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

const CLASS = { same: '', removed: 'diff-del', added: 'diff-add' };
const MARK = { same: '  ', removed: '− ', added: '+ ' };

export default function TextDiffWidget() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  const rows = useMemo(() => diffLines(a, b), [a, b]);
  const changed = rows.filter((r) => r.type !== 'same').length;

  return (
    <div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="a">Original</label>
          <textarea id="a" className="textarea textarea-mono" rows={8} value={a}
            onChange={(e) => setA(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="b">Changed</label>
          <textarea id="b" className="textarea textarea-mono" rows={8} value={b}
            onChange={(e) => setB(e.target.value)} />
        </div>
      </div>

      {(a || b) && (
        <div className="results results-block">
          <div className="label">
            {changed} changed line{changed === 1 ? '' : 's'}
          </div>
          <div className="diff stack-sm">
            {rows.map((r, idx) => (
              <div key={idx} className={`diff-line ${CLASS[r.type]}`}>
                {MARK[r.type]}
                {r.text || ' '}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
