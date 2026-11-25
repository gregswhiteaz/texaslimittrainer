import { expect, it } from 'vitest';
import { appScreens } from '../../e2e/support/play-money';

// TASK-12.1 (AC#5, D-6): the play-money dialog detector also reads `role` written as a JSX expression.

const APP = `
type Screen =
  | { readonly name: 'home'; readonly returned: boolean }
  | { readonly name: 'settings' };
`;

it('the dialog detector recognises role written as a JSX expression', () => {
  const files = [
    { path: 'src/ui/x/ExprDialog.tsx', source: `<div role={'dialog'} aria-modal="true">…</div>` },
    { path: 'src/ui/x/DqDialog.tsx', source: '<div role={"alertdialog"}>…</div>' },
    { path: 'src/ui/x/TplDialog.tsx', source: '<div role={`dialog`}>…</div>' },
    { path: 'src/ui/x/Plain.tsx', source: '<section role="region">…</section>' },
    { path: 'src/ui/x/Other.tsx', source: `<div role={'dialogue-panel'}>…</div>` },
  ];
  expect(appScreens(APP, files)).toEqual({
    routes: ['home', 'settings'],
    dialogs: ['DqDialog', 'ExprDialog', 'TplDialog'],
  });

  const native = [
    { path: 'src/ui/x/Native.tsx', source: '<dialog ref={ref}>…</dialog>' },
    { path: 'src/ui/x/RoleDialog.tsx', source: '<div role="dialog">…</div>' },
    { path: 'src/ui/x/Alert.tsx', source: "<div role='alertdialog'>…</div>" },
  ];
  expect(appScreens(APP, native).dialogs).toEqual(['Alert', 'Native', 'RoleDialog']);
});
