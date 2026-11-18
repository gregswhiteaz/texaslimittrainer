import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import logoUrl from '../../src/assets/tlh-logo.jpg';
import { cardRank, cardSuit, type Card } from '../../src/engine/cards';
import { RANK_LABELS, SUIT_NAMES, cardLabel } from '../../src/ui/cards/card-art';
import {
  CardBack,
  DeckColoursContext,
  PlayingCard,
  type DeckColours,
} from '../../src/ui/cards/PlayingCard';

const ALL_CARDS: Card[] = Array.from({ length: 52 }, (_, card) => card);
const MODES: DeckColours[] = ['two-colour', 'four-colour'];

const RED = '#B42318';
const BLACK = '#111111';
const GREEN = '#1D6B35';
const BLUE = '#1D4ED8';
const TWO_COLOUR = [BLACK, RED, RED, BLACK];
const FOUR_COLOUR = [GREEN, BLUE, RED, BLACK];

function rootTag(markup: string): string {
  const match = /^<svg[^>]*>/.exec(markup);
  if (!match) throw new Error(`markup does not start with <svg>: ${markup.slice(0, 80)}`);
  return match[0];
}

function attr(tag: string, name: string): string | undefined {
  return new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
}

function partTags(markup: string, part: string): string[] {
  return markup.match(new RegExp(`<g[^>]*\\sdata-part="${part}"[^>]*>`, 'g')) ?? [];
}

function partBody(markup: string, part: string): string {
  const match = new RegExp(`<g[^>]*\\sdata-part="${part}"[^>]*>(.*?)</g>`).exec(markup);
  return match?.[1] ?? '';
}

function colours(markup: string): { rank: string | undefined; suit: string | undefined } {
  const [rankTag = ''] = partTags(markup, 'rank');
  const [suitTag = ''] = partTags(markup, 'suit');
  return { rank: attr(rankTag, 'stroke'), suit: attr(suitTag, 'fill') };
}

describe('PlayingCard acceptance', () => {
  it('every face shows its rank and suit and no image', () => {
    for (const mode of MODES) {
      for (const card of ALL_CARDS) {
        const markup = renderToStaticMarkup(<PlayingCard card={card} deck={mode} />);
        const root = rootTag(markup);
        expect(attr(root, 'width')).toBe('60');
        expect(attr(root, 'height')).toBe('84');
        expect(attr(root, 'role')).toBe('img');
        expect(attr(root, 'aria-label')).toBe(cardLabel(card));

        const rankTags = partTags(markup, 'rank');
        expect(rankTags).toHaveLength(1);
        expect(attr(rankTags[0] ?? '', 'data-rank')).toBe(RANK_LABELS[cardRank(card)]);
        expect(partBody(markup, 'rank')).toContain('<path');

        const suitTags = partTags(markup, 'suit');
        expect(suitTags).toHaveLength(1);
        expect(attr(suitTags[0] ?? '', 'data-suit')).toBe(SUIT_NAMES[cardSuit(card)]);
        expect(partBody(markup, 'suit')).toContain('<path');

        for (const forbidden of ['<image', '<img', '<foreignObject', '<text', 'url(']) {
          expect(markup).not.toContain(forbidden);
        }
      }
    }
    expect(cardLabel(51)).toBe('Ace of spades');
    expect(cardLabel(32)).toBe('Ten of clubs');
  });

  it('two-colour deck colours', () => {
    const renders = [
      (card: Card) => renderToStaticMarkup(<PlayingCard card={card} deck="two-colour" />),
      (card: Card) => renderToStaticMarkup(<PlayingCard card={card} />),
    ];
    for (const render of renders) {
      for (const card of ALL_CARDS) {
        const expected = TWO_COLOUR[cardSuit(card)];
        expect(colours(render(card))).toEqual({ rank: expected, suit: expected });
      }
    }
  });

  it('four-colour deck colours', () => {
    const renders = [
      (card: Card) => renderToStaticMarkup(<PlayingCard card={card} deck="four-colour" />),
      (card: Card) =>
        renderToStaticMarkup(
          <DeckColoursContext.Provider value="four-colour">
            <PlayingCard card={card} />
          </DeckColoursContext.Provider>,
        ),
    ];
    for (const render of renders) {
      for (const card of ALL_CARDS) {
        const markup = render(card);
        const expected = FOUR_COLOUR[cardSuit(card)];
        expect(colours(markup)).toEqual({ rank: expected, suit: expected });
        expect(attr(rootTag(markup), 'data-deck')).toBe('four-colour');
      }
    }
  });

  it('card back shows the TLH logo', () => {
    const markup = renderToStaticMarkup(<CardBack />);
    const root = rootTag(markup);
    expect(attr(root, 'width')).toBe('60');
    expect(attr(root, 'height')).toBe('84');
    expect(attr(root, 'role')).toBe('img');
    expect(attr(root, 'aria-label')).toBe('Face-down card');

    const images = markup.match(/<image[^>]*>/g) ?? [];
    expect(images).toHaveLength(1);
    const [image = ''] = images;
    expect(attr(image, 'data-part')).toBe('logo');
    expect(attr(image, 'href')).toBe(logoUrl);
    expect(markup).not.toContain('data-part="rank"');
    expect(markup).not.toContain('data-part="suit"');
  });
});
