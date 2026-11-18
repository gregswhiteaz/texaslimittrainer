# Coverage gates — TLH Trainer

| # | Gate | Status | Requirements produced | Notes |
|---|---|---|---|---|
| 1 | Purpose & goals | Clear | all (Rationale links G-n) | G-1..G-5 measurable; G-1 → REQ-036/039, G-2 → REQ-040/048, G-3 → REQ-048, G-4 → REQ-045/046/049, G-5 → REQ-011/024 |
| 2 | User classes & permissions | Clear | User classes table | Single local user; no accounts (Q-5) |
| 3 | Scope boundary | Clear | Out of scope, Waiting room | Later: ICM, drills; waiting room 9 items |
| 4 | Glossary | Clear | Glossary | One definition per term; grade/speed names fixed (Q-42) |
| 5 | Entities × CRUD × lifecycle | Clear | REQ-052..054 + entity table | Hand records/reports immutable; delete only via reset |
| 6 | Events × states | Clear | REQ-004, 007, 008, 024, 043, 050.7, 053, 054, 056, 065 | Session active/paused/ended; bust × review open; app close mid-hand; storage/migration failure; update never mid-session |
| 7 | Edge & error cases | Clear | REQ-001.3, 003.3, 017, 018, 019.3, 044.8, 045.6, 048.7, 053, 054.3, 056.3 | First use, empty stats, zero-hand session, all-in/side pots, odd chip, quota, offline |
| 8 | Business rules | Clear | REQ-006..010, 013..020, 025..030, 032..041, 045..047 | Rules with examples and thresholds |
| 9 | Data | Clear | REQ-052..054 | IndexedDB, ≥100k hands, migrations; no export (Q-17, accepted) |
| 10 | Interfaces | Clear | REQ-001..003, 021..023, 031, 042..044, 048..051, 062, 066..072 | 8 screens (storyboards) + playtest CLI; only external system = static host |
| 11 | Non-functional sweep | Clear | REQ-055..061, 034, 065, 066..069 | Look & feel incl. card/table art and animation (066..069); sound deferred to phase 2 (Q-70). Perf, reliability, usability/a11y, security/privacy, maintainability, compatibility, portability/install (065), functional accuracy (034), look & feel (060), legal (061), operational (064) |
| 12 | Constraints | Clear | REQ-059..061, 063, 064 | TS-only, React, Vite PWA, Vitest, fast-check, Playwright, GitHub Pages, GitHub Actions |
| 13 | Assumptions | Clear | Assumptions A-1..A-5 | Each with impact and owner |
| 14 | Risks & TBDs | Clear | TBD register empty | R-1..R-5 mitigated by REQ-039/056 (R-1), REQ-035 (R-2), milestones (R-3), REQ-053.3 (R-4), REQ-028/030 (R-5) |
| 15 | Operations & lifecycle | Clear | REQ-062..065, 051, 054 | Install/update, CI/CD, migrations, reset. Backup N/A (user accepted risk, Q-17). Telemetry N/A (privacy, REQ-058). Onboarding = first-use message (REQ-003.3) |
