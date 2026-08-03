import { useState, useEffect, useMemo } from 'react';
import { loadWordIndex, findWords, fullLengthAnagrams } from './wordEngine.js';
import { DEFAULT_LANGUAGE } from './languages.js';
import LanguageSelect from './LanguageSelect.jsx';

/**
 * Powers both /word-unscrambler and /anagram-solver. `mode="anagram"`
 * surfaces the full-length (uses-every-letter) matches first, since that's
 * the strict sense of "anagram"; `mode="unscramble"` treats every subset
 * word as equally the point.
 */
export default function UnscrambleWidget({ mode = 'unscramble' }) {
  const [letters, setLetters] = useState('');
  const [lang, setLang] = useState(DEFAULT_LANGUAGE);
  const [index, setIndex] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error

  useEffect(() => {
    setStatus('loading');
    setIndex(null);
    loadWordIndex(lang)
      .then((data) => {
        setIndex(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [lang]);

  const groups = useMemo(() => {
    if (!index || !letters.trim()) return [];
    return findWords(letters, index);
  }, [index, letters]);

  const exact = useMemo(
    () => (mode === 'anagram' ? fullLengthAnagrams(letters, groups) : []),
    [mode, letters, groups]
  );

  const otherGroups =
    mode === 'anagram'
      ? groups.filter((g) => g.length !== letters.replace(/[^a-zA-Z]/g, '').length)
      : groups;

  const totalFound = groups.reduce((n, g) => n + g.words.length, 0);

  return (
    <div>
      <div className="field-grid">
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="letters">Your letters</label>
          <input
            id="letters"
            type="text"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
            placeholder="e.g. tresalp"
            maxLength={15}
            value={letters}
            onChange={(e) => setLetters(e.target.value)}
          />
        </div>

        <LanguageSelect value={lang} onChange={setLang} />
      </div>

      {status === 'loading' && (
        <p className="saving-note" style={{ marginTop: '1rem' }}>
          Loading dictionary…
        </p>
      )}
      {status === 'error' && (
        <p className="saving-note" style={{ marginTop: '1rem' }}>
          Couldn't load the dictionary — refresh and try again.
        </p>
      )}

      {status === 'ready' && letters.trim() && (
        <div className="results" style={{ display: 'block' }}>
          {mode === 'anagram' && (
            <div style={{ marginBottom: exact.length || otherGroups.length ? '1.25rem' : 0 }}>
              <div className="label" style={{ marginBottom: '0.4rem' }}>
                Full anagrams (use every letter)
              </div>
              {exact.length > 0 ? (
                <p style={{ margin: 0 }}>{exact.join(', ')}</p>
              ) : (
                <p style={{ margin: 0, color: 'var(--ink-soft)' }}>None found.</p>
              )}
            </div>
          )}

          {totalFound === 0 && (
            <p style={{ margin: 0, color: 'var(--ink-soft)' }}>
              No dictionary words found in those letters.
            </p>
          )}

          {otherGroups.length > 0 && (
            <div>
              {mode === 'anagram' && (
                <div className="label" style={{ marginBottom: '0.4rem' }}>
                  Other words from those letters
                </div>
              )}
              {otherGroups.map((g) => (
                <div key={g.length} style={{ marginBottom: '0.6rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-num)',
                      fontSize: '0.8125rem',
                      color: 'var(--ink-soft)',
                    }}
                  >
                    {g.length} letters ({g.words.length})
                  </span>
                  <p style={{ margin: '0.2rem 0 0' }}>{g.words.join(', ')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
