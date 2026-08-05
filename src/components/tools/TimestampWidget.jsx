import { useState, useEffect, useMemo } from 'react';
import { fromTimestamp, toTimestamp } from './devEngine.js';

export default function TimestampWidget() {
  const [mode, setMode] = useState('fromTs');
  const [ts, setTs] = useState(String(Math.floor(Date.now() / 1000)));
  const [unit, setUnit] = useState('seconds');
  const [dateText, setDateText] = useState(new Date().toISOString().slice(0, 19));
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  // A live clock, because "what is the timestamp right now" is half the reason
  // anyone opens this page.
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const result = useMemo(
    () => (mode === 'fromTs' ? fromTimestamp(Number(ts), unit) : toTimestamp(dateText)),
    [mode, ts, unit, dateText]
  );

  return (
    <div>
      <div className="results">
        <div className="result primary">
          <div className="label">Current Unix time</div>
          <div className="value">{now}</div>
        </div>
        <div className="result">
          <div className="label">Milliseconds</div>
          <div className="value">{now * 1000}</div>
        </div>
      </div>

      <div className="field stack-lg">
        <label>Convert</label>
        <div className="seg stack-sm">
          <button type="button" className="seg-btn" aria-pressed={mode === 'fromTs'}
            onClick={() => setMode('fromTs')}>Timestamp → date</button>
          <button type="button" className="seg-btn" aria-pressed={mode === 'toTs'}
            onClick={() => setMode('toTs')}>Date → timestamp</button>
        </div>
      </div>

      {mode === 'fromTs' ? (
        <div className="field-grid stack">
          <div className="field">
            <label htmlFor="ts">Timestamp</label>
            <input id="ts" type="text" inputMode="numeric" value={ts}
              onChange={(e) => setTs(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="unit">Unit</label>
            <select id="unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="seconds">Seconds</option>
              <option value="milliseconds">Milliseconds</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="field-grid stack">
          <div className="field field-wide">
            <label htmlFor="dt">Date and time</label>
            <input id="dt" type="text" value={dateText}
              placeholder="2026-08-05T09:30:00Z"
              onChange={(e) => setDateText(e.target.value)} />
          </div>
        </div>
      )}

      {!result.ok && <p className="note note-warn stack">{result.reason}</p>}

      {result.ok && mode === 'fromTs' && (
        <div className="results">
          <div className="result primary">
            <div className="label">UTC (ISO 8601)</div>
            <div className="value">{result.iso}</div>
          </div>
          <div className="result">
            <div className="label">Your local time</div>
            <div className="value">{result.localeDate}</div>
          </div>
          <div className="result">
            <div className="label">Relative</div>
            <div className="value">{result.relative}</div>
          </div>
          <div className="result">
            <div className="label">Seconds</div>
            <div className="value">{result.seconds}</div>
          </div>
          <div className="result">
            <div className="label">Milliseconds</div>
            <div className="value">{result.milliseconds}</div>
          </div>
        </div>
      )}

      {result.ok && mode === 'toTs' && (
        <div className="results">
          <div className="result primary">
            <div className="label">Seconds</div>
            <div className="value">{result.seconds}</div>
          </div>
          <div className="result">
            <div className="label">Milliseconds</div>
            <div className="value">{result.milliseconds}</div>
          </div>
          <div className="result">
            <div className="label">UTC (ISO 8601)</div>
            <div className="value">{result.iso}</div>
          </div>
        </div>
      )}

      <p className="muted-block">
        A Unix timestamp counts seconds since 1 January 1970 UTC and carries no
        timezone of its own. The local time shown uses your device's timezone;
        the ISO value is always UTC. A date typed without a timezone is read as
        local time, so add a trailing <code>Z</code> to force UTC.
      </p>
    </div>
  );
}
