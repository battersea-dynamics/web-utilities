import { useState } from 'react';
import { useNumber } from './useNumber.js';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import { readFile, download, formatBytes, pdfName } from './pdfHelpers.js';

export default function PdfWatermarkWidget() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [text, setText] = useState('DRAFT');
  const [opacity, setOpacity, opacityN] = useNumber(0.15, 0.15);
  const [angle, setAngle, angleN] = useNumber(45);
  const [fontSize, setFontSize, fontSizeN] = useNumber(60, 60);
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

  const run = async () => {
    if (!file || !text.trim()) {
      setError('Enter some watermark text.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const bytes = await readFile(file);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.HelveticaBold);

      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSizeN);
        const rad = (angleN * Math.PI) / 180;

        // Centre the rotated text by offsetting half its length along the
        // rotation vector.
        const x = width / 2 - (textWidth / 2) * Math.cos(rad);
        const y = height / 2 - (textWidth / 2) * Math.sin(rad);

        page.drawText(text, {
          x,
          y,
          size: fontSizeN,
          font,
          color: rgb(0.4, 0.4, 0.4),
          opacity: opacityN,
          rotate: degrees(angleN),
        });
      }

      const out = await doc.save();
      download(out, pdfName(file.name, '-watermarked'));
    } catch {
      setError('Could not add a watermark to that PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="dropzone" htmlFor="pdfwm">
        <input id="pdfwm" type="file" accept="application/pdf,.pdf" hidden
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
        <div className="field-grid stack">
          <div className="field field-wide">
            <label htmlFor="wmtext">Watermark text</label>
            <input id="wmtext" type="text" value={text} maxLength={40}
              onChange={(e) => setText(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="op">Opacity</label>
            <input id="op" type="number" min="0.05" max="1" step="0.05" value={opacity}
              onChange={(e) => setOpacity(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ang">Angle (°)</label>
            <input id="ang" type="number" min="0" max="90" step="5" value={angle}
              onChange={(e) => setAngle(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="wfs">Font size</label>
            <input id="wfs" type="number" min="10" max="140" step="5" value={fontSize}
              onChange={(e) => setFontSize(e.target.value)} />
          </div>
        </div>
      )}

      {error && <p className="note note-warn">{error}</p>}

      {file && (
        <div className="row stack-lg">
          <button type="button" className="btn" onClick={run} disabled={busy}>
            {busy ? 'Working…' : 'Add watermark'}
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
