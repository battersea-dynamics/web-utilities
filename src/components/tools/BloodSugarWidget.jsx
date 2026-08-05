import { useState, useMemo } from 'react';
import { useNumber } from './useNumber.js';
import { convertGlucose, GLUCOSE_FACTOR, LAST_VERIFIED } from './healthEngine.js';

export default function BloodSugarWidget() {
  const [measure, setMeasure] = useState('glucose'); // glucose | hba1c
  const [from, setFrom] = useState('mmol');
  const [value, setValue, valueN] = useNumber(5.5);

  const result = useMemo(() => convertGlucose(valueN, from), [valueN, from]);

  const pick = (m) => {
    setMeasure(m);
    setFrom(m === 'glucose' ? 'mmol' : 'ifcc');
    setValue(m === 'glucose' ? '5.5' : '48');
  };

  const UNITS =
    measure === 'glucose'
      ? [
          { key: 'mmol', label: 'mmol/L', note: 'UK, Ireland, most of Europe' },
          { key: 'mgdl', label: 'mg/dL', note: 'US, France, Japan' },
        ]
      : [
          { key: 'ifcc', label: 'mmol/mol', note: 'IFCC — UK standard' },
          { key: 'ngsp', label: '%', note: 'DCCT/NGSP — US standard' },
        ];

  return (
    <div>
      <div className="field">
        <label>What are you converting?</label>
        <div className="seg stack-sm">
          <button type="button" className="seg-btn" aria-pressed={measure === 'glucose'}
            onClick={() => pick('glucose')}>Blood glucose</button>
          <button type="button" className="seg-btn" aria-pressed={measure === 'hba1c'}
            onClick={() => pick('hba1c')}>HbA1c</button>
        </div>
        <p className="muted stack-sm">
          {measure === 'glucose'
            ? 'A single reading, from a meter or a finger-prick test.'
            : 'An average over roughly the previous three months, from a blood test.'}
        </p>
      </div>

      <div className="field-grid stack">
        <div className="field">
          <label htmlFor="val">Reading</label>
          <input id="val" type="number" min="0" step="0.1" value={value}
            onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="unit">In this unit</label>
          <select id="unit" value={from} onChange={(e) => setFrom(e.target.value)}>
            {UNITS.map((u) => (
              <option key={u.key} value={u.key}>{u.label} — {u.note}</option>
            ))}
          </select>
        </div>
      </div>

      {!result.ok && <p className="note stack">{result.reason}</p>}

      {result.ok && (
        <>
          <div className="results">
            {measure === 'glucose' ? (
              <>
                <div className="result primary">
                  <div className="label">mmol/L</div>
                  <div className="value">{result.mmol.toFixed(1)}</div>
                </div>
                <div className="result primary">
                  <div className="label">mg/dL</div>
                  <div className="value">{result.mgdl.toFixed(0)}</div>
                </div>
              </>
            ) : (
              <>
                <div className="result primary">
                  <div className="label">mmol/mol (IFCC)</div>
                  <div className="value">{result.ifcc.toFixed(0)}</div>
                </div>
                <div className="result primary">
                  <div className="label">% (DCCT)</div>
                  <div className="value">{result.ngsp.toFixed(1)}</div>
                </div>
              </>
            )}
          </div>

          <p className="muted-block">
            {measure === 'glucose'
              ? `Converted using 1 mmol/L = ${GLUCOSE_FACTOR} mg/dL, which comes from the molar mass of glucose.`
              : 'Converted using the IFCC–DCCT relationship: mmol/mol = (10.93 × %) − 23.5.'}{' '}
            Verified {LAST_VERIFIED}. This tool converts units only — it does not
            interpret a reading. What a number means depends on when it was taken,
            your circumstances and your treatment, which is a conversation for your
            doctor or diabetes team.
          </p>
        </>
      )}
    </div>
  );
}
