# Changelog

## [0.1.4] - 2026-02-19
- Surface per-agent workload badges on roster cards to show TODO/DOING/DONE counts at a glance

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
