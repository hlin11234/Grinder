import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import "./db.js";
import { sessionsRouter } from "./routes/sessions.js";
import { weeksRouter } from "./routes/weeks.js";
import { settingsRouter } from "./routes/settings.js";
import { exportRouter } from "./routes/export.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/sessions", sessionsRouter);
app.use("/api/weeks", weeksRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/export", exportRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Serve the built client (production) if present, so a single process can
// be reached from any device on the network.
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

const PORT = Number(process.env.PORT) || 4310;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`grinder server listening on http://${HOST}:${PORT}`);
});
