// Fails when file-sync conflict copies (macOS/iCloud `name 2.ext`, `dir 2`) are in the working tree.

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

/** A base name, a space and a number, just before the final extension (if any). */
export const SYNC_COPY_NAME = /^.+ \d+(\.[^.]+)?$/;

const SKIPPED_DIRS = new Set(['.git', 'node_modules']);

/**
 * @param {string} name A basename.
 * @returns {boolean}
 */
export function isSyncConflictCopy(name) {
  return SYNC_COPY_NAME.test(name);
}

/**
 * Lists every file or directory under `root` whose basename is a conflict copy, skipping `.git` and
 * `node_modules`. A matching directory is reported once and not descended into.
 * @param {string} root
 * @returns {string[]} Sorted POSIX paths relative to `root`.
 */
export function findSyncConflictCopies(root) {
  /** @type {string[]} */
  const found = [];
  /** @param {string} relativeDir */
  const walk = (relativeDir) => {
    for (const entry of readdirSync(join(root, relativeDir), { withFileTypes: true })) {
      if (SKIPPED_DIRS.has(entry.name)) continue;
      const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
      if (isSyncConflictCopy(entry.name)) {
        found.push(relativePath);
      } else if (entry.isDirectory()) {
        walk(relativePath);
      }
    }
  };
  walk('');
  return found.sort();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const copies = findSyncConflictCopies(process.argv[2] ?? process.cwd());
  if (copies.length > 0) {
    process.stderr.write(
      'File-sync conflict copies found (remove them; see README "Where to keep the repo"):\n' +
        copies.map((path) => `  ${path}\n`).join(''),
    );
    process.exitCode = 1;
  }
}
