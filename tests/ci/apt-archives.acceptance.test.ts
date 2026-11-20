import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../support/sandbox';

const APT_ARCHIVES = join(REPO_ROOT, 'tools/ci/apt-archives.js');

let dir: string;
let bin: string;
let cache: string;
let archives: string;
let calls: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'tlh-apt-archives-'));
  bin = join(dir, 'bin');
  cache = join(dir, 'cache');
  archives = join(dir, 'archives');
  calls = join(dir, 'calls');
  for (const path of [bin, cache, archives]) mkdirSync(path);
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const sha256 = (data: string) => createHash('sha256').update(data).digest('hex');

function fake(name: string, script: string): void {
  const path = join(bin, name);
  writeFileSync(path, `#!/bin/sh\n${script}\n`);
  chmodSync(path, 0o755);
}

/** A fake `sudo` that records its arguments, then drops `-n` and runs the rest (or exits `code`). */
function fakeSudo(code?: number): void {
  fake(
    'sudo',
    `printf "%s\\n" "sudo $*" >> ${JSON.stringify(calls)}\n` +
      (code === undefined ? '[ "$1" = "-n" ] && shift\nexec "$@"' : `exit ${code}`),
  );
}

/** A fake `apt-cache` that records its arguments and prints `records[spec]`, or exits 100. */
function fakeAptCache(records: Record<string, string>): void {
  const cases = Object.entries(records)
    .map(([spec, text]) => `  ${JSON.stringify(spec)}) printf '%s\\n' '${text}' ;;`)
    .join('\n');
  fake(
    'apt-cache',
    `printf "%s\\n" "apt-cache $*" >> ${JSON.stringify(calls)}\ncase "$2" in\n${cases}\n  *) echo "E: No packages found" >&2; exit 100 ;;\nesac`,
  );
}

const record = (pkg: string, version: string, arch: string, sha: string) =>
  `Package: ${pkg}\nArchitecture: ${arch}\nVersion: ${version}\nSHA256: ${sha}\n`;

