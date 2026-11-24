import { describe, expect, it } from 'vitest';
import { parseHealthyRanges, rangeLabel, statTenths } from '../../src/stats/healthy-ranges';
import data from '../../src/stats/healthy-ranges.json' with { type: 'json' };

type Json = Record<string, unknown>;

/** A deep copy of the shipped file with `edit` applied. */
function altered(edit: (file: Json) => void): Json {
  const file = structuredClone(data) as unknown as Json;
  edit(file);
  return file;
}
const sixMax = (file: Json): Json => (file.ranges as Json)['6-max'] as Json;
const vpip = (file: Json): Json => sixMax(file).vpip as Json;

describe('healthy ranges', () => {
  it('parseHealthyRanges rejects each invalid file with its path', () => {
    const cases: [string, (file: Json) => void][] = [
      ['format', (f) => (f.format = 'tlh-bot-style')],
      ['version', (f) => (f.version = 2)],
      ['file.extra', (f) => (f.extra = 1)],
      ['ranges', (f) => (f.ranges = null)],
      ['ranges.6-max', (f) => delete (f.ranges as Json)['6-max']],
      ['ranges.4-max', (f) => ((f.ranges as Json)['4-max'] = {})],
      ['ranges.6-max.vpip3', (f) => (sixMax(f).vpip3 = sixMax(f).vpip)],
      ['ranges.6-max.wsd', (f) => delete sixMax(f).wsd],
      ['ranges.6-max.vpip.high', (f) => Object.assign(vpip(f), { low: 28, high: 28 })],
      ['ranges.6-max.vpip.high', (f) => Object.assign(vpip(f), { low: 28, high: 20 })],
      ['ranges.6-max.vpip.low', (f) => (vpip(f).low = 20.5)],
      ['ranges.6-max.vpip.low', (f) => (vpip(f).low = -1)],
      ['ranges.6-max.vpip.low', (f) => (vpip(f).low = '20')],
      ['ranges.6-max.vpip.high', (f) => (vpip(f).high = 101)],
      ['ranges.6-max.vpip.justification', (f) => (vpip(f).justification = '')],
      ['ranges.6-max.vpip.justification', (f) => (vpip(f).justification = 'One. Two.')],
      ['ranges.6-max.vpip.justification', (f) => (vpip(f).justification = 'No full stop')],
      ['ranges.6-max.vpip.justification', (f) => (vpip(f).justification = ' Padded.')],
      ['ranges.6-max.vpip.justification', (f) => (vpip(f).justification = 'Really? Yes.')],
      ['ranges.6-max.vpip.justification', (f) => (vpip(f).justification = 3)],
      ['ranges.6-max.vpip.note', (f) => (vpip(f).note = 'x')],
    ];
    for (const [path, edit] of cases) {
      expect(() => parseHealthyRanges(altered(edit)), path).toThrow(
        new RangeError(`Invalid healthy ranges: ${path}`),
      );
    }
    expect(() => parseHealthyRanges(null)).toThrow(new RangeError('Invalid healthy ranges: file'));
    expect(() => parseHealthyRanges(altered((f) => (f.ranges = [])))).toThrow(
      new RangeError('Invalid healthy ranges: ranges'),
    );
    expect(() => parseHealthyRanges(altered(() => undefined))).not.toThrow();
  });

  it('statTenths rounds half up to tenths and returns null for a zero denominator', () => {
    expect(statTenths(1, 3)).toBe(333);
    expect(statTenths(2, 3)).toBe(667);
    expect(statTenths(1, 8)).toBe(125);
    expect(statTenths(1, 16)).toBe(63);
    expect(statTenths(281, 1000)).toBe(281);
    expect(statTenths(0, 5)).toBe(0);
    expect(statTenths(5, 5)).toBe(1000);
    expect(statTenths(3, 0)).toBeNull();
  });

  it('rangeLabel compares tenths with inclusive limits', () => {
    const range = { low: 20, high: 28, justification: 'Fixture.' };
    expect(rangeLabel(null, range)).toBe('not enough data');
    expect(rangeLabel(200, range)).toBe('in range');
    expect(rangeLabel(280, range)).toBe('in range');
    expect(rangeLabel(281, range)).toBe('too high');
    expect(rangeLabel(199, range)).toBe('too low');
  });
});
