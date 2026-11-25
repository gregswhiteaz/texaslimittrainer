// Register every new App screen and dialog component here; the play-money check visits each (TASK-2.15).

export type ScreenEntry =
  | { readonly id: string; readonly kind: 'screen'; readonly route: string }
  | { readonly id: string; readonly kind: 'dialog'; readonly component: string };

export const SCREEN_LIST = [
  { id: 'home', kind: 'screen', route: 'home' },
  { id: 'game-config', kind: 'screen', route: 'config' },
  { id: 'end-session-dialog', kind: 'dialog', component: 'EndSessionDialog' },
  { id: 'table', kind: 'screen', route: 'table' },
  { id: 'bust-dialog', kind: 'dialog', component: 'BustDialog' },
  { id: 'leave-dialog', kind: 'dialog', component: 'LeaveDialog' },
  { id: 'ending', kind: 'screen', route: 'ending' },
  { id: 'session-report', kind: 'screen', route: 'report' },
  { id: 'statistics', kind: 'screen', route: 'stats' },
  { id: 'settings', kind: 'screen', route: 'settings' },
] as const satisfies readonly ScreenEntry[];

export type ScreenId = (typeof SCREEN_LIST)[number]['id'];
