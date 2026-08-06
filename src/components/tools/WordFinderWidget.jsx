import { useState, useEffect, useMemo, useRef } from 'react';
import { findPlays, groupByLength } from './gameEngine.js';
import { GAMES, scoreWord, byScore } from './tileData.js';
import WordList from './WordList.jsx';

/**
 * Powers both /scrabble-word-finder and /words-with-friends-word-finder.
 * The only difference between them is which tile values are used, so the
 * game is fixed by the page rather than chosen by the user — a page that
 * lets you switch games ranks for neither search term.
 *
 * Results are computed off the main render path because a 15-tile rack takes
 * a few hundred milliseconds; without the pending flag the input would feel
 * frozen while it ran.
 */
export default function WordFinderWidget({ game = 'scrabble' }) {
  const [rack, setRack] = useState('');
  const [sort, setSort] = useState('score'); // score | length
  const [plays, setPlays] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | working | ready | error
  const seq = useRef(0);

  const rules = GAMES[game];

  useEffect(() => {
    const trimmed = rack.trim();
    if (trimmed.replace(/[^a-z?*_]/gi, '').length < 2) {
      setPlays([]);
      setStatus('idle');
      return;
    }
    const id = ++seq.current;
    setStatus('working');
    findPlays(trimmed, rules, scoreWord)
      .then((result) => {
        if (seq.current !== id) return; // a newer rack is already in flight
        setPlays(result);
        setStatus('ready');
      })
      .catch(() => {
        if (seq.current === id) setStatus('error');
      });
  }, [rack, rules]);

  const best = useMemo(() => [...plays].sort(byScore)[0], [plays]);

  const groups = useMemo(() => {
    if (sort === 'length') return groupByLength(plays);
    // Scored view: one flat list, highest first.
    return [{ length: null, plays: [...plays].sort(byScore) }];
  }, [plays, sort]);

  return (
    <div>
      <div className="field-grid">
        <div className="field field-wide">
          <label htmlFor="rack">Your tiles</label>
          <input
            id="rack"
            type="text"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
            placeholder="e.g. retinas — use ? for a blank"
            maxLength={15}
            value={rack}
            onChange={(e) => setRack(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="sort">Sort by</label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="score">Highest score</option>
            <option value="length">Word length</option>
          </select>
        </div>
      </div>

      <p className="note">
        Type the letters you're holding. Use <strong>?</strong> for a blank tile —
        it can be any letter, and scores nothing.
      </p>

      {status === 'working' && <p className="note stack">Searching…</p>}
      {status === 'error' && (
        <p className="note note-warn stack">
          Couldn't load the dictionary — refresh and try again.
        </p>
      )}

      {status === 'ready' && plays.length === 0 && (
        <p className="muted stack">No playable words from those tiles.</p>
      )}

      {status === 'ready' && plays.length > 0 && (
        <div className="results results-block">
          <div className="label">
            {plays.length.toLocaleString()} word{plays.length === 1 ? '' : 's'} — best is{' '}
            <strong>{best.word}</strong> at {best.score} point
            {best.score === 1 ? '' : 's'}
          </div>

          {sort === 'score' ? (
            <ol className="play-list">
              {groups[0].plays.slice(0, 200).map((p) => (
                <li key={p.word}>
                  <span className="play-word">{p.word}</span>
                  <span className="play-meta">
                    {p.length} letters
                    {p.blanksUsed > 0 &&
                      ` · ${p.blanksUsed} blank${p.blanksUsed > 1 ? 's' : ''}`}
                  </span>
                  <span className="play-score">{p.score}</span>
                </li>
              ))}
            </ol>
          ) : (
            <>
              <p className="word-hint">Click any word to see what it means.</p>
              {groups.map((g) => (
                <div key={g.length} className="word-group">
                  <span className="word-group-head">
                    {g.length} letters ({g.plays.length})
                  </span>
                  <WordList words={g.plays.map((p) => p.word)} />
                </div>
              ))}
            </>
          )}

          {sort === 'score' && plays.length > 200 && (
            <p className="note">
              Showing the 200 highest-scoring words. Sort by length to see them all.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
