import { useState, useMemo } from 'react';

const converters = {
  UPPERCASE: (t) => t.toUpperCase(),
  lowercase: (t) => t.toLowerCase(),
  'Title Case': (t) =>
    t.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()),
  'Sentence case': (t) =>
    t.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (m) => m.toUpperCase()),
  camelCase: (t) =>
    t
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
      .replace(/^[A-Z]/, (c) => c.toLowerCase()),
  PascalCase: (t) =>
    t.toLowerCase().replace(/(^|[^a-zA-Z0-9]+)(.)/g, (_, __, c) => c.toUpperCase()),
  snake_case: (t) =>
    t.trim().replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(/\s+/).join('_').toLowerCase(),
  'kebab-case': (t) =>
    t.trim().replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(/\s+/).join('-').toLowerCase(),
  'aLtErNaTiNg CaSe': (t) =>
    t
      .split('')
      .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
      .join(''),
};

const names = Object.keys(converters);

export default function CaseConverterWidget() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState('');

  const results = useMemo(
    () => names.map((name) => ({ name, value: converters[name](text) })),
    [text]
  );

  const copy = (name, value) => {
    navigator.clipboard?.writeText(value);
    setCopied(name);
    setTimeout(() => setCopied(''), 1200);
  };

  return (
    <div>
      <div className="field">
        <label htmlFor="text">Your text</label>
        <textarea id="text" className="textarea" rows={4} placeholder="Type or paste here…"
          value={text} onChange={(e) => setText(e.target.value)} />
      </div>

      <div className="results results-block">
        {results.map(({ name, value }) => (
          <div key={name} className="row-between case-row">
            <div className="file-name">
              <div className="label">{name}</div>
              <div>{value || '—'}</div>
            </div>
            <button type="button" className="btn-ghost" onClick={() => copy(name, value)}
              disabled={!text}>
              {copied === name ? 'Copied' : 'Copy'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
