import type { Action } from '../../engine/hand';
import { USER_SEAT, nextStep, userActions, type SessionSeat } from '../../table/session';
import { PlayingCard } from '../cards/PlayingCard';
import { useTableSession, type TableSessionOptions } from './useTableSession';

export type TableProps = TableSessionOptions;

const ACTION_LABELS: Record<Action['type'], string> = {
  fold: 'Fold',
  check: 'Check',
  call: 'Call',
  bet: 'Bet',
  raise: 'Raise',
};

export function Table(props: TableProps): React.JSX.Element {
  const { table, act } = useTableSession(props);
  const { hand } = table;
  const step = nextStep(table);
  const stackOf = (seat: number): number =>
    (hand?.players ?? table.stacks).find((p) => p.seat === seat)?.stack ?? 0;
  const userCards = hand?.players.find((p) => p.seat === USER_SEAT)?.holeCards;
  const ordered: SessionSeat[] = [
    ...table.seats.filter((s) => s.kind === 'bot'),
    ...table.seats.filter((s) => s.kind === 'user'),
  ];

  return (
    <section
      aria-label="Table"
      className="table-felt"
      data-street={hand?.street ?? ''}
      data-to-act={hand?.toAct ?? ''}
      data-action-count={hand?.actions.length ?? 0}
    >
      <ul aria-label="Seats" className="table-seats">
        {ordered.map((s) => (
          <li key={s.seat} data-seat={s.seat} data-user={s.kind === 'user' ? '' : undefined}>
            <span data-part="name">{s.name}</span>
            <span data-part="stack">${stackOf(s.seat)}</span>
            {s.kind === 'user' && userCards !== undefined && (
              <div role="group" aria-label="Your cards" className="table-cards">
                <PlayingCard card={userCards[0]} />
                <PlayingCard card={userCards[1]} />
              </div>
            )}
          </li>
        ))}
      </ul>
      <div role="group" aria-label="Board" className="table-cards table-board">
        {hand?.board.map((card) => (
          <PlayingCard key={card} card={card} />
        ))}
      </div>
      {step === 'user' && (
        <div role="group" aria-label="Your actions" className="table-actions">
          {userActions(table).map((action) => (
            <button key={action.type} type="button" onClick={() => act(action)}>
              {ACTION_LABELS[action.type]}
            </button>
          ))}
        </div>
      )}
      {step === 'done' && <p role="status">Hand over</p>}
    </section>
  );
}
