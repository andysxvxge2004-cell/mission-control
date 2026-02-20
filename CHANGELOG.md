# Changelog

## [0.1.22] - 2026-02-20
- Added a 'Copy share link' action in Task Aging Alerts to grab the current filter (agent/sort/pinned) as a URL-ready link

## [0.1.23] - 2026-02-20
- WHAT: Shared MissionControlShell layout now wraps every /mission-control route with top nav tabs (Dashboard / Agents / Tasks / Intelligence / Files) plus refreshed KPI strip and alert rail. WHY: Keeps navigation consistent as we expand the surface area so operators always know where they are. HOW: Added shell data loader, nav update, and layout wiring that highlight the current tab and feed lane-level counts.
- WHAT: Added dedicated Tasks, Intelligence, and Files pages under Mission Control with filtered queues, aging alerts, audit trail, and dossier quick-jumps. WHY: Gives ops focused workspaces for triage, analytics, and file-like browsing without digging through the main dashboard. HOW: New route groups reuse the existing components with URL-driven filters and snapshot of agents/tasks/audits.

## [0.1.22] - 2026-02-20
- Add export endpoint + UI control to generate a markdown “command snapshot” with agents, tasks, and recent audits
- Include download-friendly headers so the file saves with timestamped filenames for async reporting

## [0.1.21] - 2026-02-20
- Added a pinned-only view toggle + dedicated row so curated aging filters remain visible while quick filters focus on top backlog owners

## [0.1.20] - 2026-02-20
- Separated pinned filters into their own row with progress bars, keeping favorite aging drilldowns always visible even if they fall out of the top backlog list

## [0.1.19] - 2026-02-20
- Quick filter chips in Task Aging Alerts can now be pinned/unpinned, persisting via URL parameters for consistent drilldowns

## [0.1.18] - 2026-02-20
- Rebuild the agent roster into Kanban-style lanes (Idle, Engaged, Overloaded) with capacity hints based on active load
- Highlight overloaded operators with rose-accented lane borders so leads can rebalance work before assigning new tasks

## [0.1.17] - 2026-02-20
- Add agent search with instant quick-jump links so operators can open dossiers directly from Mission Control and the home dashboard
- Filter the roster in-place based on the search string while preserving any active execution-queue filters

## [0.1.16] - 2026-02-20
- Introduce task priorities (Low/Medium/High) in the data model, creation form, update controls, and queue badges
- Extend task filters to include priority so leads can focus on top-urgency work

## [0.1.15] - 2026-02-19
- Added agent + sort controls to the aging alerts panel so ops can filter by owner or focus on oldest stuck work

## [0.1.14] - 2026-02-19
- Added rotating agent badge legend and color-coded ownership tags to the aging alerts panel for quicker visual parsing

## [0.1.13] - 2026-02-19
- Task aging alerts now include relative "last update" timestamps for easier triage

## [0.1.12] - 2026-02-19
- Memory timelines now show relative ages (e.g., `2d 4h ago`) alongside absolute timestamps for faster context scanning

## [0.1.11] - 2026-02-19
- Memory hygiene banner now shows how long it has been since each agent was briefed and includes stale (3d+) agents alongside never-briefed ones
- Added relative time formatter utility for concise "Xd Yh ago" strings

## [0.1.10] - 2026-02-19
- Added dual CTA buttons to the memory hygiene banner so each unbriefed agent can be opened or appended in one click

## [0.1.9] - 2026-02-19
- Auto-log `agent.needs_briefing` audit events whenever a new agent is created without memories so gaps get recorded in the timeline

## [0.1.8] - 2026-02-19
- Highlight unbriefed agents with dashboard KPIs, warning banners, and roster badges so ops fills memory gaps before dispatching work
- Add inline "Needs briefing" pills on agent cards plus aggregated counts in Mission Control and the home dashboard

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
