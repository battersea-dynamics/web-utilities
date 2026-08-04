import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { readFile, download, formatBytes } from './pdfHelpers.js';

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

  const remove = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));

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
    } catch {
      setError('Could not merge those files. One of them may be password-protected or damaged.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="dropzone" htmlFor="pdfs">
        <input
          id="pdfs"
          type="file"
          accept="application/pdf,.pdf"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <strong>Choose PDF files</strong>
        <span className="dropzone-hint">Add two or more. They stay on your device.</span>
      </label>

      {files.length > 0 && (
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
      )}

      {error && <p className="note note-warn">{error}</p>}

      <div className="row stack-lg">
        <button type="button" className="btn" onClick={merge} disabled={busy || files.length < 2}>
          {busy ? 'Merging…' : 'Merge PDFs'}
        </button>
        {files.length > 0 && (
          <button type="button" className="btn-ghost" onClick={() => setFiles([])}>Clear all</button>
        )}
      </div>
    </div>
  );
}
