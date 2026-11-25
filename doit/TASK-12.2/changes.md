# TASK-12.2 changes

- `src/table/settings.ts` — `SettingsWriter` interface (A-4).
- `src/storage/hand-store.ts` — `writeSettings(settings)`: validated whole-record put, strict durability; `& SettingsWriter` on `openHandStore` / `sharedHandStore` return types (A-4, D-2).
- `src/ui/settings/SettingsScreen.tsx` — optional `settings` / `onSettingsChange` props; Display checkbox "Show opponent styles at the table", disabled until loaded (D-1, A-1).
- `src/ui/App.tsx` — `settings` state read once at launch (defaults + log on failure), `changeSettings` (state first, then save, failure logged), props to Settings and Table (D-3, A-1-A-3, A-5). `type Screen` unchanged.
- `src/ui/table/TableScreen.tsx` — `showOpponentStyles?` passed to `Table`.
- `src/ui/table/Table.tsx` — `showOpponentStyles?` (default `true`) on `TableProps` / `TableViewProps`; bot `Seat` omits the style span and ` · ` when off (A-7).
- `src/ui/styles.css` — `.settings-toggle` and `.settings-toggle input` (44x44 input, D-4).
- `tests/storage/settings-write.test.ts` — new: SPEC-07.
- `tests/ui/opponent-styles.acceptance.test.tsx` — new: SPEC-01, SPEC-03, SPEC-04.
- `e2e/opponent-styles.spec.ts` — new: SPEC-02, SPEC-05, SPEC-06, SPEC-08.
- `e2e/settings.spec.ts` — locked edit (D-4, edits 1-3 only): wait for the checkbox to be enabled, name controls by text or label, expected list gains the checkbox. Size, tag and Enter/Space assertions unchanged.
- `docs/storage/settings.md` — Writing and App reader sections; removed "Nothing in the app reads the record yet".
- `docs/ui/navigation.md` — Display toggle paragraph and when a change applies; test list.

- `doit/TASK-12.2/blocked.json` — SPEC-09 blocker on the locked `e2e/settings.spec.ts` tab-order assertion.
- `doit/TASK-12.2/build-log.md` — build log.

No new dependencies.
- `e2e/settings.spec.ts` — Tab-order comparison starts from the heading (Block 1; TASK-12.1 locked; unlocked; orchestrator edit)
