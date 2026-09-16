import { Router } from "express";
import { formatISO } from "date-fns";
import { listAllSessions, listSessionsInRange, getSettings } from "../store.js";
import { computeDurations, isoWeekId, localDateString, weekIdToRange } from "../time.js";

export const weeksRouter = Router();

function summarizeWeek(weekId: string) {
  const { start, end } = weekIdToRange(weekId);
  const startDate = localDateString(formatISO(start));
  const endDate = localDateString(formatISO(end));
  const sessions = listSessionsInRange(startDate, endDate);
  const settings = getSettings();

  let netSeconds = 0;
  const byCategory = new Map<string, number>();
  const byDay = new Map<string, number>();

  const enriched = sessions.map((session) => {
    const durations = computeDurations(session);
    netSeconds += durations.netSeconds;
    byCategory.set(session.category, (byCategory.get(session.category) ?? 0) + durations.netSeconds);
    byDay.set(session.date, (byDay.get(session.date) ?? 0) + durations.netSeconds);
    return { ...session, durations };
  });

  const goalSeconds = settings.weeklyGoalHours * 3600;
  const score = goalSeconds > 0 ? Math.round(Math.min(100, (netSeconds / goalSeconds) * 100)) : 0;

  return {
    weekId,
    startDate,
    endDate,
    goalHours: settings.weeklyGoalHours,
    netSeconds,
    netHours: Math.round((netSeconds / 3600) * 100) / 100,
    score,
    sessions: enriched,
    byCategory: Array.from(byCategory.entries()).map(([category, seconds]) => ({
      category,
      seconds,
    })),
    byDay: Array.from(byDay.entries()).map(([date, seconds]) => ({ date, seconds })),
  };
}

weeksRouter.get("/", (_req, res) => {
  const sessions = listAllSessions();
  if (sessions.length === 0) {
    return res.json([summarizeWeek(isoWeekId(new Date()))]);
  }
  const weekIds = new Set<string>();
  for (const s of sessions) {
    weekIds.add(isoWeekId(new Date(s.startTime)));
  }
  weekIds.add(isoWeekId(new Date()));
  const sorted = Array.from(weekIds).sort().reverse();
  res.json(
    sorted.map((weekId) => {
      const w = summarizeWeek(weekId);
      // Lightweight list view: omit per-session payload.
      const { sessions: _omit, ...rest } = w;
      return rest;
    })
  );
});

weeksRouter.get("/:weekId", (req, res) => {
  try {
    res.json(summarizeWeek(req.params.weekId));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

weeksRouter.get("/current/id", (_req, res) => {
  res.json({ weekId: isoWeekId(new Date()) });
});
