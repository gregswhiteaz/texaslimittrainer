import { describe, expect, it } from 'vitest';
import { recommend } from '../../src/advice/recommend';
import {
  drawMixed,
  findDeviation,
  parseStyle,
  startingRangeFor,
  StyleValidationError,
  type MixedSpot,
} from '../../src/bots/style';
import { APPLICABLE_SPOTS } from '../../src/advice/preflop-chart';
import { CALLING_STATION_STYLE } from '../../src/bots/calling-station';
import { MANIAC_STYLE } from '../../src/bots/maniac';
import { ROCK_STYLE } from '../../src/bots/rock';
import { TAG_STYLE, decideTag } from '../../src/bots/tag';
import type { PlayerView } from '../../src/engine/player-view';
import { seededTagPolicy } from '../../src/playtest/policy';
import { runPlaytest } from '../../src/playtest/runner';
import tagJson from '../../src/bots/styles/tag.json' with { type: 'json' };
import callingStationJson from '../../src/bots/styles/calling-station.json' with { type: 'json' };

const JUSTIFICATION = 'One two three four five six seven eight nine ten words of reasoning.';
const DESCRIPTION =
  'A test style with a description long enough to pass the fifteen word rule for every style file here.';

function entry(spot: unknown, actions: unknown = { recommended: 0.75, alternative: 0.25 }) {
  return { spot, actions, justification: JUSTIFICATION };
}

function file(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    format: 'tlh-bot-style',
    version: 1,
    style: 'TAG',
    description: DESCRIPTION,
    mixedSpots: [entry('preflop-raise')],
    ...overrides,
  };
}

function problemsOf(raw: unknown): readonly string[] {
  try {
    parseStyle(raw, 'x.json');
  } catch (error) {
    expect(error).toBeInstanceOf(StyleValidationError);
    const failure = error as StyleValidationError;
    expect(failure.name).toBe('StyleValidationError');
    expect(failure.message).toBe('Invalid style file x.json:\n- ' + failure.problems.join('\n- '));
    return failure.problems;
  }
  throw new Error('expected a StyleValidationError');
}

const SPOT = 'x.json: style TAG spot type preflop-raise';

/** A stub generator returning `values` in turn and counting calls. */
function stub(...values: number[]) {
  const generator = {
    calls: 0,
    nextUint32: () => values[generator.calls++] ?? 0,
  };
  return generator;
}

/** The first view in the seed-42 6-max playtest matching `predicate`. */
function findView(predicate: (view: PlayerView) => boolean): PlayerView {
  let found: PlayerView | undefined;
  runPlaytest({ hands: 20, seed: 42, size: 6 }, undefined, {
    makePolicy: (code) => {
      const policy = seededTagPolicy(code);
      return (view) => {
        if (found === undefined && predicate(view)) found = view;
        return policy(view);
      };
    },
  });
  if (found === undefined) throw new Error('no matching view');
  return found;
}

