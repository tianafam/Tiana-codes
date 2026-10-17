import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Compass, Search, Sparkles, ClipboardCheck, Stethoscope, ListChecks } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServices, useVisit } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const HERO_IMG =
  "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?crop=entropy&cs=srgb&fm=jpg&w=1400&q=70";

const STEPS = [
  { icon: Compass, title: "Find the right care", text: "Search directly, or answer a few guided questions to explore services." },
  { icon: ClipboardCheck, title: "Arrive prepared", text: "AI turns your own words into a one-page brief you control and choose to share." },
  { icon: Stethoscope, title: "Clinician stays in control", text: "AI drafts the notes. Nothing reaches you until your doctor approves it." },
  { icon: ListChecks, title: "Follow through", text: "Approved instructions become a checklist you confirm and track." },
];

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const services = useServices();
  const visit = useVisit();
  const started = !!visit.data?.questionnaire || !!visit.data?.booking;

  const search = () => navigate(`/clinics${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);

  return (
    <AppShell>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 paper-grain opacity-60 pointer-events-none" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-10 sm:pt-16 pb-12 grid lg:grid-cols-12 gap-10 lg:gap-12">
          <div className="lg:col-span-7 animate-fade-up">
            <p className="tracking-[0.15em] uppercase text-xs font-semibold text-terracotta">Your healthcare journey companion</p>
            <h1 data-testid="home-hero-title" className="mt-4 text-[40px] sm:text-[56px] leading-[1.05] tracking-tight text-ink">
              Walk into every appointment <em className="text-eucalypt not-italic font-medium italic">ready</em>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-muted leading-relaxed">
              From not knowing who to see, to a clear plan after your visit. VisitReady helps you find care, prepare what to say, and
              keep track of what your doctor agreed — with every AI step reviewed by a human.
            </p>

            <div className="mt-8 relative rounded-3xl overflow-hidden h-56 sm:h-72">
              <img src={HERO_IMG} alt="A GP talking with a patient in a calm clinic room" className="absolute inset-0 size-full object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(17,38,32,0.85)_0%,rgba(20,48,40,0.35)_100%)]" />
              <div data-testid="persona-card" className="absolute left-4 bottom-4 right-4 sm:right-auto sm:max-w-sm rounded-2xl bg-white/12 backdrop-blur-md border border-white/20 p-4 text-white">
                <div className="flex items-center gap-3">
                  <span className="size-10 rounded-full bg-[#FCD34D] text-eucalypt-deep grid place-items-center font-semibold">AT</span>
                  <div>
                    <p className="font-heading text-lg leading-tight">Meet Alex, 32</p>
                    <p className="text-xs text-[#D1E7DF]">Fictional demo patient · Carlton VIC</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-[#D1E7DF] leading-relaxed">
                  “I've had a dry cough for three weeks since a cold. I don't know if I need a GP, a specialist, or just to wait it out.”
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-5 lg:pt-10">
            <div data-testid="pathway-direct-card" className="rounded-3xl bg-white border border-line p-6 shadow-[0_20px_50px_-30px_rgba(23,46,39,0.35)] animate-fade-up [animation-delay:80ms]">
              <div className="flex items-center gap-2 text-eucalypt">
                <Search className="size-5" />
                <span className="tracking-[0.15em] uppercase text-xs font-semibold">Pathway one</span>
              </div>
              <h2 className="mt-3 text-2xl text-ink">I know what I need</h2>
              <p className="mt-1 text-sm text-ink-muted">Search by service, clinic or suburb and book a time.</p>
              <form
                className="mt-4 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  search();
                }}
              >
                <Input
                  data-testid="pathway-direct-search-input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="e.g. GP, physio, Carlton"
                  className="h-11 bg-cream"
                />
                <Button type="submit" data-testid="pathway-direct-btn" className="h-11 px-5">
                  Search
                </Button>
              </form>
              <div className="mt-4 flex flex-wrap gap-2">
                {(services.data ?? []).slice(0, 5).map((s) => (
                  <Link
                    key={s.id}
                    to={`/clinics?service=${s.id}`}
                    data-testid={`service-chip-${s.id}`}
                    className="rounded-full border border-line bg-cream px-3 py-1 text-xs text-ink hover:border-eucalypt hover:text-eucalypt transition-colors duration-200"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>

            <button
              data-testid="pathway-guided-btn"
              onClick={() => navigate("/navigate")}
              className="group text-left rounded-3xl bg-eucalypt-deep text-white p-6 relative overflow-hidden transition-transform duration-300 hover:-translate-y-0.5 animate-fade-up [animation-delay:160ms]"
            >
              <div className="absolute -right-10 -top-10 size-40 rounded-full bg-eucalypt/60 blur-2xl" aria-hidden />
              <div className="relative">
                <div className="flex items-center gap-2 text-[#6EE7B7]">
                  <Compass className="size-5" />
                  <span className="tracking-[0.15em] uppercase text-xs font-semibold">Pathway two</span>
                </div>
                <h2 className="mt-3 text-2xl">Help me find the right care</h2>
                <p className="mt-1 text-sm text-[#ADC5BE] leading-relaxed">
                  Describe what's going on in your own words. Answer four short questions and we'll show services people commonly explore — no
                  medical jargon, and never a diagnosis.
                </p>
                <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#FCD34D] text-eucalypt-deep px-4 py-2 text-sm font-semibold">
                  Start guided questions <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </div>
            </button>

            {started && (
              <Link
                to="/journey"
                data-testid="home-continue-journey-link"
                className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-full justify-between bg-white")}
              >
                <span className="flex items-center gap-2"><Sparkles className="size-4 text-terracotta" /> Continue Alex's journey</span>
                <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-6">
        <h2 className="text-2xl sm:text-3xl text-ink tracking-tight max-w-md">One visit, four connected moments.</h2>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              data-testid={`how-step-${i + 1}`}
              className={cn(
                "rounded-2xl border border-line bg-white p-5 transition-transform duration-300 hover:-translate-y-1",
                i % 2 === 1 && "lg:mt-8",
              )}
            >
              <div className="flex items-center justify-between">
                <s.icon className="size-5 text-eucalypt" />
                <span className="font-mono text-xs text-ink-muted">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg text-ink">{s.title}</h3>
              <p className="mt-1 text-sm text-ink-muted leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
