import { db } from "./db.js";
import type { Settings, WorkSession, WorkSessionRow } from "./types.js";

function rowToSession(row: WorkSessionRow): WorkSession {
  return {
    id: row.id,
    date: row.date,
    category: row.category,
    description: row.description,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    pauses: JSON.parse(row.pauses),
    negations: JSON.parse(row.negations),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getSession(id: string): WorkSession | null {
  const row = db.prepare("SELECT * FROM sessions WHERE id = ?").get(id) as
    | WorkSessionRow
    | undefined;
  return row ? rowToSession(row) : null;
}

export function getActiveSession(): WorkSession | null {
  const row = db
    .prepare("SELECT * FROM sessions WHERE status IN ('active', 'paused') LIMIT 1")
    .get() as WorkSessionRow | undefined;
  return row ? rowToSession(row) : null;
}

export function listSessionsInRange(startDate: string, endDate: string): WorkSession[] {
  const rows = db
    .prepare(
      "SELECT * FROM sessions WHERE date >= ? AND date <= ? ORDER BY start_time ASC"
    )
    .all(startDate, endDate) as WorkSessionRow[];
  return rows.map(rowToSession);
}

export function listAllSessions(): WorkSession[] {
  const rows = db
    .prepare("SELECT * FROM sessions ORDER BY start_time ASC")
    .all() as WorkSessionRow[];
  return rows.map(rowToSession);
}

export function insertSession(session: WorkSession): void {
  db.prepare(
    `INSERT INTO sessions
      (id, date, category, description, start_time, end_time, status, pauses, negations, created_at, updated_at)
     VALUES (@id, @date, @category, @description, @startTime, @endTime, @status, @pauses, @negations, @createdAt, @updatedAt)`
  ).run({
    id: session.id,
    date: session.date,
    category: session.category,
    description: session.description,
    startTime: session.startTime,
    endTime: session.endTime,
    status: session.status,
    pauses: JSON.stringify(session.pauses),
    negations: JSON.stringify(session.negations),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  });
}

export function updateSession(session: WorkSession): void {
  db.prepare(
    `UPDATE sessions SET
      date = @date,
      category = @category,
      description = @description,
      start_time = @startTime,
      end_time = @endTime,
      status = @status,
      pauses = @pauses,
      negations = @negations,
      updated_at = @updatedAt
     WHERE id = @id`
  ).run({
    id: session.id,
    date: session.date,
    category: session.category,
    description: session.description,
    startTime: session.startTime,
    endTime: session.endTime,
    status: session.status,
    pauses: JSON.stringify(session.pauses),
    negations: JSON.stringify(session.negations),
    updatedAt: session.updatedAt,
  });
}

export function deleteSession(id: string): void {
  db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
}

export function getSettings(): Settings {
  const row = db
    .prepare("SELECT weekly_goal_hours, categories FROM settings WHERE id = 1")
    .get() as { weekly_goal_hours: number; categories: string } | undefined;
  if (!row) return { weeklyGoalHours: 35, categories: ["general"] };
  return {
    weeklyGoalHours: row.weekly_goal_hours,
    categories: JSON.parse(row.categories),
  };
}

export function updateSettings(settings: Settings): void {
  db.prepare(
    "UPDATE settings SET weekly_goal_hours = ?, categories = ? WHERE id = 1"
  ).run(settings.weeklyGoalHours, JSON.stringify(settings.categories));
}
