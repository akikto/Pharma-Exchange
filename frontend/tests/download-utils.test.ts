import { beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadCsv, downloadTextFile } from '@/lib/download-utils';

describe('download-utils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  });

  it('downloads text files via temporary anchor', () => {
    const click = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({ click, download: '', href: '' } as HTMLAnchorElement);

    downloadTextFile('hello', 'test.txt');
    expect(click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });

  it('downloads csv with csv mime type', () => {
    const click = vi.fn();
    const anchor = { click, download: '', href: '' } as HTMLAnchorElement;
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);

    downloadCsv('a,b', 'inventory.csv');
    expect(click).toHaveBeenCalled();
    expect(anchor.download).toBe('inventory.csv');
  });
});
