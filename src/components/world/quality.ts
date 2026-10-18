"use client";

import { createContext, useContext } from "react";
import type { RenderQuality } from "@/lib/webgl";

/** Render tier for the current canvas; components scale density and lights from it. */
export const QualityContext = createContext<RenderQuality>("high");

export function useQuality(): RenderQuality {
  return useContext(QualityContext);
}
