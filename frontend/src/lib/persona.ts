import { useSyncExternalStore } from "react";

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

/** Appends the active persona to a relative /api path, e.g. vurl("/visit") → "/visit?persona=alex". */
export const vurl = (path: string) => `${path}${path.includes("?") ? "&" : "?"}persona=${encodeURIComponent(getPersona())}`;
