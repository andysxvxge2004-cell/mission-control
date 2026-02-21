# Changelog

## [0.1.41] - 2026-02-21
- Added the Executive Snapshot control panel: surfaces total agents, idle >24h, SLA warnings/breaches, oldest open task age, and stale high-priority work in a dedicated top-right block.

## [0.1.40] - 2026-02-21
- Polished the Mission Control shell layout: tighter header spacing, a framed KPI strip, and refreshed alerts so the nav + metrics align consistently on every route.
- SLA Command Board now uses intentional gradient risk colors and a spotlight-styled "Needs Attention" list with consistent chip sizes.
- Files + folder experiences picked up hover feedback, smooth scrolling, and clearer copy-to-clipboard signals without any backend changes.

## [0.1.39] - 2026-02-21
- Mission Control Files view now renders faux Office Space folders for Role, Soul, Memories, Tasks, and Audit logs with per-folder copy buttons, search, and role filters.
- Cards highlight recent activity timestamps and keep everything client-side using the existing agent/task/audit data—no backend changes required.

## [0.1.38] - 2026-02-21
- Agent roster cards now feature a three-metric workload scoreboard (TODO / DOING / DONE), inline quick chips, and an idle badge that triggers after 48h with no task/memory activity.
- Cards also surface "last touch" timestamps plus a clear stuck-task warning ribbon powered entirely from existing task timestamps.

## [0.1.37] - 2026-02-20
- Agent roster cards now surface open/done/stuck totals, highlight stuck load, and embed append-memory / assign-task quick actions for each operator.
- Agent files pivoted to faux folders (Role / Soul / Memories / Audit / Tasks) with search, copy-to-clipboard, and an Office Space theme toggle.
- SLA Command Board shows per-priority clocks (target vs worst elapsed) plus warning/breach counts so leads can intervene early.

## [0.1.36] - 2026-02-20
- Playbook library adds owner filter chips so ops can jump directly to a commander’s runbooks without typing searches.

## [0.1.34] - 2026-02-20
- Escalation library now shows last-updated timestamps and supports impact/title/recency sorting so ops can prioritize the freshest runbook in a click.

## [0.1.35] - 2026-02-20
- WHAT: Re-enabled Escalation Playbooks after APPROVED: SCHEMA, exposing the full library + CRUD tools in Mission Control Intelligence.
- WHY: Teams need ready-to-run escalation plans now that the schema is sanctioned.
- HOW: Reverted the quarantine commit, restored server actions/seeding, and brought the playbook UI back online.

## [0.1.33] - 2026-02-20
- Mission Control digests can now be customized (choose sections + Slack/plain formats) before export

## [0.1.32] - 2026-02-20
- Files tab adds sort controls (recent activity vs alphabetical) so ops can prioritize the freshest intel or scan by name

## [0.1.31] - 2026-02-20
- Mission Control Files tab now includes dossier search, role filter chips, and memory previews for faster navigation

## [0.1.30] - 2026-02-20
- Escalation playbook cards now expose a delete control wired to a validated server action so stale runbooks disappear instantly

## [0.1.29] - 2026-02-20
- Escalation playbook library now includes impact filter chips and fuzzy search so ops can immediately surface the right runbook and comms template

## [0.1.28] - 2026-02-20
- Added an escalation playbooks library with templated comms snippets inside Mission Control → Intelligence
- Persisted playbooks in the database so default critical/high/medium responses stay versioned and editable

## [0.1.27] - 2026-02-20
- Added a staffing recommendations panel that surfaces unassigned backlog counts by priority and the top agents with available capacity to take the next mission

## [0.1.26] - 2026-02-20
- Added `/api/mission-control/overdue/slack` endpoint plus UI trigger to blast Slack when tasks linger in Doing for 48h+
- Documented the Slack webhook + Mission Control base URL requirements and exposed a one-click "Ping Slack" control inside the Aging Alerts widget

## [0.1.25] - 2026-02-20
- Introduced per-priority SLA tracking and warning badges across Mission Control

## [0.1.24] - 2026-02-20
- Add shareable filter presets
