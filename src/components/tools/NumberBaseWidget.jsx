import { useState, useMemo } from 'react';
import { convertBase } from './devEngine.js';

const BASES = [
  { value: 2, label: 'Binary (base 2)' },
  { value: 8, label: 'Octal (base 8)' },
  { value: 10, label: 'Decimal (base 10)' },
  { value: 16, label: 'Hexadecimal (base 16)' },
];

export default function NumberBaseWidget() {
  const [input, setInput] = useState('255');
  const [fromBase, setFromBase] = useState(10);
  const [copied, setCopied] = useState('');

  const result = useMemo(() => convertBase(input, fromBase), [input, fromBase]);

  const copy = (key, value) => {
    navigator.clipboard?.writeText(String(value));
    setCopied(key);
    setTimeout(() => setCopied(''), 1200);
  };

  const rows = result.ok
    ? [
        ['Binary', result.binary, '0b'],
        ['Octal', result.octal, '0o'],
        ['Decimal', result.decimal, ''],
        ['Hexadecimal', result.hex, '0x'],
      ]
    : [];

  return (
    <div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="val">Number</label>
          <input id="val" type="text" inputMode="text" value={input}
            autoComplete="off" spellCheck="false"
            onChange={(e) => setInput(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="base">Currently in</label>
          <select id="base" value={fromBase} onChange={(e) => setFromBase(Number(e.target.value))}>
            {BASES.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>
      </div>

      {!result.ok && result.reason && (
        <p className="note note-warn stack">{result.reason}</p>
      )}

      {result.ok && (
        <>
          <div className="results results-block">
            {rows.map(([label, value, prefix]) => (
              <div key={label} className="case-row">
                <div className="row-between">
                  <div className="file-name">
                    <div className="label">{label}</div>
                    <div className="hash-value">
                      {prefix && <span className="muted">{prefix}</span>}{value}
                    </div>
                  </div>
                  <button type="button" className="btn-ghost" onClick={() => copy(label, value)}>
                    {copied === label ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="results">
            <div className="result">
              <div className="label">Bits needed</div>
              <div className="value">{result.bytes}</div>
            </div>
          </div>
        </>
      )}

      <p className="muted-block">
        Prefixes like <code>0x</code>, <code>0b</code> and <code>0o</code> are
        accepted and stripped automatically. Digits that do not exist in the
        chosen base are rejected rather than silently ignored — pasting{' '}
        <code>1092</code> as binary tells you so, instead of quietly reading it
        as <code>1</code>.
      </p>
    </div>
  );
}
