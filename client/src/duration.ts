import type { Negation, Pause, WorkSession } from "./types";

export interface Durations {
  grossSeconds: number;
  pausedSeconds: number;
  negatedSeconds: number;
  netSeconds: number;
}

export function computeDurations(
  session: Pick<WorkSession, "startTime" | "endTime" | "pauses" | "negations">,
  now: Date = new Date()
): Durations {
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