describe('bot style files', () => {
  it('parseStyle lists every problem', () => {
    expect(parseStyle(file(), 'x.json').mixedSpots.get('preflop-raise')).toEqual({
      recommended: 0.75,
      alternative: 0.25,
      justification: JUSTIFICATION,
    });
    expect(parseStyle(file({ mixedSpots: [] }), 'x.json').mixedSpots.size).toBe(0);
    // Float sums within 1e-9 of 1 are tolerated.
    expect(() =>
      parseStyle(
        file({
          mixedSpots: [entry('preflop-raise', { recommended: 0.7, alternative: 0.1 + 0.2 })],
        }),
        'x.json',
      ),
    ).not.toThrow();

    const format = ['x.json: expected format "tlh-bot-style" version 1'];
    expect(problemsOf(null)).toEqual(format);
    expect(problemsOf([])).toEqual(format);
    expect(problemsOf(file({ format: 'tlh-preflop-chart' }))).toEqual(format);
    expect(problemsOf(file({ version: 2 }))).toEqual(format);

    expect(problemsOf(file({ style: 'Shark' }))).toEqual(['x.json: unknown style "Shark"']);
    expect(problemsOf(file({ description: 'Too short.' }))).toEqual([
      'x.json: style has no plain-English description (at least 15 words)',
    ]);
    expect(problemsOf(file({ mixedSpots: {} }))).toEqual(['x.json: mixedSpots must be a list']);
    expect(problemsOf(file({ mixedSpots: [entry('postflop-river')] }))).toEqual([
      'x.json: style TAG has unknown spot type "postflop-river"',
    ]);
    expect(
      problemsOf(file({ mixedSpots: [entry('preflop-raise'), entry('preflop-raise')] })),
    ).toEqual(['x.json: style TAG lists spot type preflop-raise twice']);
    expect(
      problemsOf(
        file({
          mixedSpots: [
            entry('preflop-raise', { recommended: 0.5, alternative: 0.25, bluff: 0.25 }),
          ],
        }),
      ),
    ).toEqual([`${SPOT} has unknown action "bluff"`]);
    for (const bad of [-0.1, 1.5, '0.5', NaN]) {
      expect(
        problemsOf(
          file({ mixedSpots: [entry('preflop-raise', { recommended: 0.5, alternative: bad })] }),
        ),
        String(bad),
      ).toEqual([`${SPOT} has an invalid probability for alternative`]);
    }
    expect(
      problemsOf(file({ mixedSpots: [entry('preflop-raise', { recommended: 0.5 })] })),
    ).toEqual([`${SPOT} has an invalid probability for alternative`]);
    expect(
      problemsOf(
        file({ mixedSpots: [entry('preflop-raise', { recommended: 0.6, alternative: 0.3 })] }),
      ),
    ).toEqual([`${SPOT} probabilities sum to 0.8999999999999999, not 1`]);
    expect(
      problemsOf(
        file({ mixedSpots: [entry('preflop-raise', { recommended: 0, alternative: 0 })] }),
      ),
    ).toEqual([
      `${SPOT} probabilities sum to 0, not 1`,
      'x.json: style TAG marks spot type preflop-raise as mixed with fewer than two actions of non-zero probability',
    ]);
    expect(
      problemsOf(
        file({
          mixedSpots: [
            { spot: 'preflop-raise', actions: { recommended: 0.75, alternative: 0.25 } },
          ],
        }),
      ),
    ).toEqual([`${SPOT} has no justification (at least 10 words)`]);

    // Several problems are all listed, and untrusted text is cut to 20 characters.
    const long = 'x'.repeat(50);
    expect(
      problemsOf(
        file({
          style: long,
          description: undefined,
          mixedSpots: [entry(long), entry('preflop-limpers', { recommended: 1, alternative: 0 })],
        }),
      ),
    ).toEqual([
      `x.json: unknown style "${'x'.repeat(20)}..."`,
      'x.json: style has no plain-English description (at least 15 words)',
      `x.json: style ? has unknown spot type "${'x'.repeat(20)}..."`,
      'x.json: style ? marks spot type preflop-limpers as mixed with fewer than two actions of non-zero probability',
    ]);
  });

  it('parseStyle validates deviations', () => {
    const dev = (street: unknown, advice: unknown, probability: unknown = 0.5, extra = {}) => ({
      street,
      advice,
      instead: 'call',
      probability,
      justification: JUSTIFICATION,
      ...extra,
    });
    const station = (deviations: unknown) =>
      file({ style: 'Calling station', mixedSpots: [], deviations });
    const WHERE = 'x.json: style Calling station';

    expect(parseStyle(file(), 'x.json').deviations).toEqual([]);
    const valid = parseStyle(
      station([dev('preflop', 'fold', 0), dev('preflop', 'raise', 1), dev('postflop', 'fold')]),
      'x.json',
    );
    expect(valid.deviations).toEqual([
      {
        street: 'preflop',
        advice: 'fold',
        instead: 'call',
        probability: 0,
        justification: JUSTIFICATION,
      },
      {
        street: 'preflop',
        advice: 'raise',
        instead: 'call',
        probability: 1,
        justification: JUSTIFICATION,
      },
      {
        street: 'postflop',
        advice: 'fold',
        instead: 'call',
        probability: 0.5,
        justification: JUSTIFICATION,
      },
    ]);
    expect(findDeviation(valid, 'preflop', 'raise')).toBe(valid.deviations[1]);
    expect(findDeviation(valid, 'postflop', 'fold')).toBe(valid.deviations[2]);
    expect(findDeviation(valid, 'postflop', 'raise')).toBeUndefined();
    expect(findDeviation(valid, 'preflop', 'call')).toBeUndefined();

    expect(problemsOf(station({}))).toEqual(['x.json: deviations must be a list']);
    expect(problemsOf(station([dev('river', 'fold')]))).toEqual([
      `${WHERE} has unsupported deviation "river" "fold" to "call"`,
    ]);
    expect(problemsOf(station([dev('preflop', 'check')]))).toEqual([
      `${WHERE} has unsupported deviation "preflop" "check" to "call"`,
    ]);
    expect(problemsOf(station([dev('preflop', 'fold', 0.5, { instead: 'bet' })]))).toEqual([
      `${WHERE} has unsupported deviation "preflop" "fold" to "bet"`,
    ]);
    expect(problemsOf(station([dev('postflop', 'raise')]))).toEqual([
      `${WHERE} has unsupported deviation "postflop" "raise" to "call"`,
    ]);
    expect(problemsOf(station([dev('preflop', 'fold'), dev('preflop', 'fold')]))).toEqual([
      `${WHERE} lists deviation preflop fold twice`,
    ]);
    const missing: Record<string, unknown> = dev('preflop', 'fold');
    delete missing.probability;
    const bads: Record<string, unknown>[] = [-0.1, 1.5, '0.5', NaN].map((p) =>
      dev('preflop', 'fold', p),
    );
    for (const entry of [...bads, missing]) {
      expect(problemsOf(station([entry])), String(entry.probability)).toEqual([
        `${WHERE} deviation preflop fold has an invalid probability`,
      ]);
    }
    expect(
      problemsOf(station([dev('postflop', 'fold', 0.5, { justification: 'Too few words' })])),
    ).toEqual([`${WHERE} deviation postflop fold has no justification (at least 10 words)`]);

    // The Maniac's aggressive triples (D-1) parse and keep their `instead`.
    const maniacFile = (deviations: unknown) =>
      file({ style: 'Maniac', mixedSpots: [], deviations });
    const aggressive = [
      ['preflop', 'fold', 'raise'],
      ['preflop', 'check', 'raise'],
      ['preflop', 'call', 'raise'],
      ['postflop', 'check', 'bet'],
      ['postflop', 'call', 'raise'],
    ] as const;
    expect(
      parseStyle(
        maniacFile(aggressive.map(([s, a, instead]) => dev(s, a, 0.5, { instead }))),
        'x.json',
      ).deviations,
    ).toEqual(
      aggressive.map(([street, advice, instead]) => ({
        street,
        advice,
        instead,
        probability: 0.5,
        justification: JUSTIFICATION,
      })),
    );
    for (const [street, advice, instead] of [
      ['preflop', 'fold', 'bet'],
      ['postflop', 'fold', 'raise'],
      ['postflop', 'check', 'raise'],
      ['preflop', 'check', 'bet'],
      ['postflop', 'raise', 'call'],
      ['preflop', 'call', 'call'],
    ]) {
      expect(problemsOf(maniacFile([dev(street, advice, 0.5, { instead })]))).toEqual([
        `x.json: style Maniac has unsupported deviation "${street}" "${advice}" to "${instead}"`,
      ]);
    }
    expect(
      problemsOf(
        maniacFile([
          dev('postflop', 'call', 0.5, { instead: 'raise' }),
          dev('postflop', 'call', 0.2, { instead: 'raise' }),
        ]),
      ),
    ).toEqual(['x.json: style Maniac lists deviation postflop call twice']);
    // postflop/call has one supported `instead`, so a different one is shown with preflop/fold.
    expect(
      problemsOf(
        maniacFile([
          dev('preflop', 'fold', 0.5, { instead: 'raise' }),
          dev('preflop', 'fold', 0.5, { instead: 'call' }),
        ]),
      ),
    ).toEqual(['x.json: style Maniac lists deviation preflop fold twice']);
    expect(parseStyle(tagJson, 'tag.json')).toEqual(TAG_STYLE);
    expect(parseStyle(callingStationJson, 'calling-station.json')).toEqual(CALLING_STATION_STYLE);
    expect(findDeviation(MANIAC_STYLE, 'postflop', 'check')).toMatchObject({
      street: 'postflop',
      advice: 'check',
      instead: 'bet',
    });
    expect(findDeviation(MANIAC_STYLE, 'postflop', 'fold')).toBeUndefined();

    // Several problems are all listed, and untrusted text is cut to 20 characters.
    const long = 'y'.repeat(30);
    expect(
      problemsOf(
        file({
          style: 'Shark',
          deviations: [dev(long, 'fold'), dev('preflop', 'raise', 2, { justification: '' }), 7],
        }),
      ),
    ).toEqual([
      'x.json: unknown style "Shark"',
      `x.json: style ? has unsupported deviation "${'y'.repeat(20)}..." "fold" to "call"`,
      'x.json: style ? deviation preflop raise has an invalid probability',
      'x.json: style ? deviation preflop raise has no justification (at least 10 words)',
      'x.json: style ? has unsupported deviation "undefined" "undefined" to "undefined"',
    ]);
  });

  it('parseStyle validates starting ranges', () => {
    const spots = APPLICABLE_SPOTS['6-max'];
    const rangeEntry = (position: string, situation: string, overrides = {}) => ({
      position,
      situation,
      hands: position === 'BB' && situation === 'limpers' ? 'AA KK' : 'AA',
      justification: JUSTIFICATION,
      ...overrides,
    });
    const range = (
      change: (entry: Record<string, unknown>) => Record<string, unknown> = (e) => e,
    ) => spots.map((s) => change(rangeEntry(s.position, s.situation)));
    const isSpot = (e: Record<string, unknown>, position: string, situation: string) =>
      e.position === position && e.situation === situation;
    const UTG = 'x.json: style TAG starting range UTG unopened';

    const parsed = parseStyle(file({ startingRange: range().reverse() }), 'x.json');
    expect(parsed.startingRange?.map((s) => `${s.position} ${s.situation}`)).toEqual(
      spots.map((s) => `${s.position} ${s.situation}`),
    );
    expect(parsed.startingRange?.map((s) => [...s.hands])).toEqual(
      spots.map((s) => (s.position === 'BB' && s.situation === 'limpers' ? ['AA', 'KK'] : ['AA'])),
    );
    expect(parsed.startingRange?.[0]?.justification).toBe(JUSTIFICATION);

    expect(problemsOf(file({ startingRange: {} }))).toEqual([
      'x.json: startingRange must be a list',
    ]);
    expect(
      problemsOf(
        file({
          startingRange: range((e) =>
            isSpot(e, 'UTG', 'unopened') ? { ...e, situation: 'blind-defence' } : e,
          ),
        }),
      ),
    ).toEqual([
      'x.json: style TAG starting range has unknown spot "UTG" "blind-defence"',
      'x.json: style TAG starting range is missing spot UTG unopened',
    ]);
    expect(
      problemsOf(file({ startingRange: [...range(), rangeEntry('HJ', 'raise', { hands: 'KK' })] })),
    ).toEqual(['x.json: style TAG lists starting range spot HJ raise twice']);
    const atUtg = (overrides: Record<string, unknown>) =>
      problemsOf(
        file({
          startingRange: range((e) => (isSpot(e, 'UTG', 'unopened') ? { ...e, ...overrides } : e)),
        }),
      );
    expect(atUtg({ hands: 5 })).toEqual([`${UTG} hands must be a string of hand classes`]);
    expect(atUtg({ hands: 'AA AKx' })).toEqual([`${UTG} has unknown hand class "AKx"`]);
    expect(atUtg({ hands: 'AA AA' })).toEqual([`${UTG} lists AA twice`]);
    expect(atUtg({ justification: 'One two three four five six seven eight nine.' })).toEqual([
      `${UTG} has no justification (at least 10 words)`,
    ]);
    const empty = parseStyle(
      file({
        startingRange: range((e) => (isSpot(e, 'UTG', 'unopened') ? { ...e, hands: '' } : e)),
      }),
      'x.json',
    );
    expect(startingRangeFor(empty, 'UTG', 'unopened')?.hands.size).toBe(0);

    // Several problems are all listed, and untrusted text is cut to 20 characters.
    const long = 'p'.repeat(30);
    expect(
      problemsOf(
        file({
          startingRange: [
            ...range((e) =>
              isSpot(e, 'UTG', 'unopened')
                ? { ...e, hands: `AA ${'K'.repeat(30)} AA`, justification: '' }
                : e,
            ),
            rangeEntry(long, 'unopened'),
            7,
          ],
        }),
      ),
    ).toEqual([
      `${UTG} has unknown hand class "${'K'.repeat(20)}..."`,
      `${UTG} lists AA twice`,
      `${UTG} has no justification (at least 10 words)`,
      `x.json: style TAG starting range has unknown spot "${'p'.repeat(20)}..." "unopened"`,
      'x.json: style TAG starting range has unknown spot "undefined" "undefined"',
    ]);

    expect(parseStyle(tagJson, 'tag.json').startingRange).toBeNull();
    expect(parseStyle(callingStationJson, 'calling-station.json').startingRange).toBeNull();
    expect(MANIAC_STYLE.startingRange).toBeNull();
    expect(TAG_STYLE.startingRange).toBeNull();
    expect(startingRangeFor(ROCK_STYLE, 'BB', 'limpers')?.hands.has('AA')).toBe(true);
    expect(startingRangeFor(TAG_STYLE, 'UTG', 'unopened')).toBeUndefined();
  });

  it('drawMixed thresholds and when TAG draws', () => {
    const spot: MixedSpot = { recommended: 0.75, alternative: 0.25, justification: JUSTIFICATION };
    const cases: [number, 'recommended' | 'alternative'][] = [
      [0, 'alternative'],
      [1073741823, 'alternative'],
      [1073741824, 'recommended'],
      [4294967295, 'recommended'],
    ];
    for (const [u, expected] of cases) {
      const random = stub(u, 0);
      expect(drawMixed(spot, random), String(u)).toBe(expected);
      expect(random.calls).toBe(1);
    }

    // Hand 4, seat 3 (CO, A6o unopened): fold with an acceptable raise. No generator, no mixing.
    const mixed = findView((v) => {
      const r = recommend(v);
      return r.basis === 'chart' && r.situation === 'unopened' && r.alternative !== null;
    });
    expect(mixed.seat).toBe(3);
    const advice = recommend(mixed);
    expect(advice).toMatchObject({ situation: 'unopened', action: 'fold', alternative: 'raise' });
    expect(decideTag(mixed)).toEqual({ seat: 3, type: 'fold' });
    expect(decideTag(mixed, { random: stub(1073741824) })).toEqual({ seat: 3, type: 'fold' });
    expect(decideTag(mixed, { random: stub(0) })).toEqual(
      mixed.legalActions.find((a) => a.type === 'raise'),
    );

    const postflop = findView((v) => v.street !== 'preflop');
    const noAlternative = findView((v) => {
      const r = recommend(v);
      return r.basis === 'chart' && r.alternative === null;
    });
    for (const view of [postflop, noAlternative]) {
      const random = stub(0);
      expect(decideTag(view, { random })).toEqual(recommend(view).move);
      expect(random.calls).toBe(0);
    }
  });
});
