# Fix brief — TASK-12.10 (judge round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. SPEC-02 failed
- Expected: With the blocker still open, every store call (the first and every later retry) rejects promptly with UpgradeBlockedError
- Actual: Only the first call (and calls sharing its open) rejects; the next call opens a new request queued behind the still-pending blocked one and hangs until the blocker closes
- Observed via: public API: openHandStore(factory).count() / readSettings() with fake-indexeddb; raw indexedDB.open probe in Chromium and WebKit

## 2. [HIGH] J-1-01
- Problem: Expected (spec section 7, SPEC-02): while another connection keeps blocking the upgrade, every store call rejects with UpgradeBlockedError and nothing hangs, including retries after the first rejection. Actual: the first call rejects, but the next call on the same store (count(), readSettings(), etc.) stays pending indefinitely while the blocker stays open (observed > 10 s), because its new open request waits behind the earlier blocked request, which is still pending. It settles only when the blocker closes. Real Chromium and WebKit queue a second open the same way, so in the app any store call after the first failure (for example opening Statistics or saving a hand) still hangs for as long as the blocking tab stays open.
- Expected fix: While a blocked open request is still pending, new store calls must reject promptly with UpgradeBlockedError instead of starting another open that queues behind it. Once the blocker closes, the next call must succeed, as SPEC-03 already requires. Add a unit test for a second call made while the database is still blocked that expects a prompt UpgradeBlockedError rejection.


## Orchestrator note
Also cover the review r1 MINOR in the same unit test file: a blocked open that later succeeds closes its connection (assert it, e.g. by spying on close or by checking a subsequent versionchange/upgrade at a higher version is not blocked by it).
