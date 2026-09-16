import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { WorkSession } from "./types";
import { TodayView } from "./views/TodayView";
import { WeekView } from "./views/WeekView";
import { SettingsView } from "./views/SettingsView";

type Tab = "today" | "week" | "settings";

export function App() {
  const [tab, setTab] = useState<Tab>("today");
  const [active, setActive] = useState<WorkSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refreshActive = useCallback(async () => {
    try {
      const session = await api.getActiveSession();
      setActive(session);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshActive();
  }, [refreshActive]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          grinder<span className="dot">_</span>
        </div>
        <nav className="app-nav">
          <button className={tab === "today" ? "active" : ""} onClick={() => setTab("today")}>
            today
          </button>
          <button className={tab === "week" ? "active" : ""} onClick={() => setTab("week")}>
            week
          </button>
          <button
            className={tab === "settings" ? "active" : ""}
            onClick={() => setTab("settings")}
          >
            settings
          </button>
        </nav>
        <div className="app-status">
          <span
            className={`status-dot ${active ? (active.status === "paused" ? "paused" : "live") : ""}`}
          />
          {active ? (active.status === "paused" ? "paused" : "in progress") : "idle"}
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <main className="app-main">
        {!loaded ? null : tab === "today" ? (
          <TodayView active={active} onChange={refreshActive} />
        ) : tab === "week" ? (
          <WeekView />
        ) : (
          <SettingsView />
        )}
      </main>
    </div>
  );
}
