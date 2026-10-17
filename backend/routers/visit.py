"""VisitReady journey endpoints. Each fictional persona has one visit linking every stage (BR-08)."""

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from lib import demo_data as D
from lib.ai import generate_json
from lib.brief_pdf import render_brief_pdf
from lib.dates import today_iso
from lib.db import db
from models.visit import (
    ApproveRequest,
    Booking,
    BookingRequest,
    Brief,
    BriefPoint,
    BriefUpdate,
    Clinic,
    ClinicianDashboard,
    ClinicalNotes,
    ConfirmTasksRequest,
    ConsultUpdate,
    GenerateBriefRequest,
    GenerateNotesRequest,
    Instruction,
    PathwaySuggestion,
    Persona,
    PrepForm,
    Questionnaire,
    Service,
    Task,
    TaskStatusUpdate,
    Transcript,
    Visit,
)

router = APIRouter()


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def persona_cfg(persona: str) -> dict:
    cfg = D.PERSONAS.get(persona)
    if not cfg:
        raise HTTPException(404, "Unknown demo persona")
    return cfg


async def load(persona: str) -> Visit:
    cfg = persona_cfg(persona)
    doc = await db.visits.find_one({"id": cfg["visit_id"]}, {"_id": 0})
    if not doc:
        doc = Visit(id=cfg["visit_id"], persona=persona, patient=cfg["patient"], updated_at=now()).model_dump()
        await db.visits.insert_one({**doc})
    return Visit(**doc)


async def save(v: Visit) -> Visit:
    v.updated_at = now()
    await db.visits.replace_one({"id": v.id}, v.model_dump(), upsert=True)
    return v


PersonaQ = Query("alex", description="Demo persona id")


# ---------- reference data ----------
@router.get("/services", response_model=list[Service])
async def list_services():
    return D.SERVICES


@router.get("/clinics", response_model=list[Clinic])
async def list_clinics():
    return D.clinics()


@router.get("/personas", response_model=list[Persona])
async def list_personas():
    return [{**p, "demo_prep": {**p["demo_prep"]}} for p in D.PERSONAS.values()]


@router.get("/demo/transcript", response_model=Transcript)
async def sample_transcript(persona: str = PersonaQ):
    cfg = persona_cfg(persona)
    return Transcript(title=cfg["transcript_title"], text=cfg["transcript"])


@router.get("/clinician/dashboard", response_model=ClinicianDashboard)
async def clinician_dashboard():
    rows = []
    for pid, cfg in D.PERSONAS.items():
        v = await load(pid)
        rows.append({
            "persona": pid, "visit_id": v.id, "patient": v.patient, "initials": cfg["initials"],
            "concern": v.questionnaire.main_concern if v.questionnaire else None,
            "booking": v.booking,
            "brief_shared": bool(v.brief and v.brief.shared and v.brief.status == "saved"),  # BR-02
            "consult_status": v.consult.status,
            "instructions_released": len(v.consult.instructions) if v.consult.status == "approved" else 0,
        })
    rows.sort(key=lambda r: (r["booking"] is None, r["booking"].date if r["booking"] else "", r["booking"].time if r["booking"] else ""))
    return {"today": today_iso(D.TZ), "clinician": D.CLINICIAN, "appointments": rows}


# ---------- visit ----------
@router.get("/visit", response_model=Visit)
async def get_visit(persona: str = PersonaQ):
    return await load(persona)


@router.post("/visit/reset", response_model=Visit)
async def reset_visit(persona: str = PersonaQ):
    await db.visits.delete_many({"id": persona_cfg(persona)["visit_id"]})
    return await load(persona)


# Feature 1 — navigation & booking
@router.post("/visit/questionnaire", response_model=Visit)
async def submit_questionnaire(body: Questionnaire, persona: str = PersonaQ):
    v = await load(persona)
    v.questionnaire = body
    v.pathway = PathwaySuggestion(**D.suggest_pathway(body.model_dump()))
    return await save(v)


@router.post("/visit/booking", response_model=Visit)
async def book(body: BookingRequest, persona: str = PersonaQ):
    clinic = next((c for c in D.clinics() if c["id"] == body.clinic_id), None)
    if not clinic:
        raise HTTPException(404, "Clinic not found")
    slot = next((s for s in clinic["slots"] if s["id"] == body.slot_id), None)
    if not slot:
        raise HTTPException(404, "That time is no longer available")
    prac = next(p for p in clinic["practitioners"] if p["id"] == slot["practitioner_id"])
    service = next((s for s in D.SERVICES if s["id"] == body.service_id), D.SERVICES[0])
    v = await load(persona)
    v.booking = Booking(
        reference=f"VR-{uuid.uuid4().hex[:6].upper()}",
        clinic_id=clinic["id"], clinic_name=clinic["name"], clinic_address=clinic["address"],
        practitioner_id=prac["id"], practitioner_name=prac["name"],
        service_id=service["id"], service_name=service["name"],
        slot_id=slot["id"], date=slot["date"], time=slot["time"], mode=slot["mode"], confirmed_at=now(),
    )
    return await save(v)


