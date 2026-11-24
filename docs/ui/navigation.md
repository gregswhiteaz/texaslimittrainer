# Navigation: screens, the Home control and browser Back/Forward

The app has three screens, held in `App`'s state (`src/ui/App.tsx`). There are no URL routes, hash fragments
or deep links: the URL stays `/` on every screen.

| Screen      | Opened by                                                                         | Leaves to                                        |
| ----------- | --------------------------------------------------------------------------------- | ------------------------------------------------ |
| Home        | app start; Cancel / ← Home; the Table's Home control, Leave table or browser Back | New game → Game Config; Resume session → Table   |
| Game Config | New game                                                                          | Start game → Table; Cancel / ← Home → Home       |
| Table       | Start game (a new session); Resume session                                        | Home control, Leave table or browser Back → Home |

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

Leave table does the same for now; ending a session (the Leave-now dialog and the Session Report) comes with
E10 (TASK-10.1).

## Browser Back and Forward (TASK-2.14 D-2)

Only opening the Table (Start game or Resume session) adds a history entry, `{ tlhTable: <key> }`, with a key
unique to that opening (`performance.timeOrigin` and a counter; nothing else is stored in history). Home and
Game Config add no entries.

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
