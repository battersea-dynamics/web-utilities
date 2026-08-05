import { Fragment, useState, useRef } from 'react';
import { lookup, POS_LABEL } from './definitionEngine.js';

/**
 * The comma-separated word list used by every word-game tool.
 *
 * Scanning a long list is the primary task here, so the words are rendered
 * as ordinary running text — same font, same colour, no chips or buttons
 * breaking up the flow. Each one just happens to be clickable, and only
 * then is a definition fetched.
 *
 * The definition panel sits directly under the list rather than at the top
 * of the page, so it appears near whatever was clicked, and carries a
 * min-height so moving between words doesn't make the page jump.
 */
export default function WordList({ words, lang = 'en', suffix = null }) {
  const [picked, setPicked] = useState(null);
  const [entry, setEntry] = useState(undefined); // undefined = still loading
  const seq = useRef(0);

  const pick = (w) => {
    if (picked === w) {
      setPicked(null); // clicking the open word again closes it
      return;
    }
    const id = ++seq.current;
    setPicked(w);
    setEntry(undefined);
    lookup(w, lang).then((r) => {
      // A slower earlier request must not overwrite a later one.
      if (seq.current === id) setEntry(r);
    });
  };

  return (
    <>
      <p className="word-list">
        {words.map((w, i) => (
          <Fragment key={w}>
            {i > 0 && ', '}
            <button
              type="button"
              className={`word${picked === w ? ' is-picked' : ''}`}
              aria-expanded={picked === w}
              onClick={() => pick(w)}
            >
              {w}
            </button>
          </Fragment>
        ))}
        {suffix}
      </p>

      {picked && (
        <div className="word-def" role="status">
          {entry === undefined && <span className="muted">Looking up {picked}…</span>}
          {entry === null && (
            <span className="muted">
              No definition for <strong>{picked}</strong> — it's a valid word, but
              our dictionary doesn't carry a meaning for it.
            </span>
          )}
          {entry && (
            <>
              <strong>{picked}</strong>
              {entry.base && <span className="muted"> (from {entry.base})</span>}
              <span className="word-pos">{POS_LABEL[entry.pos] || entry.pos}</span>
              <span className="word-gloss">{entry.gloss}</span>
            </>
          )}
        </div>
      )}
    </>
  );
}
