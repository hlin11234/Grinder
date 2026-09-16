import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export function NegationModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: { seconds: number; reason: string }) => Promise<void>;
}) {
  const [minutes, setMinutes] = useState(10);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!minutes || minutes <= 0) {
      setError("minutes must be greater than 0");
      return;
    }
    setBusy(true);
    try {
      await onSave({ seconds: Math.round(minutes * 60), reason: reason.trim() || "unspecified" });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="subtract time" onClose={onClose} width={360}>
      <div className="field">
        <label>minutes to remove</label>
        <input
          type="number"
          min={1}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
        />
      </div>
      <div className="field">
        <label>reason</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. lunch, got distracted, phone call…"
        />
      </div>
      {error && <div className="modal-error">{error}</div>}
      <div className="modal-actions">
        <Button variant="ghost" onClick={onClose}>
          cancel
        </Button>
        <Button variant="danger" onClick={submit} disabled={busy}>
          subtract
        </Button>
      </div>
    </Modal>
  );
}
