import { userActionBar } from '../../table/action-bar';
import { nextStep, type SessionSeat } from '../../table/session';
import { PlayingCard } from '../cards/PlayingCard';
import { ActionBar } from './ActionBar';
import { useTableSession, type TableSessionOptions } from './useTableSession';

export type TableProps = TableSessionOptions;

export function Table(props: TableProps): React.JSX.Element {
  const { table, act } = useTableSession(props);
  const { hand } = table;
  const step = nextStep(table);
  const bar = userActionBar(table);
  const stackOf = (seat: number): number =>
    (hand?.players ?? table.stacks).find((p) => p.seat === seat)?.stack ?? 0;
  const userCards = hand?.players.find((p) => p.seat === table.config.userSeat)?.holeCards;
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
      {bar !== null && <ActionBar model={bar} onAct={act} />}
      {step === 'done' && <p role="status">Hand over</p>}
    </section>
  );
}
