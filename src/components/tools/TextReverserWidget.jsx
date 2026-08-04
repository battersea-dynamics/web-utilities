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

  return (
    <div>
      <div className="field">
        <label htmlFor="text">Your text</label>
        <textarea id="text" className="textarea" rows={6} value={text}
          onChange={(e) => setText(e.target.value)} />
      </div>

      <div className="field-grid stack">
        <div className="field">
          <label htmlFor="mode">Reverse by</label>
          <select id="mode" value={mode} onChange={(e) => setMode(e.target.value)}>
            {Object.keys(modes).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="results results-block">
        <div className="row-end stack-sm">
          <button type="button" className="btn-ghost" onClick={copy} disabled={!text}>
            {copied ? 'Copied' : 'Copy result'}
          </button>
        </div>
        <textarea readOnly className="textarea" rows={6} value={output} />
      </div>
    </div>
  );
}
