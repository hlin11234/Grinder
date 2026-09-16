import {
  startOfISOWeek,
  endOfISOWeek,
  getISOWeek,
  getISOWeekYear,
  addWeeks,
  formatISO,
} from "date-fns";
import type { Negation, Pause, SessionDurations, WorkSession } from "./types.js";

export function isoWeekId(date: Date): string {
  const year = getISOWeekYear(date);
  const week = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function weekIdToRange(weekId: string): { start: Date; end: Date } {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekId);
  if (!match) throw new Error(`invalid week id: ${weekId}`);
  const year = Number(match[1]);
  const week = Number(match[2]);
  // Jan 4th is always in ISO week 1.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const week1Start = startOfISOWeek(jan4);
  const start = addWeeks(week1Start, week - 1);
  const end = endOfISOWeek(start);
  return { start, end };
}

export function localDateString(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function computeDurations(
  session: Pick<WorkSession, "startTime" | "endTime" | "pauses" | "negations">,
  now: Date = new Date()
): SessionDurations {
  const start = new Date(session.startTime).getTime();
  const end = session.endTime ? new Date(session.endTime).getTime() : now.getTime();
  const grossSeconds = Math.max(0, Math.round((end - start) / 1000));

  const pausedSeconds = session.pauses.reduce((sum: number, p: Pause) => {
    const pStart = new Date(p.start).getTime();
    const pEnd = p.end ? new Date(p.end).getTime() : now.getTime();
    return sum + Math.max(0, Math.round((pEnd - pStart) / 1000));
  }, 0);

  const negatedSeconds = session.negations.reduce(
    (sum: number, n: Negation) => sum + Math.max(0, n.seconds),
    0
  );

  const netSeconds = Math.max(0, grossSeconds - pausedSeconds - negatedSeconds);

  return { grossSeconds, pausedSeconds, negatedSeconds, netSeconds };
}

export function nowIso(): string {
  return formatISO(new Date());
}
