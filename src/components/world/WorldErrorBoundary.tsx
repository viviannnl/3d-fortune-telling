"use client";

import { Component, type ReactNode } from "react";

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/** Catches render/context errors from the WebGL subtree so the HTML UI stays usable. */
export class WorldErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[world] 3D scene failed:", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
