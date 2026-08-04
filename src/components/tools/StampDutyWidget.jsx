import { useState, useMemo } from 'react';
import { propertyTax, gbp } from './taxEngine.js';
import { PROPERTY_TAX, LAST_VERIFIED } from './taxData.js';

const REGIONS = ['england', 'scotland', 'wales'];

export default function StampDutyWidget() {
  const [region, setRegion] = useState('england');
  const [price, setPrice] = useState(300000);
  const [firstTimeBuyer, setFirstTimeBuyer] = useState(false);
  const [additionalProperty, setAdditionalProperty] = useState(false);

  const result = useMemo(
    () => propertyTax(price, region, { firstTimeBuyer, additionalProperty }),
    [price, region, firstTimeBuyer, additionalProperty]
  );

  const regime = PROPERTY_TAX[region];

  return (
    <div>
      <div className="field">
        <label>Where is the property?</label>
        <div className="seg stack-sm">
          {REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              className="seg-btn"
              onClick={() => setRegion(r)}
              aria-pressed={region === r}
            >
              {PROPERTY_TAX[r].name}
            </button>
          ))}
        </div>
        <p className="muted stack-sm">
          {regime.name} charges <strong>{regime.tax}</strong> ({regime.abbr}), collected by{' '}
          {regime.authority}.
        </p>
      </div>

      <div className="field-grid stack">
        <div className="field">
          <label htmlFor="price">Purchase price (£)</label>
          <input id="price" type="number" min="0" step="5000" value={price}
            onChange={(e) => setPrice(Number(e.target.value))} />
        </div>
      </div>

      <div className="check-row">
        <label className="check">
          <input type="checkbox" checked={firstTimeBuyer}
            onChange={(e) => setFirstTimeBuyer(e.target.checked)} />
          First-time buyer
        </label>
        <label className="check">
          <input type="checkbox" checked={additionalProperty}
            onChange={(e) => setAdditionalProperty(e.target.checked)} />
          Additional property (second home or buy-to-let)
        </label>
      </div>

      {!result.ok && <p className="note stack">{result.reason}</p>}

      {result.ok && (
        <>
          <div className="results">
            <div className="result primary">
              <div className="label">{regime.abbr} to pay</div>
              <div className="value">{gbp(result.total)}</div>
            </div>
            <div className="result">
              <div className="label">Effective rate</div>
              <div className="value">{result.effectiveRate.toFixed(2)}%</div>
            </div>
            <div className="result">
              <div className="label">Total with tax</div>
              <div className="value">{gbp(price + result.total)}</div>
            </div>
          </div>

          {result.ftbApplied && result.savingVsStandard > 0 && (
            <p className="note">
              First-time buyer relief saves you{' '}
              <strong>{gbp(result.savingVsStandard)}</strong> against the standard rates.
            </p>
          )}

          {result.notes.map((n, i) => (
            <p key={i} className="note">{n}</p>
          ))}

          {result.rows.length > 0 && (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {['Band', 'Rate', 'Amount in band', 'Tax'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i}>
                      <td>{gbp(row.from)}–{row.to === Infinity ? 'above' : gbp(row.to)}</td>
                      <td>{row.rate}%</td>
                      <td>{gbp(row.slice)}</td>
                      <td>{gbp(row.tax)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="muted-block">
            Rates verified {LAST_VERIFIED} against{' '}
            <a href={regime.sourceUrl} target="_blank" rel="noopener noreferrer">
              {regime.authority}
            </a>
            . An estimate, not a quote — your solicitor calculates the figure you actually pay.
          </p>

          <div className="tool-actions">
            <a className="card" href="/mortgage-calculator">Mortgage calculator →</a>
          </div>
        </>
      )}
    </div>
  );
}
