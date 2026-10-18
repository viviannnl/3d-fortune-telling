import { z } from "zod";
import { CONVENTION } from "./conventions";
import { getCity } from "./cities";
import type { BirthInput } from "./types";
import { isRealDate, isValidTimeZone } from "./zonedTime";

export const OTHER_PLACE = "other";

/** Raw form values (all strings, as they come from inputs). */
export const BirthFormSchema = z
  .object({
    date: z.string().trim(),
    timeKnown: z.boolean(),
    time: z.string().trim(),
    placeId: z.string().trim(),
    timeZone: z.string().trim(),
    longitude: z.string().trim(),
    fold: z.enum(["earlier", "later"]).optional(),
  })
  .strict();

export type BirthFormValues = z.infer<typeof BirthFormSchema>;

export type FieldError =
  | "date_required"
  | "date_invalid"
  | "date_out_of_range"
  | "date_in_future"
  | "time_required"
  | "time_invalid"
  | "place_required"
  | "time_zone_invalid"
  | "longitude_invalid";

export type FieldErrors = Partial<Record<"date" | "time" | "place" | "timeZone" | "longitude", FieldError>>;

export type ParseResult = { ok: true; input: BirthInput } | { ok: false; errors: FieldErrors };

export const EMPTY_FORM: BirthFormValues = {
  date: "",
  timeKnown: true,
  time: "",
  placeId: "",
  timeZone: "",
  longitude: "",
};

/**
 * Turns untrusted form values into a validated engine input with field-level
 * error codes. `today` (YYYY-MM-DD) bounds the date; injected for testability.
 */
export function parseBirthForm(raw: unknown, today: string): ParseResult {
  const parsed = BirthFormSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: { date: "date_invalid" } };
  const v = parsed.data;
  const errors: FieldErrors = {};

  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.date);
  if (!v.date) errors.date = "date_required";
  else if (!dm || !isRealDate(Number(dm[1]), Number(dm[2]), Number(dm[3]))) errors.date = "date_invalid";
  else if (Number(dm[1]) < CONVENTION.supportedYears.min) errors.date = "date_out_of_range";
  else if (v.date > today) errors.date = "date_in_future";

  let time: string | null = null;
  if (v.timeKnown) {
    const tm = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(v.time);
    if (!v.time) errors.time = "time_required";
    else if (!tm || Number(tm[1]) > 23 || Number(tm[2]) > 59) errors.time = "time_invalid";
    else time = `${tm[1]}:${tm[2]}`;
  }

  let timeZone = "";
  let longitude: number | null = null;
  if (!v.placeId) {
    errors.place = "place_required";
  } else if (v.placeId === OTHER_PLACE) {
    if (!v.timeZone || !isValidTimeZone(v.timeZone)) errors.timeZone = "time_zone_invalid";
    else timeZone = v.timeZone;
    if (v.longitude !== "") {
      const lon = Number(v.longitude);
      if (!Number.isFinite(lon) || lon < -180 || lon > 180) errors.longitude = "longitude_invalid";
      else longitude = lon;
    }
  } else {
    const city = getCity(v.placeId);
    if (!city) errors.place = "place_required";
    else {
      timeZone = city.timeZone;
      longitude = city.longitude;
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, input: { date: v.date, time, timeZone, longitude, fold: v.fold } };
}
