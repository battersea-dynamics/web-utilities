import { useState, useMemo } from 'react';
import { amortise, gbp, monthsToText } from './mortgageEngine.js';

export default function MortgageOverpaymentWidget() {
  const [balance, setBalance] = useState(180000);
  const [rate, setRate] = useState(4.5);
  const [term, setTerm] = useState(22);

  const [monthlyOverpay, setMonthlyOverpay] = useState(200);
  const [startMonth, setStartMonth] = useState(1);
  const [lumpAmount, setLumpAmount] = useState(3000);
  const [lumpMonth, setLumpMonth] = useState(6);
  const [mode, setMode] = useState('reduce-term');

  const base = useMemo(
    () => amortise({ principal: balance, annualRate: rate, years: term }),
    [balance, rate, term]
  );

  const withOverpay = useMemo(
    () =>
      amortise({
        principal: balance,
        annualRate: rate,
        years: term,
        monthlyOverpay,
        overpayStartMonth: startMonth,
        lumpSums: lumpAmount > 0 ? [{ month: lumpMonth, amount: lumpAmount }] : [],
        overpayMode: mode,
      }),
    [balance, rate, term, monthlyOverpay, startMonth, lumpAmount, lumpMonth, mode]
  );

  const ok = base.ok && withOverpay.ok;
  const interestSaved = ok ? base.totalInterest - withOverpay.totalInterest : 0;
  const monthsSaved = ok ? base.months - withOverpay.months : 0;

  // Total extra actually handed over: the monthly amount only counts for the
  // months it was actually paid, which is from startMonth until the loan clears.
  const overpayMonths = ok
    ? Math.max(0, withOverpay.months - startMonth + 1)
    : 0;
  const totalOverpaid = ok
    ? monthlyOverpay * overpayMonths + (lumpAmount > 0 ? lumpAmount : 0)
    : 0;
  const savedPerPound = totalOverpaid > 0 ? interestSaved / totalOverpaid : 0;

  // The 10% annual allowance most UK fixed deals permit without penalty.
  const annualOverpayment = monthlyOverpay * 12 + (lumpAmount > 0 ? lumpAmount : 0);
  const allowance = balance * 0.1;
  const overAllowance = annualOverpayment > allowance;

  return (
    <div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="bal">Amount outstanding (£)</label>
          <input id="bal" type="number" min="0" step="1000" value={balance}
            onChange={(e) => setBalance(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="r">Interest rate (%)</label>
          <input id="r" type="number" min="0" max="20" step="0.05" value={rate}
            onChange={(e) => setRate(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="t">Years left</label>
          <input id="t" type="number" min="1" max="40" value={term}
            onChange={(e) => setTerm(Number(e.target.value))} />
        </div>
      </div>

      <div className="field-grid" style={{ marginTop: '1rem' }}>
        <div className="field">
          <label htmlFor="mo">Monthly overpayment (£)</label>
          <input id="mo" type="number" min="0" step="25" value={monthlyOverpay}
            onChange={(e) => setMonthlyOverpay(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="sm">Starting in month</label>
          <input id="sm" type="number" min="1" value={startMonth}
            onChange={(e) => setStartMonth(Math.max(1, Number(e.target.value)))} />
        </div>
        <div className="field">
          <label htmlFor="la">One-off lump sum (£)</label>
          <input id="la" type="number" min="0" step="500" value={lumpAmount}
            onChange={(e) => setLumpAmount(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="lm">Paid in month</label>
          <input id="lm" type="number" min="1" value={lumpMonth}
            onChange={(e) => setLumpMonth(Math.max(1, Number(e.target.value)))} />
        </div>
        <div className="field">
          <label htmlFor="mode">Overpayment effect</label>
          <select id="mode" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="reduce-term">Shorten the term</option>
            <option value="reduce-payment">Lower the monthly payment</option>
          </select>
        </div>
      </div>

      {!ok && <p className="saving-note" style={{ marginTop: '1rem' }}>
        The payment does not cover the interest at this rate.
      </p>}

      {ok && (
        <>
          <div className="results">
            <div className="result primary">
              <div className="label">Interest saved</div>
              <div className="value">{gbp(interestSaved)}</div>
            </div>
            <div className="result">
              <div className="label">
                {mode === 'reduce-term' ? 'Time saved' : 'Time saved'}
              </div>
              <div className="value">{monthsSaved > 0 ? monthsToText(monthsSaved) : '—'}</div>
            </div>
            <div className="result">
              <div className="label">Normal payment</div>
              <div className="value">{gbp(base.schedule[0].payment)}</div>
            </div>
            <div className="result">
              <div className="label">Cleared in</div>
              <div className="value">{monthsToText(withOverpay.months)}</div>
            </div>
            <div className="result">
              <div className="label">Interest without</div>
              <div className="value">{gbp(base.totalInterest)}</div>
            </div>
            <div className="result">
              <div className="label">Interest with</div>
              <div className="value">{gbp(withOverpay.totalInterest)}</div>
            </div>
          </div>

          {interestSaved > 0 && totalOverpaid > 0 && (
            <p className="saving-note">
              You pay <strong>{gbp(totalOverpaid)}</strong> extra over the life of the
              mortgage and avoid <strong>{gbp(interestSaved)}</strong> of interest — about{' '}
              <strong>{gbp(savedPerPound, 2)}</strong> saved for every £1 overpaid, plus a
              mortgage that ends {monthsToText(monthsSaved)} sooner. The earlier an
              overpayment is made, the more it saves.
            </p>
          )}

          {overAllowance && (
            <p className="saving-note" style={{ background: '#fdeceb', color: '#8a2b25' }}>
              That's {gbp(annualOverpayment)} in a year, above the {gbp(allowance)} that a
              typical 10% annual allowance would permit. Most fixed-rate deals charge an
              early repayment penalty above that — check your mortgage offer.
            </p>
          )}

          {mode === 'reduce-payment' && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--ink-soft)', marginTop: '0.75rem' }}>
              In this mode the lender recalculates your required payment downwards after each
              overpayment. If you keep paying the extra on top of the reduced amount, you'll
              still finish ahead of schedule.
            </p>
          )}
        </>
      )}

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <a className="card" href="/mortgage-calculator"
          style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>← Single mortgage calculator</a>
        <a className="card" href="/mortgage-comparison-calculator"
          style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>Compare mortgages →</a>
      </div>
    </div>
  );
}
