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
      result = result
        .split('\n')
        .map((l) => l.trim())
        .join('\n');
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

  const areaStyle = {
    font: 'inherit',
    padding: '0.7rem',
    border: '1px solid var(--rule)',
    borderRadius: '4px',
    background: 'var(--paper)',
    color: 'var(--ink)',
    width: '100%',
    resize: 'vertical',
  };

  return (
    <div>
      <div className="field">
        <label htmlFor="text">Your text</label>
        <textarea id="text" rows={10} style={areaStyle} placeholder="Paste messy text here…" value={text} onChange={(e) => setText(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', fontSize: '0.9375rem', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <input type="checkbox" checked={trimLines} onChange={(e) => setTrimLines(e.target.checked)} />
          Trim each line
        </label>
        <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <input type="checkbox" checked={collapseSpaces} onChange={(e) => setCollapseSpaces(e.target.checked)} />
          Collapse repeated spaces
        </label>
        <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <input type="checkbox" checked={collapseBlankLines} onChange={(e) => setCollapseBlankLines(e.target.checked)} />
          Collapse blank lines
        </label>
      </div>

      {text && (
        <div className="results" style={{ display: 'block' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
            <button
              type="button"
              onClick={copy}
              style={{
                font: 'inherit',
                fontSize: '0.8125rem',
                padding: '0.4rem 0.7rem',
                border: '1px solid var(--rule)',
                borderRadius: '4px',
                background: 'var(--surface)',
                color: 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              {copied ? 'Copied' : 'Copy result'}
            </button>
          </div>
          <textarea readOnly rows={10} style={areaStyle} value={output} />
        </div>
      )}
    </div>
  );
}
