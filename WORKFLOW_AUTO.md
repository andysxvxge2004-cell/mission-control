# WORKFLOW_AUTO.md

## Daily Startup Checklist
1. Read `SOUL.md`, `USER.md`, and the latest two entries under `memory/` (today + yesterday) before taking action.
2. Run `git status -sb` to understand pending work. If automation is enabled, also `git rev-parse HEAD` and log it in notes/cron output when relevant.
3. Check `ROADMAP.md` for remaining priorities before declaring any loop "done".
4. Confirm required cron prerequisites (errors, rate limits, pending TODOs) and capture blockers in the appropriate memory file.

## Automation Guardrails
- Before any cron declares success, ensure it has executed `git status`, `git pull --rebase --autostash origin main`, and logged `git rev-parse HEAD`. If `origin` is missing, treat that as a blocker and notify.
- Respect user instructions on schema changes: no Prisma schema/migration edits unless the task explicitly carries "APPROVED: SCHEMA" context.
- For rate-limit handling, back off exponentially after each 429 or quota error (1h heartbeat; stretch to 3h after two consecutive hits).

## Mission Control Focus
- Demo readiness hinges on: SLA Command Board, upgraded agent roster, faux-folder files viewer, and Mission Control shell polish.
- Keep automation loops healthy and quiet: silence or pause jobs that only produce repeat rate-limit noise.
- Capture meaningful progress in `MISSION_CONTROL_JOURNAL.md` and summarize daily in `memory/YYYY-MM-DD.md`.
