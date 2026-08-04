// Shared amortisation engine behind the mortgage calculator, the comparison
// tool and the overpayment tool.
//
// Everything is worked out month by month rather than with a single formula,
// because overpayments, lump sums and rate changes all alter the balance that
// subsequent interest is charged on. A one-shot formula can't express that.

/**
 * Standard annuity payment:  M = P·r / (1 − (1 + r)^−n)
 * @param {number} principal amount outstanding
 * @param {number} annualRate percent, e.g. 4.5
 * @param {number} months number of payments remaining
 */
export function monthlyPayment(principal, annualRate, months) {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

/**
 * Full month-by-month amortisation.
 *
 * @param {object} opts
 * @param {number} opts.principal amount borrowed
 * @param {number} opts.annualRate starting rate, percent
 * @param {number} opts.years original term
 * @param {number} [opts.monthlyOverpay] extra paid each month
 * @param {number} [opts.overpayStartMonth] first month the overpayment applies
 * @param {{month:number, amount:number}[]} [opts.lumpSums] one-off payments
 * @param {{month:number, rate:number}[]} [opts.rateChanges] rate switches
 * @param {'reduce-term'|'reduce-payment'} [opts.overpayMode]
 *        reduce-term keeps the payment and finishes early;
 *        reduce-payment keeps the end date and lowers the payment.
 */
export function amortise({
  principal,
  annualRate,
  years,
  monthlyOverpay = 0,
  overpayStartMonth = 1,
  lumpSums = [],
  rateChanges = [],
  overpayMode = 'reduce-term',
}) {
  const termMonths = Math.max(1, Math.round(years * 12));

  // Nothing to amortise. This happens routinely while someone is still typing
  // — deleting a digit from the price can momentarily make the deposit larger
  // than the price — so it must return a well-formed result rather than an
  // empty schedule that callers then index into.
  if (!(principal > 0)) {
    return {
      ok: false,
      reason: 'Nothing to borrow — check the price and deposit.',
      schedule: [],
      months: 0,
      totalInterest: 0,
      totalPaid: 0,
      basePayment: 0,
    };
  }

  const basePayment = monthlyPayment(principal, annualRate, termMonths);

  const lumpByMonth = new Map();
  for (const l of lumpSums) {
    if (!l || !(l.amount > 0) || !(l.month >= 1)) continue;
    lumpByMonth.set(l.month, (lumpByMonth.get(l.month) || 0) + l.amount);
  }
  const rateByMonth = new Map();
  for (const rc of rateChanges) {
    if (!rc || !(rc.month >= 1) || rc.rate == null) continue;
    rateByMonth.set(rc.month, rc.rate);
  }

  let balance = principal;
  let rate = annualRate;
  let payment = basePayment;
  let totalInterest = 0;
  let totalPaid = 0;
  let month = 0;

  const schedule = [];
  // Safety valve: without it, a payment below the monthly interest loops forever.
  const cap = termMonths + 1200;

  while (balance > 0.005 && month < cap) {
    month++;

    if (rateByMonth.has(month)) {
      rate = rateByMonth.get(month);
      const remaining = Math.max(1, termMonths - month + 1);
      payment = monthlyPayment(balance, rate, remaining);
    }

    const r = rate / 100 / 12;
    const interest = balance * r;
    const extra = month >= overpayStartMonth ? Math.max(0, monthlyOverpay) : 0;
    const lump = lumpByMonth.get(month) || 0;

    // If the scheduled payment can't even cover the interest the debt grows.
    if (payment + extra + lump <= interest) {
      return {
        ok: false,
        reason: 'The payment does not cover the interest at this rate.',
        schedule: [],
        months: Infinity,
        totalInterest: Infinity,
        totalPaid: Infinity,
        basePayment,
      };
    }

    let principalPaid = payment - interest + extra + lump;
    if (principalPaid > balance) principalPaid = balance;

    const cashOut = principalPaid + interest;
    balance -= principalPaid;
    totalInterest += interest;
    totalPaid += cashOut;

    schedule.push({
      month,
      payment: cashOut,
      interest,
      principal: principalPaid,
      balance,
      rate,
      cumulativeInterest: totalInterest,
      cumulativePaid: totalPaid,
    });

    // Keeping the end date fixed means recalculating the payment downwards
    // whenever an overpayment has shortened the balance.
    if (overpayMode === 'reduce-payment' && (extra > 0 || lump > 0) && balance > 0) {
      const remaining = Math.max(1, termMonths - month);
      payment = monthlyPayment(balance, rate, remaining);
    }
  }

  return {
    ok: true,
    schedule,
    months: schedule.length,
    totalInterest,
    totalPaid,
    basePayment,
  };
}

/** Collapse a monthly schedule into one row per calendar year of the loan. */
export function toYearly(schedule) {
  const years = [];
  for (const row of schedule) {
    const yearIndex = Math.ceil(row.month / 12);
    let y = years[yearIndex - 1];
    if (!y) {
      y = {
        year: yearIndex,
        interest: 0,
        principal: 0,
        paid: 0,
        balance: row.balance,
        openingBalance: row.balance + row.principal,
      };
      years[yearIndex - 1] = y;
    }
    y.interest += row.interest;
    y.principal += row.principal;
    y.paid += row.payment;
    y.balance = row.balance;
  }
  return years.filter(Boolean);
}

/** The state of the loan at a given month, for the point-in-time snapshot. */
export function atMonth(schedule, month) {
  if (!schedule.length) return null;
  const idx = Math.min(Math.max(1, Math.round(month)), schedule.length) - 1;
  return schedule[idx];
}

export const gbp = (n, dp = 0) =>
  isFinite(n)
    ? n.toLocaleString('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: dp,
        maximumFractionDigits: dp,
      })
    : '—';

export const monthsToText = (m) => {
  if (!isFinite(m)) return '—';
  const y = Math.floor(m / 12);
  const r = m % 12;
  if (y === 0) return `${r} month${r === 1 ? '' : 's'}`;
  if (r === 0) return `${y} year${y === 1 ? '' : 's'}`;
  return `${y}y ${r}m`;
};
