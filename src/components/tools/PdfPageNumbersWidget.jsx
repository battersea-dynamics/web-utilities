import { useState } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { readFile, download, formatBytes, pdfName } from './pdfHelpers.js';

const POSITIONS = {
  'bottom-centre': 'Bottom centre',
  'bottom-right': 'Bottom right',
  'bottom-left': 'Bottom left',
  'top-centre': 'Top centre',
  'top-right': 'Top right',
  'top-left': 'Top left',
};

export default function PdfPageNumbersWidget() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [position, setPosition] = useState('bottom-centre');
  const [format, setFormat] = useState('n');
  const [startAt, setStartAt] = useState(1);
  const [skipFirst, setSkipFirst] = useState(false);
  const [fontSize, setFontSize] = useState(11);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (list) => {
    const f = list && list[0];
    if (!f) return;
    setError('');
    setFile(f);
    setPageCount(0);
    try {
      const bytes = await readFile(f);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
    } catch {
      setError('Could not read that PDF. It may be password-protected or damaged.');
      setFile(null);
    }
  };

  const label = (num, total) => {
    if (format === 'n-of-total') return `${num} of ${total}`;
    if (format === 'page-n') return `Page ${num}`;
    if (format === 'dashes') return `— ${num} —`;
    return String(num);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const bytes = await readFile(file);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const numbered = skipFirst ? pages.length - 1 : pages.length;

      pages.forEach((page, i) => {
        if (skipFirst && i === 0) return;
        const shown = startAt + (skipFirst ? i - 1 : i);
        const text = label(shown, numbered + startAt - 1);
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const pad = 28;

        let x = (width - textWidth) / 2;
        if (position.endsWith('right')) x = width - textWidth - pad;
        if (position.endsWith('left')) x = pad;

        const y = position.startsWith('top') ? height - pad - fontSize : pad;

        page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.15, 0.15, 0.15) });
      });

      const out = await doc.save();
      download(out, pdfName(file.name, '-numbered'));
    } catch {
      setError('Could not add page numbers to that PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="dropzone" htmlFor="pdfnum">
        <input id="pdfnum" type="file" accept="application/pdf,.pdf" hidden
          onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
        <strong>{file ? 'Choose a different PDF' : 'Choose a PDF'}</strong>
        <span className="dropzone-hint">Processed on your device — nothing is uploaded.</span>
      </label>

      {file && (
        <p className="stack">
          <strong>{file.name}</strong>{' '}
          <span className="muted">
            {formatBytes(file.size)}{pageCount ? ` · ${pageCount} pages` : ''}
          </span>
        </p>
      )}

      {file && (
        <>
          <div className="field-grid stack">
            <div className="field">
              <label htmlFor="pos">Position</label>
              <select id="pos" value={position} onChange={(e) => setPosition(e.target.value)}>
                {Object.entries(POSITIONS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="fmt">Format</label>
              <select id="fmt" value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="n">1</option>
                <option value="page-n">Page 1</option>
                <option value="n-of-total">1 of 10</option>
                <option value="dashes">— 1 —</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="start">Start numbering at</label>
              <input id="start" type="number" min="1" value={startAt}
                onChange={(e) => setStartAt(Math.max(1, Number(e.target.value)))} />
            </div>
            <div className="field">
              <label htmlFor="fs">Font size</label>
              <input id="fs" type="number" min="6" max="24" value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))} />
            </div>
          </div>

          <div className="check-row">
            <label className="check">
              <input type="checkbox" checked={skipFirst}
                onChange={(e) => setSkipFirst(e.target.checked)} />
              Skip the first page (useful for cover pages)
            </label>
          </div>
        </>
      )}

      {error && <p className="note note-warn">{error}</p>}

      {file && (
        <div className="row stack-lg">
          <button type="button" className="btn" onClick={run} disabled={busy}>
            {busy ? 'Working…' : 'Add page numbers'}
          </button>
          <button type="button" className="btn-ghost"
            onClick={() => { setFile(null); setPageCount(0); setError(''); }}>
            Start over
          </button>
        </div>
      )}
    </div>
  );
}
