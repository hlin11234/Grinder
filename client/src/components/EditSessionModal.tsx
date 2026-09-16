import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { CategorySelect } from "./CategorySelect";
import { fromDatetimeLocal, toDatetimeLocal } from "../format";
import type { WorkSession } from "../types";

export function EditSessionModal({
  session,
  categories,
  onClose,
  onSave,
}: {
  session: WorkSession;
  categories: string[];
  onClose: () => void;
  onSave: (data: {
    category: string;
    description: string;
    startTime: string;
    endTime: string | null;
  }) => Promise<void>;
}) {
  const [category, setCategory] = useState(session.category);
  const [description, setDescription] = useState(session.description);
  const [startLocal, setStartLocal] = useState(toDatetimeLocal(session.startTime));
  const [endLocal, setEndLocal] = useState(
    session.endTime ? toDatetimeLocal(session.endTime) : toDatetimeLocal(new Date().toISOString())
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await onSave({
        category: category.trim() || "general",
        description,
        startTime: fromDatetimeLocal(startLocal),
        endTime: session.endTime ? fromDatetimeLocal(endLocal) : null,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="edit session" onClose={onClose}>
      <div className="field">
        <label>category</label>
        <CategorySelect categories={categories} value={category} onChange={setCategory} />
      </div>
      <div className="field">
        <label>started at</label>
        <input type="datetime-local" value={startLocal} onChange={(e) => setStartLocal(e.target.value)} />
      </div>
      {session.endTime && (
        <div className="field">
          <label>ended at</label>
          <input type="datetime-local" value={endLocal} onChange={(e) => setEndLocal(e.target.value)} />
        </div>
      )}
      <div className="field">
        <label>documentation</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
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
