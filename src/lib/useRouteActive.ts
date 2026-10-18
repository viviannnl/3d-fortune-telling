"use client";

import { useLayoutEffect, useState } from "react";

let activations = 0;

/**
 * Returns a positive activation id while this route is visible, or 0 while hidden.
 * With Cache Components, Next.js hides inactive routes in <Activity mode="hidden">
 * (DOM kept, effects cleaned up), so expensive resources such as a WebGL context
 * should key off this. Each re-activation gets a new id.
 */
export function useRouteActivation(): number {
  const [id, setId] = useState(0);
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors Activity visibility, which has no other signal
    setId(++activations);
    return () => setId(0);
  }, []);
  return id;
}
