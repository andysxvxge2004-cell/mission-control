# Changelog

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
