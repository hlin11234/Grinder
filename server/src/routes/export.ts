import { Router } from "express";
import { listAllSessions, getSettings } from "../store.js";
import { computeDurations, isoWeekId } from "../time.js";

export const exportRouter = Router();

function formatHms(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

exportRouter.get("/json", (_req, res) => {
  const sessions = listAllSessions();
  const settings = getSettings();

  const enriched = sessions.map((session) => {
    const durations = computeDurations(session);
    return {
      ...session,
      weekId: isoWeekId(new Date(session.startTime)),
      durations: {
        ...durations,
        netHms: formatHms(durations.netSeconds),
        grossHms: formatHms(durations.grossSeconds),
      },
    };
  });

  res.setHeader("Content-Disposition", "attachment; filename=grinder-export.json");
  res.json({
    exportedAt: new Date().toISOString(),
    settings,
    sessionCount: enriched.length,
    sessions: enriched,
  });
});

exportRouter.get("/csv", (_req, res) => {
  const sessions = listAllSessions();

  const header = [
    "id",
    "date",
    "week",
    "category",
    "start_time",
    "end_time",
    "status",
    "net_seconds",
    "net_hms",
    "paused_seconds",
    "negated_seconds",
    "pause_count",
    "negation_reasons",
    "description",
  ];

  const rows = sessions.map((session) => {
    const durations = computeDurations(session);
    const negationReasons = session.negations.map((n) => `${n.reason} (${n.seconds}s)`).join("; ");
    return [
      session.id,
      session.date,
      isoWeekId(new Date(session.startTime)),
      session.category,
      session.startTime,
      session.endTime ?? "",
      session.status,
      String(durations.netSeconds),
      formatHms(durations.netSeconds),
      String(durations.pausedSeconds),
      String(durations.negatedSeconds),
      String(session.pauses.length),
      negationReasons,
      session.description,
    ]
      .map((v) => csvEscape(String(v)))
      .join(",");
  });

  const csv = [header.join(","), ...rows].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=grinder-export.csv");
  res.send(csv);
});
