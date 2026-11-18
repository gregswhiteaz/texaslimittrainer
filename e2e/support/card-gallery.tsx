import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { RANK_CHARS, SUIT_CHARS } from '../../src/engine/cards';
import { CardBack, DeckColoursContext, PlayingCard } from '../../src/ui/cards/PlayingCard';

// Test-only page (D-4): never imported by the app, built and injected by card-gallery-bundle.ts.
const CARDS = Array.from({ length: RANK_CHARS.length * SUIT_CHARS.length }, (_, card) => card);

const GRID_STYLE = {
  display: 'grid',
  gridTemplateColumns: 'repeat(13, 60px)',
  gap: 8,
  padding: 8,
  background: '#2F6B4F',
  width: 'max-content',
} as const;

function Section({
  label,
  testId,
  children,
}: {
  label: string;
  testId: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={label} data-testid={testId} style={GRID_STYLE}>
      {children}
    </section>
  );
}

function Faces() {
  return CARDS.map((card) => <PlayingCard key={card} card={card} />);
}

function CardGallery() {
  return (
    <main>
      <h1>Card gallery</h1>
      <Section label="Two-colour deck" testId="faces-two-colour">
        <Faces />
      </Section>
      <DeckColoursContext.Provider value="four-colour">
        <Section label="Four-colour deck" testId="faces-four-colour">
          <Faces />
        </Section>
      </DeckColoursContext.Provider>
      <section
        aria-label="Card back"
        data-testid="card-back"
        style={{ ...GRID_STYLE, gridTemplateColumns: '60px' }}
      >
        <CardBack />
      </section>
    </main>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Card gallery needs a #root element');
createRoot(root).render(
  <StrictMode>
    <CardGallery />
  </StrictMode>,
);
