import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { Panel } from "../components/Panel";
import { Button } from "../components/Button";
import { StartSessionModal } from "../components/StartSessionModal";
import { EditTimeModal } from "../components/EditTimeModal";
import { PauseEditModal } from "../components/PauseEditModal";
import { NegationModal } from "../components/NegationModal";
import { EndSessionModal } from "../components/EndSessionModal";
import { EditSessionModal } from "../components/EditSessionModal";
import { SessionCard } from "../components/SessionCard";
import { computeDurations } from "../duration";
import { formatClock, formatHms, todayString } from "../format";
import { useTicker } from "../useTicker";
import type { Pause, Settings, WorkSession } from "../types";
import "./TodayView.css";

type ModalState =
  | { kind: "none" }
  | { kind: "start" }
  | { kind: "edit-start" }
  | { kind: "pause"; pause: Pause }
  | { kind: "negate" }
  | { kind: "end" }
  | { kind: "edit-session"; session: WorkSession };

export function TodayView({
  active,
  onChange,
}: {
  active: WorkSession | null;
  onChange: () => void;
}) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [todaySessions, setTodaySessions] = useState<WorkSession[]>([]);
  const [modal, setModal] = useState<ModalState>({ kind: "none" });
  const [description, setDescription] = useState(active?.description ?? "");
  const [error, setError] = useState<string | null>(null);

  const refreshToday = useCallback(async () => {
    const today = todayString();
    const sessions = await api.listSessionsInRange(today, today);
    setTodaySessions(sessions.filter((s) => s.id !== active?.id));
  }, [active?.id]);

  useEffect(() => {
    api.getSettings().then(setSettings).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    refreshToday();
  }, [refreshToday]);

  useEffect(() => {
    setDescription(active?.description ?? "");
  }, [active?.id, active?.description]);

  const now = useTicker(!!active && active.status !== "completed");
  const durations = active ? computeDurations(active, now) : null;

  async function guarded(fn: () => Promise<unknown>) {
    try {
      await fn();
      onChange();
      await refreshToday();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function saveDescription() {
    if (!active || description === active.description) return;
    await guarded(() => api.updateSession(active.id, { description }));
  }

  return (
    <div>
      {!active ? (
        <Panel title="active session">
          <div className="idle-panel">
            <div>no session running.</div>
            <Button variant="accent" onClick={() => setModal({ kind: "start" })}>
              start session
            </Button>
          </div>
        </Panel>
      ) : (
        <Panel
          title={active.status === "paused" ? "paused" : "active session"}
          right={<span className="chip">{active.category}</span>}
        >
          <div className="active-panel">
            <div className="timer-row">
              <div className={`timer-display ${active.status === "paused" ? "paused" : ""}`}>
                {formatHms(durations!.netSeconds)}
              </div>
              <div className="timer-meta">
                <div>started {formatClock(active.startTime)}</div>
                <button onClick={() => setModal({ kind: "edit-start" })}>correct start time</button>
              </div>
            </div>

            <div className="active-toolbar">
              {active.status === "active" ? (
                <Button onClick={() => guarded(() => api.pauseSession(active.id))}>pause</Button>
              ) : (
                <Button
                  variant="accent"
                  onClick={() => guarded(() => api.resumeSession(active.id))}
                >
                  resume
                </Button>
              )}
              <Button onClick={() => setModal({ kind: "negate" })}>subtract time</Button>
              <Button variant="danger" onClick={() => setModal({ kind: "end" })}>
                end session
              </Button>
            </div>

            {active.pauses.length > 0 && (
              <div>
                <div className="section-label">pauses</div>
                <div className="chip-row">
                  {active.pauses.map((p) => (
                    <span key={p.id} className="chip" onClick={() => setModal({ kind: "pause", pause: p })}>
                      {formatClock(p.start)} → {p.end ? formatClock(p.end) : "ongoing"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {active.negations.length > 0 && (
              <div>
                <div className="section-label">subtracted</div>
                <div className="chip-row">
                  {active.negations.map((n) => (
                    <span key={n.id} className="chip negation">
                      {Math.round(n.seconds / 60)}m — {n.reason}
                      <span
                        className="chip-x"
                        onClick={() => guarded(() => api.deleteNegation(active.id, n.id))}
                      >
                        ×
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="field">
              <label>documentation — what are you getting done</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={saveDescription}
              />
            </div>
          </div>
        </Panel>
      )}

      <div style={{ height: 16 }} />

      <Panel title="today">
        {todaySessions.length === 0 ? (
          <div className="empty-note">no completed sessions yet today.</div>
        ) : (
          <div className="today-list">
            {todaySessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onEdit={() => setModal({ kind: "edit-session", session: s })}
                onDelete={() => guarded(() => api.deleteSession(s.id))}
              />
            ))}
          </div>
        )}
      </Panel>

      {error && <div className="modal-error" style={{ marginTop: 8 }}>{error}</div>}

      {modal.kind === "start" && settings && (
        <StartSessionModal
          categories={settings.categories}
          onClose={() => setModal({ kind: "none" })}
          onStart={(data) => guarded(() => api.startSession(data))}
        />
      )}

      {modal.kind === "edit-start" && active && (
        <EditTimeModal
          title="correct start time"
          label="started at"
          initialIso={active.startTime}
          onClose={() => setModal({ kind: "none" })}
          onSave={(iso) => guarded(() => api.updateSession(active.id, { startTime: iso }))}
        />
      )}

      {modal.kind === "pause" && active && (
        <PauseEditModal
          pause={modal.pause}
          onClose={() => setModal({ kind: "none" })}
          onSave={(data) => guarded(() => api.editPause(active.id, modal.pause.id, data))}
          onDelete={() => guarded(() => api.deletePause(active.id, modal.pause.id))}
        />
      )}

      {modal.kind === "negate" && active && (
        <NegationModal
          onClose={() => setModal({ kind: "none" })}
          onSave={(data) => guarded(() => api.addNegation(active.id, data))}
        />
      )}

      {modal.kind === "end" && active && (
        <EndSessionModal
          description={active.description}
          onClose={() => setModal({ kind: "none" })}
          onEnd={(data) =>
            guarded(async () => {
              if (data.description !== active.description) {
                await api.updateSession(active.id, { description: data.description });
              }
              await api.endSession(active.id, data.endTime);
            })
          }
        />
      )}

      {modal.kind === "edit-session" && settings && (
        <EditSessionModal
          session={modal.session}
          categories={settings.categories}
          onClose={() => setModal({ kind: "none" })}
          onSave={(data) => guarded(() => api.updateSession(modal.session.id, data))}
        />
      )}
    </div>
  );
}
