import { useState, useMemo } from 'react';
import { base64Encode, base64Decode } from './devEngine.js';

export default function Base64Widget() {
  const [mode, setMode] = useState('encode');
  const [input, setInput] = useState('');
  const [urlSafe, setUrlSafe] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input) return { ok: true, value: '' };
    return mode === 'encode'
      ? { ok: true, value: base64Encode(input, urlSafe) }
      : base64Decode(input);
  }, [input, mode, urlSafe]);

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
            onClick={() => setMode('encode')}>Encode to Base64</button>
          <button type="button" className="seg-btn" aria-pressed={mode === 'decode'}
            onClick={() => setMode('decode')}>Decode from Base64</button>
        </div>
      </div>

      <div className="field stack">
        <label htmlFor="in">{mode === 'encode' ? 'Plain text' : 'Base64'}</label>
        <textarea id="in" className="textarea textarea-mono" rows={6}
          placeholder={mode === 'encode' ? 'Hello, World!' : 'SGVsbG8sIFdvcmxkIQ=='}
          value={input} onChange={(e) => setInput(e.target.value)} />
      </div>

      {mode === 'encode' && (
        <div className="check-row">
          <label className="check">
            <input type="checkbox" checked={urlSafe}
              onChange={(e) => setUrlSafe(e.target.checked)} />
            URL-safe (uses - and _ instead of + and /, drops padding)
          </label>
        </div>
      )}

      {!result.ok && <p className="note note-warn stack">{result.reason}</p>}

      {result.ok && (
        <div className="results results-block">
          <div className="row-between stack-sm">
            <span className="label">{mode === 'encode' ? 'Base64' : 'Decoded text'}</span>
            <button type="button" className="btn-ghost" onClick={copy} disabled={!result.value}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <textarea readOnly className="textarea textarea-mono" rows={6} value={result.value} />
        </div>
      )}

      <p className="muted-block">
        Handles the full Unicode range — accented characters, emoji and
        non-Latin scripts all survive a round trip, which the browser's raw
        btoa function cannot manage on its own. Everything runs locally.
      </p>
    </div>
  );
}
