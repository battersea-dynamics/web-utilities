import { useState, useMemo } from 'react';

// Simple LCS-based line diff — plenty for a "what changed" utility without
// pulling in a diff library.
function diffLines(a, b) {
  const la = a.split('\n');
  const lb = b.split('\n');
  const n = la.length;
  const m = lb.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        la[i] === lb[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const rows = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (la[i] === lb[j]) {
      rows.push({ type: 'same', text: la[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ type: 'removed', text: la[i] });
      i++;
    } else {
      rows.push({ type: 'added', text: lb[j] });
      j++;
    }
  }
  while (i < n) rows.push({ type: 'removed', text: la[i++] });
  while (j < m) rows.push({ type: 'added', text: lb[j++] });

  return rows;
}

const rowStyle = {
  same: {},
  removed: { background: '#fdeceb', color: '#8a2b25' },
  added: { background: 'var(--accent-tint)', color: '#0f4a3f' },
};

export default function TextDiffWidget() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  const rows = useMemo(() => diffLines(a, b), [a, b]);
  const changed = rows.filter((r) => r.type !== 'same').length;

  const areaStyle = {
    font: 'inherit',
    fontFamily: 'var(--font-num)',
    fontSize: '0.875rem',
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
      <div className="field-grid">
        <div className="field">
          <label htmlFor="a">Original</label>
          <textarea id="a" rows={8} style={areaStyle} value={a} onChange={(e) => setA(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="b">Changed</label>
          <textarea id="b" rows={8} style={areaStyle} value={b} onChange={(e) => setB(e.target.value)} />
        </div>
      </div>

      {(a || b) && (
        <div className="results" style={{ display: 'block' }}>
          <div className="label" style={{ marginBottom: '0.5rem' }}>
            {changed} changed line{changed === 1 ? '' : 's'}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-num)',
              fontSize: '0.875rem',
              border: '1px solid var(--rule)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            {rows.map((r, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.15rem 0.6rem',
                  whiteSpace: 'pre-wrap',
                  ...rowStyle[r.type],
                }}
              >
                {r.type === 'removed' ? '− ' : r.type === 'added' ? '+ ' : '  '}
                {r.text || ' '}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
