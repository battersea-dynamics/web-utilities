import { useState, useMemo } from 'react';
import { useNumber } from './useNumber.js';

const WORDS = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor ' +
  'incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud ' +
  'exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure ' +
  'in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur ' +
  'sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit ' +
  'anim id est laborum').split(' ');

function makeSentence(minWords, maxWords) {
  const len = minWords + Math.floor(Math.random() * (maxWords - minWords + 1));
  const words = [];
  for (let i = 0; i < len; i++) words.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
  const s = words.join(' ');
  return s[0].toUpperCase() + s.slice(1) + '.';
}

function makeParagraph(sentences) {
  const out = [];
  for (let i = 0; i < sentences; i++) out.push(makeSentence(6, 16));
  return out.join(' ');
}

export default function LoremIpsumWidget() {
  const [unit, setUnit] = useState('paragraphs');
  const [count, setCount, countN] = useNumber(3, 1);
  const [startClassic, setStartClassic] = useState(true);
  const [copied, setCopied] = useState(false);

  const safeCount = Math.min(50, Math.max(1, Math.floor(countN)));

  const output = useMemo(() => {
    let parts = [];
    if (unit === 'words') {
      const words = [];
      for (let i = 0; i < safeCount; i++) words.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
      parts = [words.join(' ')];
    } else if (unit === 'sentences') {
      for (let i = 0; i < safeCount; i++) parts.push(makeSentence(6, 16));
      parts = [parts.join(' ')];
    } else {
      for (let i = 0; i < safeCount; i++) parts.push(makeParagraph(4 + Math.floor(Math.random() * 3)));
    }

    if (startClassic && parts.length) {
      parts[0] =
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
        parts[0].replace(/^Lorem ipsum dolor sit amet,? ?/i, '');
    }

    return parts.join('\n\n');
  }, [unit, safeCount, startClassic]);

  const copy = () => {
    navigator.clipboard?.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="unit">Generate by</label>
          <select id="unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="paragraphs">Paragraphs</option>
            <option value="sentences">Sentences</option>
            <option value="words">Words</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="count">How many</label>
          <input id="count" type="number" min="1" max="50" value={count}
            onChange={(e) => setCount(e.target.value)} />
        </div>
      </div>

      <div className="check-row">
        <label className="check">
          <input type="checkbox" checked={startClassic}
            onChange={(e) => setStartClassic(e.target.checked)} />
          Start with the classic "Lorem ipsum dolor sit amet…" opening
        </label>
      </div>

      <div className="results results-block">
        <div className="row-end stack-sm">
          <button type="button" className="btn-ghost" onClick={copy}>
            {copied ? 'Copied' : 'Copy result'}
          </button>
        </div>
        <div className="prose wrap-text">{output}</div>
      </div>
    </div>
  );
}
