# TASK-12.11 Q&A (autopilot)

## Q-1 What Settings shows when a change cannot be saved
Options: Recommended — control reverts to the stored value; message exactly "Your change could not be saved, so the setting is unchanged." as <p role="alert" class="settings-error"> after the Settings header, not focusable; clears on the next change and on reopening Settings; console.error kept. Alternatives: (a) keep the new value + "Your change could not be saved. It will be lost when you close the app."; (b) message under the control with role="status"; (c) add "Try again.".
**Answer: auto-accepted (recommended).** User-visible wording listed for the user's review.
