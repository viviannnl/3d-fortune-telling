"use client";

import { createContext, useContext, type RefObject } from "react";

export interface DestinationSignals {
  /** Damped 0..1 hover/attention amount, updated every frame. */
  glow: RefObject<number>;
}

export const DestinationContext = createContext<DestinationSignals | null>(null);

export function useDestinationSignals(): DestinationSignals {
  const ctx = useContext(DestinationContext);
  if (!ctx) throw new Error("useDestinationSignals must be used inside a DestinationHotspot");
  return ctx;
}
