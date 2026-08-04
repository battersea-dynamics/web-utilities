import { useState, useMemo } from 'react';
import { amortise, gbp, monthsToText } from './mortgageEngine.js';

const blank = (label) => ({
  label,
  price: 300000,
  deposit: 45000,
  rate: 4.5,
  term: 25,
  fee: 0,
});

export default function MortgageCompareWidget() {
  const [deals, setDeals] = useState([
    { ...blank('Deal A'), rate: 4.5, term: 25 },
    { ...blank('Deal B'), rate: 4.2, term: 25, fee: 999 },
  ]);

  const update = (i, key, value) =>
    setDeals((prev) => prev.map((d, idx) => (idx === i ? { ...d, [key]: value } : d)));

  const addDeal = () =>
    setDeals((prev) =>
      prev.length >= 3 ? prev : [...prev, { ...blank(`Deal ${String.fromCharCode(65 + prev.length)}`) }]
    );

  const removeDeal = (i) =>
    setDeals((prev) => (prev.length <= 2 ? prev : prev.filter((_, idx) => idx !== i)));

  const results = useMemo(
    () =>
      deals.map((d) => {
        const borrowed = Math.max(0, d.price - d.deposit);
        const r = amortise({
          principal: borrowed,
          annualRate: d.rate,
          years: d.term,
        });
        // The fee is counted as a real cost of the deal, paid upfront.
        return {
          ...d,
          borrowed,
          ok: r.ok,
          monthly: r.ok ? r.schedule[0].payment : NaN,
          totalInterest: r.ok ? r.totalInterest : NaN,
          trueCost: r.ok ? r.totalInterest + Number(d.fee || 0) : NaN,
          totalPaid: r.ok ? r.totalPaid + Number(d.fee || 0) : NaN,
          months: r.ok ? r.months : Infinity,
        };
      }),
    [deals]
  );

  const valid = results.filter((r) => r.ok);
  const cheapestMonthly = valid.length
    ? Math.min(...valid.map((r) => r.monthly))
    : NaN;
  const cheapestOverall = valid.length
    ? Math.min(...valid.map((r) => r.trueCost))
    : NaN;

  const cell = {
    padding: '0.5rem 0.6rem',
    borderBottom: '1px solid var(--rule)',
    textAlign: 'right',
    fontFamily: 'var(--font-num)',
    whiteSpace: 'nowrap',
  };
  const head = {
    padding: '0.5rem 0.6rem',
    borderBottom: '1px solid var(--rule)',
    textAlign: 'left',
    fontSize: '0.8125rem',
    color: 'var(--ink-soft)',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  };

  return (
    <div>
      <div style={{ display: 'grid', gap: '1.25rem',
        gridTemplateColumns: `repeat(auto-fit, minmax(14rem, 1fr))` }}>
        {deals.map((d, i) => (
          <div key={i} style={{ border: '1px solid var(--rule)', borderRadius: 'var(--radius)',
            padding: '0.9rem', background: 'var(--paper)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '0.6rem' }}>
              <input type="text" value={d.label} onChange={(e) => update(i, 'label', e.target.value)}
                style={{ font: 'inherit', fontWeight: 700, border: 'none', background: 'transparent',
                  color: 'var(--ink)', width: '60%' }} />
              {deals.length > 2 && (
                <button type="button" onClick={() => removeDeal(i)}
                  style={{ font: 'inherit', fontSize: '0.75rem', border: '1px solid var(--rule)',
                    borderRadius: '4px', background: 'var(--surface)', cursor: 'pointer',
                    padding: '0.2rem 0.45rem' }}>Remove</button>
              )}
            </div>

            <div className="field" style={{ marginBottom: '0.5rem' }}>
              <label>Property price (£)</label>
              <input type="number" min="0" step="1000" value={d.price}
                onChange={(e) => update(i, 'price', Number(e.target.value))} />
            </div>
            <div className="field" style={{ marginBottom: '0.5rem' }}>
              <label>Deposit (£)</label>
              <input type="number" min="0" step="1000" value={d.deposit}
                onChange={(e) => update(i, 'deposit', Number(e.target.value))} />
            </div>
            <div className="field" style={{ marginBottom: '0.5rem' }}>
              <label>Rate (%)</label>
              <input type="number" min="0" max="20" step="0.05" value={d.rate}
                onChange={(e) => update(i, 'rate', Number(e.target.value))} />
            </div>
            <div className="field" style={{ marginBottom: '0.5rem' }}>
              <label>Term (years)</label>
              <input type="number" min="1" max="40" value={d.term}
                onChange={(e) => update(i, 'term', Number(e.target.value))} />
            </div>
            <div className="field">
              <label>Fees (£)</label>
              <input type="number" min="0" step="50" value={d.fee}
                onChange={(e) => update(i, 'fee', Number(e.target.value))} />
            </div>
          </div>
        ))}
      </div>

      {deals.length < 3 && (
        <button type="button" onClick={addDeal}
          style={{ font: 'inherit', fontSize: '0.8125rem', marginTop: '1rem',
            padding: '0.4rem 0.7rem', border: '1px solid var(--rule)', borderRadius: '4px',
            background: 'var(--surface)', color: 'var(--ink)', cursor: 'pointer' }}>
          + Add a third deal
        </button>
      )}

      <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9375rem' }}>
          <thead>
            <tr>
              <th style={head}></th>
              {results.map((r, i) => (
                <th key={i} style={{ ...head, textAlign: 'right' }}>{r.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...cell, textAlign: 'left', fontFamily: 'var(--font-ui)' }}>Borrowing</td>
              {results.map((r, i) => <td key={i} style={cell}>{gbp(r.borrowed)}</td>)}
            </tr>
            <tr>
              <td style={{ ...cell, textAlign: 'left', fontFamily: 'var(--font-ui)' }}>
                <strong>Monthly payment</strong>
              </td>
              {results.map((r, i) => (
                <td key={i} style={{ ...cell,
                  color: r.monthly === cheapestMonthly ? 'var(--accent)' : 'inherit',
                  fontWeight: r.monthly === cheapestMonthly ? 700 : 400 }}>
                  {gbp(r.monthly)}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ ...cell, textAlign: 'left', fontFamily: 'var(--font-ui)' }}>Total interest</td>
              {results.map((r, i) => <td key={i} style={cell}>{gbp(r.totalInterest)}</td>)}
            </tr>
            <tr>
              <td style={{ ...cell, textAlign: 'left', fontFamily: 'var(--font-ui)' }}>Fees</td>
              {results.map((r, i) => <td key={i} style={cell}>{gbp(Number(r.fee || 0))}</td>)}
            </tr>
            <tr>
              <td style={{ ...cell, textAlign: 'left', fontFamily: 'var(--font-ui)' }}>
                <strong>Interest + fees</strong>
              </td>
              {results.map((r, i) => (
                <td key={i} style={{ ...cell,
                  color: r.trueCost === cheapestOverall ? 'var(--accent)' : 'inherit',
                  fontWeight: r.trueCost === cheapestOverall ? 700 : 400 }}>
                  {gbp(r.trueCost)}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ ...cell, textAlign: 'left', fontFamily: 'var(--font-ui)' }}>Total repaid</td>
              {results.map((r, i) => <td key={i} style={cell}>{gbp(r.totalPaid)}</td>)}
            </tr>
            <tr>
              <td style={{ ...cell, textAlign: 'left', fontFamily: 'var(--font-ui)' }}>Term</td>
              {results.map((r, i) => <td key={i} style={cell}>{monthsToText(r.months)}</td>)}
            </tr>
          </tbody>
        </table>
      </div>

      {valid.length >= 2 && (
        <p className="saving-note" style={{ marginTop: '1.25rem' }}>
          {(() => {
            const byMonthly = valid.find((r) => r.monthly === cheapestMonthly);
            const byTotal = valid.find((r) => r.trueCost === cheapestOverall);
            if (byMonthly.label === byTotal.label) {
              return (
                <>
                  <strong>{byTotal.label}</strong> is cheapest both monthly and overall.
                </>
              );
            }
            return (
              <>
                <strong>{byMonthly.label}</strong> has the lower monthly payment, but{' '}
                <strong>{byTotal.label}</strong> costs{' '}
                {gbp(byMonthly.trueCost - byTotal.trueCost)} less once interest and fees are
                counted. The cheapest monthly payment is not always the cheapest deal.
              </>
            );
          })()}
        </p>
      )}

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <a className="card" href="/mortgage-calculator"
          style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>← Single mortgage calculator</a>
        <a className="card" href="/mortgage-overpayment-calculator"
          style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>Model overpayments →</a>
      </div>
    </div>
  );
}
