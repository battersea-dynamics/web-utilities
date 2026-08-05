import { useState, useMemo } from 'react';
import { amortise, toYearly, atMonth, gbp, monthsToText } from './mortgageEngine.js';
import { useNumber } from './useNumber.js';

export default function MortgageWidget() {
  // Core inputs — always visible, so a result appears immediately.
  const [price, setPrice, priceN] = useNumber(300000);
  const [deposit, setDeposit, depositN] = useNumber(45000);
  const [rate, setRate, rateN] = useNumber(4.5);
  const [term, setTerm, termN] = useNumber(25, 1);

  // Advanced — collapsed by default to keep the tool usable at a glance.
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [monthlyOverpay, setMonthlyOverpay, monthlyOverpayN] = useNumber(0);
  const [lumpAmount, setLumpAmount, lumpAmountN] = useNumber(0);
  const [lumpMonth, setLumpMonth, lumpMonthN] = useNumber(12, 1);
  const [newRate, setNewRate] = useState('');
  const [rateChangeMonth, setRateChangeMonth, rateChangeMonthN] = useNumber(25, 1);
  const [fee, setFee, feeN] = useNumber(0);
  const [feeAddedToLoan, setFeeAddedToLoan] = useState(true);

  const [snapshotMonth, setSnapshotMonth, snapshotMonthN] = useNumber(9, 1);
  const [showSchedule, setShowSchedule] = useState(false);

  const borrowed = Math.max(0, priceN - depositN);
  const principal = borrowed + (feeN > 0 && feeAddedToLoan ? feeN : 0);

  const opts = useMemo(
    () => ({
      principal,
      annualRate: rateN,
      years: termN,
      monthlyOverpay: monthlyOverpayN,
      lumpSums: lumpAmountN > 0 ? [{ month: lumpMonthN, amount: lumpAmountN }] : [],
      rateChanges:
        newRate.trim() !== '' && Number(newRate) >= 0
          ? [{ month: rateChangeMonthN, rate: Number(newRate) }]
          : [],
    }),
    [principal, rateN, termN, monthlyOverpayN, lumpAmountN, lumpMonthN, newRate, rateChangeMonthN]
  );

  const result = useMemo(() => amortise(opts), [opts]);
  const plain = useMemo(
    () => amortise({ principal, annualRate: rateN, years: termN }),
    [principal, rateN, termN]
  );

  const yearly = useMemo(() => (result.ok ? toYearly(result.schedule) : []), [result]);
  const snap = result.ok ? atMonth(result.schedule, snapshotMonthN) : null;

  const ltv = priceN > 0 ? (borrowed / priceN) * 100 : 0;
  const monthsSaved = plain.months - result.months;
  const interestSaved = plain.totalInterest - result.totalInterest;
  const upfront = feeN > 0 && !feeAddedToLoan ? feeN : 0;

  return (
    <div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="price">Property price (£)</label>
          <input id="price" type="number" min="0" step="1000" value={price}
            onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="deposit">Deposit (£)</label>
          <input id="deposit" type="number" min="0" step="1000" value={deposit}
            onChange={(e) => setDeposit(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="rate">Interest rate (%)</label>
          <input id="rate" type="number" min="0" max="20" step="0.05" value={rate}
            onChange={(e) => setRate(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="term">Term (years)</label>
          <input id="term" type="number" min="1" max="40" step="1" value={term}
            onChange={(e) => setTerm(e.target.value)} />
        </div>
      </div>

      <details className="disclosure" open={showAdvanced}
        onToggle={(e) => setShowAdvanced(e.currentTarget.open)}>
        <summary>More options — overpayments, rate change, fees</summary>

        <div className="field-grid stack">
          <div className="field">
            <label htmlFor="over">Monthly overpayment (£)</label>
            <input id="over" type="number" min="0" step="25" value={monthlyOverpay}
              onChange={(e) => setMonthlyOverpay(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="lump">One-off lump sum (£)</label>
            <input id="lump" type="number" min="0" step="500" value={lumpAmount}
              onChange={(e) => setLumpAmount(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="lumpm">Paid in month</label>
            <input id="lumpm" type="number" min="1" value={lumpMonth}
              onChange={(e) => setLumpMonth(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="nrate">Rate changes to (%)</label>
            <input id="nrate" type="number" min="0" max="25" step="0.05" placeholder="none"
              value={newRate} onChange={(e) => setNewRate(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="rcm">From month</label>
            <input id="rcm" type="number" min="1" value={rateChangeMonth}
              onChange={(e) => setRateChangeMonth(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="fee">Arrangement fee (£)</label>
            <input id="fee" type="number" min="0" step="50" value={fee}
              onChange={(e) => setFee(e.target.value)} />
          </div>
        </div>

        {feeN > 0 && (
          <div className="check-row">
            <label className="check">
              <input type="checkbox" checked={feeAddedToLoan}
                onChange={(e) => setFeeAddedToLoan(e.target.checked)} />
              Add the fee to the loan (rather than paying it upfront)
            </label>
          </div>
        )}
      </details>

      {!result.ok && <p className="note stack">{result.reason}</p>}

      {result.ok && (
        <>
          <div className="results">
            <div className="result primary">
              <div className="label">Monthly payment</div>
              <div className="value">{gbp(result.schedule[0].payment)}</div>
            </div>
            <div className="result">
              <div className="label">Borrowing</div>
              <div className="value">{gbp(principal)}</div>
            </div>
            <div className="result">
              <div className="label">Total interest</div>
              <div className="value">{gbp(result.totalInterest)}</div>
            </div>
            <div className="result">
              <div className="label">Total repaid</div>
              <div className="value">{gbp(result.totalPaid + upfront)}</div>
            </div>
            <div className="result">
              <div className="label">Loan to value</div>
              <div className="value">{ltv.toFixed(0)}%</div>
            </div>
            <div className="result">
              <div className="label">Paid off in</div>
              <div className="value">{monthsToText(result.months)}</div>
            </div>
          </div>

          {(monthlyOverpayN > 0 || lumpAmountN > 0) && monthsSaved > 0 && (
            <p className="note">
              Those overpayments clear the mortgage{' '}
              <strong>{monthsToText(monthsSaved)}</strong> early and save{' '}
              <strong>{gbp(interestSaved)}</strong> in interest.
            </p>
          )}

          {/* Point-in-time snapshot — "what will I be paying in month 9?" */}
          <div className="divider-top">
            <div className="field field-narrow">
              <label htmlFor="snap">Show me month</label>
              <input id="snap" type="number" min="1" max={result.months} value={snapshotMonth}
                onChange={(e) => setSnapshotMonth(e.target.value)} />
            </div>

            {snap && (
              <div className="results">
                <div className="result">
                  <div className="label">Payment that month</div>
                  <div className="value">{gbp(snap.payment)}</div>
                </div>
                <div className="result">
                  <div className="label">Of which interest</div>
                  <div className="value">{gbp(snap.interest)}</div>
                </div>
                <div className="result">
                  <div className="label">Of which capital</div>
                  <div className="value">{gbp(snap.principal)}</div>
                </div>
                <div className="result">
                  <div className="label">Balance left</div>
                  <div className="value">{gbp(snap.balance)}</div>
                </div>
                <div className="result">
                  <div className="label">Interest so far</div>
                  <div className="value">{gbp(snap.cumulativeInterest)}</div>
                </div>
                <div className="result">
                  <div className="label">Equity in home</div>
                  <div className="value">{gbp(priceN - snap.balance)}</div>
                </div>
              </div>
            )}
          </div>

          <details className="disclosure" open={showSchedule}
            onToggle={(e) => setShowSchedule(e.currentTarget.open)}>
            <summary>Year-by-year schedule</summary>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {['Year', 'Interest', 'Capital', 'Paid', 'Balance'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {yearly.map((y) => (
                    <tr key={y.year}>
                      <td>{y.year}</td>
                      <td>{gbp(y.interest)}</td>
                      <td>{gbp(y.principal)}</td>
                      <td>{gbp(y.paid)}</td>
                      <td>{gbp(y.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <div className="tool-actions">
            <a className="card" href="/mortgage-comparison-calculator">Compare mortgages →</a>
            <a className="card" href="/mortgage-overpayment-calculator">Model overpayments →</a>
          </div>
        </>
      )}
    </div>
  );
}
