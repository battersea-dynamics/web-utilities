import { useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import {
  readFile,
  download,
  parsePageRanges,
  formatBytes,
  pdfName,
  dropzoneStyle,
  buttonStyle,
  secondaryButtonStyle,
} from './pdfHelpers.js';

/**
 * One widget, four tools. All of them are "pick a PDF, choose some pages,
 * do a thing", so the differences are copy and one branch in `run()`.
 *
 * mode: 'extract' | 'delete' | 'rotate' | 'reorder'
 */
const COPY = {
  extract: {
    label: 'Pages to keep',
    placeholder: 'e.g. 1-3, 8, 12-',
    action: 'Extract pages',
    suffix: '-extract',
    hint: 'Everything else is discarded. The order you type is the order you get.',
  },
  delete: {
    label: 'Pages to delete',
    placeholder: 'e.g. 2, 5-7',
    action: 'Delete pages',
    suffix: '-trimmed',
    hint: 'All remaining pages stay in their original order.',
  },
  rotate: {
    label: 'Pages to rotate',
    placeholder: 'blank = every page',
    action: 'Rotate pages',
    suffix: '-rotated',
    hint: 'Leave blank to rotate the whole document.',
  },
  reorder: {
    label: 'New page order',
    placeholder: 'e.g. 3, 1, 2, 4-',
    action: 'Reorder pages',
    suffix: '-reordered',
    hint: 'List every page in the order you want. Pages you leave out are dropped.',
  },
};

export default function PdfPagesWidget({ mode = 'extract' }) {
  const copy = COPY[mode];

  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [ranges, setRanges] = useState('');
  const [angle, setAngle] = useState(90);
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
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const bytes = await readFile(file);
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const total = src.getPageCount();
      const selected = parsePageRanges(ranges, total);

      if (mode === 'rotate') {
        // Rotate in place, then save the same document.
        const targets = selected.length ? selected : src.getPageIndices();
        for (const i of targets) {
          const page = src.getPage(i);
          const current = page.getRotation().angle;
          page.setRotation(degrees((current + angle) % 360));
        }
        const out = await src.save();
        download(out, pdfName(file.name, copy.suffix));
        return;
      }

      let keep;
      if (mode === 'extract' || mode === 'reorder') {
        keep = selected;
        if (keep.length === 0) {
          setError('Enter at least one valid page number.');
          return;
        }
      } else {
        const drop = new Set(selected);
        keep = src.getPageIndices().filter((i) => !drop.has(i));
        if (keep.length === 0) {
          setError('That would delete every page.');
          return;
        }
      }

      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, keep);
      copied.forEach((p) => out.addPage(p));
      const saved = await out.save();
      download(saved, pdfName(file.name, copy.suffix));
    } catch {
      setError('Something went wrong processing that PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label style={dropzoneStyle} htmlFor="pdf">
        <input
          id="pdf"
          type="file"
          accept="application/pdf,.pdf"
          style={{ display: 'none' }}
          onChange={(e) => {
            pick(e.target.files);
            e.target.value = '';
          }}
        />
        <strong>{file ? 'Choose a different PDF' : 'Choose a PDF'}</strong>
        <div style={{ fontSize: '0.875rem', color: 'var(--ink-soft)', marginTop: '0.25rem' }}>
          Processed on your device — nothing is uploaded.
        </div>
      </label>

      {file && (
        <p style={{ margin: '0.9rem 0 0', fontSize: '0.9375rem' }}>
          <strong>{file.name}</strong>{' '}
          <span style={{ color: 'var(--ink-soft)' }}>
            {formatBytes(file.size)}
            {pageCount ? ` · ${pageCount} page${pageCount === 1 ? '' : 's'}` : ''}
          </span>
        </p>
      )}

      {file && (
        <div className="field-grid" style={{ marginTop: '1rem' }}>
          <div className="field" style={{ gridColumn: mode === 'rotate' ? 'auto' : '1 / -1' }}>
            <label htmlFor="ranges">{copy.label}</label>
            <input
              id="ranges"
              type="text"
              placeholder={copy.placeholder}
              value={ranges}
              onChange={(e) => setRanges(e.target.value)}
            />
          </div>

          {mode === 'rotate' && (
            <div className="field">
              <label htmlFor="angle">Rotate by</label>
              <select id="angle" value={angle} onChange={(e) => setAngle(Number(e.target.value))}>
                <option value={90}>90° clockwise</option>
                <option value={180}>180°</option>
                <option value={270}>90° anticlockwise</option>
              </select>
            </div>
          )}
        </div>
      )}

      {file && (
        <p style={{ margin: '0.6rem 0 0', fontSize: '0.8125rem', color: 'var(--ink-soft)' }}>
          {copy.hint}
        </p>
      )}

      {error && <p className="saving-note" style={{ marginTop: '1rem' }}>{error}</p>}

      {file && (
        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
          <button type="button" style={buttonStyle} onClick={run} disabled={busy}>
            {busy ? 'Working…' : copy.action}
          </button>
          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={() => {
              setFile(null);
              setRanges('');
              setPageCount(0);
              setError('');
            }}
          >
            Start over
          </button>
        </div>
      )}
    </div>
  );
}
