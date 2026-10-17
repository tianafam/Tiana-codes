// Hand-written mirrors of backend/models/visit.py — keep in sync.

export interface Service { id: string; name: string; description: string }
export interface Practitioner { id: string; name: string; role: string; bio: string; languages: string[] }
export type SlotMode = "in_person" | "telehealth";
export interface Slot { id: string; practitioner_id: string; date: string; time: string; mode: SlotMode }
export interface Clinic {
  id: string; name: string; suburb: string; address: string; image: string; bulk_billing: boolean;
  rating: number; distance_km: number; services: string[]; blurb: string;
  practitioners: Practitioner[]; slots: Slot[];
}
export interface Transcript { title: string; text: string }

export interface Patient { name: string; age: number; pronouns: string; suburb: string }
export type Preference = "in_person" | "telehealth" | "any";
export interface Questionnaire {
  main_concern: string; duration: string; consulted_before: "yes" | "no"; referral: string;
  location: string; preference: Preference; consent_reuse: boolean;
}
export interface PathwaySuggestion {
  service_id: string; service_name: string; headline: string; explanation: string;
  reasons: string[]; alternatives: string[]; emergency: boolean;
}
export interface BookingRequest { clinic_id: string; slot_id: string; service_id: string }
export interface Booking {
  reference: string; clinic_id: string; clinic_name: string; clinic_address: string;
  practitioner_id: string; practitioner_name: string; service_id: string; service_name: string;
  slot_id: string; date: string; time: string; mode: SlotMode; confirmed_at: string;
}
export interface PrepForm {
  main_concern: string; symptoms: string; duration: string; previous_care: string; history: string;
  medications: string; concerns: string; questions: string; prefilled_fields: string[];
}
export type PrepField = Exclude<keyof PrepForm, "prefilled_fields">;
export interface BriefPoint { id: string; section: string; text: string; source_field: string; source_text: string; edited: boolean }
export interface Brief {
  points: BriefPoint[]; status: "draft" | "saved"; shared: boolean; ai_source: "live" | "fallback";
  generated_at: string; saved_at: string | null;
}
export interface GenerateBriefRequest { prep: PrepForm; use_fallback: boolean }
export interface BriefUpdate { points: { id: string; text: string }[]; shared: boolean }

export type InstructionKind = "appointment" | "test" | "referral" | "medication" | "self_care";
export interface Instruction { id: string; kind: InstructionKind; text: string }
export interface ClinicalNotes { subjective: string; objective: string; assessment: string; plan: string }
export interface Consult {
  transcript: string; notes: ClinicalNotes | null; instructions: Instruction[];
  status: "none" | "draft" | "approved"; ai_source: "live" | "fallback" | null; edited: boolean;
  generated_at: string | null; approved_at: string | null; approved_by: string | null;
}
export interface GenerateNotesRequest { transcript: string; use_fallback: boolean }
export interface ConsultUpdate { notes: ClinicalNotes; instructions: Instruction[] }
export interface ApproveRequest extends ConsultUpdate { reviewed: boolean }

export type TaskStatus = "suggested" | "todo" | "in_progress" | "completed";
export interface Task {
  id: string; title: string; kind: InstructionKind; source_instruction_id: string; source_text: string;
  verbatim: boolean; status: TaskStatus; confirmed_at: string | null;
}
export interface ConfirmTasksRequest { task_ids: string[] }
export interface TaskStatusUpdate { status: Exclude<TaskStatus, "suggested"> }

export interface Visit {
  id: string; patient: Patient; questionnaire: Questionnaire | null; pathway: PathwaySuggestion | null;
  booking: Booking | null; prep: PrepForm | null; brief: Brief | null; consult: Consult; tasks: Task[];
  updated_at: string;
}

export const PREP_LABELS: Record<PrepField, string> = {
  main_concern: "Main concern", symptoms: "Symptoms", duration: "Duration", previous_care: "Previous care",
  history: "Relevant history", medications: "Current medications", concerns: "Worries", questions: "Questions",
};

export const KIND_LABELS: Record<InstructionKind, string> = {
  appointment: "Appointment", test: "Test", referral: "Referral", medication: "Medication", self_care: "Self-care",
};
