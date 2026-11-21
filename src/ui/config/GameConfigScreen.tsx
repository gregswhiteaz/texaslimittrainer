import { useState } from 'react';
import {
  buyIn,
  CASH_STAKES,
  configForGameType,
  DEFAULT_SESSION_CONFIG,
  type BotStyle,
  type GameType,
  type SessionConfig,
  type Speed,
  type Stake,
} from '../../table/session';
import { useHeadingFocus } from '../useHeadingFocus';

export interface GameConfigScreenProps {
  readonly config: SessionConfig;
  readonly onStart: (config: SessionConfig) => void;
  readonly onCancel: () => void;
}

const GAME_TYPES: readonly GameType[] = ['cash', 'sit-and-go'];
const GAME_TYPE_LABELS: Record<GameType, string> = {
  cash: 'Cash game',
  'sit-and-go': 'Sit-and-go',
};
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

const stakeKey = (stake: Stake): string => `${stake.smallBet}/${stake.bigBet}`;

type Field = readonly [string, React.ReactNode, React.ReactNode];

/** Summary of `config` (TASK-2.1 D-6) plus the game-type (TASK-2.4 D-4) and stake (TASK-2.3 D-1) choices;
 *  Start game hands over the chosen game type, and the chosen stake for a cash game. */
export function GameConfigScreen({
  config,
  onStart,
  onCancel,
}: GameConfigScreenProps): React.JSX.Element {
  const heading = useHeadingFocus(true);
  const [gameType, setGameType] = useState<GameType>(config.gameType);
  // A-7: a sit-and-go config carries no stake, so the hidden cash stake starts at the default.
  const [stake, setStake] = useState<Stake>(
    config.gameType === 'cash' ? config.stake : DEFAULT_SESSION_CONFIG.stake,
  );
  const stack = buyIn(stake);
  const gameTypeChoice = (
    <div role="radiogroup" aria-labelledby="config-game-type" className="config-choice">
      {GAME_TYPES.map((value) => (
        <label key={value}>
          <input
            type="radio"
            name="game-type"
            value={value}
            checked={gameType === value}
            onChange={() => setGameType(value)}
          />
          {GAME_TYPE_LABELS[value]}
        </label>
      ))}
    </div>
  );
  const stakeSelect = (
    <select
      id="config-stake"
      value={stakeKey(stake)}
      onChange={(event) => {
        const chosen = CASH_STAKES.find((s) => stakeKey(s) === event.target.value);
        if (chosen !== undefined) setStake(chosen);
      }}
    >
      {CASH_STAKES.map((s) => (
        <option key={stakeKey(s)} value={stakeKey(s)}>
          {`$${s.smallBet} / $${s.bigBet}`}
        </option>
      ))}
    </select>
  );
  const cashFields: readonly Field[] = [
    ['stake', <label htmlFor="config-stake">Stakes (small bet / big bet)</label>, stakeSelect],
    ['buy-in', 'Buy-in', `$${stack} (${stack / stake.bigBet} big bets)`],
  ];
  const fields: readonly Field[] = [
    ['game', <span id="config-game-type">Game type</span>, gameTypeChoice],
    ['players', 'Players at the table', playersLabel(config.players)],
    ...(gameType === 'cash' ? cashFields : []),
    ['speed', 'Speed', SPEED_LABELS[config.speed]],
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
            {fields.map(([key, label, value]) => (
              <div key={key}>
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
        <button
          type="button"
          className="button-primary"
          onClick={() => onStart(configForGameType(config, gameType, stake))}
        >
          Start game
        </button>
      </div>
    </main>
  );
}
