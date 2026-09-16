import { useEffect, useState } from "react";
import { api } from "../api";
import { Panel } from "../components/Panel";
import { Button } from "../components/Button";
import { CategoryPieChart } from "../components/CategoryPieChart";
import { SessionCard } from "../components/SessionCard";
import { EditSessionModal } from "../components/EditSessionModal";
import { formatDay, formatHoursMinutes } from "../format";
import { shiftWeekId, weekIdToRange } from "../week";
import type { Settings, WeekSummary, WorkSession } from "../types";
import "./WeekView.css";

export function WeekView() {
  const [weekId, setWeekId] = useState<string | null>(null);
  const [week, setWeek] = useState<WeekSummary | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [editing, setEditing] = useState<WorkSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getCurrentWeekId().then((r) => setWeekId(r.weekId));
    api.getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (!weekId) return;
    api
      .getWeek(weekId)
      .then(setWeek)
      .catch((err) => setError(err.message));
  }, [weekId]);

  async function refresh() {
    if (!weekId) return;
    setWeek(await api.getWeek(weekId));
  }

  if (!weekId || !week) return null;

  const { start, end } = weekIdToRange(weekId);
  const range = `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(
    undefined,
    { month: "short", day: "numeric" }
  )}`;

  const byDate = new Map<string, typeof week.sessions>();
  for (const s of week.sessions) {
    if (!byDate.has(s.date)) byDate.set(s.date, []);
    byDate.get(s.date)!.push(s);
  }
  const dates = Array.from(byDate.keys()).sort().reverse();

  const pct = Math.min(100, week.score);

  return (
    <div>
      <Panel
        title="week"
        right={
          <div className="week-nav" style={{ gap: 6 }}>
            <Button variant="ghost" onClick={() => setWeekId(shiftWeekId(weekId, -1))}>
              ‹ prev
            </Button>
            <Button variant="ghost" onClick={() => setWeekId(shiftWeekId(weekId, 1))}>
              next ›
            </Button>
          </div>
        }
      >
        <div className="week-label">
          {weekId}
          <span className="week-range">{range}</span>
        </div>

        <div style={{ height: 14 }} />

        <div className="score-row">
          <div>
            <div className="score-number">
              {week.score}
              <span className="unit">/100</span>
            </div>
            <div className="score-detail">
              {formatHoursMinutes(week.netSeconds)} of {week.goalHours}h goal
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </Panel>

      <div style={{ height: 16 }} />

      <Panel title="time by category">
        <CategoryPieChart data={week.byCategory} />
      </Panel>

      <div style={{ height: 16 }} />

      <Panel title="sessions">
        {dates.length === 0 ? (
          <div className="empty-note">no sessions logged this week.</div>
        ) : (
          dates.map((date) => (
            <div className="day-group" key={date}>
              <div className="day-heading">
                <span>{formatDay(date)}</span>
              </div>
              {byDate
                .get(date)!
                .slice()
                .reverse()
                .map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    onEdit={() => setEditing(s)}
                    onDelete={async () => {
                      await api.deleteSession(s.id);
                      await refresh();
                    }}
                  />
                ))}
            </div>
          ))
        )}
      </Panel>

      {error && <div className="modal-error">{error}</div>}

      {editing && settings && (
        <EditSessionModal
          session={editing}
          categories={settings.categories}
          onClose={() => setEditing(null)}
          onSave={async (data) => {
            await api.updateSession(editing.id, data);
            await refresh();
          }}
        />
      )}
    </div>
  );
}
