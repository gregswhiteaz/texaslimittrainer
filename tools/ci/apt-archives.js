// CI apt archive cache (TASK-1.47). The restored Actions cache is untrusted, and apt trusts a file
// already in /var/cache/apt/archives on name and size only. So `restore` copies a cached .deb into
// the archives directory only when its sha256 matches the signed apt index, and `collect` rebuilds
// the cache from the archives that the current install actually used.
// Usage: node tools/ci/apt-archives.js restore --from <cacheDir> --to <archivesDir>
//        node tools/ci/apt-archives.js collect --from <archivesDir> --to <cacheDir>
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, createReadStream, lstatSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { pipeline } from 'node:stream/promises';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

const DEB_FILE = /^([a-z0-9][a-z0-9+.-]*)_([A-Za-z0-9.+~%-]+)_([a-z0-9-]+)\.deb$/;
const DPKG_FORMAT = '${Package}\\t${Version}\\t${Architecture}\\t${db:Status-Abbrev}\\n';

class UsageError extends Error {}

/** @param {string} line */
const log = (line) => process.stdout.write(`${line}\n`);

/**
 * Replaces control characters with `?`, so a file name cannot start a workflow-command line.
 * @param {string} text
 */
// eslint-disable-next-line no-control-regex
const safe = (text) => text.replace(/[\x00-\x1f\x7f]/g, '?');

/**
 * Reads `<name>_<version>_<arch>.deb` as apt names its archives (an epoch's `:` is stored as `%3a`).
 * @param {string} fileName
 * @returns {{ name: string, version: string, arch: string } | null}
 */
export function parseDebFileName(fileName) {
  const match = DEB_FILE.exec(fileName);
  if (!match) return null;
  const [, name = '', encoded = '', arch = ''] = match;
  const version = encoded.replace(/%3a/gi, ':');
  if (version.includes('%')) return null;
  return { name, version, arch };
}

/**
 * Parses `apt-cache show` output. Records missing any of the four fields are skipped.
 * @param {string} text
 * @returns {{ package: string, version: string, architecture: string, sha256: string }[]}
 */
export function parseAptRecords(text) {
  const records = [];
  for (const block of text.split(/\n\s*\n/)) {
    /** @type {Map<string, string>} */
    const fields = new Map();
    for (const line of block.split('\n')) {
      const field = /^(Package|Version|Architecture|SHA256):\s*(\S+)\s*$/.exec(line);
      if (field) fields.set(field[1] ?? '', field[2] ?? '');
    }
    const [pkg, version, architecture, sha256] = [
      'Package',
      'Version',
      'Architecture',
      'SHA256',
    ].map((key) => fields.get(key));
    if (!pkg || !version || !architecture || !sha256) continue;
    records.push({ package: pkg, version, architecture, sha256: sha256.toLowerCase() });
  }
  return records;
}

/**
 * Reads `dpkg-query -W -f '${Package}\t${Version}\t${Architecture}\t${db:Status-Abbrev}\n'` output
 * into `name|version|arch` keys of the packages that are installed (status `ii`).
 * @param {string} text
 * @returns {Set<string>}
 */
export function parseInstalled(text) {
  const installed = new Set();
  for (const line of text.split('\n')) {
    const [name, version, arch, status] = line.split('\t');
    if (name && version && arch && status?.startsWith('ii')) {
      installed.add(`${name}|${version}|${arch}`);
    }
  }
  return installed;
}

/**
 * Sorted `.deb` entry names of `dir`. A missing directory is empty.
 * @param {string} dir
 */
function debEntries(dir) {
  try {
    return readdirSync(dir)
      .filter((entry) => entry.endsWith('.deb'))
      .sort();
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') return [];
    throw error;
  }
}

/** @param {string} path */
async function sha256Of(path) {
  const hash = createHash('sha256');
  await pipeline(createReadStream(path), hash);
  return hash.digest('hex');
}

/**
 * @param {{ status: number | null, error?: Error }} result
 * @param {string} command
 */
const failure = (result, command) =>
  result.error
    ? `could not start ${command}: ${result.error.message}`
    : `exit code ${result.status ?? 'none'}`;

/**
 * Why a cached file may not be restored, or null when it matches the apt index.
 * @param {string} path
 * @param {string} entry
 * @param {{ aptCacheMissing: boolean }} state
 */
