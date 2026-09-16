export type SessionStatus = "active" | "paused" | "completed";

export interface Pause {
  id: string;
  start: string;
  end: string | null;
  durationSeconds: number;
}

export interface Negation {
  id: string;
  seconds: number;
  reason: string;
  createdAt: string;
}

export interface WorkSession {
  id: string;
  date: string;
  category: string;
  description: string;
  startTime: string;
  endTime: string | null;
  status: SessionStatus;
  pauses: Pause[];
  negations: Negation[];
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  weeklyGoalHours: number;
  categories: string[];
}

export interface WeekSummaryBase {
  weekId: string;
  startDate: string;
  endDate: string;
  goalHours: number;
  netSeconds: number;
  netHours: number;
  score: number;
  byCategory: { category: string; seconds: number }[];
  byDay: { date: string; seconds: number }[];
}

export interface SessionDurations {
  grossSeconds: number;
  pausedSeconds: number;
  negatedSeconds: number;
  netSeconds: number;
}

export interface WeekSummary extends WeekSummaryBase {
  sessions: (WorkSession & { durations: SessionDurations })[];
}