# Feature 2 — preparation
@router.put("/visit/prep", response_model=Visit)
async def save_prep(body: PrepForm, persona: str = PersonaQ):
    v = await load(persona)
    v.prep = body
    return await save(v)


def fallback_brief(prep: PrepForm) -> list[dict]:
    sections = [
        ("main_concern", "Main concern"), ("symptoms", "Symptoms"), ("duration", "Timeline"),
        ("previous_care", "What I've tried"), ("history", "Relevant history"), ("medications", "Medications"),
        ("concerns", "What worries me"),
    ]
    points = []
    for field, section in sections:
        val = getattr(prep, field).strip()
        if val:
            points.append({"section": section, "text": val[0].upper() + val[1:], "source_field": field})
    for q in [q.strip("-• ").strip() for q in prep.questions.splitlines() if q.strip()]:
        points.append({"section": "Questions for my doctor", "text": q, "source_field": "questions"})
    return points


BRIEF_SYSTEM = (
    "You organise a patient's own words into a concise one-page appointment brief for their doctor. "
    "Never diagnose, never add medical advice, never invent facts. Use first person from the patient's perspective. "
    "Every point must cite exactly one source field it came from. Respond with JSON only."
)


@router.post("/visit/brief/generate", response_model=Visit)
async def generate_brief(body: GenerateBriefRequest, persona: str = PersonaQ):
    v = await load(persona)
    if not v.booking:
        raise HTTPException(409, "Book an appointment before preparing a brief")
    prep = body.prep
    v.prep = prep
    fields = {k: getattr(prep, k) for k in D.PREP_FIELD_LABELS if getattr(prep, k).strip()}
    if not fields:
        raise HTTPException(422, "Add at least one detail before generating a brief")

    raw = None
    if not body.use_fallback:
        prompt = (
            "Patient input fields (JSON):\n" + json.dumps(fields, ensure_ascii=False) +
            "\n\nReturn {\"points\": [{\"section\": one of [\"Main concern\",\"Symptoms\",\"Timeline\",\"What I've tried\","
            "\"Relevant history\",\"Medications\",\"What worries me\",\"Questions for my doctor\"], "
            "\"text\": short clear sentence (max 25 words), \"source_field\": one of " + json.dumps(list(fields)) + "}]}. "
            "Keep 5-10 points, one per question for questions. Order by section as listed."
        )
        data = await generate_json(BRIEF_SYSTEM, prompt)
        if data and isinstance(data.get("points"), list):
            raw = [p for p in data["points"] if isinstance(p, dict) and p.get("source_field") in fields and p.get("text")]
    ai_source = "live" if raw else "fallback"
    if not raw:
        raw = fallback_brief(prep)

    points = [
        BriefPoint(id=f"bp-{i+1}", section=str(p.get("section", "Notes")), text=str(p["text"]),
                   source_field=p["source_field"], source_text=fields[p["source_field"]])
        for i, p in enumerate(raw)
    ]
    v.brief = Brief(points=points, ai_source=ai_source, generated_at=now())
    return await save(v)


@router.put("/visit/brief", response_model=Visit)
async def update_brief(body: BriefUpdate, persona: str = PersonaQ):
    v = await load(persona)
    if not v.brief:
        raise HTTPException(409, "Generate a brief first")
    edits = {e.id: e.text for e in body.points}
    for p in v.brief.points:
        if p.id in edits and edits[p.id].strip() != p.text:
            p.text = edits[p.id].strip()
            p.edited = True
    v.brief.shared = body.shared  # BR-02: explicit patient choice
    v.brief.status = "saved"
    v.brief.saved_at = now()
    return await save(v)


@router.get("/visit/brief/pdf")
async def brief_pdf(persona: str = PersonaQ):
    v = await load(persona)
    if not v.brief:
        raise HTTPException(404, "No brief has been generated yet")
    pdf = render_brief_pdf(v)
    first = v.patient.name.split()[0].lower()
    return Response(
        content=pdf, media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="visitready-brief-{first}.pdf"'},
    )


# Feature 3 — clinical notes
NOTES_SYSTEM = (
    "You are a clinical documentation assistant drafting notes for a GP to review. Use only information in the transcript. "
    "Write concise SOAP notes in clinical shorthand. Separately list patient-facing follow-up instructions in plain language. "
    "Medication instructions MUST be copied word-for-word from what the doctor said in the transcript. Respond with JSON only."
)


