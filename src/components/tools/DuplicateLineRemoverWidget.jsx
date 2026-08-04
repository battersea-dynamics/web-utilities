import { useState, useMemo } from 'react';

export default function DuplicateLineRemoverWidget() {
  const [text, setText] = useState('');
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [trim, setTrim] = useState(true);
  const [copied, setCopied] = useState(false);

  const { output, removedCount } = useMemo(() => {
    const lines = text.split('\n');
    const seen = new Set();
    const kept = [];
    let removed = 0;

    for (const raw of lines) {
      const line = trim ? raw.trim() : raw;
      const key = ignoreCase ? line.toLowerCase() : line;
      if (seen.has(key)) {
        removed++;
        continue;
      }
      seen.add(key);
      kept.push(line);
    }

    return { output: kept.join('\n'), removedCount: removed };
  }, [text, ignoreCase, trim]);

  const copy = () => {
    navigator.clipboard?.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div>
      <div className="field">
        <label htmlFor="text">Your list</label>
        <textarea id="text" className="textarea" rows={10}
          placeholder={'one\ntwo\none\nthree'}
          value={text} onChange={(e) => setText(e.target.value)} />
      </div>

      <div className="check-row">
        <label className="check">
          <input type="checkbox" checked={ignoreCase}
            onChange={(e) => setIgnoreCase(e.target.checked)} />
          Ignore case
        </label>
        <label className="check">
          <input type="checkbox" checked={trim} onChange={(e) => setTrim(e.target.checked)} />
          Trim whitespace
        </label>
      </div>

      {text && (
        <div className="results results-block">
          <div className="row-between stack-sm">
            <span className="label">
              {removedCount} duplicate{removedCount === 1 ? '' : 's'} removed
            </span>
            <button type="button" className="btn-ghost" onClick={copy}>
              {copied ? 'Copied' : 'Copy result'}
            </button>
          </div>
          <textarea readOnly className="textarea" rows={10} value={output} />
        </div>
      )}
    </div>
  );
}
