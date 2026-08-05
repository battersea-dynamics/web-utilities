import { useState } from 'react';
import { uuid } from './devEngine.js';

export default function UuidWidget() {
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [braces, setBraces] = useState(false);
  const [list, setList] = useState(() => Array.from({ length: 5 }, uuid));
  const [copied, setCopied] = useState(false);

  const generate = () => setList(Array.from({ length: count }, uuid));

  const format = (u) => {
    let s = uppercase ? u.toUpperCase() : u;
    return braces ? `{${s}}` : s;
  };

  const output = list.map(format).join('\n');

  const copy = () => {
    navigator.clipboard?.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="count">How many</label>
          <input id="count" type="number" min="1" max="500" value={count}
            onChange={(e) => setCount(Math.min(500, Math.max(1, Number(e.target.value) || 1)))} />
        </div>
      </div>

      <div className="check-row">
        <label className="check">
          <input type="checkbox" checked={uppercase}
            onChange={(e) => setUppercase(e.target.checked)} />
          Uppercase
        </label>
        <label className="check">
          <input type="checkbox" checked={braces}
            onChange={(e) => setBraces(e.target.checked)} />
          Wrap in braces
        </label>
      </div>

      <div className="row stack-lg">
        <button type="button" className="btn" onClick={generate}>Generate</button>
        <button type="button" className="btn-ghost" onClick={copy}>
          {copied ? 'Copied' : 'Copy all'}
        </button>
      </div>

      <div className="results results-block">
        <div className="label">{list.length} generated</div>
        <textarea readOnly className="textarea textarea-mono stack-sm"
          rows={Math.min(12, list.length + 1)} value={output} />
      </div>

      <p className="muted-block">
        These are version 4 UUIDs — 122 random bits produced by your browser's
        cryptographic random number generator. They are generated locally and
        never transmitted, so they are safe to use as real identifiers.
      </p>
    </div>
  );
}
