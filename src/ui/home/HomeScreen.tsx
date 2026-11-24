import logoUrl from '../../assets/tlh-logo.jpg';
import { useHeadingFocus } from '../useHeadingFocus';

export interface HomeScreenProps {
  readonly onNewGame: () => void;
  /** True when Home is reached from another screen (A-4). */
  readonly focusHeading?: boolean;
  /** undefined: still loading or not provided; null: no paused session; else the entry's subtitle. */
  readonly paused?: { readonly summary: string } | null;
  readonly onResume?: () => void;
}

export function HomeScreen({
  onNewGame,
  focusHeading = false,
  paused,
  onResume,
}: HomeScreenProps): React.JSX.Element {
  const heading = useHeadingFocus(focusHeading);
  return (
    <main className="screen">
      <header className="home-header">
        <img src={logoUrl} alt="" width={64} height={64} />
        <h1 ref={heading}>TLH Trainer</h1>
      </header>
      <nav
        aria-label="Main menu"
        className="home-menu"
        data-paused={paused === undefined ? 'loading' : paused === null ? 'none' : 'shown'}
      >
        <button type="button" className="menu-primary" onClick={onNewGame}>
          <span className="menu-title">New game</span>
          <span className="menu-subtitle">Set up a cash game or sit-and-go</span>
        </button>
        {paused != null && (
          <button type="button" className="menu-secondary" onClick={onResume}>
            <span className="menu-title">Resume session</span>
            <span className="menu-subtitle">{paused.summary}</span>
          </button>
        )}
      </nav>
    </main>
  );
}
