"use client";

import { useMemo, type FormEvent, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CITIES, REGIONS } from "@/features/destiny/cities";
import { OTHER_PLACE, type FieldError } from "@/features/destiny/validation";
import { playSound } from "@/lib/audio/engine";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { usePreferences } from "@/stores/preferences";
import { useDestiny } from "@/stores/destiny";

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const inputClass =
  "mt-1.5 block h-10 w-full rounded-sm border border-border bg-surface/70 px-3 text-sm text-text placeholder:text-text-muted/70 transition-colors duration-150 hover:border-lavender/70 focus-visible:border-pale-blue aria-[invalid=true]:border-danger-border disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:dark]";

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 flex items-start gap-1.5 text-xs text-danger">
          <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export function DestinyForm() {
  const t = useDictionary().destiny;
  const locale = usePreferences((s) => s.locale);
  const draft = useDestiny((s) => s.draft);
  const fieldErrors = useDestiny((s) => s.fieldErrors);
  const chartError = useDestiny((s) => s.chartError);
  const { setDraft, submit } = useDestiny.getState();
  const today = localToday();
  const timeZones = useMemo(
    () => (typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : []),
    [],
  );

  const message = (code: FieldError | undefined) => (code ? t.errors[code] : undefined);
  const describedBy = (id: string, hasHint: boolean, error?: string) =>
    error ? `${id}-error` : hasHint ? `${id}-hint` : undefined;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (submit(localToday())) {
      playSound("reveal");
      return;
    }
    // Move focus to the first problem so keyboard and screen-reader users land on it.
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>("[data-destiny-form] [aria-invalid=true], [data-destiny-form] [role=alert]")
        ?.focus(),
    );
  };

  const errors = {
    date: message(fieldErrors.date),
    time: message(fieldErrors.time),
    place: message(fieldErrors.place),
    timeZone: message(fieldErrors.timeZone),
    longitude: message(fieldErrors.longitude),
  };

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      data-destiny-form
      className="flex flex-col gap-4"
      aria-labelledby="destiny-form-title"
    >
      <div>
        <h3 id="destiny-form-title" className="font-serif text-xl text-text">
          {t.form.title}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-text-muted">{t.form.intro}</p>
      </div>

      <Field id="birth-date" label={t.form.date} error={errors.date}>
        <input
          id="birth-date"
          type="date"
          min="1900-01-01"
          max={today}
          value={draft.date}
          onChange={(e) => setDraft({ date: e.target.value })}
          aria-invalid={Boolean(errors.date)}
          aria-describedby={describedBy("birth-date", false, errors.date)}
          className={inputClass}
        />
      </Field>

      <div>
        <Field id="birth-time" label={t.form.time} hint={t.form.timeHint} error={errors.time}>
          <input
            id="birth-time"
            type="time"
            value={draft.time}
            disabled={!draft.timeKnown}
            onChange={(e) => setDraft({ time: e.target.value })}
            aria-invalid={Boolean(errors.time)}
            aria-describedby={describedBy("birth-time", true, errors.time)}
            className={inputClass}
          />
        </Field>
        <label className="mt-2 flex cursor-pointer items-start gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={!draft.timeKnown}
            onChange={(e) => setDraft({ timeKnown: !e.target.checked, time: e.target.checked ? "" : draft.time })}
            className="mt-0.5 size-4 cursor-pointer accent-[var(--lavender)]"
          />
          <span>
            {t.form.unknownTime}
            {!draft.timeKnown && <span className="block text-xs text-text-muted">{t.form.unknownTimeHint}</span>}
          </span>
        </label>
      </div>

      <Field id="birth-place" label={t.form.place} error={errors.place}>
        <select
          id="birth-place"
          value={draft.placeId}
          onChange={(e) => setDraft({ placeId: e.target.value })}
          aria-invalid={Boolean(errors.place)}
          aria-describedby={describedBy("birth-place", false, errors.place)}
          className={inputClass}
        >
          <option value="">{t.form.placePlaceholder}</option>
          {REGIONS.map((region) => (
            <optgroup key={region} label={t.form.regions[region]}>
              {CITIES.filter((c) => c.region === region).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name[locale]}
                </option>
              ))}
            </optgroup>
          ))}
          <option value={OTHER_PLACE}>{t.form.otherPlace}</option>
        </select>
      </Field>

      {draft.placeId === OTHER_PLACE && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="birth-tz" label={t.form.timeZone} error={errors.timeZone}>
            <input
              id="birth-tz"
              list="birth-tz-options"
              autoComplete="off"
              spellCheck={false}
              placeholder={t.form.timeZonePlaceholder}
              value={draft.timeZone}
              onChange={(e) => setDraft({ timeZone: e.target.value })}
              aria-invalid={Boolean(errors.timeZone)}
              aria-describedby={describedBy("birth-tz", false, errors.timeZone)}
              className={inputClass}
            />
            <datalist id="birth-tz-options">
              {timeZones.map((z) => (
                <option key={z} value={z} />
              ))}
            </datalist>
          </Field>
          <Field id="birth-lon" label={t.form.longitude} hint={t.form.longitudeHint} error={errors.longitude}>
            <input
              id="birth-lon"
              inputMode="decimal"
              value={draft.longitude}
              onChange={(e) => setDraft({ longitude: e.target.value })}
              aria-invalid={Boolean(errors.longitude)}
              aria-describedby={describedBy("birth-lon", true, errors.longitude)}
              className={inputClass}
            />
          </Field>
        </div>
      )}

      {chartError === "ambiguous_local_time" && (
        <fieldset className="rounded-sm border border-border px-3 py-2">
          <legend className="px-1 text-sm text-text">{t.form.fold}</legend>
          {(["earlier", "later"] as const).map((fold) => (
            <label key={fold} className="mt-1 flex cursor-pointer items-center gap-2 text-sm text-text">
              <input
                type="radio"
                name="fold"
                checked={draft.fold === fold}
                onChange={() => setDraft({ fold })}
                className="size-4 cursor-pointer accent-[var(--lavender)]"
              />
              {fold === "earlier" ? t.form.foldEarlier : t.form.foldLater}
            </label>
          ))}
        </fieldset>
      )}

      {chartError && (
        <p
          role="alert"
          tabIndex={-1}
          className="flex items-start gap-2 rounded-sm border border-danger-border px-3 py-2 text-sm text-danger outline-none"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {t.errors.chart[chartError]}
        </p>
      )}

      <Button type="submit" variant="primary" className="self-start">
        {t.form.submit}
      </Button>
    </form>
  );
}
