export function downloadTextFile(content: string, filename: string, mimeType = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(content: string, filename: string): void {
  downloadTextFile(content, filename, 'text/csv;charset=utf-8');
}

export async function shareTextFile(
  content: string,
  filename: string,
  options?: { title?: string; mimeType?: string },
): Promise<'shared' | 'clipboard' | 'unsupported'> {
  const mimeType = options?.mimeType ?? 'text/plain;charset=utf-8';
  const file = new File([content], filename, { type: mimeType });

  if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: options?.title ?? filename, files: [file] });
    return 'shared';
  }

  if (typeof navigator.clipboard?.writeText === 'function') {
    await navigator.clipboard.writeText(content);
    return 'clipboard';
  }

  return 'unsupported';
}
