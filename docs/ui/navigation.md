# Navigation: screens, the Home control and browser Back/Forward

The app has six screens (plus the busy screen shown while a session ends, and the error screen), held in `App`'s state (`src/ui/App.tsx`). There are no URL routes, hash fragments
or deep links: the URL stays `/` on every screen.

| Screen         | Opened by                                                                                                    | Leaves to                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Home           | app start; Cancel / ← Home; the Table's Home control or browser Back; Leave table with 0 hands; Back to Home | New game → Game Config; Resume session → Table; Statistics → Statistics; Settings → Settings |
| Game Config    | New game                                                                                                     | Start game → Table (asks first if a session is paused); Cancel / ← Home → Home               |
| Table          | Start game (a new session); Resume session                                                                   | Home control or browser Back → Home; Leave table → Session report (or Home)                  |
| Session report | Leave table (after at least one completed hand)                                                              | View statistics → Statistics; Back to Home → Home                                            |
| Statistics     | Statistics on Home; View statistics on the Session report                                                    | ← Home → Home                                                                                |
| Settings       | Settings on Home                                                                                             | ← Home → Home                                                                                |
| Error screen   | any unexpected error (TASK-13.1)                                                                             | Return Home → Home                                                                           |

Each return to Home moves focus to Home's `TLH Trainer` heading.

**Statistics (TASK-11.1).** Home's Main menu always ends with `Statistics` (after Resume session when one is
shown). It opens the Statistics screen with its `Statistics` heading focused; `← Home` returns to Home. The
screen reads the stored hands each time it opens, after any hand write still running, and writes nothing. See
[trends.md](../stats/trends.md).

**Settings (TASK-12.1).** Home's Main menu always ends with `Settings`, after Statistics. It opens the Settings
screen with its `Settings` heading focused: `← Home`, then the sections Play, Display and Your data (Your data
says that hands, sessions and statistics are stored only in this browser, with no backup), then
`Version <x>`, where `<x>` is `package.json`'s `version` inlined at build time (`__APP_VERSION__` in
`vite.config.ts`, read as `APP_VERSION` from `src/ui/app-version.ts`). `← Home` returns to Home. Settings adds
no history entry.

**Display: Show opponent styles at the table (TASK-12.2).** The Display section has one native checkbox, `Show
opponent styles at the table`, checked by default. It is disabled until App has read the settings at launch.
Each change is saved at once (see [settings.md](../storage/settings.md)). Unchecked, every bot seat at the table
shows its name and stack without the style label and its `·` separator; the user's seat and every other seat
field are unchanged. Style labels elsewhere (Game Config line-up, Session report, Statistics) are not affected.
Settings opens only from Home in this slice, so a change applies the next time a Table is shown (New game or
Resume session). App passes the value to the Table on every render, so a later in-table Settings overlay
(TASK-12.3) applies it on the next render.

**From the Session report (TASK-11.6).** The report ends with a right-aligned row: `View statistics` (outlined),
then `Back to Home`. Opening Statistics from the report resets the filters and grouping like Home's entry (All /
All / Every 500 hands), and its totals include the session that just ended. Leaving the report writes nothing,
because the report was saved before it was shown. There is no way back from Statistics to the report: `← Home`
returns to Home, which shows no Resume for the ended session.

## The Home control (REQ-004.9)

The Table header shows `Home` before `Leave table` (a later Settings control will go between them). Choosing it
**pauses** the session and opens Home, where Resume session shows it:

