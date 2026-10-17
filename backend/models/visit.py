"""Pydantic models for the VisitReady demo journey. Mirrored by frontend/src/lib/types.ts."""

from typing import Literal, Optional

from pydantic import BaseModel, Field


# ---------- Reference data ----------
class Service(BaseModel):
    id: str
    name: str
    description: str


class Practitioner(BaseModel):
    id: str
    name: str
    role: str
    bio: str
    languages: list[str]


class Slot(BaseModel):
    id: str
    practitioner_id: str
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    mode: Literal["in_person", "telehealth"]


class Clinic(BaseModel):
    id: str
    name: str
    suburb: str
    address: str
    image: str
    bulk_billing: bool
    rating: float
    distance_km: float
    services: list[str]
    blurb: str
    practitioners: list[Practitioner]
    slots: list[Slot]


class Transcript(BaseModel):
    title: str
    text: str


# ---------- Visit sub-documents ----------
class Patient(BaseModel):
    name: str
    age: int
    pronouns: str
    suburb: str


class Questionnaire(BaseModel):
    main_concern: str = Field(min_length=2)
    duration: str = Field(min_length=1)
    consulted_before: Literal["yes", "no"]
    referral: str = ""
    location: str = Field(min_length=2)
    preference: Literal["in_person", "telehealth", "any"] = "any"
    consent_reuse: bool = False


class PathwaySuggestion(BaseModel):
    service_id: str
    service_name: str
    headline: str
    explanation: str
    reasons: list[str]
    alternatives: list[str]
    emergency: bool


class BookingRequest(BaseModel):
    clinic_id: str
    slot_id: str
    service_id: str = "gp"


class Booking(BaseModel):
    reference: str
    clinic_id: str
    clinic_name: str
    clinic_address: str
    practitioner_id: str
    practitioner_name: str
    service_id: str
    service_name: str
    slot_id: str
    date: str
    time: str
    mode: Literal["in_person", "telehealth"]
    confirmed_at: str


class PrepForm(BaseModel):
    main_concern: str = ""
    symptoms: str = ""
    duration: str = ""
    previous_care: str = ""
    history: str = ""
    medications: str = ""
    concerns: str = ""
    questions: str = ""
    prefilled_fields: list[str] = []


class BriefPoint(BaseModel):
    id: str
    section: str
    text: str
    source_field: str
    source_text: str
    edited: bool = False


class Brief(BaseModel):
    points: list[BriefPoint]
    status: Literal["draft", "saved"] = "draft"
    shared: bool = False
    ai_source: Literal["live", "fallback"]
    generated_at: str
    saved_at: Optional[str] = None


class GenerateBriefRequest(BaseModel):
    prep: PrepForm
    use_fallback: bool = False


class BriefPointEdit(BaseModel):
    id: str
    text: str = Field(min_length=1)


class BriefUpdate(BaseModel):
    points: list[BriefPointEdit]
    shared: bool


InstructionKind = Literal["appointment", "test", "referral", "medication", "self_care"]


class Instruction(BaseModel):
    id: str
    kind: InstructionKind
    text: str = Field(min_length=1)
    approved: bool = False  # clinician ticks each item before release


class ClinicalNotes(BaseModel):
    subjective: str
    objective: str
    assessment: str
    plan: str


class Consult(BaseModel):
    transcript: str = ""
    notes: Optional[ClinicalNotes] = None
    instructions: list[Instruction] = []
    status: Literal["none", "draft", "approved"] = "none"
    ai_source: Optional[Literal["live", "fallback"]] = None
    ai_notes: Optional[ClinicalNotes] = None  # untouched AI draft, for before/after comparison
    ai_instructions: list[Instruction] = []
    edited: bool = False
    generated_at: Optional[str] = None
    approved_at: Optional[str] = None
    approved_by: Optional[str] = None


class GenerateNotesRequest(BaseModel):
    transcript: str = Field(min_length=20)
    use_fallback: bool = False


class ConsultUpdate(BaseModel):
    notes: ClinicalNotes
    instructions: list[Instruction]


class ApproveRequest(ConsultUpdate):
    pass


TaskStatus = Literal["suggested", "todo", "in_progress", "completed"]


class Task(BaseModel):
    id: str
    title: str
    kind: InstructionKind
    source_instruction_id: str
    source_text: str
    verbatim: bool
    status: TaskStatus = "suggested"
    confirmed_at: Optional[str] = None


class ConfirmTasksRequest(BaseModel):
    task_ids: list[str] = Field(min_length=1)


class TaskStatusUpdate(BaseModel):
    status: Literal["todo", "in_progress", "completed"]


class Persona(BaseModel):
    id: str
    initials: str
    patient: Patient
    tagline: str
    quote: str
    demo_questionnaire: Questionnaire
    demo_prep: PrepForm


class Visit(BaseModel):
    id: str
    persona: str = "alex"
    patient: Patient
    questionnaire: Optional[Questionnaire] = None
    pathway: Optional[PathwaySuggestion] = None
    booking: Optional[Booking] = None
    prep: Optional[PrepForm] = None
    brief: Optional[Brief] = None
    consult: Consult = Consult()
    tasks: list[Task] = []
    updated_at: str
