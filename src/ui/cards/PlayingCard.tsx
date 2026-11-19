import { createContext, useContext } from 'react';
import logoUrl from '../../assets/tlh-logo.jpg';
import { cardRank, cardSuit, formatCard, type Card } from '../../engine/cards';
import {
  BACK_FILL,
  BACK_FRAME,
  CARD_HEIGHT,
  CARD_RADIUS,
  CARD_WIDTH,
  FACE_BORDER,
  FACE_FILL,
  RANK_GLYPHS,
  RANK_LABELS,
  RANK_ORIGIN,
  RANK_STROKE_WIDTH,
  SUIT_COLOURS,
  SUIT_END,
  SUIT_HEIGHT,
  SUIT_NAMES,
  SUIT_SYMBOLS,
  cardLabel,
  type DeckColours,
  type RankLabel,
  type SuitName,
} from './card-art';

export type { DeckColours } from './card-art';

/** Default 'two-colour' (REQ-050.4 default off). TASK-12.7 provides the user's setting. */
export const DeckColoursContext = createContext<DeckColours>('two-colour');

export interface PlayingCardProps {
  card: Card;
  /** Overrides DeckColoursContext. */
  deck?: DeckColours;
}

const VIEW_BOX = `0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`;

export function PlayingCard({ card, deck }: PlayingCardProps): React.JSX.Element {
  const contextDeck = useContext(DeckColoursContext);
  const mode = deck ?? contextDeck;
  const code = formatCard(card);
  // formatCard has validated the card, so both indexes are in range.
  const label = RANK_LABELS[cardRank(card)] as RankLabel;
  const suitIndex = cardSuit(card);
  const suit = SUIT_NAMES[suitIndex] as SuitName;
  const colour = SUIT_COLOURS[mode][suitIndex];
  const glyph = RANK_GLYPHS[label];
  const symbol = SUIT_SYMBOLS[suit];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={CARD_WIDTH}
      height={CARD_HEIGHT}
      viewBox={VIEW_BOX}
      role="img"
      aria-label={cardLabel(card)}
      data-card={code}
      data-deck={mode}
    >
      <rect
        x={0.5}
        y={0.5}
        width={CARD_WIDTH - 1}
        height={CARD_HEIGHT - 1}
        rx={CARD_RADIUS}
        fill={FACE_FILL}
        stroke={FACE_BORDER}
        strokeWidth={1}
      />
      <g
        data-part="rank"
        data-rank={label}
        transform={`translate(${RANK_ORIGIN.x} ${RANK_ORIGIN.y})`}
        fill="none"
        stroke={colour}
        strokeWidth={RANK_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={glyph.d} />
      </g>
      <g
        data-part="suit"
        data-suit={suit}
        transform={`translate(${SUIT_END.x - symbol.width} ${SUIT_END.y - SUIT_HEIGHT})`}
        fill={colour}
      >
        <path d={symbol.d} />
      </g>
    </svg>
  );
}

export interface CardBackProps {
  /** 'small' is the half-size seat marker (A-1); the artwork scales with it. */
  size?: 'standard' | 'small';
}

export function CardBack({ size = 'standard' }: CardBackProps): React.JSX.Element {
  const scale = size === 'small' ? 0.5 : 1;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={CARD_WIDTH * scale}
      height={CARD_HEIGHT * scale}
      viewBox={VIEW_BOX}
      role="img"
      aria-label="Face-down card"
      data-card="back"
    >
      <rect width={CARD_WIDTH} height={CARD_HEIGHT} rx={CARD_RADIUS} fill={BACK_FILL} />
      <rect
        x={3}
        y={3}
        width={CARD_WIDTH - 6}
        height={CARD_HEIGHT - 6}
        rx={3}
        fill="none"
        stroke={BACK_FRAME}
        strokeWidth={2}
      />
      <image
        data-part="logo"
        href={logoUrl}
        x={4}
        y={16}
        width={52}
        height={52}
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
}
