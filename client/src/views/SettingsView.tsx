import { useEffect, useState } from "react";
import { api } from "../api";
import { Panel } from "../components/Panel";
import { Button } from "../components/Button";
import type { Settings } from "../types";
import "./SettingsView.css";

export function SettingsView() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [goalHours, setGoalHours] = useState(35);
  const [newCategory, setNewCategory] = useState("");
  const [savedAt, setSavedAt] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getSettings().then((s) => {
      setSettings(s);
      setGoalHours(s.weeklyGoalHours);
    });
  }, []);

  async function persist(next: Settings) {
    try {
      const saved = await api.updateSettings(next);
      setSettings(saved);
      setSavedAt(Date.now());
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function saveGoal() {
    if (!settings || goalHours === settings.weeklyGoalHours) return;
    await persist({ ...settings, weeklyGoalHours: goalHours });
  }

  async function addCategory() {
    if (!settings) return;
    const name = newCategory.trim();
    if (!name || settings.categories.includes(name)) return;
    await persist({ ...settings, categories: [...settings.categories, name] });
    setNewCategory("");
  }

  async function removeCategory(name: string) {
    if (!settings) return;
    await persist({ ...settings, categories: settings.categories.filter((c) => c !== name) });
  }

  if (!settings) return null;

  return (
    <div>
      <Panel title="weekly goal">
        <div className="settings-block">
          <div className="field">
            <label>target hours per week</label>
            <input
              type="number"
              min={1}
              value={goalHours}
              onChange={(e) => setGoalHours(Number(e.target.value))}
              onBlur={saveGoal}
            />
          </div>
          <div className="save-note">{Date.now() - savedAt < 1500 ? "saved" : ""}</div>
        </div>
      </Panel>

      <div style={{ height: 16 }} />

      <Panel title="categories">
        <div className="settings-block">
          <div className="category-list">
            {settings.categories.map((c) => (
              <div className="category-row" key={c}>
                <span>{c}</span>
                <button onClick={() => removeCategory(c)} aria-label={`remove ${c}`}>
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="add-category-row">
            <input
              value={newCategory}
              placeholder="new category"
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
            />
            <Button variant="accent" onClick={addCategory}>
              add
            </Button>
          </div>
        </div>
      </Panel>

      <div style={{ height: 16 }} />

      <Panel title="export">
        <div className="export-row">
          <a href="/api/export/json">
            <Button>export json</Button>
          </a>
          <a href="/api/export/csv">
            <Button>export csv</Button>
          </a>
        </div>
      </Panel>

      {error && <div className="modal-error">{error}</div>}
    </div>
  );
}
