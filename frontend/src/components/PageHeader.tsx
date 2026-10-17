import type { ReactNode } from "react";
import JourneyStepper from "@/components/JourneyStepper";

export default function PageHeader({
  stage, eyebrow, title, intro, aside,
}: { stage?: string; eyebrow: string; title: string; intro?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 sm:pt-10 animate-fade-up">
      {stage && <JourneyStepper current={stage} />}
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="tracking-[0.15em] uppercase text-xs font-semibold text-terracotta">{eyebrow}</p>
          <h1 className="mt-2 text-3xl sm:text-[42px] leading-tight tracking-tight text-ink">{title}</h1>
          {intro && <div className="mt-3 text-ink-muted leading-relaxed">{intro}</div>}
        </div>
        {aside}
      </div>
    </div>
  );
}
