import { useState, useEffect, useMemo } from 'react';
import { useNumber } from './useNumber.js';
import { DEFAULT_LANGUAGE } from './languages.js';
import LanguageSelect from './LanguageSelect.jsx';
import WordList from './WordList.jsx';

const wordsCache = new Map();
function loadWords(lang) {
  if (!wordsCache.has(lang)) {
    wordsCache.set(
      lang,
      fetch(`/data/${lang}/words.json`).then((r) => {
        if (!r.ok) throw new Error('Failed to load dictionary');
        return r.json();
      })
    );
  }
  return wordsCache.get(lang);
}

const MAX_SHOWN = 300;

export default function WordFilterWidget() {
  const [starts, setStarts] = useState('');
  const [ends, setEnds] = useState('');
  const [contains, setContains] = useState('');
  const [length, setLength] = useState('');
  const [lang, setLang] = useState(DEFAULT_LANGUAGE);
  const [words, setWords] = useState(null);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    setStatus('loading');
    setWords(null);
    loadWords(lang)
      .then((data) => {
        setWords(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [lang]);

  const s = starts.trim().toLowerCase().replace(/[^a-z]/g, '');
  const e = ends.trim().toLowerCase().replace(/[^a-z]/g, '');
  const c = contains.trim().toLowerCase().replace(/[^a-z]/g, '');
  const len = length ? Number(length) : null;

  const active = Boolean(s || e || c || len);

  const results = useMemo(() => {
    if (!words || !active) return [];
    return words.filter((w) => {
      if (s && !w.startsWith(s)) return false;
      if (e && !w.endsWith(e)) return false;
      if (c && !w.includes(c)) return false;
      if (len && w.length !== len) return false;
      return true;
    });
  }, [words, s, e, c, len, active]);

  return (
    <div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="starts">Starts with</label>
          <input id="starts" type="text" placeholder="e.g. qu" value={starts}
            onChange={(ev) => setStarts(ev.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="ends">Ends with</label>
          <input id="ends" type="text" placeholder="e.g. ing" value={ends}
            onChange={(ev) => setEnds(ev.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="contains">Contains</label>
          <input id="contains" type="text" placeholder="e.g. xy" value={contains}
            onChange={(ev) => setContains(ev.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="length">Exact length</label>
          <input id="length" type="number" min="2" max="15" placeholder="any" value={length}
            onChange={(ev) => setLength(ev.target.value)} />
        </div>

        <LanguageSelect value={lang} onChange={setLang} />
      </div>

      {status === 'loading' && <p className="note stack">Loading dictionary…</p>}
      {status === 'error' && (
        <p className="note note-warn stack">
          Couldn't load the dictionary — refresh and try again.
        </p>
      )}

      {status === 'ready' && active && (
        <div className="results results-block">
          <div className="label">
            {results.length.toLocaleString()} match{results.length === 1 ? '' : 'es'}
          </div>
          {results.length > 0 && (
            <p className="word-hint">Click any word to see what it means.</p>
          )}
          <WordList
            words={results.slice(0, MAX_SHOWN)}
            lang={lang}
            suffix={
              results.length > MAX_SHOWN
                ? ` … and ${(results.length - MAX_SHOWN).toLocaleString()} more`
                : null
            }
          />
        </div>
      )}
    </div>
  );
}
