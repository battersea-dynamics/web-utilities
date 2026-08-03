import { useState, useMemo } from 'react';

const gbp = (n) =>
  isFinite(n)
    ? n.toLocaleString('en-GB', {
        style: 'currency',
        currency: 'GBP',
        maximumFractionDigits: 0,
      })
    : '—';

/**
 * Standard repayment mortgage formula:
 *   M = P * r / (1 - (1 + r)^-n)
 * where r is the monthly rate and n the number of monthly payments.
 */
function monthlyPayment(principal, annualRate, years) {
  const n = years * 12;
  const r = annualRate / 100 / 12;
  if (principal <= 0 || n <= 0) return 0;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

/** Amortise month by month so we can measure the effect of overpaying. */
function amortise(principal, annualRate, years, overpay) {
  const r = annualRate / 100 / 12;
  const base = monthlyPayment(principal, annualRate, years);
  const pay = base + Math.max(0, overpay);

  let balance = principal;
  let interestPaid = 0;
  let months = 0;
  const cap = years * 12 + 1;

  while (balance > 0 && months < cap) {
    const interest = balance * r;
    let capitalRepaid = pay - interest;
    if (capitalRepaid <= 0) return { months: Infinity, interestPaid: Infinity, base };
    if (capitalRepaid > balance) capitalRepaid = balance;
    interestPaid += interest;
    balance -= capitalRepaid;
    months++;
  }

  return { months, interestPaid, base };
}

export default function MortgageWidget() {
  const [price, setPrice] = useState(300000);
  const [deposit, setDeposit] = useState(45000);
  const [rate, setRate] = useState(4.5);
  const [term, setTerm] = useState(25);
  const [overpay, setOverpay] = useState(0);

  const principal = Math.max(0, price - deposit);

  const result = useMemo(
    () => amortise(principal, rate, term, overpay),
    [principal, rate, term, overpay]
  );

  const plain = useMemo(
    () => amortise(principal, rate, term, 0),
    [principal, rate, term]
  );

  const monthly = result.base + Math.max(0, overpay);
  const totalRepaid = principal + result.interestPaid;
  const ltv = price > 0 ? (principal / price) * 100 : 0;

  const monthsSaved = plain.months - result.months;
  const interestSaved = plain.interestPaid - result.interestPaid;

  const yearsPart = Math.floor(result.months / 12);
  const monthsPart = result.months % 12;

  return (
    <div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="price">Property price (£)</label>
          <input
            id="price" type="number" min="0" step="1000"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </div>

        <div className="field">
          <label htmlFor="deposit">Deposit (£)</label>
          <input
            id="deposit" type="number" min="0" step="1000"
            value={deposit}
            onChange={(e) => setDeposit(Number(e.target.value))}
          />
        </div>

        <div className="field">
          <label htmlFor="rate">Interest rate (%)</label>
          <input
            id="rate" type="number" min="0" max="20" step="0.05"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          />
        </div>

        <div className="field">
          <label htmlFor="term">Term (years)</label>
          <input
            id="term" type="number" min="1" max="40" step="1"
            value={term}
            onChange={(e) => setTerm(Number(e.target.value))}
          />
        </div>

        <div className="field">
          <label htmlFor="overpay">Monthly overpayment (£)</label>
          <input
            id="overpay" type="number" min="0" step="25"
            value={overpay}
            onChange={(e) => setOverpay(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="results">
        <div className="result primary">
          <div className="label">Monthly payment</div>
          <div className="value">{gbp(monthly)}</div>
        </div>
        <div className="result">
          <div className="label">Borrowing</div>
          <div className="value">{gbp(principal)}</div>
        </div>
        <div className="result">
          <div className="label">Total interest</div>
          <div className="value">{gbp(result.interestPaid)}</div>
        </div>
        <div className="result">
          <div className="label">Total repaid</div>
          <div className="value">{gbp(totalRepaid)}</div>
        </div>
        <div className="result">
          <div className="label">Loan to value</div>
          <div className="value">{ltv.toFixed(0)}%</div>
        </div>
        <div className="result">
          <div className="label">Paid off in</div>
          <div className="value">
            {isFinite(result.months) ? `${yearsPart}y ${monthsPart}m` : '—'}
          </div>
        </div>
      </div>

      {overpay > 0 && isFinite(interestSaved) && monthsSaved > 0 && (
        <p className="saving-note">
          Overpaying {gbp(overpay)} a month clears the mortgage{' '}
          <strong>
            {Math.floor(monthsSaved / 12)} years {monthsSaved % 12} months
          </strong>{' '}
          early and saves <strong>{gbp(interestSaved)}</strong> in interest.
        </p>
      )}
    </div>
  );
}