async function rejectReason(path, entry, state) {
  if (!lstatSync(path).isFile()) return 'not a regular file';
  const deb = parseDebFileName(entry);
  if (!deb) return 'unrecognised file name';
  if (state.aptCacheMissing) return 'apt-cache unavailable';
  const spec =
    deb.arch === 'all' ? `${deb.name}=${deb.version}` : `${deb.name}:${deb.arch}=${deb.version}`;
  const result = spawnSync('apt-cache', ['show', spec], { encoding: 'utf8' });
  if (/** @type {NodeJS.ErrnoException | undefined} */ (result.error)?.code === 'ENOENT') {
    state.aptCacheMissing = true;
    return 'apt-cache unavailable';
  }
  const record =
    result.status === 0
      ? parseAptRecords(result.stdout).find(
          (r) => r.package === deb.name && r.version === deb.version && r.architecture === deb.arch,
        )
      : undefined;
  if (!record) return 'not in the apt index';
  if ((await sha256Of(path)) !== record.sha256) return 'sha256 mismatch';
  return null;
}

/**
 * @param {string} from
 * @param {string} to
 */
async function restore(from, to) {
  const entries = debEntries(from);
  const state = { aptCacheMissing: false };
  const kept = [];
  for (const entry of entries) {
    const path = resolve(from, entry);
    const reason = await rejectReason(path, entry, state);
    if (reason === null) kept.push(path);
    else {
      const prefix = reason === 'sha256 mismatch' ? '::warning::' : '';
      log(`${prefix}apt-archives: dropped ${safe(entry)}: ${reason}`);
    }
  }
  if (kept.length > 0) {
    const result = spawnSync('sudo', ['-n', 'cp', '--', ...kept, `${resolve(to)}/`], {
      stdio: 'inherit',
    });
    if (result.error || result.status !== 0) {
      log(`::error::apt-archives: copying verified archives failed (${failure(result, 'sudo')})`);
      return 1;
    }
  }
  const dropped = entries.length - kept.length;
  log(`apt-archives: restored ${kept.length} of ${entries.length} .deb files (${dropped} dropped)`);
  return 0;
}

/**
 * @param {string} from
 * @param {string} to
 */
function collect(from, to) {
  mkdirSync(to, { recursive: true });
  for (const entry of debEntries(to)) rmSync(join(to, entry), { recursive: true, force: true });
  const result = spawnSync('dpkg-query', ['-W', '-f', DPKG_FORMAT], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    log(`::error::apt-archives: dpkg-query failed (${failure(result, 'dpkg-query')})`);
    return 1;
  }
  const installed = parseInstalled(result.stdout);
  const entries = debEntries(from);
  let copied = 0;
  let bytes = 0;
  for (const entry of entries) {
    const path = join(from, entry);
    const stat = lstatSync(path);
    const deb = parseDebFileName(entry);
    if (!stat.isFile() || !deb || !installed.has(`${deb.name}|${deb.version}|${deb.arch}`)) {
      continue;
    }
    copyFileSync(path, join(to, entry));
    copied += 1;
    bytes += stat.size;
  }
  const megabytes = (bytes / (1024 * 1024)).toFixed(1);
  log(
    `apt archives: ${copied} .deb files, ${megabytes} MB (${entries.length - copied} not used by this install)`,
  );
  return 0;
}

/** @param {string[]} argv */
function parseOptions(argv) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      options: { from: { type: 'string' }, to: { type: 'string' } },
      allowPositionals: true,
      strict: true,
    });
  } catch (error) {
    throw new UsageError(/** @type {Error} */ (error).message);
  }
  const [command, ...stray] = parsed.positionals;
  if (command !== 'restore' && command !== 'collect') {
    throw new UsageError(`expected restore or collect, got "${command ?? ''}"`);
  }
  if (stray.length > 0) throw new UsageError(`unexpected argument "${stray[0]}"`);
  const { from, to } = parsed.values;
  if (!from) throw new UsageError('--from is required');
  if (!to) throw new UsageError('--to is required');
  return { command, from, to };
}

/** @param {string[]} argv */
async function main(argv) {
  const { command, from, to } = parseOptions(argv);
  return command === 'restore' ? restore(from, to) : collect(from, to);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    process.stderr.write(`apt-archives: usage: ${safe(error.message)}\n`);
    process.exitCode = 2;
  }
}
