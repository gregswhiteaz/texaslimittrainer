// TASK-13.1 A-1: which window events show the error screen.

/** A window `error` event's error, or null when it carries none (cross-origin "Script error.", benign
 *  browser notices such as Chrome's ResizeObserver loop). */
export function unexpectedFromErrorEvent(event: { readonly error?: unknown }): unknown {
  return event.error ?? null;
}

/** An unhandled rejection always counts: the app handles every promise it means to. */
export function unexpectedFromRejection(event: { readonly reason?: unknown }): unknown {
  return event.reason;
}