function run(args: string[], path = `${bin}${delimiter}${process.env.PATH ?? ''}`) {
  const child = spawn(process.execPath, [APT_ARCHIVES, ...args], {
    env: { ...process.env, PATH: path },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
  child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve) => {
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

const callLog = () => (existsSync(calls) ? readFileSync(calls, 'utf8') : '');

describe('apt-archives restore', () => {
  it('restore drops a tampered .deb and copies only archives that match the signed index', async () => {
    const foo = 'genuine libfoo1 archive';
    writeFileSync(join(cache, 'libfoo1_1.2-3_amd64.deb'), foo);
    writeFileSync(join(cache, 'libbar_2%3a0.9_all.deb'), 'tampered libbar archive');
    writeFileSync(join(cache, 'libold_1.0_amd64.deb'), 'old archive');
    writeFileSync(join(cache, 'evil.deb'), 'evil');
    symlinkSync(join(cache, 'libfoo1_1.2-3_amd64.deb'), join(cache, 'link_1.0_amd64.deb'));
    writeFileSync(join(cache, 'notes.txt'), 'not an archive');
    fakeAptCache({
      'libfoo1:amd64=1.2-3': record('libfoo1', '1.2-3', 'amd64', sha256(foo).toUpperCase()),
      'libbar=2:0.9': record('libbar', '2:0.9', 'all', sha256('genuine libbar archive')),
      'link:amd64=1.0': record('link', '1.0', 'amd64', sha256(foo)),
    });
    fakeSudo();

    const result = await run(['restore', '--from', cache, '--to', archives]);

    expect(result.code, result.stderr).toBe(0);
    expect(readdirSync(archives)).toEqual(['libfoo1_1.2-3_amd64.deb']);
    expect(readFileSync(join(archives, 'libfoo1_1.2-3_amd64.deb'), 'utf8')).toBe(foo);
    expect(result.stdout).toContain(
      '::warning::apt-archives: dropped libbar_2%3a0.9_all.deb: sha256 mismatch\n',
    );
    expect(result.stdout).toContain(
      'apt-archives: dropped libold_1.0_amd64.deb: not in the apt index\n',
    );
    expect(result.stdout).toContain('apt-archives: dropped evil.deb: unrecognised file name\n');
    expect(result.stdout).toContain(
      'apt-archives: dropped link_1.0_amd64.deb: not a regular file\n',
    );
    expect(result.stdout).toContain('apt-archives: restored 1 of 5 .deb files (4 dropped)\n');
    const log = callLog();
    expect(log).toContain('apt-cache show libbar=2:0.9\n');
    expect(log).toContain('apt-cache show libfoo1:amd64=1.2-3\n');
    expect(log).toContain('apt-cache show libold:amd64=1.0\n');
    expect(log).not.toContain('link');
    expect(log).toContain(`sudo -n cp -- ${join(cache, 'libfoo1_1.2-3_amd64.deb')} ${archives}/\n`);
  });

  it('restore copies nothing when apt-cache is unavailable, accepts a missing cache and fails when the copy fails', async () => {
    const foo = 'genuine libfoo1 archive';
    writeFileSync(join(cache, 'libfoo1_1.2-3_amd64.deb'), foo);
    fakeSudo();
    const unavailable = await run(['restore', '--from', cache, '--to', archives], bin);
    expect(unavailable.code, unavailable.stderr).toBe(0);
    expect(readdirSync(archives)).toEqual([]);
    expect(callLog()).toBe('');
    expect(unavailable.stdout).toContain(
      'apt-archives: dropped libfoo1_1.2-3_amd64.deb: apt-cache unavailable\n',
    );
    expect(unavailable.stdout).toContain('restored 0 of 1 .deb files (1 dropped)');

    const missing = await run(['restore', '--from', join(dir, 'nowhere'), '--to', archives]);
    expect(missing.code, missing.stderr).toBe(0);
    expect(missing.stdout).toContain('apt-archives: restored 0 of 0 .deb files (0 dropped)\n');

    fakeAptCache({ 'libfoo1:amd64=1.2-3': record('libfoo1', '1.2-3', 'amd64', sha256(foo)) });
    fakeSudo(1);
    const failed = await run(['restore', '--from', cache, '--to', archives]);
    expect(failed.code).toBe(1);
    expect(failed.stdout).toContain(
      '::error::apt-archives: copying verified archives failed (exit code 1)\n',
    );
    expect(failed.stdout).not.toContain('restored');
  });
});

describe('apt-archives collect', () => {
  it('collect rebuilds the cache with only the archives installed at that version', async () => {
    for (const name of [
      'libfoo1_1.2-3_amd64.deb',
      'libnew_4.0_amd64.deb',
      'libfoo1_1.1-0_amd64.deb',
      'libgone_1.0_amd64.deb',
    ]) {
      writeFileSync(join(archives, name), `archive ${name}`);
    }
    mkdirSync(join(archives, 'partial'));
    writeFileSync(join(archives, 'lock'), '');
    writeFileSync(join(cache, 'libbar_2%3a0.9_all.deb'), 'tampered libbar archive');
    writeFileSync(join(cache, 'libfoo1_1.2-3_amd64.deb'), 'stale copy');
    fake(
      'dpkg-query',
      `printf "%s\\n" "dpkg-query $*" >> ${JSON.stringify(calls)}\n` +
        "printf 'libfoo1\\t1.2-3\\tamd64\\tii \\nlibnew\\t4.0\\tamd64\\tii \\nlibgone\\t1.0\\tamd64\\trc \\n'",
    );

    const result = await run(['collect', '--from', archives, '--to', cache]);

    expect(result.code, result.stderr).toBe(0);
    expect(readdirSync(cache).sort()).toEqual(['libfoo1_1.2-3_amd64.deb', 'libnew_4.0_amd64.deb']);
    expect(readFileSync(join(cache, 'libfoo1_1.2-3_amd64.deb'), 'utf8')).toBe(
      'archive libfoo1_1.2-3_amd64.deb',
    );
    expect(result.stdout).toContain('apt archives: 2 .deb files');
    expect(result.stdout).toContain('(2 not used by this install)');
    expect(callLog()).toContain('dpkg-query -W -f ${Package}\\t${Version}');

    const fresh = join(dir, 'fresh', 'apt-archives');
    const created = await run(['collect', '--from', archives, '--to', fresh]);
    expect(created.code, created.stderr).toBe(0);
    expect(readdirSync(fresh).sort()).toEqual(['libfoo1_1.2-3_amd64.deb', 'libnew_4.0_amd64.deb']);
  });

  it('collect fails when dpkg-query fails and bad usage exits 2', async () => {
    writeFileSync(join(archives, 'libfoo1_1.2-3_amd64.deb'), 'archive');
    fake('dpkg-query', 'echo "dpkg-query: error" >&2\nexit 2');
    const failed = await run(['collect', '--from', archives, '--to', cache]);
    expect(failed.code).toBe(1);
    expect(failed.stdout).toContain('::error::apt-archives: dpkg-query failed (exit code 2)\n');
    expect(readdirSync(cache)).toEqual([]);

    for (const args of [
      ['prune', '--from', 'a', '--to', 'b'],
      ['restore', '--from', 'a'],
      ['collect', '--to', 'b'],
      ['restore', 'extra', '--from', 'a', '--to', 'b'],
      ['restore', '--from', 'a', '--to', 'b', '--force'],
      [],
    ]) {
      const usage = await run(args);
      expect(usage.code, args.join(' ')).toBe(2);
      expect(usage.stderr, args.join(' ')).toMatch(/^apt-archives: usage: /);
    }
  });
});
