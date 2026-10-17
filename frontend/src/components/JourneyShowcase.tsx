import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Check, Compass, ClipboardCheck, Link2, ListChecks, Share2, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { tag: "Discover", title: "Find your next step", text: "Not sure where to start? Explore care options and find an appointment that fits.", icon: Compass, to: "/patient/navigate" },
  { tag: "Prepare", title: "Make every conversation count", text: "Turn your concerns and questions into a clear, editable appointment brief.", icon: ClipboardCheck, to: "/patient/prep" },
  { tag: "Consult", title: "AI assists. Clinicians decide.", text: "AI drafts consultation notes while clinicians review and approve the care plan.", icon: Stethoscope, to: "/clinician" },
  { tag: "Follow through", title: "Know what comes next", text: "Turn approved instructions into a personal checklist you can confirm and track.", icon: ListChecks, to: "/patient/follow-through" },
];
const DURATION = 5200;
const d = (ms: number) => ({ animationDelay: `${ms}ms` });

function Discover() {
  return (
    <div className="space-y-3">
      <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-[#FCD34D] text-eucalypt-deep px-4 py-2.5 text-sm animate-fade-up">I've had a dry cough for three weeks</div>
      <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-white/10 border border-white/15 px-4 py-3 text-sm animate-fade-up" style={d(500)}>
        <p className="text-[10px] uppercase tracking-[0.15em] text-[#6EE7B7]">Suggested starting point</p>
        <p className="mt-1 font-heading text-lg">General Practice (GP)</p>
        <p className="text-xs text-[#ADC5BE]">Guidance only — not a diagnosis</p>
      </div>
      <div className="flex flex-wrap gap-2 animate-fade-up" style={d(1100)}>
        {["08:45", "10:15", "13:30"].map((t, i) => (
          <span key={t} className={cn("rounded-xl border px-3 py-2 font-mono text-sm", i === 1 ? "bg-terracotta border-terracotta text-white" : "border-white/20 text-[#D1E7DF]")}>{t}</span>
        ))}
      </div>
      <p className="inline-flex items-center gap-1.5 rounded-full bg-[#6EE7B7] text-eucalypt-deep px-3 py-1 text-xs font-semibold animate-fade-up" style={d(1700)}><Check className="size-3.5" /> Booked with Dr Sarah Lin</p>
    </div>
  );
}

function Prepare() {
  const pts = [["Dry cough, worse at night", "Symptoms"], ["Started after a cold, 3 weeks ago", "Duration"], ["Could this be asthma coming back?", "Questions"]];
  return (
    <div className="rounded-2xl bg-white text-ink p-4 shadow-2xl">
      <p className="text-[10px] uppercase tracking-[0.15em] text-ink-muted">Appointment brief · Alex</p>
      <ul className="mt-2 space-y-2.5">
        {pts.map(([t, s], i) => (
          <li key={t} className="animate-fade-up" style={d(i * 450)}>
            <p className="text-sm">{t}</p>
            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-eucalypt-soft text-eucalypt px-2 py-0.5 text-[10px] font-medium"><Link2 className="size-3" /> Source: {s}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-eucalypt/30 text-eucalypt px-2.5 py-1 text-xs font-semibold animate-fade-up" style={d(1500)}><Share2 className="size-3" /> Shared with Dr Lin — your choice</p>
    </div>
  );
}

function Consult() {
  return (
    <div className="relative rounded-2xl bg-white text-ink p-4 shadow-2xl">
      <p className="text-[10px] uppercase tracking-[0.15em] text-ink-muted">Assessment · AI draft</p>
      <p className="mt-2 text-sm leading-relaxed">
        Likely <del className="bg-[#FEE2E2] text-[#991B1B] rounded px-0.5">viral cough</del>{" "}
        <ins className="no-underline bg-[#DCFCE7] text-[#166534] rounded px-0.5 font-medium animate-fade-up inline-block" style={d(700)}>post-viral cough with airway sensitivity</ins>. No red flags.
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
        {["Chest X-ray", "Inhaler · 4 weeks", "Review in 2 weeks"].map((x, i) => (
          <span key={x} className="inline-flex items-center gap-1 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] px-2 py-0.5 animate-fade-up" style={d(1000 + i * 250)}><Check className="size-3" />{x}</span>
        ))}
      </div>
      <span className="absolute -top-3 -right-3 rotate-6 rounded-xl border-2 border-[#16A34A] bg-white text-[#166534] px-3 py-1 text-xs font-bold tracking-wide shadow-lg animate-fade-up" style={d(2000)}>
        <BadgeCheck className="inline size-3.5 mr-1" />APPROVED BY DR LIN
      </span>
    </div>
  );
}

function Follow() {
  return (
    <div className="rounded-2xl bg-white text-ink p-4 shadow-2xl space-y-3">
      <div className="grid grid-cols-7 gap-1.5">
        {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
          <div key={i} className="text-center">
            <p className="text-[10px] text-ink-muted">{day}</p>
            <span className={cn("mt-1 mx-auto size-7 rounded-lg grid place-items-center text-xs", i < 5 ? "bg-[#16A34A] text-white animate-fade-up" : "border border-dashed border-[#86EFAC] text-[#166534]")} style={i < 5 ? d(i * 220) : undefined}>
              {i < 5 ? <Check className="size-3.5" /> : i + 1}
            </span>
          </div>
        ))}
      </div>
      <div className="space-y-1.5 text-xs">
        <p className="flex items-center gap-2 rounded-lg border-l-4 border-[#16A34A] bg-[#F0FDF4] px-2 py-1.5">Inhaler · daily · day 5 of 28</p>
        <p className="flex items-center gap-2 rounded-lg border-l-4 border-[#2563EB] bg-[#EFF6FF] px-2 py-1.5">Review with Dr Lin · due in 9 days</p>
        <p className="flex items-center gap-2 rounded-lg border-l-4 border-[#DC2626] bg-[#FEF2F2] px-2 py-1.5">Short of breath? Call 000</p>
      </div>
      <p className="font-heading text-sm text-[#166534] animate-fade-up" style={d(1300)}>“Small steps every day add up to big changes.”</p>
    </div>
  );
}

const PREVIEWS = [Discover, Prepare, Consult, Follow];

export default function JourneyShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = window.setTimeout(() => setActive((a) => (a + 1) % STEPS.length), DURATION);
    return () => window.clearTimeout(t);
  }, [active, paused]);
  const Preview = PREVIEWS[active];
  const step = STEPS[active];

  return (
    <div
      data-testid="journey-showcase"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative overflow-hidden rounded-[32px] bg-eucalypt-deep text-white p-5 sm:p-8 lg:p-10 grid lg:grid-cols-[1.05fr_1fr] gap-8"
    >
      <div className="absolute -left-24 -bottom-24 size-80 rounded-full bg-eucalypt/50 blur-3xl pointer-events-none" aria-hidden />
      <div className="relative">
        <ol role="tablist" aria-label="VisitReady journey" className="space-y-1">
          {STEPS.map((s, i) => {
            const on = i === active;
            return (
              <li key={s.tag}>
                <button
                  role="tab"
                  aria-selected={on}
                  data-testid={`showcase-tab-${i + 1}`}
                  onClick={() => setActive(i)}
                  className={cn("group w-full text-left rounded-2xl px-4 py-3 transition-[background-color] duration-300", on ? "bg-white/10" : "hover:bg-white/5")}
                >
                  <div className="flex items-baseline gap-4">
                    <span className={cn("font-heading text-3xl sm:text-4xl tabular-nums transition-colors duration-300", on ? "text-[#FCD34D]" : "text-white/30")}>0{i + 1}</span>
                    <div className="min-w-0">
                      <p className={cn("text-[11px] uppercase tracking-[0.18em] font-semibold", on ? "text-[#6EE7B7]" : "text-white/40")}>{s.tag}</p>
                      <p className={cn("font-heading text-xl sm:text-2xl leading-snug transition-colors duration-300", on ? "text-white" : "text-white/55 group-hover:text-white/80")}>{s.title}</p>
                      {on && <p className="mt-1 text-sm text-[#D1E7DF] leading-relaxed animate-fade-up">{s.text}</p>}
                    </div>
                  </div>
                  <div className="mt-3 h-0.5 rounded-full bg-white/10 overflow-hidden">
                    {on && <div key={`${active}-${paused}`} className="h-full bg-[#FCD34D]" style={{ width: paused ? "100%" : undefined, animation: paused ? undefined : `showcase-progress ${DURATION}ms linear forwards` }} />}
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="relative flex flex-col">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#6EE7B7]">
          <step.icon className="size-4" /> Live preview · {step.tag}
        </div>
        <div key={active} data-testid={`showcase-preview-${active + 1}`} className="mt-4 flex-1 min-h-[290px] grid content-center">
          <Preview />
        </div>
        <Link to={step.to} data-testid="showcase-try-link" className="mt-6 self-start inline-flex items-center gap-2 rounded-full bg-white text-eucalypt-deep px-5 py-2.5 text-sm font-semibold hover:bg-[#FCD34D] transition-colors duration-200">
          Try {step.tag.toLowerCase()} <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
