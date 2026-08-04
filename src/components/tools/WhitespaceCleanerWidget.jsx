import { useState, useMemo } from 'react';

export default function WhitespaceCleanerWidget() {
  const [text, setText] = useState('');
  const [collapseSpaces, setCollapseSpaces] = useState(true);
  const [collapseBlankLines, setCollapseBlankLines] = useState(true);
  const [trimLines, setTrimLines] = useState(true);
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    let result = text.replace(/\t/g, ' ').replace(/\r\n?/g, '\n');
    if (trimLines) {
      result = result.split('\n').map((l) => l.trim()).join('\n');
    }
    if (collapseSpaces) {
      result = result.replace(/ {2,}/g, ' ');
    }
    if (collapseBlankLines) {
      result = result.replace(/\n{3,}/g, '\n\n');
    }
    return result.trim();
  }, [text, collapseSpaces, collapseBlankLines, trimLines]);

  const copy = () => {
    navigator.clipboard?.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div>
      <div className="field">
        <label htmlFor="text">Your text</label>
        <textarea id="text" className="textarea" rows={10}
          placeholder="Paste messy text here…"
          value={text} onChange={(e) => setText(e.target.value)} />
      </div>

      <div className="check-row">
        <label className="check">
          <input type="checkbox" checked={trimLines}
            onChange={(e) => setTrimLines(e.target.checked)} />
          Trim each line
        </label>
        <label className="check">
          <input type="checkbox" checked={collapseSpaces}
            onChange={(e) => setCollapseSpaces(e.target.checked)} />
          Collapse repeated spaces
        </label>
        <label className="check">
          <input type="checkbox" checked={collapseBlankLines}
            onChange={(e) => setCollapseBlankLines(e.target.checked)} />
          Collapse blank lines
        </label>
      </div>

      {text && (
        <div className="results results-block">
          <div className="row-end stack-sm">
            <button type="button" className="btn-ghost" onClick={copy}>
              {copied ? 'Copied' : 'Copy result'}
            </button>
          </div>
          <textarea readOnly className="textarea" rows={10} value={output} />
        </div>
      )}
    </div>
  );
}
