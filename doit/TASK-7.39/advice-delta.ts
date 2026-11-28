// TASK-7.39 SPEC-07 / A-6: the user's postflop advice, base tree vs branch tree, on calling-station playtest views.
// Usage: node --import ./tools/playtest/resolve-ts.js doit/TASK-7.39/advice-delta.ts <baseRoot> <branchRoot>
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const [baseRoot, branchRoot] = process.argv.slice(2);
if (baseRoot === undefined || branchRoot === undefined) {
  throw new Error('usage: advice-delta.ts <baseRoot> <branchRoot>');
}
const load = (root: string, file: string) => import(pathToFileURL(resolve(root, file)).href);

const base = await load(baseRoot, 'src/advice/postflop.ts');
const branch = await load(branchRoot, 'src/advice/postflop.ts');
const { ACTION_RANGE_ADVICE } = await load(branchRoot, 'src/advice/recommend.ts');
const { runPlaytest } = await load(branchRoot, 'src/playtest/runner.ts');
const { decideCallingStation } = await load(branchRoot, 'src/bots/calling-station.ts');
const { botDecisionSeed, botRandom } = await load(branchRoot, 'src/engine/bot-random.ts');
const { formatCard } = await load(branchRoot, 'src/engine/cards.ts');

const SEED = 7390;
const HANDS = 3000;
const PER_BUCKET = 300;
const THRESHOLD = 7;

type View = {
  seat: number;
  street: string;
  toAct: number;
  holeCards: number[];
  board: number[];
  players: { seat: number; folded: boolean }[];
};
type Advice = {
  action: string;
  ruleId: string;
  equityPct: number;
  equityVsCallingRangePct: number;
  explanation: string;
};

const cards = (list: number[]) => list.map((c) => formatCard(c)).join('');
const liveOpponents = (v: View) => v.players.filter((p) => p.seat !== v.seat && !p.folded).length;
const fellBack = (a: Advice) => a.equityVsCallingRangePct === a.equityPct;

for (const size of [9, 10]) {
  const buckets: Record<string, View[]> = { '< 7': [], '>= 7': [] };
  runPlaytest({ hands: HANDS, seed: SEED, size }, undefined, {
    makePolicy: (code: string) => (view: View) => {
      if (view.street !== 'preflop' && view.toAct === view.seat) {
        const bucket = buckets[liveOpponents(view) >= THRESHOLD ? '>= 7' : '< 7'] as View[];
        if (bucket.length < PER_BUCKET) bucket.push(view);
      }
      return decideCallingStation(view, { random: botRandom(botDecisionSeed(code, view)) });
    },
  });
  for (const [name, views] of Object.entries(buckets)) {
    const n = { differing: 0, action: 0, ruleId: 0, fallback: 0, explanation: 0 };
    let maxDelta = 0;
    let sumDelta = 0;
    const listed: string[] = [];
    for (const view of views) {
      const before: Advice = base.recommendPostflop(view, ACTION_RANGE_ADVICE);
      const after: Advice = branch.recommendPostflop(view, ACTION_RANGE_ADVICE);
      const delta = Math.abs(after.equityVsCallingRangePct - before.equityVsCallingRangePct);
      maxDelta = Math.max(maxDelta, delta);
      sumDelta += delta;
      if (isDeepStrictEqual(before, after)) continue;
      n.differing++;
      if (before.action !== after.action) n.action++;
      if (before.ruleId !== after.ruleId) n.ruleId++;
      if (fellBack(before) !== fellBack(after)) n.fallback++;
      if (before.explanation !== after.explanation) n.explanation++;
      if (name === '>= 7' && listed.length < 20) {
        listed.push(
          `| ${size} | ${cards(view.holeCards)} | ${cards(view.board)} | ${liveOpponents(view)} | ` +
            `${before.equityPct} / ${before.equityVsCallingRangePct} -> ${after.equityPct} / ${after.equityVsCallingRangePct} | ` +
            `${before.action} -> ${after.action} |`,
        );
      }
    }
    const mean = views.length === 0 ? 0 : sumDelta / views.length;
    console.log(
      `| ${size} | ${name} | ${views.length} | ${n.differing} | ${maxDelta.toFixed(1)} | ${mean.toFixed(3)} | ` +
        `${n.action} / ${n.ruleId} | ${n.fallback} | ${n.explanation} |`,
    );
    if (listed.length > 0) {
      console.log('\n| size | hero | board | opponents | equity / calling, before -> after | action |');
      console.log('|---|---|---|---|---|---|');
      for (const line of listed) console.log(line);
      console.log('');
    }
  }
}
