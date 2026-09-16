import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { fromDatetimeLocal, toDatetimeLocal } from "../format";
import type { Pause } from "../types";

export function PauseEditModal({
  pause,
  onClose,
  onSave,
  onDelete,
}: {
  pause: Pause;
  onClose: () => void;
  onSave: (data: { start?: string; end?: string | null }) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [start, setStart] = useState(toDatetimeLocal(pause.start));
  const [stillPaused, setStillPaused] = useState(pause.end === null);
  const [end, setEnd] = useState(toDatetimeLocal(pause.end ?? new Date().toISOString()));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await onSave({
        start: fromDatetimeLocal(start),
        end: stillPaused ? null : fromDatetimeLocal(end),
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Modal title="correct pause" onClose={onClose} width={360}>
      <div className="field">
        <label>paused at</label>
        <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-dim)" }}>
        <input
          type="checkbox"
          checked={stillPaused}
          onChange={(e) => setStillPaused(e.target.checked)}
        />
        still paused (forgot to resume)
      </label>

      {!stillPaused && (
        <div className="field">
          <label>resumed at</label>
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      )}

      {error && <div className="modal-error">{error}</div>}
      <div className="modal-actions">
        <Button variant="danger" onClick={remove} disabled={busy}>
          delete
        </Button>
        <div style={{ flex: 1 }} />
        <Button variant="ghost" onClick={onClose}>
          cancel
        </Button>
        <Button variant="accent" onClick={submit} disabled={busy}>
          save
        </Button>
      </div>
    </Modal>
  );
}
