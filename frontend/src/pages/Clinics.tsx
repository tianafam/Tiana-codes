import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ArrowRight, CalendarCheck, MapPin, Search, Star, Video } from "lucide-react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vurl } from "@/lib/persona";
import { apiPost } from "@/lib/api";
import { useClinics, useServices, useVisit, useVisitMutation } from "@/lib/hooks";
import type { BookingRequest, Clinic, Visit } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Clinics() {
  const [params, setParams] = useSearchParams();
  const service = params.get("service") ?? "all";
  const q = params.get("q") ?? "";
  const clinics = useClinics();
  const services = useServices();
  const visit = useVisit();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pracId, setPracId] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const book = useVisitMutation((b: BookingRequest) => apiPost<Visit>(vurl("/visit/booking"), b));

  const serviceNames = useMemo(() => Object.fromEntries((services.data ?? []).map((s) => [s.id, s.name])), [services.data]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (clinics.data ?? []).filter((c) => {
      if (service !== "all" && !c.services.includes(service)) return false;
      if (!needle) return true;
      const hay = [c.name, c.suburb, ...c.services.map((s) => serviceNames[s] ?? s), ...c.practitioners.map((p) => p.name)].join(" ").toLowerCase();
      return needle.split(/\s+/).some((w) => hay.includes(w));
    });
  }, [clinics.data, service, q, serviceNames]);

  const selected: Clinic | undefined = filtered.find((c) => c.id === selectedId) ?? filtered[0];
  const prac = selected?.practitioners.find((p) => p.id === pracId) ?? selected?.practitioners[0];
  const pracSlots = selected?.slots.filter((s) => s.practitioner_id === prac?.id) ?? [];
  const days = [...new Set(pracSlots.map((s) => s.date))];
  const activeDay = day && days.includes(day) ? day : days[0];
  const daySlots = pracSlots.filter((s) => s.date === activeDay);
  const slot = pracSlots.find((s) => s.id === slotId);
  const bookingService = service !== "all" && selected?.services.includes(service) ? service : selected?.services[0] ?? "gp";

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v && v !== "all") next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };

  const selectClinic = (id: string) => { setSelectedId(id); setPracId(null); setDay(null); setSlotId(null); };

  const confirm = () => {
    if (!selected || !slot) return;
    book.mutate({ clinic_id: selected.id, slot_id: slot.id, service_id: bookingService }, { onSuccess: () => setConfirmOpen(true) });
  };

  const booking = visit.data?.booking;

  return (
    <AppShell>
      <PageHeader
        stage="find"
        eyebrow="Step 1 · Book"
        title="Choose a clinic and a time"
        intro="Fictional clinics and practitioners. Booking here is simulated — no real appointment is made."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-muted" />
          <Input
            data-testid="clinic-search-input"
            value={q}
            onChange={(e) => setParam("q", e.target.value)}
            placeholder="Search clinic, suburb or practitioner"
            className="pl-9 h-11 bg-white"
          />
        </div>
        <Select value={service} onValueChange={(v: string) => setParam("service", v)}>
          <SelectTrigger data-testid="clinic-service-select" className="h-11 sm:w-64 bg-white">
            <SelectValue>{(v) => (v === "all" ? "All services" : serviceNames[v as string] ?? "Service")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All services</SelectItem>
            {(services.data ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id} data-testid={`clinic-service-option-${s.id}`}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {booking && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-4">
          <div data-testid="existing-booking-banner" className="rounded-2xl bg-eucalypt-soft border border-eucalypt/20 px-4 py-3 flex flex-wrap items-center gap-3 justify-between text-sm">
            <span className="text-eucalypt">
              <CalendarCheck className="inline size-4 mr-1" /> Booked: {booking.practitioner_name}, {booking.clinic_name} · {format(parseISO(booking.date), "EEE d MMM")} {booking.time}
            </span>
            <Link to="/patient/prep" data-testid="existing-booking-prep-link" className="font-semibold text-eucalypt inline-flex items-center gap-1">
              Prepare for this visit <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-6 grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-3" data-testid="clinic-list">
          {clinics.isLoading && [0, 1, 2].map((i) => <div key={i} className="h-36 rounded-3xl ai-shimmer" />)}
          {!clinics.isLoading && filtered.length === 0 && (
            <div data-testid="clinic-empty-state" className="rounded-3xl border border-dashed border-line p-8 text-center text-ink-muted">
              No clinics match that search. Try another service or suburb.
            </div>
          )}
          {filtered.map((c) => (
            <button
              key={c.id}
              data-testid={`clinic-card-${c.id}`}
              onClick={() => selectClinic(c.id)}
              className={cn(
                "w-full text-left rounded-3xl border bg-white p-3 flex gap-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5",
                selected?.id === c.id ? "border-eucalypt shadow-[0_16px_40px_-24px_rgba(13,92,77,0.6)]" : "border-line",
              )}
            >
              <img src={c.image} alt="" className="size-24 sm:size-28 rounded-2xl object-cover shrink-0" />
              <div className="min-w-0 py-1">
                <p className="font-heading text-lg text-ink leading-tight">{c.name}</p>
                <p className="mt-1 text-xs text-ink-muted flex items-center gap-1"><MapPin className="size-3" />{c.suburb}{c.distance_km > 0 && ` · ${c.distance_km} km`}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.bulk_billing && <Badge className="bg-eucalypt-soft text-eucalypt">Bulk billing</Badge>}
                  <Badge variant="outline" className="gap-1"><Star className="size-3 fill-[#FBBF24] text-[#FBBF24]" />{c.rating}</Badge>
                  {c.services.slice(0, 2).map((s) => <Badge key={s} variant="secondary">{serviceNames[s] ?? s}</Badge>)}
                </div>
              </div>
            </button>
          ))}
        </div>

        {selected && prac && (
          <div className="lg:col-span-7">
            <div data-testid="clinic-detail-panel" key={selected.id} className="lg:sticky lg:top-24 rounded-3xl bg-white border border-line overflow-hidden animate-fade-up">
              <div className="relative h-40">
                <img src={selected.image} alt={selected.name} className="absolute inset-0 size-full object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(17,38,32,0.85)_0%,rgba(20,48,40,0.4)_100%)]" />
                <div className="absolute bottom-4 left-5 right-5 text-white">
                  <h2 data-testid="clinic-detail-name" className="text-2xl">{selected.name}</h2>
                  <p className="text-sm text-[#D1E7DF]">{selected.address}</p>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-sm text-ink-muted">{selected.blurb}</p>

                <p className="mt-5 tracking-[0.15em] uppercase text-xs font-semibold text-ink-muted">Practitioner</p>
                <div className="mt-2 grid sm:grid-cols-2 gap-2">
                  {selected.practitioners.map((p) => (
                    <button
                      key={p.id}
                      data-testid={`practitioner-${p.id}`}
                      onClick={() => { setPracId(p.id); setDay(null); setSlotId(null); }}
                      className={cn(
                        "rounded-2xl border p-3 text-left transition-[border-color,background-color] duration-200",
                        prac.id === p.id ? "border-eucalypt bg-eucalypt-soft/60" : "border-line hover:border-eucalypt/40",
                      )}
                    >
                      <p className="font-medium text-ink">{p.name}</p>
                      <p className="text-xs text-ink-muted">{p.role} · {p.languages.join(", ")}</p>
                      <p className="mt-1 text-xs text-ink-muted leading-relaxed">{p.bio}</p>
                    </button>
                  ))}
                </div>

                <p className="mt-5 tracking-[0.15em] uppercase text-xs font-semibold text-ink-muted">Available times</p>
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {days.map((d) => (
                    <button
                      key={d}
                      data-testid={`slot-day-${d}`}
                      onClick={() => { setDay(d); setSlotId(null); }}
                      className={cn(
                        "rounded-xl px-3 py-2 text-sm border shrink-0 transition-colors duration-200",
                        activeDay === d ? "bg-eucalypt-deep text-white border-eucalypt-deep" : "border-line text-ink hover:bg-sand",
                      )}
                    >
                      {format(parseISO(d), "EEE d MMM")}
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {daySlots.map((s) => (
                    <button
                      key={s.id}
                      data-testid={`slot-${s.time.replace(":", "")}`}
                      onClick={() => setSlotId(s.id)}
                      className={cn(
                        "rounded-xl border py-2.5 text-sm font-mono transition-[background-color,border-color,transform] duration-200 active:scale-95",
                        slotId === s.id ? "bg-terracotta text-white border-terracotta" : "border-line hover:border-terracotta/60",
                      )}
                    >
                      {s.time}
                      {s.mode === "telehealth" && <Video className="inline size-3 ml-1" />}
                    </button>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                  <p data-testid="booking-summary" className="text-sm text-ink-muted">
                    {slot ? (
                      <>
                        <span className="text-ink font-medium">{prac.name}</span> · {format(parseISO(slot.date), "EEEE d MMMM")} at {slot.time}
                      </>
                    ) : (
                      "Select a time to continue"
                    )}
                  </p>
                  <Button data-testid="confirm-booking-btn" disabled={!slot || book.isPending} onClick={confirm} className="h-11 px-6 rounded-full">
                    {book.isPending ? "Confirming…" : "Confirm simulated booking"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent data-testid="booking-confirmation-dialog">
          <DialogHeader>
            <div className="size-12 rounded-full bg-eucalypt-soft text-eucalypt grid place-items-center"><CalendarCheck className="size-6" /></div>
            <DialogTitle className="font-heading text-2xl">You're booked in</DialogTitle>
            <DialogDescription>Simulated appointment — no real booking has been made.</DialogDescription>
          </DialogHeader>
          {booking && (
            <div className="rounded-2xl bg-cream border border-line p-4 text-sm space-y-1">
              <p className="font-medium text-ink">{booking.practitioner_name} · {booking.service_name}</p>
              <p className="text-ink-muted">{booking.clinic_name}, {booking.clinic_address}</p>
              <p className="text-ink">{format(parseISO(booking.date), "EEEE d MMMM")} at {booking.time}</p>
              <p className="font-mono text-xs text-ink-muted pt-1">Ref <span data-testid="booking-reference">{booking.reference}</span></p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" data-testid="booking-dialog-close-btn" onClick={() => setConfirmOpen(false)}>Close</Button>
            <Link to="/patient/prep" data-testid="booking-go-prep-btn" className={buttonVariants()} onClick={() => setConfirmOpen(false)}>
              Prepare for my visit <ArrowRight className="size-4" />
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
