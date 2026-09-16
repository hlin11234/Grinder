import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "grinder.db");
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    description TEXT NOT NULL DEFAULT '',
    start_time TEXT NOT NULL,
    end_time TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    pauses TEXT NOT NULL DEFAULT '[]',
    negations TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
  CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    weekly_goal_hours REAL NOT NULL DEFAULT 35,
    categories TEXT NOT NULL DEFAULT '["general"]'
  );
`);

const settingsRow = db.prepare("SELECT id FROM settings WHERE id = 1").get();
if (!settingsRow) {
  db.prepare(
    "INSERT INTO settings (id, weekly_goal_hours, categories) VALUES (1, 35, ?)"
  ).run(JSON.stringify(["deep-work", "meetings", "admin", "learning"]));
}
