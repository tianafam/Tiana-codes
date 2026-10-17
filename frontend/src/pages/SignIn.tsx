import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { usePersonas } from "@/lib/hooks";
import { setPersona, usePersonaId } from "@/lib/persona";
import { cn } from "@/lib/utils";

const TONES: Record<string, string> = { alex: "bg-[#FCD34D] text-eucalypt-deep", priya: "bg-terracotta text-white" };

export default function SignIn() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const signup = params.get("mode") === "signup";
  const personas = usePersonas();
  const current = usePersonaId();

  const choose = (id: string, name: string) => {
    setPersona(id);
    toast.success(`Signed in as ${name} (demo)`);
    navigate("/patient");
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 sm:pt-14 animate-fade-up">
        <p className="tracking-[0.15em] uppercase text-[11px] font-semibold text-terracotta">{signup ? "Sign up · Demo" : "Sign in · Demo"}</p>
        <h1 data-testid="sign-in-title" className="mt-2 text-[32px] sm:text-[40px] leading-tight tracking-tight text-ink">Who's starting the journey?</h1>
        <p className="mt-2 text-[15px] text-ink-muted max-w-xl">
          No passwords and no real accounts. Pick a fictional patient to explore VisitReady as them.
        </p>

        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {personas.isLoading && [0, 1].map((i) => <div key={i} className="h-48 rounded-3xl ai-shimmer" />)}
          {(personas.data ?? []).map((p) => (
            <button
              key={p.id}
              data-testid={`sign-in-persona-${p.id}`}
              onClick={() => choose(p.id, p.patient.name)}
              className="group text-left rounded-3xl frost-card p-6 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-eucalypt/40"
            >
              <div className="flex items-center justify-between">
                <span className={cn("size-12 rounded-full grid place-items-center text-sm font-semibold", TONES[p.id] ?? "bg-eucalypt-soft text-eucalypt")}>{p.initials}</span>
                {p.id === current && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-eucalypt-soft text-eucalypt px-2.5 py-0.5 text-[11px] font-semibold">
                    <Check className="size-3" /> Last used
                  </span>
                )}
              </div>
              <p className="mt-4 font-heading text-2xl text-ink">{p.patient.name}, {p.patient.age}</p>
              <p className="mt-1 text-sm text-ink-muted">{p.tagline}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-eucalypt">
                Continue as {p.patient.name.split(" ")[0]} <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
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
