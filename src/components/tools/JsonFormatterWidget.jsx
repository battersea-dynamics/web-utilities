import { useState, useMemo } from 'react';
import { formatJson } from './devEngine.js';

export default function JsonFormatterWidget() {
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState(2);
  const [copied, setCopied] = useState('');

  const result = useMemo(() => formatJson(input, indent), [input, indent]);

  const copy = (which, value) => {
    navigator.clipboard?.writeText(value);
    setCopied(which);
    setTimeout(() => setCopied(''), 1200);
  };

  return (
    <div>
      <div className="field">
        <label htmlFor="in">JSON</label>
        <textarea id="in" className="textarea textarea-mono" rows={8}
          placeholder='{"name":"example","tags":[1,2,3]}'
          value={input} onChange={(e) => setInput(e.target.value)} />
      </div>

      <div className="field-grid stack">
        <div className="field">
          <label htmlFor="indent">Indent</label>
          <select id="indent" value={indent} onChange={(e) => setIndent(Number(e.target.value))}>
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
            <option value={0}>None</option>
          </select>
        </div>
      </div>

      {input.trim() && !result.ok && (
        <p className="note note-warn stack">
          <strong>Invalid JSON.</strong> {result.reason}
        </p>
      )}

      {result.ok && (
        <>
          <div className="results">
            <div className="result primary">
              <div className="label">Valid</div>
              <div className="value">Yes</div>
            </div>
            <div className="result">
              <div className="label">Top level</div>
              <div className="value">{result.type}</div>
            </div>
            {result.count !== null && (
              <div className="result">
                <div className="label">{result.type === 'array' ? 'Items' : 'Keys'}</div>
                <div className="value">{result.count}</div>
              </div>
            )}
            <div className="result">
              <div className="label">Minified size</div>
              <div className="value">{result.minified.length}</div>
            </div>
          </div>

          <div className="results results-block">
            <div className="row-between stack-sm">
              <span className="label">Formatted</span>
              <button type="button" className="btn-ghost"
                onClick={() => copy('pretty', result.pretty)}>
                {copied === 'pretty' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <textarea readOnly className="textarea textarea-mono" rows={12} value={result.pretty} />

            <div className="row-between stack-lg">
              <span className="label">Minified</span>
              <button type="button" className="btn-ghost"
                onClick={() => copy('min', result.minified)}>
                {copied === 'min' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <textarea readOnly className="textarea textarea-mono" rows={3} value={result.minified} />
          </div>
        </>
      )}

      <p className="muted-block">
        Validation and formatting run in your browser, so configuration files,
        API responses and anything else you paste stay on your machine.
      </p>
    </div>
  );
}
