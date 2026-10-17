import { useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Check, ChevronDown, RotateCcw, Stethoscope, User, Phone, Leaf } from "lucide-react";
import DemoGuide from "@/components/DemoGuide";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setPersona, usePersonaId } from "@/lib/persona";
import { useCurrentPersona, usePersonas } from "@/lib/hooks";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { vurl } from "@/lib/persona";
import { apiPost } from "@/lib/api";
import { useVisitMutation } from "@/lib/hooks";
import type { Visit } from "@/lib/types";
import { cn } from "@/lib/utils";

const PATIENT_NAV = [
  { to: "/journey", label: "My journey", id: "journey" },
  { to: "/navigate", label: "Find care", id: "navigate" },
  { to: "/prep", label: "Prepare", id: "prep" },
  { to: "/actions", label: "Follow-up", id: "actions" },
];

export default function AppShell({ children, mode = "patient" }: { children: ReactNode; mode?: "patient" | "clinician" }) {
  const navigate = useNavigate();
  const [resetOpen, setResetOpen] = useState(false);
  const reset = useVisitMutation(() => apiPost<Visit>(vurl("/visit/reset")));
  const clinician = mode === "clinician";
  const personaId = usePersonaId();
  const personas = usePersonas();
  const persona = useCurrentPersona();

  const doReset = () =>
    reset.mutate(undefined, {
      onSuccess: () => {
        setResetOpen(false);
        toast.success(`Demo reset — ${persona?.patient.name ?? "the"} journey starts fresh`);
        navigate("/");
      },
    });

  return (
    <div className={cn("min-h-screen flex flex-col", clinician ? "bg-[#F5F7F6]" : "bg-cream")}>
      <div data-testid="demo-boundary-strip" className="bg-eucalypt-deep text-[#D1E7DF] text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
          <span>
            <span className="font-semibold text-[#FCD34D] tracking-[0.15em] uppercase mr-2">Demo</span>
            Simulated journey with fictional patients, clinics and clinicians. Not a real healthcare service.
          </span>
          <span className="flex items-center gap-1.5">
            <Phone className="size-3.5" /> In an emergency call <strong className="text-white">000</strong>
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line/80 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link to="/" data-testid="brand-home-link" className="flex items-center gap-2 shrink-0">
            <span className="size-8 rounded-full bg-eucalypt text-white grid place-items-center">
              <Leaf className="size-4" />
            </span>
            <span className="font-heading text-xl font-semibold tracking-tight text-ink">VisitReady</span>
          </Link>

          {!clinician && (
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {PATIENT_NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  data-testid={`nav-${n.id}-link`}
                  className={({ isActive }) =>
                    cn(
                      "px-3 py-1.5 rounded-full text-sm transition-colors duration-200",
                      isActive ? "bg-eucalypt-soft text-eucalypt font-medium" : "text-ink-muted hover:text-ink hover:bg-sand",
                    )
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </nav>
          )}
          {clinician && (
            <span className="ml-3 hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] text-[#92400E] px-3 py-1 text-xs font-semibold">
              <Stethoscope className="size-3.5" /> Clinician Demo Mode
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                data-testid="persona-switcher-btn"
                className="flex items-center gap-2 rounded-full border border-line bg-white pl-1 pr-3 py-1 text-sm hover:border-eucalypt/50 transition-colors duration-200"
              >
                <span className="size-7 rounded-full bg-[#FCD34D] text-eucalypt-deep grid place-items-center text-[11px] font-semibold">{persona?.initials ?? "…"}</span>
                <span data-testid="persona-current-name" className="hidden sm:inline text-ink">{persona?.patient.name.split(" ")[0] ?? "Persona"}</span>
                <ChevronDown className="size-3.5 text-ink-muted" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Demo persona</DropdownMenuLabel>
                  {(personas.data ?? []).map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      data-testid={`persona-option-${p.id}`}
                      onClick={() => {
                        if (p.id === personaId) return;
                        setPersona(p.id);
                        toast.success(`Now demoing ${p.patient.name}`);
                        navigate(clinician ? "/clinician" : "/");
                      }}
                      className="items-start gap-3 py-2"
                    >
                      <span className="mt-0.5 size-7 rounded-full bg-eucalypt-soft text-eucalypt grid place-items-center text-[11px] font-semibold shrink-0">{p.initials}</span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-ink">{p.patient.name}, {p.patient.age}</span>
                        <span className="block text-xs text-ink-muted">{p.tagline}</span>
                      </span>
                      {p.id === personaId && <Check className="size-4 text-eucalypt mt-1" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <div role="tablist" aria-label="Demo role" className="flex rounded-full bg-sand p-1 border border-line">
              <button
                role="tab"
                aria-selected={!clinician}
                data-testid="role-toggle-patient"
                onClick={() => navigate("/journey")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm transition-[background-color,color,box-shadow] duration-200",
                  !clinician ? "bg-white text-eucalypt shadow-sm font-semibold" : "text-ink-muted hover:text-ink",
                )}
              >
                <User className="size-3.5" /> Patient
              </button>
              <button
                role="tab"
                aria-selected={clinician}
                data-testid="role-toggle-clinician"
                onClick={() => navigate("/clinician")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm transition-[background-color,color,box-shadow] duration-200",
                  clinician ? "bg-eucalypt text-white shadow-sm font-semibold" : "text-ink-muted hover:text-ink",
                )}
              >
                <Stethoscope className="size-3.5" /> Clinician
              </button>
            </div>
            <Button variant="ghost" size="sm" data-testid="reset-demo-btn" onClick={() => setResetOpen(true)} className="text-ink-muted">
              <RotateCcw className="size-4" /> <span className="hidden lg:inline">Reset demo</span>
            </Button>
          </div>
        </div>
        {!clinician && (
          <nav className="md:hidden flex gap-1 overflow-x-auto px-4 pb-2">
            {PATIENT_NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={`mobile-nav-${n.id}-link`}
                className={({ isActive }) =>
                  cn("px-3 py-1 rounded-full text-sm whitespace-nowrap", isActive ? "bg-eucalypt-soft text-eucalypt" : "text-ink-muted")
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 text-xs text-ink-muted flex flex-wrap gap-x-6 gap-y-2 justify-between">
          <span>VisitReady is a concept demo. Suggestions are not diagnoses or triage decisions.</span>
          <span>All people, clinics and transcripts are fictional. AI drafts require clinician approval.</span>
        </div>
      </footer>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent data-testid="reset-demo-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Reset the demo?</DialogTitle>
            <DialogDescription>
              This clears {persona?.patient.name ?? "this persona"}'s questionnaire, booking, brief, clinical notes and follow-up tasks so you can run the journey again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" data-testid="reset-demo-cancel-btn" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button data-testid="reset-demo-confirm-btn" onClick={doReset} disabled={reset.isPending}>
              {reset.isPending ? "Resetting…" : "Reset journey"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DemoGuide />
      <Toaster richColors offset={{ bottom: 80, right: 20 }} />
    </div>
  );
}