@router.post("/visit/consult/generate", response_model=Visit)
async def generate_notes(body: GenerateNotesRequest, persona: str = PersonaQ):
    cfg = persona_cfg(persona)
    v = await load(persona)
    if not v.booking:
        raise HTTPException(409, "No appointment booked for this patient yet")
    if v.consult.status == "approved":
        raise HTTPException(409, "Notes are already approved and released")

    notes, instructions = None, None
    if not body.use_fallback:
        shared = ""
        if v.brief and v.brief.shared and v.brief.status == "saved":
            shared = "\n\nPatient-shared preparation brief:\n" + "\n".join(f"- {p.section}: {p.text}" for p in v.brief.points)
        prompt = (
            "Consultation transcript:\n" + body.transcript + shared +
            "\n\nReturn {\"notes\": {\"subjective\": str, \"objective\": str, \"assessment\": str, \"plan\": str}, "
            "\"instructions\": [{\"kind\": one of [\"appointment\",\"test\",\"referral\",\"medication\",\"self_care\"], \"text\": str}]}"
        )
        data = await generate_json(NOTES_SYSTEM, prompt)
        try:
            if data:
                notes = {k: str(data["notes"][k]) for k in ("subjective", "objective", "assessment", "plan")}
                instructions = [i for i in data["instructions"] if i.get("kind") in D.TASK_TITLES and i.get("text")]
        except (KeyError, TypeError):
            notes, instructions = None, None
    ai_source = "live" if notes and instructions else "fallback"
    if ai_source == "fallback":
        notes, instructions = cfg["fallback_notes"], cfg["fallback_instructions"]

    ins = [Instruction(id=f"ins-{i+1}", kind=x["kind"], text=str(x["text"])) for i, x in enumerate(instructions)]
    v.consult.transcript = body.transcript
    v.consult.notes = ClinicalNotes(**notes)
    v.consult.instructions = ins
    v.consult.ai_notes = ClinicalNotes(**notes)
    v.consult.ai_instructions = [i.model_copy() for i in ins]
    v.consult.status = "draft"  # BR-04: AI output always starts as Draft
    v.consult.ai_source = ai_source
    v.consult.edited = False
    v.consult.generated_at = now()
    v.tasks = []
    return await save(v)


def _content(ins: list[Instruction]) -> list[tuple[str, str, str]]:
    return [(i.id, i.kind, i.text) for i in ins]


def _apply_edits(v: Visit, body: ConsultUpdate) -> None:
    if v.consult.status == "none":
        raise HTTPException(409, "Generate draft notes first")
    if v.consult.status == "approved":
        raise HTTPException(409, "Approved notes are locked")
    v.consult.notes = body.notes
    v.consult.instructions = body.instructions
    v.consult.edited = body.notes != v.consult.ai_notes or _content(body.instructions) != _content(v.consult.ai_instructions)


@router.put("/visit/consult", response_model=Visit)
async def update_consult(body: ConsultUpdate, persona: str = PersonaQ):
    v = await load(persona)
    _apply_edits(v, body)
    return await save(v)


@router.post("/visit/consult/approve", response_model=Visit)
async def approve_consult(body: ApproveRequest, persona: str = PersonaQ):
    v = await load(persona)
    _apply_edits(v, body)
    if not v.consult.instructions:
        raise HTTPException(422, "Add at least one patient-facing instruction")
    if not all(i.approved for i in v.consult.instructions):
        raise HTTPException(422, "Approve every follow-up item before releasing to the patient")
    v.consult.status = "approved"
    v.consult.approved_at = now()
    v.consult.approved_by = D.CLINICIAN["name"]  # the signed-in demo clinician reviews every visit
    # BR-05 / BR-07: tasks derive only from approved instructions, text preserved verbatim.
    v.tasks = [
        Task(id=f"task-{i.id}", title=D.TASK_TITLES[i.kind], kind=i.kind, source_instruction_id=i.id,
             source_text=i.text, verbatim=i.kind == "medication")
        for i in v.consult.instructions
    ]
    return await save(v)


# Feature 4 — follow-up tracker
@router.post("/visit/tasks/confirm", response_model=Visit)
async def confirm_tasks(body: ConfirmTasksRequest, persona: str = PersonaQ):
    v = await load(persona)
    if v.consult.status != "approved":
        raise HTTPException(409, "Follow-up tasks are released only after clinician approval")
    ids = set(body.task_ids)
    for t in v.tasks:
        if t.id in ids and t.status == "suggested":
            t.status = "todo"
            t.confirmed_at = now()
    return await save(v)


@router.patch("/visit/tasks/{task_id}", response_model=Visit)
async def update_task(task_id: str, body: TaskStatusUpdate, persona: str = PersonaQ):
    v = await load(persona)
    task = next((t for t in v.tasks if t.id == task_id), None)
    if not task:
        raise HTTPException(404, "Task not found")
    if task.status == "suggested":
        raise HTTPException(409, "Confirm this task before tracking it")
    task.status = body.status
    return await save(v)
