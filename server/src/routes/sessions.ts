import { Router } from "express";
import { nanoid } from "nanoid";
import {
  deleteSession,
  getActiveSession,
  getSession,
  insertSession,
  listAllSessions,
  listSessionsInRange,
  updateSession,
} from "../store.js";
import { localDateString, nowIso } from "../time.js";
import type { Negation, Pause, WorkSession } from "../types.js";

export const sessionsRouter = Router();

sessionsRouter.get("/active", (_req, res) => {
  res.json(getActiveSession());
});

sessionsRouter.get("/", (req, res) => {
  const { from, to } = req.query as { from?: string; to?: string };
  if (from && to) {
    res.json(listSessionsInRange(from, to));
  } else {
    res.json(listAllSessions());
  }
});

sessionsRouter.get("/:id", (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: "not found" });
  res.json(session);
});

// Start a new session. Only one active/paused session is allowed at a time.
sessionsRouter.post("/", (req, res) => {
  const existing = getActiveSession();
  if (existing) {
    return res
      .status(409)
      .json({ error: "a session is already in progress", session: existing });
  }

  const { category, description, startTime } = req.body as {
    category?: string;
    description?: string;
    startTime?: string;
  };

  const start = startTime ?? nowIso();
  const now = nowIso();
  const session: WorkSession = {
    id: nanoid(),
    date: localDateString(start),
    category: category?.trim() || "general",
    description: description ?? "",
    startTime: start,
    endTime: null,
    status: "active",
    pauses: [],
    negations: [],
    createdAt: now,
    updatedAt: now,
  };

  insertSession(session);
  res.status(201).json(session);
});

// General edit: description, category, start/end time overrides.
sessionsRouter.patch("/:id", (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: "not found" });

  const { category, description, startTime, endTime } = req.body as {
    category?: string;
    description?: string;
    startTime?: string;
    endTime?: string | null;
  };

  if (category !== undefined) session.category = category.trim() || "general";
  if (description !== undefined) session.description = description;
  if (startTime !== undefined) {
    session.startTime = startTime;
    session.date = localDateString(startTime);
  }
  if (endTime !== undefined) session.endTime = endTime;

  session.updatedAt = nowIso();
  updateSession(session);
  res.json(session);
});

sessionsRouter.delete("/:id", (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: "not found" });
  deleteSession(req.params.id);
  res.status(204).end();
});

sessionsRouter.post("/:id/pause", (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: "not found" });
  if (session.status !== "active") {
    return res.status(400).json({ error: `cannot pause a session that is ${session.status}` });
  }

  const pause: Pause = {
    id: nanoid(),
    start: nowIso(),
    end: null,
    durationSeconds: 0,
  };
  session.pauses.push(pause);
  session.status = "paused";
  session.updatedAt = nowIso();
  updateSession(session);
  res.json(session);
});

sessionsRouter.post("/:id/resume", (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: "not found" });
  if (session.status !== "paused") {
    return res.status(400).json({ error: `cannot resume a session that is ${session.status}` });
  }

  const openPause = [...session.pauses].reverse().find((p) => p.end === null);
  if (openPause) {
    openPause.end = nowIso();
    openPause.durationSeconds = Math.max(
      0,
      Math.round((new Date(openPause.end).getTime() - new Date(openPause.start).getTime()) / 1000)
    );
  }
  session.status = "active";
  session.updatedAt = nowIso();
  updateSession(session);
  res.json(session);
});

// Correct a pause after the fact: e.g. you forgot to unpause and the recorded
// end time is wrong, or you want to close a still-open pause with a specific time.
sessionsRouter.patch("/:id/pauses/:pauseId", (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: "not found" });
  const pause = session.pauses.find((p) => p.id === req.params.pauseId);
  if (!pause) return res.status(404).json({ error: "pause not found" });

  const { start, end } = req.body as { start?: string; end?: string | null };
  if (start !== undefined) pause.start = start;
  if (end !== undefined) pause.end = end;

  if (pause.end) {
    pause.durationSeconds = Math.max(
      0,
      Math.round((new Date(pause.end).getTime() - new Date(pause.start).getTime()) / 1000)
    );
    // If this was the pause currently holding the session open, editing its
    // end time resolves it: the session is active again as of that time.
    if (session.status === "paused" && !session.pauses.some((p) => p.end === null)) {
      session.status = "active";
    }
  } else {
    pause.durationSeconds = 0;
    session.status = "paused";
  }

  session.updatedAt = nowIso();
  updateSession(session);
  res.json(session);
});

sessionsRouter.delete("/:id/pauses/:pauseId", (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: "not found" });
  const before = session.pauses.length;
  session.pauses = session.pauses.filter((p) => p.id !== req.params.pauseId);
  if (session.pauses.length === before) return res.status(404).json({ error: "pause not found" });
  if (session.status === "paused" && !session.pauses.some((p) => p.end === null)) {
    session.status = "active";
  }
  session.updatedAt = nowIso();
  updateSession(session);
  res.json(session);
});

// Manually deduct time for a break/distraction you didn't formally pause for.
sessionsRouter.post("/:id/negations", (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: "not found" });

  const { seconds, reason } = req.body as { seconds?: number; reason?: string };
  if (!seconds || seconds <= 0) {
    return res.status(400).json({ error: "seconds must be a positive number" });
  }

  const negation: Negation = {
    id: nanoid(),
    seconds: Math.round(seconds),
    reason: reason?.trim() || "unspecified",
    createdAt: nowIso(),
  };
  session.negations.push(negation);
  session.updatedAt = nowIso();
  updateSession(session);
  res.json(session);
});

sessionsRouter.delete("/:id/negations/:negId", (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: "not found" });
  const before = session.negations.length;
  session.negations = session.negations.filter((n) => n.id !== req.params.negId);
  if (session.negations.length === before) {
    return res.status(404).json({ error: "negation not found" });
  }
  session.updatedAt = nowIso();
  updateSession(session);
  res.json(session);
});

// End the session. If currently paused, the open pause is closed at the same time.
sessionsRouter.post("/:id/end", (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: "not found" });
  if (session.status === "completed") {
    return res.status(400).json({ error: "session already completed" });
  }

  const { endTime } = req.body as { endTime?: string };
  const end = endTime ?? nowIso();

  const openPause = session.pauses.find((p) => p.end === null);
  if (openPause) {
    openPause.end = end;
    openPause.durationSeconds = Math.max(
      0,
      Math.round((new Date(openPause.end).getTime() - new Date(openPause.start).getTime()) / 1000)
    );
  }

  session.endTime = end;
  session.status = "completed";
  session.updatedAt = nowIso();
  updateSession(session);
  res.json(session);
});
