import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { fromDatetimeLocal, toDatetimeLocal } from "../format";

export function EditTimeModal({
  title,
  label,
  initialIso,
  onClose,
  onSave,
}: {
  title: string;
  label: string;
  initialIso: string;
  onClose: () => void;
  onSave: (iso: string) => Promise<void>;
}) {
  const [value, setValue] = useState(toDatetimeLocal(initialIso));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await onSave(fromDatetimeLocal(value));
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose} width={340}>
      <div className="field">
        <label>{label}</label>
        <input type="datetime-local" value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      {error && <div className="modal-error">{error}</div>}
      <div className="modal-actions">
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
