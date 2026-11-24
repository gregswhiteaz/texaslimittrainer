# Navigation: screens, the Home control and browser Back/Forward

The app has four screens, held in `App`'s state (`src/ui/App.tsx`). There are no URL routes, hash fragments
or deep links: the URL stays `/` on every screen.

| Screen         | Opened by                                                                                                    | Leaves to                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Home           | app start; Cancel / ← Home; the Table's Home control or browser Back; Leave table with 0 hands; Back to Home | New game → Game Config; Resume session → Table                              |
| Game Config    | New game                                                                                                     | Start game → Table; Cancel / ← Home → Home                                  |
| Table          | Start game (a new session); Resume session                                                                   | Home control or browser Back → Home; Leave table → Session report (or Home) |
| Session report | Leave table (after at least one completed hand)                                                              | Back to Home → Home                                                         |

Each return to Home moves focus to Home's `TLH Trainer` heading.

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
completed hands the session is deleted and Home opens with no report. In the middle of a hand, the unfinished
hand is dropped as with the Home control (the Leave-now dialog comes with TASK-10.2). An ended session never
shows in Resume. If the session cannot be ended, the error is logged and Home opens with the session still
paused.

**The bust dialog (TASK-3.11).** When a cash hand ends with the user on $0, a modal `Out of chips` dialog
offers `Rebuy` and `Leave table`, and the page behind it (the header's Home and Leave table included) is inert.
Escape is ignored. Leave table in the dialog ends the session exactly like the header's Leave table and opens
its Session report. Browser Back at the dialog pauses to Home, and Resume session reopens the dialog.

**Continue on a bust (TASK-9.2).** When the Hand Review is held on a cash hand that left the user on $0, the
control under the table reads `Continue` instead of `Deal next hand`, also after Close review. Continue clears
the review and opens the `Out of chips` dialog; nothing is dealt until Rebuy. In a sit-and-go the control still
reads `Deal next hand` (`See results` comes with TASK-5.8).

## Browser Back and Forward (TASK-2.14 D-2)

Only opening the Table (Start game or Resume session) adds a history entry, `{ tlhTable: <key> }`, with a key
unique to that opening (`performance.timeOrigin` and a counter; nothing else is stored in history). Home, Game
Config and the Session report add no entries; Back on the Session report leaves the app.

- **Back on the Table** pauses to Home, exactly like the Home control.
- **Forward never reopens the Table.** Use Resume session.
- **Back on Home or Game Config** leaves the app, to whatever page came before it. A session that was started
  stays paused, as when the app is closed.
- Leaving the Table in the app (Home control or Leave table) steps back off its entry, so the entry does not
  linger and a later Back leaves the app.
- A Table entry from an earlier load of the page never matches the current key, so Back onto it from a new
  Table pauses to Home.

Example, starting from the page before the app:

```text
load the app            […, app*]
Start game              […, app, T1*]        push T1
Back                    […, app*, T1]        popstate (state null) on the Table → pause to Home
Forward                 […, app, T1*]        popstate (T1) on Home → ignored, Home stays
Resume session          […, app, T1, T2*]    push T2 (drops nothing here; a push drops forward entries)
Home control            […, app, T1*, T2]    current entry is T2 → history.back(); popstate on Home → ignored
```

## Tests

- `tests/ui/table-home.acceptance.test.tsx`: the header's Home button, rendered only when `App` provides it.
- `e2e/home-control.spec.ts` (every push): the Home control between hands and in the middle of a hand.
- `e2e/history.spec.ts` (every push): Back and Forward on the Table, Back on Home and Game Config, and Back
  after a reload and Resume.
- `e2e/home.spec.ts`: `history.length` is unchanged across New game, then Cancel or ← Home.
- `e2e/session-report.spec.ts` (every push): Leave table opens the Session report, Back to Home, and a 0-hand
  session opens Home.
