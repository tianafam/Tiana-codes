import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, Clock, Lock, Quote, RotateCcw } from "lucide-react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { vurl } from "@/lib/persona";
import { apiPatch, apiPost } from "@/lib/api";
import { formatDateTime, useVisit, useVisitMutation } from "@/lib/hooks";
import { KIND_LABELS } from "@/lib/types";
import type { ConfirmTasksRequest, Task, TaskStatus, TaskStatusUpdate, Visit } from "@/lib/types";
import { cn } from "@/lib/utils";

const COLUMNS: { status: Exclude<TaskStatus, "suggested">; label: string; icon: typeof Clock }[] = [
  { status: "todo", label: "To Do", icon: Clock },
  { status: "in_progress", label: "In Progress", icon: ArrowRight },
  { status: "completed", label: "Completed", icon: CheckCircle2 },
];

export default function Actions() {
  const visit = useVisit();
  const v = visit.data;
  const approved = v?.consult.status === "approved";
  const tasks = v?.tasks ?? [];
  const suggested = tasks.filter((t) => t.status === "suggested");
  const active = tasks.filter((t) => t.status !== "suggested");
  const done = active.filter((t) => t.status === "completed").length;

  return (
    <AppShell>
      <PageHeader
        stage="follow"
        eyebrow="Step 4 · Follow through"
        title="Your follow-up plan"
        intro="Tasks come only from instructions your clinician has approved. Each one links back to the exact instruction, and nothing is active until you confirm it."
        aside={
          active.length > 0 && (
            <div data-testid="task-progress" className="rounded-2xl bg-white border border-line px-4 py-3 min-w-56">
              <p className="text-xs uppercase tracking-[0.15em] text-ink-muted">Progress</p>
              <p className="font-heading text-2xl text-ink">{done} of {active.length} done</p>
              <div className="mt-2 h-1.5 rounded-full bg-sand overflow-hidden">
                <div className="h-full bg-eucalypt transition-[width] duration-500" style={{ width: `${(done / active.length) * 100}%` }} />
              </div>
            </div>
          )
        }
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        {visit.isLoading && <div className="h-64 rounded-3xl ai-shimmer" />}
        {(visit.isError || (v && !approved)) && (
          <div data-testid="actions-locked" className="rounded-3xl border border-dashed border-line bg-white p-10 text-center">
            <Lock className="mx-auto size-8 text-ink-muted" />
            <h2 className="mt-3 text-2xl text-ink">Nothing to do yet</h2>
            <p className="mt-2 text-ink-muted max-w-lg mx-auto">
              {v?.consult.status === "draft"
                ? "Your clinician is reviewing draft notes. Follow-up tasks are only released once they approve them."
                : "After your appointment, your clinician's approved instructions will appear here as suggested tasks."}
            </p>
          </div>
        )}

        {v && approved && (
          <div className="grid lg:grid-cols-12 gap-6">
            <aside data-testid="approved-instructions-card" className="lg:col-span-4 rounded-3xl bg-eucalypt-deep text-white p-6 h-fit lg:sticky lg:top-24">
              <div className="flex items-center gap-2 text-[#6EE7B7]">
                <BadgeCheck className="size-5" />
                <span className="tracking-[0.15em] uppercase text-xs font-semibold">Approved instructions</span>
              </div>
              <p className="mt-2 text-xs text-[#ADC5BE]">
                From {v.consult.approved_by} · {v.consult.approved_at && formatDateTime(v.consult.approved_at)}
              </p>
              <ol className="mt-4 space-y-3">
                {v.consult.instructions.map((i, idx) => (
                  <li key={i.id} id={`instruction-${i.id}`} data-testid={`approved-instruction-${idx}`} className="text-sm leading-relaxed border-l-2 border-[#6EE7B7]/40 pl-3">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-[#FCD34D]">{KIND_LABELS[i.kind]}</span>
                    <p className="text-[#F5F8F7]">{i.text}</p>
                  </li>
                ))}
              </ol>
            </aside>

            <div className="lg:col-span-8 space-y-8">
              {suggested.length > 0 && <SuggestedTasks key={suggested.map((t) => t.id).join()} tasks={suggested} />}
              {active.length > 0 && (
                <div>
                  <h2 className="text-2xl text-ink">Your checklist</h2>
                  <div data-testid="task-board" className="mt-4 grid md:grid-cols-3 gap-4">
                    {COLUMNS.map((col) => {
                      const items = active.filter((t) => t.status === col.status);
                      return (
                        <div key={col.status} data-testid={`task-column-${col.status}`} className="rounded-3xl bg-sand/60 border border-line p-3 min-h-40">
                          <div className="flex items-center justify-between px-2 py-1">
                            <span className="text-sm font-semibold text-ink flex items-center gap-1.5"><col.icon className="size-4 text-eucalypt" />{col.label}</span>
                            <span className="font-mono text-xs text-ink-muted">{items.length}</span>
                          </div>
                          <div className="mt-2 space-y-2">
                            {items.map((t) => <TaskCard key={t.id} task={t} />)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {active.length > 0 && done === active.length && suggested.length === 0 && (
                <div data-testid="all-done-card" className="rounded-3xl bg-eucalypt-soft border border-eucalypt/20 p-6 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-eucalypt font-heading text-xl">All follow-up actions complete. Nice work, {v.patient.name.split(" ")[0]}.</p>
                  <Link to="/journey" data-testid="actions-journey-link" className={cn(buttonVariants(), "rounded-full")}>See full journey</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function SourceQuote({ task }: { task: Task }) {
  return (
    <div className="mt-2 rounded-xl bg-cream border border-line p-2.5 text-xs text-ink-muted">
      <span className="flex items-center gap-1 font-semibold text-eucalypt"><Quote className="size-3" /> Source: approved instruction</span>
      <p data-testid={`task-source-${task.id}`} className="mt-1 text-ink leading-relaxed">“{task.source_text}”</p>
    </div>
  );
}

function SuggestedTasks({ tasks }: { tasks: Task[] }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(tasks.map((t) => t.id)));
  const confirm = useVisitMutation((b: ConfirmTasksRequest) => apiPost<Visit>(vurl("/visit/tasks/confirm"), b), "Tasks added to your checklist");
  const toggle = (id: string, on: boolean) =>
    setSelected((s) => {
      const n = new Set(s);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });

  return (
    <div data-testid="suggested-tasks" className="rounded-3xl bg-white border border-line p-5 sm:p-6 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge className="bg-[#FEF3C7] text-[#92400E]">Suggested · not active yet</Badge>
          <h2 className="mt-2 text-2xl text-ink">Review your suggested tasks</h2>
          <p className="text-sm text-ink-muted">Choose which ones to add to your checklist.</p>
        </div>
        <Button
          data-testid="task-confirm-btn"
          disabled={selected.size === 0 || confirm.isPending}
          onClick={() => confirm.mutate({ task_ids: [...selected] })}
          className="rounded-full px-5"
        >
          {confirm.isPending ? "Confirming…" : `Confirm ${selected.size} task${selected.size === 1 ? "" : "s"}`}
        </Button>
      </div>
      <ul className="mt-5 grid sm:grid-cols-2 gap-3">
        {tasks.map((t) => (
          <li key={t.id}>
            <label
              data-testid={`suggested-task-${t.id}`}
              className={cn(
                "block rounded-2xl border p-4 cursor-pointer transition-[border-color,background-color] duration-200",
                selected.has(t.id) ? "border-eucalypt bg-eucalypt-soft/40" : "border-line",
              )}
            >
              <div className="flex items-start gap-3">
                <Checkbox data-testid={`suggested-task-checkbox-${t.id}`} checked={selected.has(t.id)} onCheckedChange={(c) => toggle(t.id, c === true)} className="mt-1" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-medium text-ink">{t.title}</p>
                    <Badge variant="outline" className="text-[10px]">{KIND_LABELS[t.kind]}</Badge>
                    {t.verbatim && <Badge data-testid={`verbatim-badge-${t.id}`} className="bg-terracotta-soft text-terracotta text-[10px]"><Lock className="size-2.5" /> Verbatim from clinician</Badge>}
                  </div>
                  <SourceQuote task={t} />
                </div>
              </div>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const update = useVisitMutation((b: TaskStatusUpdate) => apiPatch<Visit>(vurl(`/visit/tasks/${task.id}`), b));
  const busy = update.isPending;
  return (
    <div data-testid={`task-card-${task.id}`} data-status={task.status} className="rounded-2xl bg-white border border-line p-3 shadow-[0_8px_20px_-16px_rgba(23,46,39,0.5)] animate-fade-up">
      <div className="flex flex-wrap items-center gap-1.5">
        <p className={cn("font-medium text-sm text-ink", task.status === "completed" && "line-through text-ink-muted")}>{task.title}</p>
        {task.verbatim && <Badge className="bg-terracotta-soft text-terracotta text-[10px]"><Lock className="size-2.5" /> Verbatim</Badge>}
      </div>
      <SourceQuote task={task} />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {task.status === "todo" && (
          <Button size="xs" data-testid={`task-start-btn-${task.id}`} disabled={busy} onClick={() => update.mutate({ status: "in_progress" })}>
            Start <ArrowRight className="size-3" />
          </Button>
        )}
        {task.status === "in_progress" && (
          <>
            <Button size="xs" variant="outline" data-testid={`task-back-btn-${task.id}`} disabled={busy} onClick={() => update.mutate({ status: "todo" })}>
              <ArrowLeft className="size-3" /> To Do
            </Button>
            <Button size="xs" data-testid={`task-complete-btn-${task.id}`} disabled={busy} onClick={() => update.mutate({ status: "completed" })}>
              <CheckCircle2 className="size-3" /> Complete
            </Button>
          </>
        )}
        {task.status === "completed" && (
          <Button size="xs" variant="ghost" data-testid={`task-reopen-btn-${task.id}`} disabled={busy} onClick={() => update.mutate({ status: "in_progress" })}>
            <RotateCcw className="size-3" /> Reopen
          </Button>
        )}
      </div>
    </div>
  );
}
