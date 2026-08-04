import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  readFile,
  download,
  formatBytes,
  dropzoneStyle,
  buttonStyle,
  secondaryButtonStyle,
} from './pdfHelpers.js';

export default function PdfMergeWidget() {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const addFiles = (list) => {
    const pdfs = Array.from(list).filter(
      (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name)
    );
    if (pdfs.length === 0) {
      setError('Those files are not PDFs.');
      return;
    }
    setError('');
    setFiles((prev) => [...prev, ...pdfs]);
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

  const remove = (index) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  const merge = async () => {
    if (files.length < 2) {
      setError('Add at least two PDFs to merge.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const merged = await PDFDocument.create();
      for (const file of files) {
        const bytes = await readFile(file);
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const out = await merged.save();
      download(out, 'merged.pdf');
    } catch (e) {
      setError(
        'Could not merge those files. One of them may be password-protected or damaged.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label style={dropzoneStyle} htmlFor="pdfs">
        <input
          id="pdfs"
          type="file"
          accept="application/pdf,.pdf"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <strong>Choose PDF files</strong>
        <div style={{ fontSize: '0.875rem', color: 'var(--ink-soft)', marginTop: '0.25rem' }}>
          Add two or more. They stay on your device.
        </div>
      </label>

      {files.length > 0 && (
        <ol style={{ margin: '1.25rem 0 0', paddingLeft: '1.25rem' }}>
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} style={{ marginBottom: '0.4rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ minWidth: 0, wordBreak: 'break-word' }}>
                  {f.name}{' '}
                  <span style={{ color: 'var(--ink-soft)', fontSize: '0.8125rem' }}>
                    {formatBytes(f.size)}
                  </span>
                </span>
                <span style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                  <button type="button" style={secondaryButtonStyle}
                    onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                  <button type="button" style={secondaryButtonStyle}
                    onClick={() => move(i, 1)} disabled={i === files.length - 1}>↓</button>
                  <button type="button" style={secondaryButtonStyle}
                    onClick={() => remove(i)}>Remove</button>
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}

      {error && <p className="saving-note" style={{ marginTop: '1rem' }}>{error}</p>}

      <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button type="button" style={buttonStyle} onClick={merge} disabled={busy || files.length < 2}>
          {busy ? 'Merging…' : 'Merge PDFs'}
        </button>
        {files.length > 0 && (
          <button type="button" style={secondaryButtonStyle} onClick={() => setFiles([])}>
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
