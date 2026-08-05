import { useState, useEffect } from 'react';
import { md5, sha, SHA_ALGORITHMS } from './devEngine.js';

const ALL = ['MD5', ...SHA_ALGORITHMS];

export default function HashWidget() {
  const [text, setText] = useState('');
  const [hashes, setHashes] = useState({});
  const [copied, setCopied] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out = { MD5: md5(text) };
      for (const alg of SHA_ALGORITHMS) {
        out[alg] = await sha(text, alg);
      }
      if (!cancelled) setHashes(out);
    })();
    return () => { cancelled = true; };
  }, [text]);

  const copy = (alg, value) => {
    navigator.clipboard?.writeText(value);
    setCopied(alg);
    setTimeout(() => setCopied(''), 1200);
  };

  return (
    <div>
      <div className="field">
        <label htmlFor="text">Text to hash</label>
        <textarea id="text" className="textarea" rows={4}
          placeholder="Type or paste anything — the empty string has a hash too."
          value={text} onChange={(e) => setText(e.target.value)} />
      </div>

      <div className="results results-block">
        {ALL.map((alg) => (
          <div key={alg} className="case-row">
            <div className="row-between">
              <div className="file-name">
                <div className="label">
                  {alg}
                  {(alg === 'MD5' || alg === 'SHA-1') && (
                    <span className="muted"> — checksums only, not secure</span>
                  )}
                </div>
                <div className="hash-value">{hashes[alg] || '…'}</div>
              </div>
              <button type="button" className="btn-ghost"
                onClick={() => copy(alg, hashes[alg])} disabled={!hashes[alg]}>
                {copied === alg ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="muted-block">
        Hashing happens in your browser — nothing you type is sent anywhere.
        MD5 and SHA-1 are both broken for security purposes and should not be
        used for passwords or signatures, but remain fine for verifying that a
        file downloaded intact.
      </p>
    </div>
  );
}
