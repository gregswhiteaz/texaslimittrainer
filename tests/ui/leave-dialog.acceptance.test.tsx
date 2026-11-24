import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { TableState } from '../../src/table/session';
import { LeaveDialog } from '../../src/ui/table/LeaveDialog';
import { TableView } from '../../src/ui/table/Table';
import { SEAT_1_DEALT, withFinalStacks } from '../support/table-scenarios';

// TASK-10.2 (REQ-004.5, A-3, A-4): the Leave-now dialog and the table while leaving.

const noop = (): void => undefined;
const PROMPT = { onConfirm: noop, onCancel: noop };

const render = (
  table: TableState,
  extra: { leavePrompt?: typeof PROMPT | null; leaving?: boolean } = {},
): string =>
  renderToString(
    <TableView
      table={table}
      onAct={noop}
      onLeave={noop}
      onHome={noop}
      onDealNext={noop}
      onRebuy={noop}
      {...extra}
    />,
  );

const dialogs = (html: string): number => html.match(/<dialog[\s>]/g)?.length ?? 0;

describe('leave dialog acceptance', () => {
  it('the leave dialog and the leaving table render as specified', () => {
    const dialog = renderToString(<LeaveDialog onConfirm={noop} onCancel={noop} />);
    expect(dialog).toContain('<dialog class="leave-dialog" aria-labelledby="leave-heading">');
    expect(dialog).toContain('<h2 id="leave-heading">Leave now? Your hand will be folded.</h2>');
    expect([...dialog.matchAll(/<button([^>]*)>([^<]*)<\/button>/g)].map((m) => m[2])).toEqual([
      'Cancel',
      'Confirm',
    ]);
    expect(dialog).toContain('<button type="button" class="leave-cancel">Cancel</button>');
    expect(dialog).toContain('<button type="button" class="leave-confirm">Confirm</button>');

    const prompted = render(SEAT_1_DEALT, { leavePrompt: PROMPT });
    expect(dialogs(prompted)).toBe(1);
    expect(prompted).toContain('<dialog class="leave-dialog"');

    const plain = render(SEAT_1_DEALT);
    expect(dialogs(plain)).toBe(0);
    expect(plain).toContain('<button type="button" class="table-leave">Leave table</button>');
    expect(plain).toContain('<button type="button" class="table-home">Home</button>');

    const leaving = render(SEAT_1_DEALT, { leaving: true });
    expect(leaving).toContain('<button type="button" class="table-home" disabled="">Home</button>');
    expect(leaving).toContain(
      '<button type="button" class="table-leave" disabled="">Leave table</button>',
    );

    const busted = withFinalStacks([160, 222, 160, 160, 0, 165]);
    expect(render(busted)).toContain('bust-dialog');
    const bustedLeaving = render(busted, { leaving: true });
    expect(bustedLeaving).not.toContain('bust-dialog');
    expect(dialogs(bustedLeaving)).toBe(0);
  });
});
