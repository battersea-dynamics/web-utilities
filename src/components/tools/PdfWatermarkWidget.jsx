import { useState } from 'react';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import {
  readFile,
  download,
  formatBytes,
  pdfName,
  dropzoneStyle,
  buttonStyle,
  secondaryButtonStyle,
} from './pdfHelpers.js';

export default function PdfWatermarkWidget() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [text, setText] = useState('DRAFT');
  const [opacity, setOpacity] = useState(0.15);
  const [angle, setAngle] = useState(45);
  const [fontSize, setFontSize] = useState(60);
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
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const rad = (angle * Math.PI) / 180;

        // Centre the rotated text by offsetting half its length along the
        // rotation vector.
        const x = width / 2 - (textWidth / 2) * Math.cos(rad);
        const y = height / 2 - (textWidth / 2) * Math.sin(rad);

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.4, 0.4, 0.4),
          opacity,
          rotate: degrees(angle),
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
      <label style={dropzoneStyle} htmlFor="pdfwm">
        <input id="pdfwm" type="file" accept="application/pdf,.pdf" style={{ display: 'none' }}
          onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
        <strong>{file ? 'Choose a different PDF' : 'Choose a PDF'}</strong>
        <div style={{ fontSize: '0.875rem', color: 'var(--ink-soft)', marginTop: '0.25rem' }}>
          Processed on your device — nothing is uploaded.
        </div>
      </label>

      {file && (
        <p style={{ margin: '0.9rem 0 0', fontSize: '0.9375rem' }}>
          <strong>{file.name}</strong>{' '}
          <span style={{ color: 'var(--ink-soft)' }}>
            {formatBytes(file.size)}{pageCount ? ` · ${pageCount} pages` : ''}
          </span>
        </p>
      )}

      {file && (
        <div className="field-grid" style={{ marginTop: '1rem' }}>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="wmtext">Watermark text</label>
            <input id="wmtext" type="text" value={text} maxLength={40}
              onChange={(e) => setText(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="op">Opacity</label>
            <input id="op" type="number" min="0.05" max="1" step="0.05" value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="ang">Angle (°)</label>
            <input id="ang" type="number" min="0" max="90" step="5" value={angle}
              onChange={(e) => setAngle(Number(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="wfs">Font size</label>
            <input id="wfs" type="number" min="10" max="140" step="5" value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))} />
          </div>
        </div>
      )}

      {error && <p className="saving-note" style={{ marginTop: '1rem' }}>{error}</p>}

      {file && (
        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
          <button type="button" style={buttonStyle} onClick={run} disabled={busy}>
            {busy ? 'Working…' : 'Add watermark'}
          </button>
          <button type="button" style={secondaryButtonStyle}
            onClick={() => { setFile(null); setPageCount(0); setError(''); }}>
            Start over
          </button>
        </div>
      )}
    </div>
  );
}
