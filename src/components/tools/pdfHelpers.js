// Shared helpers for the PDF tools. Everything here runs in the browser —
// no file is ever uploaded anywhere, which is the main thing these tools
// have over the big online PDF services.
//
// Presentation lives in global.css; this file is behaviour only.

/** Read a File/Blob into an ArrayBuffer. */
export function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsArrayBuffer(file);
  });
}

/** Trigger a browser download for the given bytes. */
export function download(bytes, filename, type = 'application/pdf') {
  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the download a moment to start before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Parse a page-range string like "1-3, 7, 10-12" into zero-based indices.
 * `total` bounds the result and lets us support "3-" meaning "3 to the end".
 * Returns indices in the order written, so it doubles as a reorder spec.
 */
export function parsePageRanges(input, total) {
  if (!input || !input.trim()) return [];
  const out = [];
  for (const rawPart of input.split(',')) {
    const part = rawPart.trim();
    if (!part) continue;

    const range = part.match(/^(\d+)\s*-\s*(\d*)$/);
    if (range) {
      const start = parseInt(range[1], 10);
      const end = range[2] ? parseInt(range[2], 10) : total;
      if (!start || start > end) continue;
      for (let p = start; p <= Math.min(end, total); p++) out.push(p - 1);
      continue;
    }

    const single = part.match(/^(\d+)$/);
    if (single) {
      const p = parseInt(single[1], 10);
      if (p >= 1 && p <= total) out.push(p - 1);
    }
  }
  return out;
}

/** Human-readable file size. */
export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Swap a .pdf extension onto a name, or append one. */
export function pdfName(original, suffix) {
  const base = original.replace(/\.pdf$/i, '');
  return `${base}${suffix}.pdf`;
}
