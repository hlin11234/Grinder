import { addWeeks, endOfISOWeek, getISOWeek, getISOWeekYear, startOfISOWeek } from "date-fns";

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
  const jan4 = new Date(year, 0, 4);
  const week1Start = startOfISOWeek(jan4);
  const start = addWeeks(week1Start, week - 1);
  const end = endOfISOWeek(start);
  return { start, end };
}

export function shiftWeekId(weekId: string, delta: number): string {
  const { start } = weekIdToRange(weekId);
  return isoWeekId(addWeeks(start, delta));
}
