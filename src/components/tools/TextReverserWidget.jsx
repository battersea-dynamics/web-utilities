import { useState, useMemo } from 'react';

function reverseLetters(t) {
  return t.split('\n').map((line) => [...line].reverse().join('')).join('\n');
}
function reverseWords(t) {
  return t
    .split('\n')
    .map((line) => line.split(/\s+/).filter(Boolean).reverse().join(' '))
    .join('\n');
}
function reverseLines(t) {
  return t.split('\n').reverse().join('\n');
}

const modes = {
  'Letter by letter': reverseLetters,
  'Word by word': reverseWords,
  'Line by line': reverseLines,
};

export default function TextReverserWidget() {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('Letter by letter');
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => modes[mode](text), [text, mode]);

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
        <textarea id="text" rows={6} style={areaStyle} value={text} onChange={(e) => setText(e.target.value)} />
      </div>

      <div className="field-grid" style={{ marginTop: '1rem' }}>
        <div className="field">
          <label htmlFor="mode">Reverse by</label>
          <select id="mode" value={mode} onChange={(e) => setMode(e.target.value)}>
            {Object.keys(modes).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="results" style={{ display: 'block' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
          <button
            type="button"
            onClick={copy}
            disabled={!text}
            style={{
              font: 'inherit',
              fontSize: '0.8125rem',
              padding: '0.4rem 0.7rem',
              border: '1px solid var(--rule)',
              borderRadius: '4px',
              background: 'var(--surface)',
              color: 'var(--ink)',
              cursor: text ? 'pointer' : 'default',
            }}
          >
            {copied ? 'Copied' : 'Copy result'}
          </button>
        </div>
        <textarea readOnly rows={6} style={areaStyle} value={output} />
      </div>
    </div>
  );
}
