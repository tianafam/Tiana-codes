import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, apiGet } from "@/lib/api";
import { usePersonaId, vurl } from "@/lib/persona";
import type { Clinic, Persona, Service, Transcript, Visit } from "@/lib/types";

export const visitKey = (persona: string) => ["visit", persona] as const;

export function useVisit() {
  const persona = usePersonaId();
  return useQuery({ queryKey: visitKey(persona), queryFn: () => apiGet<Visit>(vurl("/visit")) });
}
export const usePersonas = () => useQuery({ queryKey: ["personas"], queryFn: () => apiGet<Persona[]>("/personas"), staleTime: Infinity });
/** The active persona's profile + demo answers (undefined while loading / offline). */
export function useCurrentPersona(): Persona | undefined {
  const id = usePersonaId();
  return usePersonas().data?.find((p) => p.id === id);
}
export const useClinics = () => useQuery({ queryKey: ["clinics"], queryFn: () => apiGet<Clinic[]>("/clinics") });
export const useServices = () => useQuery({ queryKey: ["services"], queryFn: () => apiGet<Service[]>("/services") });
export function useTranscript() {
  const persona = usePersonaId();
  return useQuery({ queryKey: ["transcript", persona], queryFn: () => apiGet<Transcript>(vurl("/demo/transcript")) });
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    const detail = (e.body as { detail?: unknown } | null)?.detail;
    if (typeof detail === "string") return detail;
    return "Please check the details and try again.";
  }
  return "We couldn't reach the server. Please try again.";
}

/** Every journey mutation returns the updated Visit, so we write it straight into the cache. */
export function useVisitMutation<B>(fn: (body: B) => Promise<Visit>, successMessage?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (v) => {
      qc.setQueryData(visitKey(v.persona), v);
      if (successMessage) toast.success(successMessage);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export interface Stage { key: string; label: string; short: string; path: string; done: boolean }

export function journeyStages(v?: Visit): Stage[] {
  const tasks = v?.tasks ?? [];
  return [
    { key: "find", label: "Find care & book", short: "Find care", path: "/navigate", done: !!v?.booking },
    { key: "prep", label: "Prepare brief", short: "Prepare", path: "/prep", done: v?.brief?.status === "saved" },
    { key: "consult", label: "Clinician notes", short: "Consult", path: "/clinician", done: v?.consult.status === "approved" },
    {
      key: "follow", label: "Follow through", short: "Follow up", path: "/actions",
      done: tasks.length > 0 && tasks.every((t) => t.status === "completed"),
    },
  ];
}

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
