import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, apiGet } from "@/lib/api";
import type { Clinic, Service, Transcript, Visit } from "@/lib/types";

export const VISIT_KEY = ["visit"] as const;

export const useVisit = () => useQuery({ queryKey: VISIT_KEY, queryFn: () => apiGet<Visit>("/visit") });
export const useClinics = () => useQuery({ queryKey: ["clinics"], queryFn: () => apiGet<Clinic[]>("/clinics") });
export const useServices = () => useQuery({ queryKey: ["services"], queryFn: () => apiGet<Service[]>("/services") });
export const useTranscript = () =>
  useQuery({ queryKey: ["transcript"], queryFn: () => apiGet<Transcript>("/demo/transcript") });

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
      qc.setQueryData(VISIT_KEY, v);
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
