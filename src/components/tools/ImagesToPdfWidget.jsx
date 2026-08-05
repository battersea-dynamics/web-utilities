import { useState } from 'react';
import { useNumber } from './useNumber.js';
import { PDFDocument } from 'pdf-lib';
import { readFile, download, formatBytes } from './pdfHelpers.js';

// Page sizes in PDF points (72 per inch).
const PAGE_SIZES = {
  A4: [595.28, 841.89],
  Letter: [612, 792],
  Legal: [612, 1008],
};

export default function ImagesToPdfWidget() {
  const [files, setFiles] = useState([]);
  const [size, setSize] = useState('A4');
  const [orientation, setOrientation] = useState('auto');
  const [margin, setMargin, marginN] = useNumber(36);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const addFiles = (list) => {
    const imgs = Array.from(list).filter((f) => /^image\/(jpeg|png)$/.test(f.type));
    if (imgs.length === 0) {
      setError('Only JPG and PNG images are supported.');
      return;
    }
    setError('');
    setFiles((prev) => [...prev, ...imgs]);
  };

  const move = (index, delta) => {
    setFiles((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const build = async () => {
    if (files.length === 0) return;
    setBusy(true);
    setError('');
    try {
      const doc = await PDFDocument.create();

      for (const file of files) {
        const bytes = await readFile(file);
        const image =
          file.type === 'image/png' ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);

        let [w, h] = PAGE_SIZES[size];
        const landscape =
          orientation === 'landscape' ||
          (orientation === 'auto' && image.width > image.height);
        if (landscape) [w, h] = [h, w];

        const page = doc.addPage([w, h]);
        const usableW = w - marginN * 2;
        const usableH = h - marginN * 2;
        // Scale to fit inside the margins without distorting the image.
        const scale = Math.min(usableW / image.width, usableH / image.height);
        const drawW = image.width * scale;
        const drawH = image.height * scale;

        page.drawImage(image, {
          x: (w - drawW) / 2,
          y: (h - drawH) / 2,
          width: drawW,
          height: drawH,
        });
      }

      const out = await doc.save();
      download(out, 'images.pdf');
    } catch {
      setError('Could not build the PDF. One of the images may be damaged.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="dropzone" htmlFor="imgs">
        <input id="imgs" type="file" accept="image/jpeg,image/png" multiple hidden
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        <strong>Choose images</strong>
        <span className="dropzone-hint">JPG or PNG. One image per page, in the order shown.</span>
      </label>

      {files.length > 0 && (
        <>
          <ol className="file-list">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`}>
                <div className="file-row">
                  <span className="file-name">
                    {f.name} <span className="muted">{formatBytes(f.size)}</span>
                  </span>
                  <span className="file-actions">
                    <button type="button" className="btn-ghost" onClick={() => move(i, -1)}
                      disabled={i === 0} aria-label="Move up">↑</button>
                    <button type="button" className="btn-ghost" onClick={() => move(i, 1)}
                      disabled={i === files.length - 1} aria-label="Move down">↓</button>
                    <button type="button" className="btn-ghost" onClick={() => remove(i)}>Remove</button>
                  </span>
                </div>
              </li>
            ))}
          </ol>

          <div className="field-grid stack-lg">
            <div className="field">
              <label htmlFor="size">Page size</label>
              <select id="size" value={size} onChange={(e) => setSize(e.target.value)}>
                <option value="A4">A4</option>
                <option value="Letter">Letter</option>
                <option value="Legal">Legal</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="orient">Orientation</label>
              <select id="orient" value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                <option value="auto">Match each image</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="margin">Margin (pt)</label>
              <input id="margin" type="number" min="0" max="144" step="6" value={margin}
                onChange={(e) => setMargin(e.target.value)} />
            </div>
          </div>
        </>
      )}

      {error && <p className="note note-warn">{error}</p>}

      <div className="row stack-lg">
        <button type="button" className="btn" onClick={build} disabled={busy || files.length === 0}>
          {busy ? 'Building…' : 'Create PDF'}
        </button>
        {files.length > 0 && (
          <button type="button" className="btn-ghost" onClick={() => setFiles([])}>Clear all</button>
        )}
      </div>
    </div>
  );
}
