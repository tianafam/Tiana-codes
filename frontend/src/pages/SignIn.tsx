import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { errorMessage, usePersonas, visitKey } from "@/lib/hooks";
import { apiPost } from "@/lib/api";
import type { Visit } from "@/lib/types";
import { clearGuest, getGuest, setPersona, setSignedIn, useGuest } from "@/lib/persona";
import { cn } from "@/lib/utils";

const TONES: Record<string, string> = { alex: "bg-[#FCD34D] text-eucalypt-deep", priya: "bg-terracotta text-white" };

export default function SignIn() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const signup = params.get("mode") === "signup";
  const personas = usePersonas();

  const qc = useQueryClient();
  const guest = useGuest();
  const [busyId, setBusyId] = useState<string | null>(null);

  // Every sign-in starts a fresh, empty journey; anything the guest already answered or picked carries over.
  const choose = async (id: string, name: string) => {
    setBusyId(id);
    setPersona(id);
    const draft = getGuest();
    const q = `?persona=${encodeURIComponent(id)}`;
    try {
      let v = await apiPost<Visit>(`/visit/reset${q}`);
      if (draft.questionnaire) v = await apiPost<Visit>(`/visit/questionnaire${q}`, draft.questionnaire);
      if (draft.booking) {
        try { v = await apiPost<Visit>(`/visit/booking${q}`, draft.booking); }
        catch (e) { toast.error(`Signed in, but that time couldn't be booked: ${errorMessage(e)}`); }
      }
      qc.setQueryData(visitKey(id), v);
      qc.invalidateQueries({ queryKey: ["clinician-dashboard"] });
      clearGuest();
      setSignedIn(true);
      if (v.booking) { toast.success(`Signed in as ${name} — you're booked in`); navigate("/patient/prep"); }
      else if (v.pathway) { toast.success(`Signed in as ${name} — your answers are saved`); navigate("/patient/navigate"); }
      else { toast.success(`Signed in as ${name} (demo) — fresh journey`); navigate("/patient"); }
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 sm:pt-14 animate-fade-up">
        <button
          type="button"
          data-testid="sign-in-back-btn"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/patient"))}
          className="group mb-6 inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:border-eucalypt/50 hover:text-eucalypt transition-colors duration-200"
        >
          <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" /> Back
        </button>
        <p className="tracking-[0.15em] uppercase text-[11px] font-semibold text-terracotta">{signup ? "Sign up · Demo" : "Sign in · Demo"}</p>
        <h1 data-testid="sign-in-title" className="mt-2 text-[32px] sm:text-[40px] leading-tight tracking-tight text-ink">Who's starting the journey?</h1>
        <p className="mt-2 text-[15px] text-ink-muted max-w-xl">
          {signup ? "Sign up starts a brand-new, empty journey as a fictional demo patient." : "No passwords and no real accounts. Each sign-in starts a fresh, empty journey."}
        </p>

        {(guest.questionnaire || guest.booking) && (
          <p data-testid="sign-in-carry-over-notice" className="mt-5 rounded-2xl bg-eucalypt-soft text-eucalypt px-4 py-3 text-sm">
            Your answers{guest.booking ? " and chosen appointment time" : ""} will carry over once you pick a patient.
          </p>
        )}
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {personas.isLoading && [0, 1].map((i) => <div key={i} className="h-48 rounded-3xl ai-shimmer" />)}
          {(personas.data ?? []).map((p) => (
            <button
              key={p.id}
              data-testid={`sign-in-persona-${p.id}`}
              disabled={busyId !== null}
              onClick={() => choose(p.id, p.patient.name)}
              className="group text-left rounded-3xl frost-card p-6 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-eucalypt/40"
            >
              <div className="flex items-center justify-between">
                <span className={cn("size-12 rounded-full grid place-items-center text-sm font-semibold", TONES[p.id] ?? "bg-eucalypt-soft text-eucalypt")}>{p.initials}</span>
              </div>
              <p className="mt-4 font-heading text-2xl text-ink">{p.patient.name}, {p.patient.age}</p>
              <p className="mt-1 text-sm text-ink-muted">{p.tagline}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-eucalypt">
                {busyId === p.id ? "Signing in…" : `Continue as ${p.patient.name.split(" ")[0]}`} <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </button>
          ))}
        </div>

        <Link to="/clinician" data-testid="sign-in-clinician-link" className="mt-6 inline-flex items-center gap-2 text-sm text-ink-muted hover:text-eucalypt transition-colors duration-200">
          <Stethoscope className="size-4" /> Are you a clinician? Go to the clinician portal
        </Link>
      </section>
    </AppShell>
  );
}
