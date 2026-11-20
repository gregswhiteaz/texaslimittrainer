import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import logoUrl from '../../src/assets/tlh-logo.jpg';
import { RANK_LABELS, RANK_NAMES, cardLabel } from '../../src/ui/cards/card-art';
import { DeckColoursContext, PlayingCard } from '../../src/ui/cards/PlayingCard';

const ASSETS_DIR = fileURLToPath(new URL('../../src/assets/', import.meta.url));

function jpegSize(bytes: Buffer): { width: number; height: number } {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error(`bad JPEG marker at ${offset}`);
    const marker = bytes[offset + 1] ?? 0;
    const length = bytes.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  throw new Error('no SOF frame header');
}

describe('card art', () => {
  it('labels every rank and suit', () => {
    expect(cardLabel(0)).toBe('Two of clubs');
    expect(cardLabel(1)).toBe('Two of diamonds');
    expect(cardLabel(34)).toBe('Ten of hearts');
    expect(cardLabel(51)).toBe('Ace of spades');
    expect(RANK_NAMES).toHaveLength(13);
    expect(RANK_LABELS).toHaveLength(13);
  });

  it('deck prop overrides context and default is two-colour', () => {
    const overridden = renderToStaticMarkup(
      createElement(
        DeckColoursContext.Provider,
        { value: 'four-colour' },
        createElement(PlayingCard, { card: 1, deck: 'two-colour' }),
      ),
    );
    expect(overridden).toContain('data-deck="two-colour"');
    expect(overridden).toMatch(/data-part="suit"[^>]*fill="#B42318"/);
    expect(overridden).not.toContain('#1D4ED8');

    const plain = renderToStaticMarkup(createElement(PlayingCard, { card: 1 }));
    expect(plain).toContain('data-deck="two-colour"');
  });

  it('invalid cards throw RangeError', () => {
    for (const [card, text] of [
      [52, '52'],
      [-1, '-1'],
      [1.5, '1.5'],
      [NaN, 'NaN'],
    ] as const) {
      const message = `Invalid card: ${text}`;
      expect(() => cardLabel(card)).toThrow(RangeError);
      expect(() => cardLabel(card)).toThrow(new RangeError(message));
      expect(() => renderToStaticMarkup(createElement(PlayingCard, { card }))).toThrow(
        new RangeError(message),
      );
    }
  });

  it('logo asset is a 512px JPEG under 64 KB', () => {
    expect(readdirSync(ASSETS_DIR)).toEqual(['tlh-logo.jpg']);
    const bytes = readFileSync(`${ASSETS_DIR}tlh-logo.jpg`);
    expect([bytes[0], bytes[1]]).toEqual([0xff, 0xd8]);
    expect(jpegSize(bytes)).toEqual({ width: 512, height: 512 });
    expect(bytes.length).toBeLessThanOrEqual(65_536);
    expect(logoUrl.startsWith('/')).toBe(true);
    expect(logoUrl).not.toMatch(/^http/);
  });
});