- The session is never ended: nothing is written, no `endedAt` is set and no report is created. The stored
  session record already is the state ready for the next hand (see
  [sessions.md](../storage/sessions.md#pause-from-the-table)).
- Between hands nothing is lost. Home waits for any hand write still running, so the count includes the hand
  just finished.
- In the middle of a hand, that unfinished hand is dropped exactly as when the app is closed: it has no record
  and no effect on stats. Resume deals the same hand number again from the stacks at the end of the last
  completed hand.

## Leave table ends the session (TASK-10.1, REQ-004.5)

Leave table (in the Table header and in the bust dialog) **ends** the session. The Table closes at once (it
steps back off its history entry, so no further hand is dealt) and an empty busy screen shows while App waits
for any hand write still running and then calls `endSession` ([reports.md](../storage/reports.md)). With at
least one completed hand the Session report opens, its `Session report` heading focused: the header line
(game, players, limits, hands) and the cash tiles Result, BB/100 and Rebuys, then `Back to Home`. With 0
completed hands the session is deleted and Home opens with no report. An ended session never shows in Resume.
If the session cannot be ended, the error is logged and Home opens with the session still paused.

**Leave table during a hand (TASK-10.2, REQ-004.7, REQ-004.8).** From the hand's deal until its result shows,
Leave table first opens a modal dialog, `Leave now? Your hand will be folded.`, with `Cancel` (focused) and
`Confirm`. Before the deal and once the result shows, Leave table ends the session at once, as above.

- While the dialog is open, play is frozen: no bot acts and no hand is dealt. `Cancel` (or Escape) closes it,
  returns focus to Leave table and the hand goes on with the same cards, stacks and player to act.
- `Confirm` folds the user's hand at once, even when a bot is to act, unless the user is all-in (the cards stay
  in to the showdown and the user is paid any pot won) or has already folded. The table shows the fold and the
  bots play the hand out. Meanwhile Home and Leave table are disabled, and no Hand Review, review badge, Deal
  next hand or bust dialog shows. No further hand is dealt.
- The hand is graded and stored like any completed hand, and once its write has settled the session ends as
  above, so its Session report counts it. If that write fails, the error is logged and the session still ends
  with the hands that were stored.
- The forced fold is not a decision: it has no grade and no entry in the hand record's `decisions`, so it never
  counts in error rates, hint usage or leaks. The record carries `forcedFold: true`
  ([hand-records.md](../storage/hand-records.md)).

**The bust dialog (TASK-3.11).** When a cash hand ends with the user on $0, a modal `Out of chips` dialog
offers `Rebuy` and `Leave table`, and the page behind it (the header's Home and Leave table included) is inert.
Escape is ignored. Leave table in the dialog ends the session exactly like the header's Leave table and opens
its Session report. Browser Back at the dialog pauses to Home, and Resume session reopens the dialog.

**Continue on a bust (TASK-9.2).** When the Hand Review is held on a cash hand that left the user on $0, the
control under the table reads `Continue` instead of `Deal next hand`, also after Close review. Continue clears
the review and opens the `Out of chips` dialog; nothing is dealt until Rebuy. In a sit-and-go the control still
reads `Deal next hand` (`See results` comes with TASK-5.8).

## Start game with a paused session (TASK-2.7, REQ-004.4)

Start game checks storage first. If a session is paused (not ended), a modal `End your paused session?` dialog
opens over Game Config, which stays as it was:

- It reads `Starting a new game ends this paused session:`, the session's Home summary line (for example
  `Cash · 6 players · $4/$8 · 4 hands · paused`), and `Its Session Report will be saved.` or, with 0 completed
  hands, `It has no completed hands, so no report is saved.`
- Buttons: `Cancel` (focused) and `End session and start`. Cancel or Escape closes the dialog, changes nothing
  and returns focus to Start game.
- `End session and start` ends the paused session (its report is saved; a 0-hand session is deleted), also
  ends any older unended sessions ([reports.md](../storage/reports.md)), and then opens the Table for the new
  game. No Session report screen is shown. While it runs, both buttons are disabled and Escape is ignored. If
  the paused session cannot be ended, the error is logged, the dialog closes and no game starts.

With no paused session, Start game opens the Table at once. New game, Resume session and Cancel / ← Home never
ask and never end anything.

## Browser Back and Forward (TASK-2.14 D-2, TASK-2.20)

Only opening the Table (Start game or Resume session) adds a history entry, `{ tlhTable: <key> }`, with a key
unique to that opening (32 hex characters from 16 `crypto.getRandomValues` bytes, so keys differ across loads
even under a faked clock; nothing else is stored in history). Home, Game
Config, Statistics, Settings and the Session report add no entries; Back on the Session report leaves the app.

- **Back on the Table** pauses to Home, exactly like the Home control.
- **Forward never reopens the Table.** Use Resume session. Forward onto the Table entry this page load pushed
  last steps straight back off it, so Home stays and one Back leaves the app.
- **Back on Home or Game Config** leaves the app, to whatever page came before it. A session that was started
  stays paused, as when the app is closed.
- Leaving the Table in the app (Home control or Leave table) steps back off its entry, so the entry does not
  linger and a later Back leaves the app.
- A Table entry from an earlier load of the page never matches the current key, so Back onto it from a new
  Table pauses to Home. Such entries are not stepped off (stepping back from them would reload the page), so
  Back from Home onto one keeps today's behaviour.
- Home and browser Back wait for any table write still running (the start record and hand writes) before
  reading the paused session, so the Resume count includes the hand just completed.

Example, starting from the page before the app:

```text
load the app            […, app*]
Start game              […, app, T1*]        push T1 (the last key this load pushed)
Back                    […, app*, T1]        popstate (state null) on the Table → pause to Home
Forward                 […, app, T1*]        popstate (T1) on Home, T1 is the last key → history.back()
                        […, app*, T1]        popstate (state null) on Home → ignored, Home stays
Back                    […*]                 leaves the app (one Back)
```

After a reload on the Table (`[app, T1*]`, a new load that has pushed nothing), Resume session pushes T2:
`[app, T1, T2*]`. Back → popstate (T1) on the Table → pause to Home; T1 is not stepped off.

## Error screen (TASK-13.1, REQ-056.3, REQ-057)

`AppRoot` (`src/ui/AppRoot.tsx`, rendered by `src/main.tsx`) wraps `App` in an error boundary and listens for
`window` `error` and `unhandledrejection`. Any of these replaces the whole app with the error screen
(`src/ui/error/ErrorScreen.tsx`):

- a render, commit or effect error anywhere below it (for example a rejected or illegal bot decision, or a
  failure while the Session report mounts);
- a window `error` event that carries an error object. Events with `error: null` (cross-origin `Script error.`,
  Chrome's `ResizeObserver loop` notice) are ignored (A-1);
- any unhandled promise rejection, whatever its reason.

The screen is not one of App's routes, so it adds no history entry. It shows the heading `Something went wrong`
(focused), one sentence, `The app hit an unexpected problem. Every completed hand is saved, and a paused session
resumes from its last completed hand.`, and a native `Return Home` button. It never shows the error's message,
stack or file names. The first error is logged once to the console as `Unexpected error`; errors while the screen
shows are ignored. Nothing is sent off the device or stored.

**Return Home** steps back off the Table's history entry if it is the current one (so a later Back leaves the
app), replaces the shared advice client if its worker has failed (a new worker starts warming at once, so a new
game works without a reload), and remounts App on Home with the `TLH Trainer` heading focused.

**Resume after an error.** Nothing is written or ended on an error, exactly as when the app is closed mid-hand
(REQ-004.2). Each completed hand is stored with the session record before the next hand is dealt, so Home (which
waits for any hand write still running) shows Resume session with the hands completed before the error. Resume
deals the unfinished hand's number again from the stacks at the end of the last completed hand; the unfinished
hand has no record. An error during hand 1 leaves the paused session with 0 hands; Home offers it for Resume ("0 hands · paused"),
as after a reload mid-hand 1, and Resume deals Hand #1. Only ending a session deletes a 0-hand session.

## Tests

- `tests/ui/table-home.acceptance.test.tsx`: the header's Home button, rendered only when `App` provides it.
- `e2e/home-control.spec.ts` (every push): the Home control between hands and in the middle of a hand.
- `e2e/history.spec.ts` (every push): Back and Forward on the Table, Back on Home and Game Config, and Back
  after a reload and Resume, all under the paused clock.
- `e2e/pause-history.spec.ts` (every push): Home and browser Back wait for a held session write (an init script
  from `e2e/support/hold-writes.ts` holds it open) before showing the paused hand count; the random history key;
  Back, Forward, then one Back leaves the app; and Back after a reload and Resume on the real clock.
- `e2e/home.spec.ts`: `history.length` is unchanged across New game, then Cancel or ← Home.
- `tests/ui/end-session-dialog.acceptance.test.tsx`: the dialog markup, shown only with a prompt.
- `e2e/new-game-confirm.spec.ts` (every push): the dialog, Cancel and Escape, Confirm, older sessions, a 0-hand
  session, and Start game with no paused session.
- `e2e/session-report.spec.ts` (every push): Leave table opens the Session report, Back to Home, and a 0-hand
  session opens Home.
- `e2e/statistics.spec.ts` (every push): Home → Statistics → Home, with focus on each heading.
- `tests/ui/home-settings.acceptance.test.tsx`, `tests/ui/settings.acceptance.test.tsx`: the Settings entry
  and the Settings screen markup and version line.
- `e2e/settings.spec.ts` (every push): Home → Settings → Home, Tab reach, Enter/Space, 44x44 targets, axe and
  the version line.
- `tests/ui/opponent-styles.acceptance.test.tsx`, `e2e/opponent-styles.spec.ts` (every push): the opponent
  styles toggle, its save and reload, and the seats with styles on and off, including a change made while paused.
- `tests/ui/error-screen.acceptance.test.tsx`, `tests/ui/unexpected-error.test.ts`,
  `tests/ui/advice-client-recovery.test.ts`: the error screen markup, which window events count, and the
  replacement of a failed advice client.
- `e2e/error-recovery.spec.ts` (every push): errors injected from a Playwright init script
  (`e2e/support/fault-injection.ts`, never in `dist/`) in a bot step, a worker failure, a rejected decision, the
  Session report's mount and outside React; Return Home, Resume from the last completed hand and a fresh
  worker for a new game.
