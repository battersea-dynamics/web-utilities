import { useState, useMemo } from 'react';
import { urlEncode, urlDecode } from './devEngine.js';

export default function UrlEncoderWidget() {
  const [mode, setMode] = useState('encode');
  const [input, setInput] = useState('');
  const [component, setComponent] = useState(true);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input) return { ok: true, value: '' };
    return mode === 'encode'
      ? { ok: true, value: urlEncode(input, component) }
      : urlDecode(input, component);
  }, [input, mode, component]);

  const copy = () => {
    navigator.clipboard?.writeText(result.value || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div>
      <div className="field">
        <label>Direction</label>
        <div className="seg stack-sm">
          <button type="button" className="seg-btn" aria-pressed={mode === 'encode'}
            onClick={() => setMode('encode')}>Encode</button>
          <button type="button" className="seg-btn" aria-pressed={mode === 'decode'}
            onClick={() => setMode('decode')}>Decode</button>
        </div>
      </div>

      <div className="field stack">
        <label htmlFor="in">{mode === 'encode' ? 'Text or URL' : 'Encoded text'}</label>
        <textarea id="in" className="textarea textarea-mono" rows={5}
          placeholder={mode === 'encode' ? 'search?q=a b&sort=new' : 'search%3Fq%3Da%20b'}
          value={input} onChange={(e) => setInput(e.target.value)} />
      </div>

      <div className="check-row">
        <label className="check">
          <input type="checkbox" checked={component}
            onChange={(e) => setComponent(e.target.checked)} />
          Treat as a single value rather than a whole URL
        </label>
      </div>
      <p className="muted-block">
        Ticked, characters like <code>/</code> <code>?</code> <code>&amp;</code> and{' '}
        <code>=</code> are escaped too — right for one query parameter. Unticked,
        they are left alone so a complete URL still works.
      </p>

      {!result.ok && <p className="note note-warn stack">{result.reason}</p>}

      {result.ok && (
        <div className="results results-block">
          <div className="row-between stack-sm">
            <span className="label">Result</span>
            <button type="button" className="btn-ghost" onClick={copy} disabled={!result.value}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <textarea readOnly className="textarea textarea-mono" rows={5} value={result.value} />
        </div>
      )}
    </div>
  );
}
