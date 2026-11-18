# Cross-epic notes for EPIC-mode weavers (from orchestrator)

From E01 (wave 1, 18 stories):
- REQ-062.1 playtest options: E01 delivers --hands/--seed/--size/--game. E06 must add --lineup and --check-styles (REQ-027.5); E07 must add the advice-determinism check option (REQ-036).
- REQ-063.1: E07 must add the golden-spot suite to `npm test`.
- REQ-063.4: E01's build is a static bundle; PWA manifest + service worker are E13's job.
- SNG in playtest: E05 adds 1,500 chips + level schedule.
- Until E06 bots exist, playtest seats pick seeded random legal moves. E06 must re-verify REQ-062.5 (100k 6-max hands ≤ 60 min) with real bots.
- REQ-056.2 (1,000,000-hand run over all sizes, game types AND line-ups): E01 covers sizes/game types with random-move seats; E06 must add a story/AC that extends the 1M invariant run to all line-up presets once bots exist.
- Orchestrator decision: E01 toolchain/CI stories are High priority despite Should clauses — the user explicitly asked for toolchain and test harness first.

From E07 (wave 2, 17 stories):
- E06: M1 TAG bot uses E07-S01 (6-max chart) + E07-S03 (postflop call/fold). Recommendations are always legal (capped raise → call; call with nothing to call → check). Chart cells carry an acceptable alternative usable by the mixing rule. Style bands must use E07-S08 stat functions. NEW clause REQ-027.6 (bands use postflop-only aggression per REQ-045.3) is assigned to E06.
- E08/E09: advice result fields: action, equity %, required equity %, rule id, explanation, per-opponent basis, optional approximate label, optional short-stack note (separate field). Review must recompute advice with the observed-stats snapshot taken at decision time (REQ-036.2). Add a UI test that hint card and review entry for the same decision show identical values. Preflop basis = "typical player". Explanations land in M2 (E07-S12) — an M1 basic review must not claim REQ-043.1's explanation field.
- E03: hand records must keep full per-seat, per-street action history (needed by E07-S08 stats).
- E05: PlayerView must expose game type and current level big bet (needed by E07-S17).

From E06 (wave 3, 14 stories):
- E02/E03: E06-S07 resolves line-up name (preset or Custom) into session config; E02 calls it on Start game; E03 stores it with session and hand records (E11 filters by line-up).
- E03: replacement bots get distinct ids (E06-S08); reset that seat's observed stats on replacement (REQ-031.3); run bot decisions off the main thread (REQ-055.6).
- E04: replacement bots show their own initials (REQ-070.3).
- E02: use E06-S06 line-up module for preset picker and per-seat edits (REQ-009.2, 009.3, 009.5).
- E05: SNG never refills seats; E06-S08 is cash only.
- Playtest `--lineup` also accepts comma-separated per-seat styles.

From E03 (wave 4, 17 stories):
- E02: E03-S01 opens straight onto a default cash 6-max $4/$8 table until Home/Config exist; E02 puts Home in front and passes session config (stake, line-up via E06-S07, speed). Resume (REQ-004.2/004.3) reads E03-S11 session state.
- E04: builds on E03-S03 seat fields (bet chips, art, avatars, action log); replacement bots show own initials (REQ-070.3).
- E05: E03-S03 header shows stake — add SNG level (REQ-021.8). E03-S06 already formats chips without $. Add SNG level and finishing data to E03-S11 session state.
- E08: set hinted=true in the E03-S10 decision record (add an AC; S10 only proves false). Request hints through the E03-S12 worker (REQ-055.1).
- E09: M1 basic review reads the completed hand exposed by E03-S01; in M2 read decisions from E03-S10 records (don't recompute). Suspend the E03-S04 auto-deal timer while the panel is open (REQ-024.2). Continue on bust opens the E03-S08 dialog (REQ-007.6).
- E10: wire Leave table (header E03-S03, bust dialog E03-S08) to end the session and open the report (REQ-004.5); NEW clause REQ-004.7 (Leave mid-hand: confirm dialog, auto-fold, hand completes and is recorded, then session ends) is assigned to E10. Show rebuys (REQ-007.3). Reports immutable (REQ-052.5).
- E11: filter by line-up name stored on sessions/hands.
- E12: owns style-label toggle (REQ-021.2), four-colour toggle (E03-S05 renders both), default speed, Reset all data as the only deletion path.
- E13: schema versions/migrations for E03-S09 stores (REQ-054), write-failure path (REQ-053.2), logo on Splash/Home/app icon (REQ-060.3).

From E04 (wave 5, 9 stories, all M3):
- E12: owns the "Bot banter" toggle (REQ-071.5) — AC: toggle off → zero bubbles. Reset all data must also clear the action-log collapse preference (E04-S02).
- E13: include the log collapse preference in schema versioning (REQ-054); add generated app icons to E04-S03's image-asset allow-list.
- E10: REQ-072.3 reads elapsed playing time stored by E04-S09 in session state.
- E02: Resume continues from stored elapsed time, not wall-clock (REQ-072.1).
- E05: SNG shows chip numbers without $ in log/bet chips/pots; header also holds the clock. Banter "pot ≥ 10 big bets" uses the current level's big bet; "new player sits down" never fires in SNG.
- Banter uses its own seeded generator, separate from bot decisions (keeps replays exact).

From wave 5 (E02, E08, E09, E10):
- E05: SNG Start game (E02-S04 passes game type sng, no stake) must play the SNG structure; Resume must restore SNG level and hands to next level (REQ-004.3); store finishing position + starting player count on session (depend on E10-S11); Home snapshot for SNG shows level and finishing position instead of stake and BB/100. "See results" on bust with review open (REQ-008.9) hooks into the same control as E09-S06. Re-verify short-stack note on real SNG tables.
- E11: add "View statistics"/"Back to Home" on report (REQ-044.6); reuse E10 report builder and stored reports; G-2 rate uses E10-S02's unhinted rule; add Statistics entry on Home (REQ-002.3; Home = E02-S01); read hinted flag from E03-S10 records.
- E12: add Settings entry on Home (REQ-002.3). Wire default speed (REQ-050.1) into Game Config (E02-S11; REQ-012.3 says speed always comes from Settings). Wire auto-open toggle (REQ-050.2) into E09-S07. Reset all data deletes stored reports and returns Game Config to first-use defaults (E02-S10).
- E13: launch ≤3 s and migration-failure screen sit with the splash (E02-S12); error-screen Return Home leaves the session paused; extend no-real-money check to later screens; schema versions cover the reports store; axe audit includes open hint card and open review panel.
- Possible end-to-end Playwright test of hint-vs-review equality across both UIs.
