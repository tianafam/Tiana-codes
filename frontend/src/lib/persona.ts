import { useSyncExternalStore } from "react";
import type { BookingRequest, PathwaySuggestion, Questionnaire } from "@/lib/types";

// Which fictional demo persona the presenter is driving. Persisted so a refresh keeps the same journey.
const KEY = "visitready-persona";
let current = (typeof localStorage !== "undefined" && localStorage.getItem(KEY)) || "alex";
const listeners = new Set<() => void>();

export const getPersona = () => current;

export function setPersona(id: string) {
  current = id;
  localStorage.setItem(KEY, id);
  listeners.forEach((l) => l());
}

export const usePersonaId = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getPersona,
  );

// ---- demo sign-in session: nobody is signed in until they pick a patient on /patient/sign-in ----
const SIGNED_KEY = "visitready-signed-in";
let signedIn = typeof localStorage !== "undefined" && localStorage.getItem(SIGNED_KEY) === "1";
const sessionListeners = new Set<() => void>();
const emitSession = () => sessionListeners.forEach((l) => l());
const subscribeSession = (cb: () => void) => { sessionListeners.add(cb); return () => { sessionListeners.delete(cb); }; };

export const isSignedIn = () => signedIn;
export const useSignedIn = () => useSyncExternalStore(subscribeSession, isSignedIn);
export function setSignedIn(on: boolean) {
  signedIn = on;
  localStorage.setItem(SIGNED_KEY, on ? "1" : "0");
  emitSession();
}

// ---- guest answers kept in the browser until sign-in, then carried over to the new journey ----
export interface GuestDraft { questionnaire?: Questionnaire; pathway?: PathwaySuggestion; booking?: BookingRequest }
const GUEST_KEY = "visitready-guest";
let guest: GuestDraft = (() => { try { return JSON.parse(localStorage.getItem(GUEST_KEY) ?? "{}") as GuestDraft; } catch { return {}; } })();
export const getGuest = () => guest;
export const useGuest = () => useSyncExternalStore(subscribeSession, getGuest);
export function setGuest(next: GuestDraft) {
  guest = next;
  localStorage.setItem(GUEST_KEY, JSON.stringify(next));
  emitSession();
}
export const clearGuest = () => setGuest({});

/** Appends the active persona to a relative /api path, e.g. vurl("/visit") → "/visit?persona=alex". */
export const vurl = (path: string) => `${path}${path.includes("?") ? "&" : "?"}persona=${encodeURIComponent(getPersona())}`;
