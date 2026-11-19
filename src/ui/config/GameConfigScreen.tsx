import {
  buyIn,
  type BotStyle,
  type GameType,
  type SessionConfig,
  type Speed,
} from '../../table/session';
import { useHeadingFocus } from '../useHeadingFocus';

export interface GameConfigScreenProps {
  readonly config: SessionConfig;
  readonly onStart: (config: SessionConfig) => void;
  readonly onCancel: () => void;
}

const GAME_TYPE_LABELS: Record<GameType, string> = { cash: 'Cash game' };
const SPEED_LABELS: Record<Speed, string> = { rapid: 'Rapid' };
const STYLE_LABELS: Record<BotStyle, string> = {
  TAG: 'Tight-aggressive',
  'Calling station': 'Calling station',
  Maniac: 'Maniac',
  Rock: 'Rock',
};
const TABLE_SIZE_NAMES: Partial<Record<number, string>> = {
  2: 'heads-up',
  6: '6-max',
  10: 'full ring',
};

function playersLabel(players: number): string {
  const name = TABLE_SIZE_NAMES[players];
  return name === undefined ? String(players) : `${players} (${name})`;
}

/** Read-only summary of `config` (D-6); Start game hands over the same object. */
export function GameConfigScreen({
  config,
  onStart,
  onCancel,
}: GameConfigScreenProps): React.JSX.Element {
  const heading = useHeadingFocus(true);
  const { stake } = config;
  const stack = buyIn(stake);
  const fields: readonly (readonly [string, string])[] = [
    ['Game type', GAME_TYPE_LABELS[config.gameType]],
    ['Players at the table', playersLabel(config.players)],
    ['Stakes (small bet / big bet)', `$${stake.smallBet} / $${stake.bigBet}`],
    ['Buy-in', `$${stack} (${stack / stake.bigBet} big bets)`],
    ['Speed', SPEED_LABELS[config.speed]],
  ];
  const bots = config.seats.filter((s) => s.kind === 'bot');

  return (
    <main className="screen">
      <header className="config-header">
        <button type="button" className="link-button" onClick={onCancel}>
          ← Home
        </button>
        <h1 ref={heading}>New game</h1>
      </header>
      <div className="config-panels">
        <section className="panel" aria-labelledby="config-session">
          <h2 id="config-session" className="visually-hidden">
            Session
          </h2>
          <dl className="config-fields">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="panel" aria-labelledby="config-opponents">
          <h2 id="config-opponents">Opponents</h2>
          <ul className="config-seats">
            {bots.map((s) => (
              <li key={s.seat}>
                <span className="seat-label">Seat {s.seat}</span>
                <span className="seat-name">{s.name}</span>
                <span>{s.style !== null && STYLE_LABELS[s.style]}</span>
              </li>
            ))}
            <li>
              <span className="seat-label">You</span>
              <span>Seat {config.userSeat}</span>
            </li>
          </ul>
        </section>
      </div>
      <div className="config-actions">
        <button type="button" className="button-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="button-primary" onClick={() => onStart(config)}>
          Start game
        </button>
      </div>
    </main>
  );
}
