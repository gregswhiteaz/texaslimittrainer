import {
  ADVICE_ING,
  CHART_BASIS,
  CHART_NAMES,
  CHART_POSITIONS,
  CONCEPTS,
  OBSERVED_MIN_HANDS,
  OPPONENT_TYPE_LEAD,
  POSTFLOP_TEMPLATES,
  POT_ODDS_LEAD,
  POT_ODDS_RIVER_BET_LEAD,
  PREFLOP_CONTEXT,
  PREFLOP_SENTENCES,
  RANK_NAMES,
  SEAT_NAMES,
  SITUATION_LABELS,
  type PreflopSentenceKey,
} from './explanations';
import type { HandClass } from './hand-class';
import type { PostflopRecommendation } from './postflop';
import type { PreflopRecommendation } from './preflop';
import type { Position, Situation } from './preflop-chart';

export { basisText } from './explanations';

/** `${pct.toFixed(1)}%`. */
export function formatPct(pct: number): string {
  return `${pct.toFixed(1)}%`;
}

/** Replaces {key} from `values` and {def:<ConceptId>} with that concept's definition.
 *  Throws Error(`Unknown template placeholder {<name>}`) for any other placeholder. */
export function fillTemplate(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(/\{([^{}]+)\}/g, (_, name: string) => {
    const value = name.startsWith('def:')
      ? CONCEPTS.find((c) => c.id === name.slice(4))?.definition
      : Object.hasOwn(values, name)
        ? values[name]
        : undefined;
    if (value === undefined) throw new Error(`Unknown template placeholder {${name}}`);
    return value;
  });
}

function rankName(rank: string) {
  return RANK_NAMES[rank] as { readonly one: string; readonly many: string };
}

/** A pair → a pair of aces; suited → ace-king suited; offsuit → seven-two offsuit. */
export function handClassName(hc: HandClass): string {
  const high = rankName(hc.charAt(0));
  if (hc.length === 2) return `a pair of ${high.many}`;
  const low = rankName(hc.charAt(1));
  return `${high.one}-${low.one} ${hc.endsWith('s') ? 'suited' : 'offsuit'}`;
}

export function explainPreflop(rec: Omit<PreflopRecommendation, 'explanation'>): string {
  const sentences = [
    fillTemplate(PREFLOP_CONTEXT[rec.situation], { seat: SEAT_NAMES[rec.position] }),
  ];
  const key: PreflopSentenceKey =
    rec.cell.action === 'raise' && rec.action === 'call' ? 'call-capped' : rec.action;
  sentences.push(fillTemplate(PREFLOP_SENTENCES[key], { hand: handClassName(rec.handClass) }));
  if (rec.alternative !== null) {
    sentences.push(
      fillTemplate(PREFLOP_SENTENCES.alternative, {
        alternativeIng: ADVICE_ING[rec.alternative],
      }),
    );
  } else if (rec.borderline) {
    sentences.push(PREFLOP_SENTENCES.borderline);
  }
  return sentences.join(' ');
}

/** Plain-English position label, e.g. 'the cutoff'. */
export function positionLabel(position: Position): string {
  return CHART_POSITIONS[position];
}

/** Plain-English situation label, e.g. 'facing a raise and calls'. */
export function situationLabel(situation: Situation): string {
  return SITUATION_LABELS[situation];
}

/** The preflop hint's chart basis, e.g. 'From the 6-max chart: raise A9o from the cutoff'. */
export function chartBasisText(
  rec: Pick<PreflopRecommendation, 'referenceSize' | 'action' | 'handClass' | 'position'>,
): string {
  return fillTemplate(CHART_BASIS, {
    chart: CHART_NAMES[rec.referenceSize],
    action: rec.action,
    hand: rec.handClass,
    position: positionLabel(rec.position),
  });
}

/** `valueThresholdPct` is the threshold that applied (50 or 65). */
export function explainPostflop(
  rec: Omit<PostflopRecommendation, 'explanation'>,
  valueThresholdPct: number,
): string {
  const raise = rec.action === 'raise';
  const values: Record<string, string> = {
    equity: formatPct(rec.equityPct),
    required: formatPct(rec.requiredEquityPct),
    callingEquity: formatPct(rec.equityVsCallingRangePct),
    threshold: formatPct(valueThresholdPct),
    outs: String(rec.outs.length),
    aggressive: raise ? 'raise' : 'bet',
    aggressiveIng: raise ? 'raising' : 'betting',
  };
  if (rec.impliedRequiredEquityPct !== null) {
    values.impliedRequired = formatPct(rec.impliedRequiredEquityPct);
  }
  const key =
    rec.ruleId === 'pot-odds-fold' && rec.impliedRequiredEquityPct !== null
      ? 'pot-odds-fold-implied'
      : rec.ruleId;
  const template =
    rec.requiredCountsRiverBet === true
      ? POSTFLOP_TEMPLATES[key].replace(POT_ODDS_LEAD, POT_ODDS_RIVER_BET_LEAD)
      : POSTFLOP_TEMPLATES[key];
  const text = fillTemplate(template, values);
  if (rec.opponentBasis.every((b) => b.observedHands === null)) return text;
  const lead = fillTemplate(OPPONENT_TYPE_LEAD, { minHands: String(OBSERVED_MIN_HANDS) });
  return lead + text.charAt(0).toLowerCase() + text.slice(1);
}
