import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { appScreens, unlistedScreens } from '../../e2e/support/play-money';
import { SCREEN_LIST } from '../../e2e/support/screen-list';

// TASK-2.15 (AC#2): every App screen and dialog component in src/ui is in the play-money screen list.

const UI_DIR = fileURLToPath(new URL('../../src/ui/', import.meta.url));

it('the screen list names every App screen and every dialog component', () => {
  const uiFiles = readdirSync(UI_DIR, { recursive: true, encoding: 'utf8' })
    .filter((path) => path.endsWith('.tsx') && !path.endsWith('.test.tsx'))
    .map((path) => ({ path, source: readFileSync(join(UI_DIR, path), 'utf8') }));
  const found = appScreens(readFileSync(join(UI_DIR, 'App.tsx'), 'utf8'), uiFiles);

  const missing = unlistedScreens(found, SCREEN_LIST);
  expect(missing, missing.join('\n')).toEqual([]);
  expect(found).toEqual({
    routes: ['config', 'ending', 'home', 'report', 'table'],
    dialogs: ['BustDialog', 'EndSessionDialog'],
  });
});
