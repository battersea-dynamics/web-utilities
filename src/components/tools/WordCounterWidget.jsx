import { useState, useMemo } from 'react';

export default function WordCounterWidget() {
  const [text, setText] = useState('');

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const sentences = trimmed
      ? (trimmed.match(/[.!?]+(?:\s|$)/g) || []).length || 1
      : 0;
    const paragraphs = trimmed
      ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length
      : 0;

    const fmtTime = (mins) => {
      if (mins < 1 / 60) return '0 sec';
      const totalSec = Math.round(mins * 60);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      if (m === 0) return `${s} sec`;
      return `${m} min${s ? ` ${s}s` : ''}`;
    };

    return {
      words,
      chars,
      charsNoSpaces,
      sentences,
      paragraphs,
      readingTime: fmtTime(words / 200),
      speakingTime: fmtTime(words / 130),
    };
  }, [text]);

  return (
    <div>
      <div className="field">
        <label htmlFor="text">Your text</label>
        <textarea
          id="text"
          className="textarea"
          rows={10}
          placeholder="Paste or type here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div className="results">
        <div className="result primary">
          <div className="label">Words</div>
          <div className="value">{stats.words.toLocaleString()}</div>
        </div>
        <div className="result">
          <div className="label">Characters</div>
          <div className="value">{stats.chars.toLocaleString()}</div>
        </div>
        <div className="result">
          <div className="label">Chars (no spaces)</div>
          <div className="value">{stats.charsNoSpaces.toLocaleString()}</div>
        </div>
        <div className="result">
          <div className="label">Sentences</div>
          <div className="value">{stats.sentences.toLocaleString()}</div>
        </div>
        <div className="result">
          <div className="label">Paragraphs</div>
          <div className="value">{stats.paragraphs.toLocaleString()}</div>
        </div>
        <div className="result">
          <div className="label">Reading time</div>
          <div className="value">{stats.readingTime}</div>
        </div>
        <div className="result">
          <div className="label">Speaking time</div>
          <div className="value">{stats.speakingTime}</div>
        </div>
      </div>
    </div>
  );
}
