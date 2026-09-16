import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { fromDatetimeLocal, toDatetimeLocal } from "../format";

export function EndSessionModal({
  description,
  onClose,
  onEnd,
}: {
  description: string;
  onClose: () => void;
  onEnd: (data: { endTime: string; description: string }) => Promise<void>;
}) {
  const [endLocal, setEndLocal] = useState(toDatetimeLocal(new Date().toISOString()));
  const [desc, setDesc] = useState(description);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await onEnd({ endTime: fromDatetimeLocal(endLocal), description: desc });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="end session" onClose={onClose}>
      <div className="field">
        <label>ended at</label>
        <input type="datetime-local" value={endLocal} onChange={(e) => setEndLocal(e.target.value)} />
      </div>
      <div className="field">
        <label>what did you get done</label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="documentation for this work period…" />
      </div>
      {error && <div className="modal-error">{error}</div>}
      <div className="modal-actions">
        <Button variant="ghost" onClick={onClose}>
          cancel
        </Button>
        <Button variant="accent" onClick={submit} disabled={busy}>
          end session
        </Button>
      </div>
    </Modal>
  );
}
