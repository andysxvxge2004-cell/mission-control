# Mission Control (web)

Next.js app that powers the Mission Control cockpit. It exposes the dashboards, task triage tools, and automation surfaces that keep TradeWise ops humming.

## Local development

```bash
# Install deps at repo root
pnpm install

# Run the web app in dev mode
pnpm -C apps/web dev

# Lint everything before you commit
pnpm -C apps/web lint
```

The app expects a PostgreSQL database provided by `@mission-control/db`. The shared Prisma client is already wired up inside the repo, so you only need to make sure your database is running and `DATABASE_URL` is set at the repo root.

## Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Prisma connection string used throughout Mission Control |
| `MISSION_CONTROL_BASE_URL` | ⚠️ recommended | Used to build deep links inside outbound alerts (e.g., `/mission-control/tasks`) |
| `SLACK_OVERDUE_WEBHOOK_URL` | ⚠️ recommended | Incoming webhook that receives the "tasks stuck for 48h+" alert. Falls back to `SLACK_WEBHOOK_URL` if set |

> Tip: keep these values in a project-level `.env` file or export them before running `pnpm dev`.

## Slack overdue alerts

- API route: `POST /api/mission-control/overdue/slack`
- Behavior: fetches tasks in `DOING` whose `updatedAt` is older than the stale cutoff (48h by default) and posts a summary to Slack.
- Response contract:
  - `{ ok: true, sent: true, count: <number> }` when a message is delivered
  - `{ ok: true, sent: false, reason: "no_overdue_tasks" }` when there's nothing to report
  - `{ ok: true, sent: false, reason: "missing_webhook" }` when the webhook env var is absent (payload preview is returned for validation)
  - `{ ok: false, ... }` when Slack responds with an error status

The Mission Control → Tasks page now exposes a **Ping Slack** button inside the "Aging alerts" panel. That action hits the same API route, surfaces success/error state inline, and is safe to spam—if no tasks are overdue, it simply tells you so instead of paging Slack.

## Release checklist

1. `pnpm -C apps/web lint`
2. Run through the Mission Control UI at `/mission-control`
3. (Optional) hit `POST /api/mission-control/overdue/slack` manually to confirm Slack wiring
4. Update `CHANGELOG.md` + `MISSION_CONTROL_JOURNAL.md`
