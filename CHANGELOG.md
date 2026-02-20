# Changelog

## [0.1.8] - 2026-02-19
- Add workspace memory alerts that list every agent lacking documented memories, with quick links to append updates
- Display the reminders across both dashboards so leads get nudged before staffing an unbriefed operator

## [0.1.7] - 2026-02-19
- Add per-agent activity timelines by correlating audit log events with their assigned work
- Introduce a reusable timeline component for dossiers, including safe metadata rendering

## [0.1.6] - 2026-02-19
- Bubble stuck-task counts into dashboard KPIs and show inline warnings atop Execution Queue so leads spot risk immediately
- Centralize the 48h aging threshold helper for reuse across server metrics and client cards

## [0.1.5] - 2026-02-19
- Surface a dedicated aging-alerts panel that lists every DOING task idle for 48+ hours across dashboards
- Highlight each stuck task with staleness badges, last-update timestamps, and agent context for fast triage

## [0.1.4] - 2026-02-19
- Add agent performance rollups highlighting open vs. completed load for every operator across both dashboards

## [0.1.3] - 2026-02-19
- Add agent/status filters plus reset controls to the Execution queue on the dashboard and Mission Control views
- Keep mission stats accurate by computing aggregates independently of filtered task lists

## [0.1.2] - 2026-02-19
- Allow reassignment of tasks from any lane with inline agent pickers and combined status/owner updates

## [0.1.1] - 2026-02-19
- Group task queue by status lanes with per-lane counts and styling for faster triage

## [0.1.0] - 2026-02-19
- Initialize Mission Control monorepo with pnpm workspace
- Scaffold Next.js web app with Tailwind
- Add Prisma ORM package with Agent/Task/Audit schemas and SQLite storage
- Add Mission Control route namespace with agent roster/detail/files views
- Auto-seed core "Sentry" agent to ensure visibility in dashboards
