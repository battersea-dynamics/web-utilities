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
    t
      .toLowerCase()
      .replace(/(^|[^a-zA-Z0-9]+)(.)/g, (_, __, c) => c.toUpperCase()),
  snake_case: (t) =>
    t
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .join('_')
      .toLowerCase(),
  'kebab-case': (t) =>
    t
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .join('-')
      .toLowerCase(),
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
        <textarea
          id="text"
          rows={4}
          style={{
            font: 'inherit',
            padding: '0.7rem',
            border: '1px solid var(--rule)',
            borderRadius: '4px',
            background: 'var(--paper)',
            color: 'var(--ink)',
            width: '100%',
            resize: 'vertical',
          }}
          placeholder="Type or paste here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div className="results" style={{ display: 'block' }}>
        {results.map(({ name, value }) => (
          <div
            key={name}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
              alignItems: 'center',
              borderTop: '1px solid var(--rule)',
              padding: '0.6rem 0',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div className="label">{name}</div>
              <div style={{ wordBreak: 'break-word' }}>{value || '—'}</div>
            </div>
            <button
              type="button"
              onClick={() => copy(name, value)}
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
                flexShrink: 0,
              }}
            >
              {copied === name ? 'Copied' : 'Copy'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
