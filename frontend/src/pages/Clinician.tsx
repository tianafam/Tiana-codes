import { useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { BadgeCheck, CalendarClock, FileAudio, Lock, Plus, ShieldCheck, Sparkles, Trash2, User } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiPost, apiPut } from "@/lib/api";
import { formatDateTime, useTranscript, useVisit, useVisitMutation } from "@/lib/hooks";
import { KIND_LABELS } from "@/lib/types";
import type { ApproveRequest, ClinicalNotes, Consult, ConsultUpdate, GenerateNotesRequest, Instruction, InstructionKind, Visit } from "@/lib/types";
import { cn } from "@/lib/utils";

const SOAP: { key: keyof ClinicalNotes; label: string }[] = [
  { key: "subjective", label: "Subjective" },
  { key: "objective", label: "Objective" },
  { key: "assessment", label: "Assessment" },
  { key: "plan", label: "Plan" },
];
const WORKFLOW = ["Generate draft", "Review & edit", "Approve & release"];

export default function Clinician() {
  const visit = useVisit();
  const v = visit.data;
  const transcriptQ = useTranscript();
  const [transcript, setTranscript] = useState<string | null>(null);
  const generate = useVisitMutation((b: GenerateNotesRequest) => apiPost<Visit>("/visit/consult/generate", b), "Draft notes generated — review before approving");

  const text = transcript ?? v?.consult.transcript ?? "";
  const status = v?.consult.status ?? "none";
  const stepIndex = status === "none" ? 0 : status === "draft" ? 1 : 3;
  const briefShared = v?.brief?.shared && v.brief.status === "saved";

  return (
    <AppShell mode="clinician">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 animate-fade-up">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="tracking-[0.15em] uppercase text-xs font-semibold text-terracotta">Clinician workspace · Simulated</p>
            <h1 className="mt-2 text-3xl sm:text-[42px] leading-tight tracking-tight text-ink">Consultation documentation</h1>
            <p className="mt-2 text-ink-muted max-w-2xl">AI drafts notes from the transcript. They stay in Draft until you review and approve them — nothing reaches the patient before then.</p>
          </div>
          <ol data-testid="clinician-workflow-stepper" className="flex items-center gap-2">
            {WORKFLOW.map((w, i) => (
              <li key={w} className="flex items-center gap-2">
                <span
                  data-testid={`workflow-step-${i + 1}`}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium border",
                    i < stepIndex ? "bg-eucalypt text-white border-eucalypt" : i === stepIndex ? "bg-white border-terracotta text-terracotta" : "border-line text-ink-muted",
                  )}
                >
                  {i + 1}. {w}
                </span>
                {i < 2 && <span className="w-4 h-px bg-line" />}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-8 grid lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-5 space-y-5">
          <div data-testid="clinician-appointment-card" className="rounded-3xl bg-eucalypt-deep text-white p-5">
            <div className="flex items-center gap-3">
              <span className="size-11 rounded-full bg-[#FCD34D] text-eucalypt-deep grid place-items-center font-semibold"><User className="size-5" /></span>
              <div>
                <p className="font-heading text-xl">{v?.patient.name ?? "Alex Turner"}</p>
                <p className="text-xs text-[#ADC5BE]">{v ? `${v.patient.age} · ${v.patient.pronouns} · ${v.patient.suburb}` : "Fictional patient"}</p>
              </div>
            </div>
            {v?.booking ? (
              <p data-testid="clinician-appointment-time" className="mt-4 text-sm text-[#D1E7DF] flex items-center gap-2">
                <CalendarClock className="size-4" /> {format(parseISO(v.booking.date), "EEE d MMM")} · {v.booking.time} · {v.booking.practitioner_name}, {v.booking.clinic_name}
              </p>
            ) : (
              <p data-testid="clinician-no-appointment" className="mt-4 text-sm text-[#FCD34D]">No appointment booked yet. Switch to Patient mode to book one.</p>
            )}
            <p className="mt-2 font-mono text-[11px] text-[#ADC5BE]">Visit {v?.id ?? "—"}{v?.booking && ` · Ref ${v.booking.reference}`}</p>
          </div>

          <div data-testid="clinician-shared-brief" className="rounded-3xl bg-white border border-line p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg text-ink">Patient preparation brief</h2>
              {briefShared ? <Badge className="bg-eucalypt-soft text-eucalypt">Shared by patient</Badge> : <Badge variant="outline"><Lock className="size-3" /> Not shared</Badge>}
            </div>
            {briefShared && v?.brief ? (
              <ul className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                {v.brief.points.map((p) => (
                  <li key={p.id} className="text-sm">
                    <span className="text-xs font-semibold text-eucalypt">{p.section}</span>
                    <p className="text-ink leading-relaxed">{p.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p data-testid="clinician-brief-locked" className="mt-3 text-sm text-ink-muted">
                The patient hasn't chosen to share a preparation brief. It stays private unless they opt in.
              </p>
            )}
          </div>

          <div className="rounded-3xl bg-white border border-line p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg text-ink flex items-center gap-2"><FileAudio className="size-4 text-eucalypt" /> Consultation transcript</h2>
              <Button
                variant="outline"
                size="sm"
                data-testid="load-transcript-btn"
                disabled={!transcriptQ.data || status === "approved"}
                onClick={() => transcriptQ.data && setTranscript(transcriptQ.data.text)}
              >
                Load fictional transcript
              </Button>
            </div>
            <Textarea
              data-testid="transcript-input"
              value={text}
              onChange={(e) => setTranscript(e.target.value)}
              disabled={status === "approved"}
              rows={12}
              placeholder="Paste a fictional transcript, or load the prepared one."
              className="mt-3 font-mono text-xs leading-relaxed bg-[#F5F7F6]"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                data-testid="generate-soap-btn"
                disabled={text.trim().length < 20 || generate.isPending || status === "approved" || !v?.booking}
                onClick={() => generate.mutate({ transcript: text, use_fallback: false })}
                className="rounded-full"
              >
                <Sparkles className="size-4" /> {generate.isPending ? "Drafting notes…" : status === "draft" ? "Regenerate draft" : "Generate draft notes"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                data-testid="generate-soap-fallback-btn"
                disabled={text.trim().length < 20 || generate.isPending || status === "approved" || !v?.booking}
                onClick={() => generate.mutate({ transcript: text, use_fallback: true })}
                className="text-ink-muted self-center"
              >
                Use prepared fallback draft
              </Button>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-7">
          {generate.isPending ? (
            <div data-testid="notes-generating" className="rounded-3xl bg-white border border-line p-6 space-y-4">
              <p className="text-sm text-eucalypt flex items-center gap-2"><Sparkles className="size-4 animate-pulse" /> GPT-5.2 is drafting SOAP notes and a patient plan…</p>
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl ai-shimmer" />)}
            </div>
          ) : v && v.consult.status !== "none" && v.consult.notes ? (
            <NotesEditor key={v.consult.generated_at ?? "x"} consult={v.consult} />
          ) : (
            <div data-testid="notes-empty" className="rounded-3xl border border-dashed border-line bg-white/70 p-10 text-center">
              <ShieldCheck className="mx-auto size-8 text-ink-muted" />
              <h3 className="mt-3 text-xl text-ink">No draft yet</h3>
              <p className="mt-1 text-sm text-ink-muted">Load the transcript and generate a draft. You'll review and correct it before anything is released.</p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function NotesEditor({ consult }: { consult: Consult }) {
  const [notes, setNotes] = useState<ClinicalNotes>(consult.notes!);
  const [instructions, setInstructions] = useState<Instruction[]>(consult.instructions);
  const [reviewed, setReviewed] = useState(false);
  const save = useVisitMutation((b: ConsultUpdate) => apiPut<Visit>("/visit/consult", b), "Edits saved — still in Draft");
  const approve = useVisitMutation((b: ApproveRequest) => apiPost<Visit>("/visit/consult/approve", b), "Approved & released to the patient");
  const approved = consult.status === "approved";
  const valid = instructions.length > 0 && instructions.every((i) => i.text.trim()) && SOAP.every((s) => notes[s.key].trim());

  const updateIns = (id: string, patch: Partial<Instruction>) => setInstructions((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const addIns = () => setInstructions((list) => [...list, { id: `ins-${Date.now()}`, kind: "self_care", text: "" }]);

  return (
    <div className="space-y-5 animate-fade-up">
      <div
        data-testid="notes-status-banner"
        className={cn(
          "rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-sm border",
          approved ? "bg-[#DCFCE7] border-[#BBF7D0] text-[#166534]" : "bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]",
        )}
      >
        <span className="flex items-center gap-2 font-semibold">
          {approved ? <BadgeCheck className="size-4" /> : <Sparkles className="size-4" />}
          <span data-testid="notes-status-badge">{approved ? "APPROVED & RELEASED" : "DRAFT — not visible to patient"}</span>
        </span>
        <span className="text-xs">
          {approved
            ? `Approved by ${consult.approved_by} · ${formatDateTime(consult.approved_at!)}`
            : `${consult.ai_source === "live" ? "AI draft · GPT-5.2" : "Prepared fallback draft"}${consult.edited ? " · edited by clinician" : ""}`}
        </span>
      </div>

      <div className="rounded-3xl bg-white border border-line p-5 sm:p-6">
        <h2 className="text-xl text-ink">Clinical notes <span className="text-sm text-ink-muted font-sans">(SOAP)</span></h2>
        <div className="mt-4 space-y-4">
          {SOAP.map((s) => (
            <div key={s.key}>
              <Label htmlFor={`soap-${s.key}`} className="text-xs uppercase tracking-[0.15em] text-ink-muted">{s.label}</Label>
              <Textarea
                id={`soap-${s.key}`}
                data-testid={`soap-${s.key}-input`}
                value={notes[s.key]}
                disabled={approved}
                onChange={(e) => setNotes((n) => ({ ...n, [s.key]: e.target.value }))}
                rows={3}
                className="mt-1 bg-[#F5F7F6] leading-relaxed"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-line p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl text-ink">Patient-facing follow-up plan</h2>
            <p className="text-xs text-ink-muted">Plain-language instructions. Once approved, these become the patient's suggested tasks. Medication text is passed on word-for-word.</p>
          </div>
          {!approved && (
            <Button variant="outline" size="sm" data-testid="add-instruction-btn" onClick={addIns}>
              <Plus className="size-4" /> Add
            </Button>
          )}
        </div>
        <ul className="mt-4 space-y-3">
          {instructions.map((ins, idx) => (
            <li key={ins.id} data-testid={`instruction-row-${idx}`} className="rounded-2xl border border-line p-3 bg-cream/50">
              <div className="flex items-center gap-2">
                <Select value={ins.kind} onValueChange={(val: string) => updateIns(ins.id, { kind: val as InstructionKind })} disabled={approved}>
                  <SelectTrigger size="sm" data-testid={`instruction-kind-${idx}`} className="w-40 bg-white">
                    <SelectValue>{(val) => KIND_LABELS[val as InstructionKind]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(KIND_LABELS) as InstructionKind[]).map((k) => <SelectItem key={k} value={k}>{KIND_LABELS[k]}</SelectItem>)}
                  </SelectContent>
                </Select>
                {ins.kind === "medication" && <Badge className="bg-terracotta-soft text-terracotta">Released verbatim</Badge>}
                {!approved && (
                  <Button variant="ghost" size="icon-sm" className="ml-auto" aria-label="Remove instruction" data-testid={`instruction-remove-${idx}`} onClick={() => setInstructions((l) => l.filter((i) => i.id !== ins.id))}>
                    <Trash2 className="size-4 text-ink-muted" />
                  </Button>
                )}
              </div>
              <Textarea
                data-testid={`instruction-text-${idx}`}
                value={ins.text}
                disabled={approved}
                onChange={(e) => updateIns(ins.id, { text: e.target.value })}
                rows={2}
                className="mt-2 bg-white"
              />
            </li>
          ))}
        </ul>
      </div>

      {approved ? (
        <div data-testid="approved-panel" className="rounded-3xl bg-eucalypt-deep text-white p-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#D1E7DF]">Notes are locked. {instructions.length} instructions released to the patient as suggested tasks.</p>
          <Link to="/actions" data-testid="clinician-view-patient-actions-link" className={cn(buttonVariants({ variant: "secondary" }), "rounded-full")}>
            Switch to patient follow-up
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-line p-5 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox data-testid="review-confirm-checkbox" checked={reviewed} onCheckedChange={(c) => setReviewed(c === true)} className="mt-0.5" />
            <span className="text-sm text-ink leading-relaxed">
              I have reviewed and corrected these AI-drafted notes and the patient-facing plan, and I take responsibility for their accuracy.
            </span>
          </label>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" data-testid="save-notes-btn" disabled={!valid || save.isPending} onClick={() => save.mutate({ notes, instructions })} className="rounded-full">
              Save edits (keep as draft)
            </Button>
            <Button
              data-testid="approve-release-btn"
              disabled={!reviewed || !valid || approve.isPending}
              onClick={() => approve.mutate({ notes, instructions, reviewed })}
              className={cn("rounded-full px-5", reviewed && valid && "animate-pulse-ring")}
            >
              <BadgeCheck className="size-4" /> {approve.isPending ? "Approving…" : "Approve & release"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
