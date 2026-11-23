import { useState } from 'react';
import { referenceSizeOf } from '../../advice/preflop';
import type { ReferenceSize } from '../../advice/preflop-chart';
import { LINE_UP_PRESETS, type LineUpPreset } from '../../bots/lineup';
import {
  BOT_STYLES,
  botsClockwise,
  buyIn,
  CASH_STAKES,
  configForGameType,
  configForLineUp,
  configWithSeatStyle,
  DEFAULT_SESSION_CONFIG,
  type BotStyle,
  type GameType,
  type SessionConfig,
  type Speed,
  type Stake,
  TABLE_SIZES,
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

const REFERENCE_SIZE_TABLE: Record<ReferenceSize, number> = {
  'heads-up': 2,
  '6-max': 6,
  'full-ring': 10,
};

/** REQ-005.3/005.4: the approximate-advice note, or null at 2, 6, 9 and 10 players. */
function playersNote(players: number): string | null {
  if ([2, 6, 9, 10].includes(players)) return null;
  const reference = REFERENCE_SIZE_TABLE[referenceSizeOf(players)];
  return `Advice will be approximate (based on ${TABLE_SIZE_NAMES[reference]}).`;
}

const stakeKey = (stake: Stake): string => `${stake.smallBet}/${stake.bigBet}`;

type Field = readonly [string, React.ReactNode, React.ReactNode];

const isPreset = (name: string): name is LineUpPreset =>
  (LINE_UP_PRESETS as readonly string[]).includes(name);
const isBotStyle = (value: string): value is BotStyle =>
  (BOT_STYLES as readonly string[]).includes(value);

/** Summary of `config` (TASK-2.1 D-6) plus the game-type (TASK-2.4 D-4), players (TASK-2.2 D-1), stake
 *  (TASK-2.3 D-1), line-up (TASK-2.5) and per-seat style (TASK-2.8) choices; Start game hands over the chosen
 *  size seated with the chosen line-up and seat edits, the chosen game type, and the chosen stake for a cash
 *  game. */
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
  const [players, setPlayers] = useState(config.players);
  // TASK-2.5 A-1: start at the config's preset, or Mixed when it has none.
  const [preset, setPreset] = useState<LineUpPreset>(
    isPreset(config.lineUp) ? config.lineUp : 'Mixed',
  );
  // TASK-2.8 A-2: per-seat style edits; a preset or players change discards them.
  const [edits, setEdits] = useState<Readonly<Record<number, BotStyle>>>({});
  const seated = Object.entries(edits).reduce(
    (c, [seat, style]) => configWithSeatStyle(c, preset, Number(seat), style),
    configForLineUp(config, players, preset),
  );
  const note = playersNote(players);
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
  const playersChoice = (
    <>
      <select
        id="config-players"
        value={String(players)}
        aria-describedby={note === null ? undefined : 'config-players-note'}
        onChange={(event) => {
          const chosen = Number(event.target.value);
          if (TABLE_SIZES.includes(chosen)) {
            setPlayers(chosen);
            setEdits({});
          }
        }}
      >
        {TABLE_SIZES.map((n) => (
          <option key={n} value={String(n)}>
            {playersLabel(n)}
          </option>
        ))}
      </select>
      {note !== null && (
        <p id="config-players-note" className="config-note">
          {note}
        </p>
      )}
    </>
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
    ['players', <label htmlFor="config-players">Players at the table</label>, playersChoice],
    ...(gameType === 'cash' ? cashFields : []),
    ['speed', 'Speed', SPEED_LABELS[config.speed]],
  ];
  const bots = botsClockwise(seated);

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
          <div
            role="radiogroup"
            aria-labelledby="config-lineup"
            className="config-choice config-lineup"
          >
            <span id="config-lineup">Line-up</span>
            {LINE_UP_PRESETS.map((value) => (
              <label key={value}>
                <input
                  type="radio"
                  name="line-up"
                  value={value}
                  checked={preset === value}
                  onChange={() => {
                    setPreset(value);
                    setEdits({});
                  }}
                />
                {value}
              </label>
            ))}
          </div>
          <ul className="config-seats">
            {bots.map((s) => (
              <li key={s.seat}>
                <span className="seat-label">Seat {s.seat}</span>
                <span className="seat-name">{s.name}</span>
                <label className="config-style">
                  Style
                  <select
                    aria-label={`Style for ${s.name}`}
                    value={s.style ?? undefined}
                    onChange={(event) => {
                      const chosen = event.target.value;
                      if (isBotStyle(chosen)) setEdits({ ...edits, [s.seat]: chosen });
                    }}
                  >
                    {BOT_STYLES.map((v) => (
                      <option key={v} value={v}>
                        {STYLE_LABELS[v]}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            ))}
            <li>
              <span className="seat-label">You</span>
              <span>Seat {seated.userSeat}</span>
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
          onClick={() => onStart(configForGameType(seated, gameType, stake))}
        >
          Start game
        </button>
      </div>
    </main>
  );
}
