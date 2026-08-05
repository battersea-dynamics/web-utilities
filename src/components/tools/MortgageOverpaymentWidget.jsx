import { useState, useMemo } from 'react';
import { useNumber } from './useNumber.js';
import { amortise, gbp, monthsToText } from './mortgageEngine.js';

export default function MortgageOverpaymentWidget() {
  const [balance, setBalance, balanceN] = useNumber(180000);
  const [rate, setRate, rateN] = useNumber(4.5);
  const [term, setTerm, termN] = useNumber(22, 1);

  const [monthlyOverpay, setMonthlyOverpay, monthlyOverpayN] = useNumber(200);
  const [startMonth, setStartMonth, startMonthN] = useNumber(1, 1);
  const [lumpAmount, setLumpAmount, lumpAmountN] = useNumber(3000);
  const [lumpMonth, setLumpMonth, lumpMonthN] = useNumber(6, 1);
  const [mode, setMode] = useState('reduce-term');

  const base = useMemo(
    () => amortise({ principal: balanceN, annualRate: rateN, years: termN }),
    [balanceN, rateN, termN]
  );

  const withOverpay = useMemo(
    () =>
      amortise({
        principal: balanceN,
        annualRate: rateN,
        years: termN,
        monthlyOverpay: monthlyOverpayN,
        overpayStartMonth: startMonthN,
        lumpSums: lumpAmountN > 0 ? [{ month: lumpMonthN, amount: lumpAmountN }] : [],
        overpayMode: mode,
      }),
    [balanceN, rateN, termN, monthlyOverpayN, startMonthN, lumpAmountN, lumpMonthN, mode]
  );

  const ok = base.ok && withOverpay.ok;
  const interestSaved = ok ? base.totalInterest - withOverpay.totalInterest : 0;
  const monthsSaved = ok ? base.months - withOverpay.months : 0;

  // Total extra actually handed over: the monthly amount only counts for the
  // months it was actually paid, which is from startMonth until the loan clears.
  const overpayMonths = ok ? Math.max(0, withOverpay.months - startMonthN + 1) : 0;
  const totalOverpaid = ok
    ? monthlyOverpayN * overpayMonths + (lumpAmountN > 0 ? lumpAmountN : 0)
    : 0;
  const savedPerPound = totalOverpaid > 0 ? interestSaved / totalOverpaid : 0;

  // The 10% annual allowance most UK fixed deals permit without penalty.
  const annualOverpayment = monthlyOverpayN * 12 + (lumpAmountN > 0 ? lumpAmountN : 0);
  const allowance = balanceN * 0.1;
  const overAllowance = annualOverpayment > allowance;

  return (
    <div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="bal">Amount outstanding (£)</label>
          <input id="bal" type="number" min="0" step="1000" value={balance}
            onChange={(e) => setBalance(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="r">Interest rate (%)</label>
          <input id="r" type="number" min="0" max="20" step="0.05" value={rate}
            onChange={(e) => setRate(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="t">Years left</label>
          <input id="t" type="number" min="1" max="40" value={term}
            onChange={(e) => setTerm(e.target.value)} />
        </div>
      </div>

      <div className="field-grid stack">
        <div className="field">
          <label htmlFor="mo">Monthly overpayment (£)</label>
          <input id="mo" type="number" min="0" step="25" value={monthlyOverpay}
            onChange={(e) => setMonthlyOverpay(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="sm">Starting in month</label>
          <input id="sm" type="number" min="1" value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="la">One-off lump sum (£)</label>
          <input id="la" type="number" min="0" step="500" value={lumpAmount}
            onChange={(e) => setLumpAmount(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lm">Paid in month</label>
          <input id="lm" type="number" min="1" value={lumpMonth}
            onChange={(e) => setLumpMonth(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="mode">Overpayment effect</label>
          <select id="mode" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="reduce-term">Shorten the term</option>
            <option value="reduce-payment">Lower the monthly payment</option>
          </select>
        </div>
      </div>

      {!ok && (
        <p className="note note-warn stack">
          {base.reason || withOverpay.reason || 'Check the figures entered.'}
        </p>
      )}

      {ok && (
        <>
          <div className="results">
            <div className="result primary">
              <div className="label">Interest saved</div>
              <div className="value">{gbp(interestSaved)}</div>
            </div>
            <div className="result">
              <div className="label">Time saved</div>
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
            <p className="note">
              You pay <strong>{gbp(totalOverpaid)}</strong> extra over the life of the
              mortgage and avoid <strong>{gbp(interestSaved)}</strong> of interest — about{' '}
              <strong>{gbp(savedPerPound, 2)}</strong> saved for every £1 overpaid, plus a
              mortgage that ends {monthsToText(monthsSaved)} sooner. The earlier an
              overpayment is made, the more it saves.
            </p>
          )}

          {overAllowance && (
            <p className="note note-warn">
              That's {gbp(annualOverpayment)} in a year, above the {gbp(allowance)} that a
              typical 10% annual allowance would permit. Most fixed-rate deals charge an
              early repayment penalty above that — check your mortgage offer.
            </p>
          )}

          {mode === 'reduce-payment' && (
            <p className="muted-block">
              In this mode the lender recalculates your required payment downwards after each
              overpayment. If you keep paying the extra on top of the reduced amount, you'll
              still finish ahead of schedule.
            </p>
          )}
        </>
      )}

      <div className="tool-actions">
        <a className="card" href="/mortgage-calculator">← Single mortgage calculator</a>
        <a className="card" href="/mortgage-comparison-calculator">Compare mortgages →</a>
      </div>
    </div>
  );
}
