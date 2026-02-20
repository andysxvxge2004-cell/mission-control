# Mission Control Roadmap

This roadmap tracks the near-term features required to make Mission Control a reliable operations cockpit. Items are ordered roughly by priority.

## Near-term backlog
- [x] Group execution queue by status lanes with per-lane counts for rapid triage (shipped in 0.1.1)
- [x] Inline agent reassignment controls inside each lane so ownership and status update together (shipped in 0.1.2)
- [x] Filter controls for the Execution queue (status + agent) so dispatch can zero in on the next blocker (shipped in 0.1.3)
- [x] Agent performance rollups that summarize each operator's open vs. completed work (shipped in 0.1.4)
- [x] Task aging alerts that surface items stuck in "Doing" beyond 48 hours (shipped in 0.1.5)

## Later
- [x] Timeline overlays that correlate audit log activity with task changes (shipped in 0.1.7)
- [x] Workspace notifications that nudge when new agents are added without souls/memories (shipped in 0.1.7)
