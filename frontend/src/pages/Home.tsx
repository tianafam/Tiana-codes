import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronRight, ClipboardCheck, Compass, ListChecks, Search, Stethoscope } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServices } from "@/lib/hooks";

// Bright, uncluttered clinic waiting room — Pexels (free to use), photo 8459996.
const HERO_IMG = "https://images.pexels.com/photos/8459996/pexels-photo-8459996.jpeg?auto=compress&cs=tinysrgb&w=1800&h=600&fit=crop";

const STEPS = [
  { icon: Compass, tag: "Discover", title: "Find your next step", text: "Not sure where to start? Explore care options and find an appointment that fits." },
  { icon: ClipboardCheck, tag: "Prepare", title: "Make every conversation count", text: "Turn your concerns and questions into a clear, editable appointment brief." },
  { icon: Stethoscope, tag: "Consult", title: "AI assists. Clinicians decide.", text: "AI drafts consultation notes while clinicians review and approve the care plan." },
  { icon: ListChecks, tag: "Follow through", title: "Know what comes next", text: "Turn approved instructions into a personal checklist you can confirm and track." },
];

const CARD = "h-full rounded-3xl bg-white border border-line p-6 sm:p-7 flex flex-col transition-[box-shadow,border-color] duration-200 hover:border-eucalypt/40 hover:shadow-[0_18px_40px_-28px_rgba(23,46,39,0.45)]";

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const services = useServices();
  const search = () => navigate(`/patient/clinics${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);

  return (
    <AppShell>
      {/* Hero: short headline, wide banner, then the two pathways */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 sm:pt-10">
        <div className="max-w-3xl animate-fade-up">
          <h1 data-testid="home-hero-title" className="text-[38px] sm:text-[52px] leading-[1.06] tracking-tight text-ink">
            Your health journey, connected.
          </h1>
          <p data-testid="home-hero-subtitle" className="mt-3 text-lg text-ink-muted leading-relaxed max-w-2xl">
            Find the care you need, prepare with confidence, and stay on track after every visit — all in one place.
          </p>
        </div>

        <div className="mt-6 relative h-36 sm:h-44 lg:h-48 rounded-3xl overflow-hidden border border-line">
          <img src={HERO_IMG} alt="A bright, calm clinic waiting room" data-testid="home-hero-image" className="absolute inset-0 size-full object-cover object-center" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,38,32,0.35)_0%,rgba(17,38,32,0)_55%)]" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8" aria-labelledby="help-heading">
        <h2 id="help-heading" data-testid="pathways-heading" className="text-[26px] sm:text-[30px] tracking-tight text-ink">How can we help you today?</h2>
        <div className="mt-4 grid md:grid-cols-2 gap-5">
          <div data-testid="pathway-direct-card" className={CARD}>
            <span className="size-10 rounded-full bg-eucalypt-soft text-eucalypt grid place-items-center"><Search className="size-5" /></span>
            <h3 className="mt-4 text-[22px] text-ink">I know what I need</h3>
            <p className="mt-1 text-[15px] text-ink-muted">Search for a service, clinic or suburb.</p>
            <form className="mt-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); search(); }}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-muted" />
                <Input
                  data-testid="pathway-direct-search-input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search services, e.g. GP, physio, Carlton"
                  aria-label="Search services or clinics"
                  className="h-11 pl-9 bg-cream hover:border-eucalypt/50 focus-visible:border-eucalypt focus-visible:ring-eucalypt/20"
                />
              </div>
              <Button type="submit" data-testid="pathway-direct-btn" className="h-11 px-5 rounded-xl">Search</Button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {(services.data ?? []).slice(0, 5).map((s) => (
                <Link
                  key={s.id}
                  to={`/patient/clinics?service=${s.id}`}
                  data-testid={`service-chip-${s.id}`}
                  className="rounded-full border border-line bg-white px-3 py-1 text-[13px] text-ink hover:border-eucalypt hover:text-eucalypt transition-colors duration-200"
                >
                  {s.name}
                </Link>
              ))}
            </div>
          </div>

          <div data-testid="pathway-guided-card" className={CARD}>
            <span className="size-10 rounded-full bg-eucalypt-soft text-eucalypt grid place-items-center"><Compass className="size-5" /></span>
            <h3 className="mt-4 text-[22px] text-ink">Help me find care</h3>
            <p className="mt-1 text-[15px] text-ink-muted">Answer four short questions to explore your options. Guidance only — never a diagnosis.</p>
            <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[14px] text-ink">
              {["Your main concern", "How long it's been", "Care you've already had", "Where you'd like to be seen"].map((x) => (
                <li key={x} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-eucalypt" />{x}</li>
              ))}
            </ul>
            <div className="mt-auto pt-5">
              <Button data-testid="pathway-guided-btn" onClick={() => navigate("/patient/navigate")} className="h-11 px-5 rounded-xl group">
                Start guided questions <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-14" aria-labelledby="steps-heading">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="steps-heading" data-testid="steps-heading" className="text-[28px] sm:text-[34px] tracking-tight text-ink lg:whitespace-nowrap">One journey. Four connected steps.</h2>
          <p className="text-[14px] text-ink-muted">AI support and clinician-reviewed care instructions.</p>
        </div>
        <ol className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {STEPS.map((s, i) => (
            <li key={s.tag} data-testid={`how-step-${i + 1}`} className="relative h-full">
              <div className="h-full rounded-2xl border border-line bg-white p-5 transition-[border-color] duration-200 hover:border-eucalypt/40">
                <div className="flex items-center gap-2">
                  <span className="size-9 rounded-xl bg-eucalypt-soft text-eucalypt grid place-items-center"><s.icon className="size-[18px]" /></span>
                  <span className="text-[11px] tracking-[0.14em] uppercase font-semibold text-terracotta">0{i + 1} — {s.tag}</span>
                </div>
                <h3 className="mt-4 text-[19px] leading-snug text-ink">{s.title}</h3>
                <p className="mt-1.5 text-[14px] text-ink-muted leading-relaxed">{s.text}</p>
              </div>
              {i < STEPS.length - 1 && (
                <span aria-hidden className="hidden lg:grid absolute top-1/2 -right-[19px] -translate-y-1/2 z-10 size-8 rounded-full bg-cream border border-line text-eucalypt place-items-center">
                  <ChevronRight className="size-4" />
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>
    </AppShell>
  );
}
