import { useState, useMemo } from 'react';
import { takeHomePay, gbp } from './taxEngine.js';
import { INCOME_TAX, LAST_VERIFIED, TAX_YEAR } from './taxData.js';

const REGIONS = ['rUK', 'scotland'];

export default function TakeHomePayWidget() {
  const [region, setRegion] = useState('rUK');
  const [salary, setSalary] = useState(35000);
  const [pensionPercent, setPensionPercent] = useState(5);

  const result = useMemo(
    () => takeHomePay(salary, region, { pensionPercent }),
    [salary, region, pensionPercent]
  );

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
        <label style={{ marginBottom: '0.4rem' }}>Where do you live?</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              aria-pressed={region === r}
              style={tabStyle(region === r)}
            >
              {INCOME_TAX[r].name}
            </button>
          ))}
        </div>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem', color: 'var(--ink-soft)' }}>
          Scotland sets its own income tax bands. National Insurance is the same UK-wide.
        </p>
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="salary">Gross annual salary (£)</label>
          <input id="salary" type="number" min="0" step="1000" value={salary}
            onChange={(e) => setSalary(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="pension">Pension contribution (%)</label>
          <input id="pension" type="number" min="0" max="100" step="0.5" value={pensionPercent}
            onChange={(e) => setPensionPercent(Number(e.target.value))} />
        </div>
      </div>

      {!result.ok && (
        <p className="saving-note" style={{ marginTop: '1rem' }}>{result.reason}</p>
      )}

      {result.ok && (
        <>
          <div className="results">
            <div className="result primary">
              <div className="label">Take home a month</div>
              <div className="value">{gbp(result.monthly)}</div>
            </div>
            <div className="result">
              <div className="label">Take home a year</div>
              <div className="value">{gbp(result.takeHome)}</div>
            </div>
            <div className="result">
              <div className="label">Income tax</div>
              <div className="value">{gbp(result.incomeTax)}</div>
            </div>
            <div className="result">
              <div className="label">National Insurance</div>
              <div className="value">{gbp(result.nationalInsurance)}</div>
            </div>
            <div className="result">
              <div className="label">Pension</div>
              <div className="value">{gbp(result.pension)}</div>
            </div>
            <div className="result">
              <div className="label">Tax + NI rate</div>
              <div className="value">{result.effectiveTaxRate.toFixed(1)}%</div>
            </div>
          </div>

          <p className="saving-note">
            Your personal allowance is <strong>{gbp(result.allowance)}</strong>, and you keep{' '}
            <strong>{gbp(100 - result.marginalRate, 0)}</strong> of the next £100 you earn — a
            marginal rate of {result.marginalRate.toFixed(0)}%.
          </p>

          {result.bandRows.length > 0 && (
            <div style={{ overflowX: 'auto', marginTop: '1.25rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse',
                fontFamily: 'var(--font-num)', fontSize: '0.8125rem' }}>
                <thead>
                  <tr>
                    {['Band', 'Rate', 'Income taxed', 'Tax'].map((h) => (
                      <th key={h} style={{ textAlign: 'right', padding: '0.35rem 0.5rem',
                        borderBottom: '1px solid var(--rule)', color: 'var(--ink-soft)', fontWeight: 600 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.bandRows.map((row, i) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'right', padding: '0.3rem 0.5rem' }}>{row.label}</td>
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
            {TAX_YEAR} rates, verified {LAST_VERIFIED} against GOV.UK. Assumes a standard tax
            code, one job, and a workplace pension taken before income tax but after National
            Insurance. Student loans and salary sacrifice are not included.
          </p>
        </>
      )}
    </div>
  );
}
