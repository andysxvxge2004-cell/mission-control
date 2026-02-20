# Mission Control Roadmap

This roadmap tracks the near-term features required to make Mission Control a reliable operations cockpit. Items are ordered roughly by priority.

## Near-term backlog
- [x] Group execution queue by status lanes with per-lane counts for rapid triage (shipped in 0.1.1)
- [x] Inline agent reassignment controls inside each lane so ownership and status update together (shipped in 0.1.2)
- [x] Filter controls for the Execution queue (status + agent) so dispatch can zero in on the next blocker (shipped in 0.1.3)
- [x] Agent performance rollups that summarize each operator's open vs. completed work (shipped in 0.1.4)
- [x] Task aging alerts that surface items stuck in "Doing" beyond 48 hours (shipped in 0.1.5)
- [x] Priority labels on tasks (High / Medium / Low) with queue badges so urgent work is obvious (shipped in 0.1.16)
- [x] Agent search + quick-jump to dossiers directly from the roster (shipped in 0.1.17)
- [x] Grouped Kanban lanes for agent cards (Idle, Engaged, Overloaded) with capacity hints (shipped in 0.1.18)
- [x] Export daily command snapshot (agents, tasks, audits) to markdown for async reporting (shipped in 0.1.22)
- [x] Weekly digest email summarizing agent load + stuck tasks (shipped in 0.1.24)
- [x] Task SLA tracking with per-priority thresholds and warning badges (shipped in 0.1.25)
- [x] Slack notification hook for overdue tasks (shipped in 0.1.26)
- [x] Escalation playbook filters + search controls so operators can zero in on the right response quickly (shipped in 0.1.29)
- [x] Files tab search + role filters so dispatch can jump into the right dossier instantly (shipped in 0.1.31)
- [x] Files tab sorting controls (recent activity vs. alphabetical) so ops can choose preferred ordering (shipped in 0.1.32)
- [x] Audit log filters + search controls for faster forensic triage (shipped in 0.1.30)
- [x] Mission Control digest customization (choose which sections export + optional Slack delivery) (shipped in 0.1.33)

## Later
- [x] Smart agent recommendations based on backlog composition (suggest who to staff next) (shipped in 0.1.27)
- [x] Escalation playbooks library with templated response steps (shipped in 0.1.28)
