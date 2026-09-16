export type SessionStatus = "active" | "paused" | "completed";

export interface Pause {
  id: string;
  start: string; // ISO timestamp
  end: string | null; // ISO timestamp, null while ongoing
  durationSeconds: number; // recomputed whenever end is set
}

export interface Negation {
  id: string;
  seconds: number;
  reason: string;
  createdAt: string;
}

export interface WorkSession {
  id: string;
  date: string; // YYYY-MM-DD, derived from startTime (local)
  category: string;
  description: string;
  startTime: string; // ISO
  endTime: string | null; // ISO
  status: SessionStatus;
  pauses: Pause[];
  negations: Negation[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkSessionRow {
  id: string;
  date: string;
  category: string;
  description: string;
  start_time: string;
  end_time: string | null;
  status: SessionStatus;
  pauses: string;
  negations: string;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  weeklyGoalHours: number;
  categories: string[];
}

export interface SessionDurations {
  grossSeconds: number;
  pausedSeconds: number;
  negatedSeconds: number;
  netSeconds: number;
}
