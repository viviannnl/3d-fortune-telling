"use client";

import Link from "next/link";
import { DestinyControls } from "@/components/destiny/DestinyControls";
import { ElementLabels } from "@/components/destiny/ElementLabels";
import { TarotControls } from "@/components/tarot/TarotControls";
import { WorldStage } from "@/components/world/WorldStage";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { useExperience } from "@/stores/experience";
import { BlessingToast } from "./BlessingToast";
import { DestinationLabels } from "./DestinationLabels";
import { DestinationShell } from "./DestinationShell";
import { LanguageToggle } from "./LanguageToggle";
import { PreferencesBootstrap } from "./PreferencesBootstrap";
import { SanctuaryOverlay } from "./SanctuaryOverlay";
import { SkyLine } from "./SkyLine";
import { WishLabels } from "./WishLabels";
import { SoundToggle } from "./SoundToggle";
import { AudioDirector } from "./AudioDirector";

/** Full-screen root: the 3D world underneath, minimal accessible HTML on top. */
export function AppShell() {
  const t = useDictionary();
  const view = useExperience((s) => s.view);

  return (
    <main className="relative h-dvh w-full overflow-hidden" data-view={view}>
      <PreferencesBootstrap />
      <WorldStage />
      {view === "sanctuary" && <DestinationLabels />}
      {view === "sanctuary" && <WishLabels />}
      {view === "sanctuary" && <BlessingToast />}
      {view === "destiny" && <ElementLabels />}

      {/* Soft scrims keep the title and controls legible over foliage and the moon's reflection. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{ background: "linear-gradient(to bottom, rgb(23 21 47 / 0.72), rgb(23 21 47 / 0.3) 60%, transparent)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%]"
        style={{ background: "linear-gradient(to top, rgb(23 21 47 / 0.78), rgb(23 21 47 / 0.35) 55%, transparent)" }}
      />

      <div className="pointer-events-none absolute inset-0 flex flex-col p-5 md:p-8">
        <header className="flex items-start justify-between gap-4">
          <div className="max-w-xs [text-shadow:var(--text-halo)]">
            <p className="font-serif text-2xl font-medium tracking-wide text-text md:text-[1.75rem]">{t.brand.name}</p>
            {view === "sanctuary" && (
              <>
                <p className="mt-1 hidden text-sm leading-relaxed text-text-muted sm:block">{t.brand.tagline}</p>
                <div className="hidden sm:block">
                  <SkyLine />
                </div>
              </>
            )}
          </div>
          <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
            <AudioDirector />
            <SoundToggle />
            <LanguageToggle />
          </div>
        </header>

        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          {view === "sanctuary" && <SanctuaryOverlay key="sanctuary" />}
          {view === "tarot" && (
            <DestinationShell key="tarot" id="tarot">
              <TarotControls />
            </DestinationShell>
          )}
          {view === "destiny" && (
            <DestinationShell key="destiny" id="destiny">
              <DestinyControls />
            </DestinationShell>
          )}
        </div>

        <footer
          data-view={view}
          className="mt-3 flex flex-col items-center justify-center gap-1 text-center data-[view=destiny]:max-sm:hidden data-[view=tarot]:max-sm:hidden text-xs tracking-wide text-text-muted [text-shadow:var(--text-halo)] sm:flex-row sm:gap-3"
        >
          <span>{t.footer.disclaimer}</span>
          <span aria-hidden className="hidden sm:inline">
            ·
          </span>
          <Link
            href="/about"
            className="pointer-events-auto rounded-sm underline decoration-border underline-offset-4 transition-colors duration-150 hover:text-text"
          >
            {t.footer.about}
          </Link>
        </footer>
      </div>
    </main>
  );
}
