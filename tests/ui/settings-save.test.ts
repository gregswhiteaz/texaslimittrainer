import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, type Settings } from '../../src/table/settings';
import { createSettingsSaver } from '../../src/ui/settings/settings-save';

// TASK-12.11 (SPEC-04, SPEC-05): the settings save tracker.

const A: Settings = DEFAULT_SETTINGS;
const B: Settings = { ...DEFAULT_SETTINGS, showOpponentStyles: false };
const C: Settings = { ...DEFAULT_SETTINGS, fourColourDeck: true };
const S: Settings = { ...DEFAULT_SETTINGS, botBanter: false };

interface PendingWrite {
  readonly settings: Settings;
  readonly resolve: () => void;
  readonly reject: (error: unknown) => void;
}

/** A write function whose calls settle only when the test says so. */
function fakeWrites(): { write: (settings: Settings) => Promise<void>; pending: PendingWrite[] } {
  const pending: PendingWrite[] = [];
  const write = (settings: Settings): Promise<void> =>
    new Promise<void>((resolve, reject) => pending.push({ settings, resolve, reject }));
  return { write, pending };
}

const failing = (): Promise<void> => Promise.reject(new Error('write failed'));
const working = (): Promise<void> => Promise.resolve();

describe('createSettingsSaver', () => {
  it('a failed latest save reverts to the last saved value', async () => {
    const error = new Error('write failed');
    const first = createSettingsSaver(() => Promise.reject(error), A);
    expect(await first.save(B)).toEqual({ kind: 'failed', revertTo: A, error });

    let fail = false;
    const second = createSettingsSaver(() => (fail ? failing() : working()), A);
    expect(await second.save(B)).toEqual({ kind: 'saved' });
    fail = true;
    expect(await second.save(C)).toMatchObject({ kind: 'failed', revertTo: B });

    const third = createSettingsSaver(failing, A);
    third.setSaved(S);
    expect(await third.save(B)).toMatchObject({ kind: 'failed', revertTo: S });
  });

  it('only the latest save decides the outcome', async () => {
    const { write, pending } = fakeWrites();
    const saver = createSettingsSaver(write, A);
    const b = saver.save(B);
    const c = saver.save(C);
    expect(pending.map((p) => p.settings)).toEqual([B, C]);
    const error = new Error('b failed');
    pending[0]?.reject(error);
    expect(await b).toEqual({ kind: 'superseded', error });
    pending[1]?.resolve();
    expect(await c).toEqual({ kind: 'saved' });

    const raced = fakeWrites();
    const other = createSettingsSaver(raced.write, A);
    const b2 = other.save(B);
    const c2 = other.save(C);
    raced.pending[0]?.resolve();
    expect(await b2).toEqual({ kind: 'superseded' });
    raced.pending[1]?.reject(new Error('c failed'));
    expect(await c2).toMatchObject({ kind: 'failed', revertTo: B });
  });

  it('a later save after a settled one is the latest again', async () => {
    const saver = createSettingsSaver(failing, A);
    expect((await saver.save(B)).kind).toBe('failed');
    expect(await saver.save(C)).toMatchObject({ kind: 'failed', revertTo: A });
  });
});
