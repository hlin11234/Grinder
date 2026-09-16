# grinder

A simple, self-hosted work tracker. It runs as one small server that keeps all
your data in a SQLite file — every device on your network (or wherever you
deploy it) that opens the page talks to that same server, so your phone,
laptop, and desktop always see the same sessions.

## What it does

- **Sessions.** Start a session, optionally backdating the start time. Add as
  many sessions as you want in a day.
- **Live timer.** While a session is running you see elapsed net work time,
  ticking in real time.
- **Pause / resume.** Pause tracks how long you were away. If you forget to
  resume, you can go back and correct the pause's start/end time later — or
  mark it as still-open and close it retroactively.
- **Time negator.** Manually subtract minutes from a session (with a reason)
  to account for a break or distraction you didn't formally pause for.
- **Documentation.** Every session has a free-text field for what you actually
  got done — this is what makes the log useful later, to you or to an AI.
- **Weekly score.** Set a weekly goal in hours; each week shows a 0–100 score
  based on net hours worked against that goal.
- **Week view.** Browse week by week, see a pie chart of time by category, and
  every session logged that week (editable, deletable).
- **Export.** Download everything as JSON (full structured dump, good for
  feeding to an AI) or CSV (good for spreadsheets).

## Stack

- `server/` — Express + better-sqlite3 (TypeScript). One SQLite file
  (`server/data/grinder.db`) holds all state. All duration math (gross time,
  paused time, subtracted time, net time) happens server-side so every device
  agrees.
- `client/` — React + Vite (TypeScript), a small terminal-flavored,
  muted-dark UI. Talks to the server over `/api/*`.

## Running it

Install once from the repo root (npm workspaces):

```bash
npm install
```

### Development

```bash
npm run dev:server   # http://localhost:4310
npm run dev:client   # http://localhost:5173 (proxies /api to the server)
```

Open `http://localhost:5173` while developing.

### Production (single process, reachable from any device)

```bash
npm run build   # builds client into client/dist, server into server/dist
npm start        # serves API + built client on http://0.0.0.0:4310
```

Then, from any phone/tablet/laptop on the same network, open
`http://<this-machine's-LAN-IP>:4310`. Because the server binds `0.0.0.0` by
default, it's reachable from other devices as soon as it's running — there's
no separate sync step or account to set up. To run it somewhere always-on
(a home server, a small VPS, etc.), just keep `npm start` running there (e.g.
under `pm2` or a systemd unit) and point your devices at that machine's
address. Set `PORT` / `HOST` env vars to change the bind.

### Data

Everything lives in `server/data/grinder.db`. Back it up like any file if you
care about the history; it's git-ignored by default.

### Export

From the Settings tab, "export json" / "export csv" download everything —
every session, its category, start/end, pauses, subtracted time, and
documentation, plus computed net durations. The JSON export is the more
complete one and is meant to be easy to hand to an AI for analysis.
