import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { CategorySelect } from "./CategorySelect";
import { fromDatetimeLocal, toDatetimeLocal } from "../format";

export function StartSessionModal({
  categories,
  onClose,
  onStart,
}: {
  categories: string[];
  onClose: () => void;
  onStart: (data: { category: string; description: string; startTime: string }) => Promise<void>;
}) {
  const [category, setCategory] = useState(categories[0] ?? "");
  const [description, setDescription] = useState("");
  const [startLocal, setStartLocal] = useState(toDatetimeLocal(new Date().toISOString()));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!category.trim()) {
      setError("category is required");
      return;
    }
    setBusy(true);
    try {
      await onStart({
        category: category.trim(),
        description,
        startTime: fromDatetimeLocal(startLocal),
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="start session" onClose={onClose}>
      <div className="field">
        <label>category</label>
        <CategorySelect categories={categories} value={category} onChange={setCategory} />
      </div>
      <div className="field">
        <label>started at</label>
        <input
          type="datetime-local"
          value={startLocal}
          onChange={(e) => setStartLocal(e.target.value)}
        />
      </div>
      <div className="field">
        <label>what are you working on</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="optional notes…"
        />
      </div>
      {error && <div className="modal-error">{error}</div>}
      <div className="modal-actions">
        <Button variant="ghost" onClick={onClose}>
          cancel
        </Button>
        <Button variant="accent" onClick={submit} disabled={busy}>
          start
        </Button>
      </div>
    </Modal>
  );
}
