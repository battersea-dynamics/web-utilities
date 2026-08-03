import { useState, useMemo } from 'react';

export default function DuplicateLineRemoverWidget() {
  const [text, setText] = useState('');
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [trim, setTrim] = useState(true);
  const [copied, setCopied] = useState(false);

  const { output, removedCount } = useMemo(() => {
    const lines = text.split('\n');
    const seen = new Set();
    const kept = [];
    let removed = 0;

    for (const raw of lines) {
      const line = trim ? raw.trim() : raw;
      const key = ignoreCase ? line.toLowerCase() : line;
      if (seen.has(key)) {
        removed++;
        continue;
      }
      seen.add(key);
      kept.push(line);
    }

    return { output: kept.join('\n'), removedCount: removed };
  }, [text, ignoreCase, trim]);

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
        <label htmlFor="text">Your list</label>
        <textarea
          id="text"
          rows={10}
          style={areaStyle}
          placeholder={'one\ntwo\none\nthree'}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', fontSize: '0.9375rem' }}>
        <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <input type="checkbox" checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} />
          Ignore case
        </label>
        <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <input type="checkbox" checked={trim} onChange={(e) => setTrim(e.target.checked)} />
          Trim whitespace
        </label>
      </div>

      {text && (
        <div className="results" style={{ display: 'block' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <span className="label">{removedCount} duplicate{removedCount === 1 ? '' : 's'} removed</span>
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
