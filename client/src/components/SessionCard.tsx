import { computeDurations } from "../duration";
import { formatClock, formatHoursMinutes } from "../format";
import type { WorkSession } from "../types";
import { Button } from "./Button";
import "./SessionCard.css";

export function SessionCard({
  session,
  onEdit,
  onDelete,
}: {
  session: WorkSession;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const durations = computeDurations(session);
  return (
    <div className="session-card">
      <div className="session-card-top">
        <span className="session-card-tag">{session.category}</span>
        <span className="session-card-times">
          {formatClock(session.startTime)}
          {" → "}
          {session.endTime ? formatClock(session.endTime) : "…"}
        </span>
        <span className="session-card-net">net {formatHoursMinutes(durations.netSeconds)}</span>
      </div>
      {session.description && <div className="session-card-desc">{session.description}</div>}
      <div className="session-card-actions">
        <Button variant="ghost" onClick={onEdit}>
          edit
        </Button>
        <Button variant="danger" onClick={onDelete}>
          delete
        </Button>
      </div>
    </div>
  );
}
