
## Recorded deviation (orchestrator, after review r1 — CI run 45803095640)
Spec D-1/A-1 say: replace when *any* Table entry is current. CI showed that while closeTable's history.back() is pending, this load's own entry is still current; replacing it let the pending Back pop the new Table entry (WebKit players-choice timeout). Approved change: replace only when the current entry is an earlier page load's (key ≠ lastTableKey); otherwise push as before. The AC ("the extra entry is replaced so no stale Table entry remains", one Back leaves the app) is unchanged. Judge on substance.
