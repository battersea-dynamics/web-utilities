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
      prev.length >= 3
        ? prev
        : [...prev, { ...blank(`Deal ${String.fromCharCode(65 + prev.length)}`) }]
    );

  const removeDeal = (i) =>
    setDeals((prev) => (prev.length <= 2 ? prev : prev.filter((_, idx) => idx !== i)));

  const results = useMemo(
    () =>
      deals.map((d) => {
        const borrowed = Math.max(0, d.price - d.deposit);
        const r = amortise({ principal: borrowed, annualRate: d.rate, years: d.term });
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
  const cheapestMonthly = valid.length ? Math.min(...valid.map((r) => r.monthly)) : NaN;
  const cheapestOverall = valid.length ? Math.min(...valid.map((r) => r.trueCost)) : NaN;

  const best = (v, target) => (v === target ? 'is-best' : undefined);

  return (
    <div>
      <div className="compare-grid">
        {deals.map((d, i) => (
          <div key={i} className="compare-col">
            <div className="row-between stack-sm">
              <input
                type="text"
                className="compare-title"
                value={d.label}
                aria-label={`Name for deal ${i + 1}`}
                onChange={(e) => update(i, 'label', e.target.value)}
              />
              {deals.length > 2 && (
                <button type="button" className="btn-tiny" onClick={() => removeDeal(i)}>
                  Remove
                </button>
              )}
            </div>

            <div className="field">
              <label>Property price (£)</label>
              <input type="number" min="0" step="1000" value={d.price}
                onChange={(e) => update(i, 'price', Number(e.target.value))} />
            </div>
            <div className="field">
              <label>Deposit (£)</label>
              <input type="number" min="0" step="1000" value={d.deposit}
                onChange={(e) => update(i, 'deposit', Number(e.target.value))} />
            </div>
            <div className="field">
              <label>Rate (%)</label>
              <input type="number" min="0" max="20" step="0.05" value={d.rate}
                onChange={(e) => update(i, 'rate', Number(e.target.value))} />
            </div>
            <div className="field">
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
        <button type="button" className="btn-ghost stack" onClick={addDeal}>
          + Add a third deal
        </button>
      )}

      <div className="table-scroll stack-lg">
        <table className="data-table">
          <thead>
            <tr>
              <th />
              {results.map((r, i) => <th key={i}>{r.label}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="label-cell">Borrowing</td>
              {results.map((r, i) => <td key={i}>{gbp(r.borrowed)}</td>)}
            </tr>
            <tr>
              <td className="label-cell"><strong>Monthly payment</strong></td>
              {results.map((r, i) => (
                <td key={i} className={best(r.monthly, cheapestMonthly)}>{gbp(r.monthly)}</td>
              ))}
            </tr>
            <tr>
              <td className="label-cell">Total interest</td>
              {results.map((r, i) => <td key={i}>{gbp(r.totalInterest)}</td>)}
            </tr>
            <tr>
              <td className="label-cell">Fees</td>
              {results.map((r, i) => <td key={i}>{gbp(Number(r.fee || 0))}</td>)}
            </tr>
            <tr>
              <td className="label-cell"><strong>Interest + fees</strong></td>
              {results.map((r, i) => (
                <td key={i} className={best(r.trueCost, cheapestOverall)}>{gbp(r.trueCost)}</td>
              ))}
            </tr>
            <tr>
              <td className="label-cell">Total repaid</td>
              {results.map((r, i) => <td key={i}>{gbp(r.totalPaid)}</td>)}
            </tr>
            <tr>
              <td className="label-cell">Term</td>
              {results.map((r, i) => <td key={i}>{monthsToText(r.months)}</td>)}
            </tr>
          </tbody>
        </table>
      </div>

      {valid.length >= 2 && (
        <p className="note">
          {(() => {
            const byMonthly = valid.find((r) => r.monthly === cheapestMonthly);
            const byTotal = valid.find((r) => r.trueCost === cheapestOverall);
            if (byMonthly.label === byTotal.label) {
              return <><strong>{byTotal.label}</strong> is cheapest both monthly and overall.</>;
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

      <div className="tool-actions">
        <a className="card" href="/mortgage-calculator">← Single mortgage calculator</a>
        <a className="card" href="/mortgage-overpayment-calculator">Model overpayments →</a>
      </div>
    </div>
  );
}
