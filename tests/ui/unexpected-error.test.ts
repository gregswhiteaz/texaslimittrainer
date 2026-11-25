import { describe, expect, it } from 'vitest';
import {
  unexpectedFromErrorEvent,
  unexpectedFromRejection,
} from '../../src/ui/error/unexpected-error';

describe('unexpected window events (TASK-13.1 A-1)', () => {
  it('error events without an error object are ignored and every rejection counts', () => {
    const error = new Error('boom');
    expect(unexpectedFromErrorEvent({ error })).toBe(error);
    expect(unexpectedFromErrorEvent({ error: 'x' })).toBe('x');
    expect(unexpectedFromErrorEvent({ error: null })).toBeNull();
    expect(unexpectedFromErrorEvent({})).toBeNull();

    expect(unexpectedFromRejection({ reason: error })).toBe(error);
    expect(unexpectedFromRejection({ reason: 'x' })).toBe('x');
    expect(unexpectedFromRejection({ reason: undefined })).toBeUndefined();
  });
});
