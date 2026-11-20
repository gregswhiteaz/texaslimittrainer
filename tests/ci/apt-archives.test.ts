import { describe, expect, it } from 'vitest';
import { parseAptRecords, parseDebFileName, parseInstalled } from '../../tools/ci/apt-archives.js';

describe('apt-archives parsers', () => {
  it('parses apt file names, records and installed packages', () => {
    expect(parseDebFileName('libbar_2%3a0.9_all.deb')).toEqual({
      name: 'libbar',
      version: '2:0.9',
      arch: 'all',
    });
    expect(parseDebFileName('libfoo1_1.2-3_amd64.deb')).toEqual({
      name: 'libfoo1',
      version: '1.2-3',
      arch: 'amd64',
    });
    expect(parseDebFileName('libc++1_1%3A18.1~u1_amd64.deb')?.version).toBe('1:18.1~u1');
    for (const bad of [
      'evil.deb',
      '-x_1_amd64.deb',
      'a_1_amd64.deb.part',
      'a_1%2f_amd64.deb',
      'a/b_1_amd64.deb',
      'a_1_amd64.deb\nb_1_amd64.deb',
      'a_1\n_amd64.deb',
    ]) {
      expect(parseDebFileName(bad), bad).toBeNull();
    }

    const records = parseAptRecords(
      [
        'Package: libfoo1',
        'Architecture: amd64',
        'Version: 1.2-3',
        'Filename: pool/main/libf/libfoo1_1.2-3_amd64.deb',
        'SHA256: ABCDEF0123',
        '',
        'Package: libnosha',
        'Architecture: amd64',
        'Version: 1.0',
        '',
        'Package: libbar',
        'Architecture: all',
        'Version: 2:0.9',
        'SHA256: 99aa',
        '',
      ].join('\n'),
    );
    expect(records).toEqual([
      { package: 'libfoo1', version: '1.2-3', architecture: 'amd64', sha256: 'abcdef0123' },
      { package: 'libbar', version: '2:0.9', architecture: 'all', sha256: '99aa' },
    ]);
    expect(parseAptRecords('')).toEqual([]);

    const installed = parseInstalled(
      [
        'libfoo1\t1.2-3\tamd64\tii ',
        'libgone\t1.0\tamd64\trc ',
        'libhalf\t2.0\tamd64\tiU ',
        'libbar\t2:0.9\tall\tii ',
        '',
      ].join('\n'),
    );
    expect([...installed].sort()).toEqual(['libbar|2:0.9|all', 'libfoo1|1.2-3|amd64']);
  });
});
