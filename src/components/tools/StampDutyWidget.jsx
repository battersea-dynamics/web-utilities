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

  const tabStyle = (active) => ({
    font: 'inherit',
    fontSize: '0.875rem',
    fontWeight: active ? 700 : 500,
    padding: '0.55rem 0.9rem',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--rule)'}`,
    background: active ? 'var(--accent-tint)' : 'var(--surface)',
    color: active ? 'var(--accent)' : 'var(--ink)',
    borderRadius: '4px',
    cursor: 'pointer',
  });

  return (
    <div>
      <div className="field" style={{ marginBottom: '1rem' }}>
        <label style={{ marginBottom: '0.4rem' }}>Where is the property?</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              aria-pressed={region === r}
              style={tabStyle(region === r)}
            >
              {PROPERTY_TAX[r].name}
            </button>
          ))}
        </div>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem', color: 'var(--ink-soft)' }}>
          {regime.name} charges <strong>{regime.tax}</strong> ({regime.abbr}), collected by{' '}
          {regime.authority}.
        </p>
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="price">Purchase price (£)</label>
          <input
            id="price"
            type="number"
            min="0"
            step="5000"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.85rem', flexWrap: 'wrap', fontSize: '0.9375rem' }}>
        <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={firstTimeBuyer}
            onChange={(e) => setFirstTimeBuyer(e.target.checked)}
          />
          First-time buyer
        </label>
        <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={additionalProperty}
            onChange={(e) => setAdditionalProperty(e.target.checked)}
          />
          Additional property (second home or buy-to-let)
        </label>
      </div>

      {!result.ok && (
        <p className="saving-note" style={{ marginTop: '1rem' }}>{result.reason}</p>
      )}

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
            <p className="saving-note">
              First-time buyer relief saves you{' '}
              <strong>{gbp(result.savingVsStandard)}</strong> against the standard rates.
            </p>
          )}

          {result.notes.map((n, i) => (
            <p key={i} className="saving-note" style={{ marginTop: '0.6rem' }}>{n}</p>
          ))}

          {result.rows.length > 0 && (
            <div style={{ overflowX: 'auto', marginTop: '1.25rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse',
                fontFamily: 'var(--font-num)', fontSize: '0.8125rem' }}>
                <thead>
                  <tr>
                    {['Band', 'Rate', 'Amount in band', 'Tax'].map((h) => (
                      <th key={h} style={{ textAlign: 'right', padding: '0.35rem 0.5rem',
                        borderBottom: '1px solid var(--rule)', color: 'var(--ink-soft)', fontWeight: 600 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'right', padding: '0.3rem 0.5rem' }}>
                        {gbp(row.from)}–{row.to === Infinity ? 'above' : gbp(row.to)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.3rem 0.5rem' }}>{row.rate}%</td>
                      <td style={{ textAlign: 'right', padding: '0.3rem 0.5rem' }}>{gbp(row.slice)}</td>
                      <td style={{ textAlign: 'right', padding: '0.3rem 0.5rem' }}>{gbp(row.tax)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p style={{ marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--ink-soft)' }}>
            Rates verified {LAST_VERIFIED} against{' '}
            <a href={regime.sourceUrl} target="_blank" rel="noopener noreferrer">
              {regime.authority}
            </a>
            . An estimate, not a quote — your solicitor calculates the figure you actually pay.
          </p>

          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a className="card" href="/mortgage-calculator" style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>
              Mortgage calculator →
            </a>
          </div>
        </>
      )}
    </div>
  );
}
