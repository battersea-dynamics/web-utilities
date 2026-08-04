// Maths verification for the site's calculators.
//
// Run with:  npm test          (uses Node's built-in test runner, no deps)
//
// The point of these tests is independence. The mortgage engine works the loan
// out iteratively, month by month. Checking it against a second iterative
// implementation would prove nothing, so instead it is checked against:
//
//   1. Closed-form formulas derived separately (annuity payment, and the
//      standard remaining-balance formula), which come from a different
//      derivation entirely.
//   2. Present-value identity: discounting every scheduled payment back at the
//      monthly rate must return the original principal.
//   3. Conservation: the principal portions of every payment must sum to the
//      amount borrowed, and interest + principal must equal cash paid.
//   4. Published reference figures that are widely quoted and independently
//      checkable, plus the Excel PMT values from the project's own source
//      spreadsheet (Excel being an independent implementation).

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  monthlyPayment,
  amortise,
  toYearly,
  atMonth,
} from '../src/components/tools/mortgageEngine.js';
import { findWords, fullLengthAnagrams } from '../src/components/tools/wordEngine.js';
import { parsePageRanges } from '../src/components/tools/pdfHelpers.js';

/* ------------------------------------------------------------------ */
/* Independent reference implementations                               */
/* ------------------------------------------------------------------ */

/** Closed-form annuity payment. Standard formula, derived independently. */
function refPayment(P, annualRatePct, n) {
  const r = annualRatePct / 100 / 12;
  if (r === 0) return P / n;
  return (P * r) / (1 - Math.pow(1 + r, -n));
}

/**
 * Closed-form remaining balance after k payments:
 *   B_k = P(1+r)^k − M·((1+r)^k − 1)/r
 * Nothing iterative about it — a direct check on the loop's bookkeeping.
 */
function refBalance(P, annualRatePct, n, k) {
  const r = annualRatePct / 100 / 12;
  const M = refPayment(P, annualRatePct, n);
  if (r === 0) return P - M * k;
  const g = Math.pow(1 + r, k);
  return P * g - (M * (g - 1)) / r;
}

const near = (a, b, tol, msg) =>
  assert.ok(
    Math.abs(a - b) <= tol,
    `${msg}\n    got      ${a}\n    expected ${b}\n    diff     ${Math.abs(a - b)} (tolerance ${tol})`
  );

/* ------------------------------------------------------------------ */
/* 1. Published / independent reference values                         */
/* ------------------------------------------------------------------ */

describe('mortgage: payment against published figures', () => {
  test('$100,000 at 6% over 30 years is the widely published $599.55', () => {
    near(monthlyPayment(100000, 6, 360), 599.55, 0.005, 'classic textbook case');
  });

  test('£200,000 at 5% over 25 years', () => {
    near(monthlyPayment(200000, 5, 300), 1169.18, 0.01, '25-year repayment');
  });

  // From the project's own source spreadsheet, computed by Excel's PMT().
  test('Excel PMT: 160,000 at 6.1% over 30 years = 969.5916568726814', () => {
    near(monthlyPayment(160000, 6.1, 360), 969.5916568726814, 1e-9, 'Excel Sheet1');
  });

  test('Excel PMT: 160,000 at 5.2% over 23 years = 995.0017116152405', () => {
    near(monthlyPayment(160000, 5.2, 276), 995.0017116152405, 1e-9, 'Excel Sheet2 col C');
  });

  test('Excel PMT: 160,000 at 5.2% over 29 years = 891.2593703104728', () => {
    near(monthlyPayment(160000, 5.2, 348), 891.2593703104728, 1e-9, 'Excel Sheet2 col D');
  });
});

/* ------------------------------------------------------------------ */
/* 2. Engine vs closed-form                                            */
/* ------------------------------------------------------------------ */

describe('mortgage: engine agrees with closed-form maths', () => {
  const cases = [
    { principal: 255000, annualRate: 4.5, years: 25, label: 'typical UK purchase' },
    { principal: 160000, annualRate: 5.2, years: 23, label: 'spreadsheet case' },
    { principal: 80000, annualRate: 3.1, years: 10, label: 'small, short' },
    { principal: 750000, annualRate: 6.75, years: 35, label: 'large, long, high rate' },
  ];

  for (const c of cases) {
    test(`${c.label}: first payment matches annuity formula`, () => {
      const r = amortise(c);
      assert.ok(r.ok, 'should amortise');
      near(
        r.schedule[0].payment,
        refPayment(c.principal, c.annualRate, c.years * 12),
        0.01,
        'first payment'
      );
    });

    test(`${c.label}: balance matches closed-form at months 1, 12, 60 and mid-term`, () => {
      const r = amortise(c);
      const n = c.years * 12;
      for (const k of [1, 12, 60, Math.floor(n / 2)]) {
        if (k > r.schedule.length) continue;
        near(
          atMonth(r.schedule, k).balance,
          refBalance(c.principal, c.annualRate, n, k),
          0.02,
          `balance after ${k} payments`
        );
      }
    });

    test(`${c.label}: principal portions sum to the amount borrowed`, () => {
      const r = amortise(c);
      const sum = r.schedule.reduce((a, x) => a + x.principal, 0);
      near(sum, c.principal, 0.01, 'sum of capital repaid');
    });

    test(`${c.label}: interest + capital equals cash paid, every month`, () => {
      const r = amortise(c);
      for (const row of r.schedule) {
        near(row.interest + row.principal, row.payment, 1e-9, `month ${row.month}`);
      }
    });

    test(`${c.label}: present value of payments returns the principal`, () => {
      const r = amortise(c);
      const rate = c.annualRate / 100 / 12;
      const pv = r.schedule.reduce(
        (acc, row) => acc + row.payment / Math.pow(1 + rate, row.month),
        0
      );
      near(pv, c.principal, 0.05, 'discounted cash flows');
    });

    test(`${c.label}: term is exactly the scheduled number of months`, () => {
      const r = amortise(c);
      assert.equal(r.months, c.years * 12);
    });

    test(`${c.label}: totals are self-consistent`, () => {
      const r = amortise(c);
      near(r.totalPaid, c.principal + r.totalInterest, 0.02, 'total paid');
      near(
        r.totalInterest,
        r.schedule.reduce((a, x) => a + x.interest, 0),
        1e-6,
        'total interest'
      );
    });
  }
});

/* ------------------------------------------------------------------ */
/* 3. Edge cases                                                       */
/* ------------------------------------------------------------------ */

describe('mortgage: edge cases', () => {
  test('0% interest splits the principal evenly and charges no interest', () => {
    const r = amortise({ principal: 12000, annualRate: 0, years: 1 });
    assert.ok(r.ok);
    assert.equal(r.months, 12);
    near(r.schedule[0].payment, 1000, 1e-9, 'monthly at 0%');
    near(r.totalInterest, 0, 1e-9, 'interest at 0%');
    near(r.totalPaid, 12000, 1e-9, 'total repaid at 0%');
  });

  test('1-year term', () => {
    const r = amortise({ principal: 24000, annualRate: 5, years: 1 });
    assert.ok(r.ok);
    assert.equal(r.months, 12);
    near(r.schedule[0].payment, refPayment(24000, 5, 12), 0.01, '1-year payment');
    near(
      r.schedule.reduce((a, x) => a + x.principal, 0),
      24000,
      0.01,
      'capital repaid over 1 year'
    );
  });

  test('final balance is driven to zero, not left as a rounding crumb', () => {
    const r = amortise({ principal: 255000, annualRate: 4.5, years: 25 });
    near(r.schedule.at(-1).balance, 0, 1e-6, 'closing balance');
  });

  test('very large principal stays consistent', () => {
    const P = 1e9;
    const r = amortise({ principal: P, annualRate: 5, years: 30 });
    assert.ok(r.ok);
    near(r.schedule[0].payment, refPayment(P, 5, 360), 0.5, 'payment on £1bn');
    near(r.schedule.reduce((a, x) => a + x.principal, 0), P, 1, 'capital repaid');
  });

  test('very small principal', () => {
    const r = amortise({ principal: 1, annualRate: 5, years: 1 });
    assert.ok(r.ok);
    near(r.schedule.reduce((a, x) => a + x.principal, 0), 1, 1e-6, 'capital repaid');
  });

  test('zero principal reports failure rather than an indexable empty result', () => {
    // Regression: this previously returned ok:true with an empty schedule, and
    // every mortgage widget then read schedule[0], throwing and blanking the UI.
    const r = amortise({ principal: 0, annualRate: 4.5, years: 25 });
    assert.equal(r.ok, false, 'must not claim success');
    assert.match(r.reason, /nothing to borrow/i);
    assert.equal(r.schedule.length, 0);
    assert.equal(r.months, 0);
  });

  test('negative principal reports failure', () => {
    const r = amortise({ principal: -5000, annualRate: 4.5, years: 25 });
    assert.equal(r.ok, false);
    assert.equal(r.schedule.length, 0);
  });

  test('NaN principal reports failure (empty or junk input while typing)', () => {
    const r = amortise({ principal: NaN, annualRate: 4.5, years: 25 });
    assert.equal(r.ok, false, 'NaN must not slip through as a valid loan');
  });

  test('regression: every intermediate value while retyping a price is safe', () => {
    // Changing 300000 to 190000 passes through 30000, 3000, 300, 30, 3 and ''.
    // With a 45000 deposit several of those make the borrowing zero, which is
    // what crashed the widget.
    const deposit = 45000;
    const typed = [300000, 30000, 3000, 300, 30, 3, 0, NaN, 190000];
    for (const price of typed) {
      const borrowed = Math.max(0, price - deposit);
      const r = amortise({ principal: borrowed, annualRate: 4.5, years: 25 });
      assert.equal(typeof r.ok, 'boolean', `price ${price}: returns a usable result`);
      if (r.ok) {
        assert.ok(r.schedule.length > 0, `price ${price}: ok implies a schedule exists`);
        assert.ok(r.schedule[0].payment > 0, `price ${price}: schedule[0] is readable`);
      } else {
        assert.equal(r.schedule.length, 0, `price ${price}: failure has no schedule`);
        assert.ok(r.reason, `price ${price}: failure explains itself`);
      }
    }
  });

  test('ok:true always guarantees schedule[0] is readable', () => {
    // The invariant every widget relies on.
    const cases = [
      { principal: 1, annualRate: 0, years: 1 },
      { principal: 255000, annualRate: 4.5, years: 25 },
      { principal: 0.01, annualRate: 20, years: 40 },
    ];
    for (const c of cases) {
      const r = amortise(c);
      if (r.ok) assert.ok(r.schedule[0] && r.schedule[0].payment >= 0);
    }
  });

  test('interest-swamped payment is reported rather than looping forever', () => {
    // A payment that cannot cover the monthly interest would never repay.
    const r = amortise({ principal: 100000, annualRate: 25, years: 40 });
    // Either it amortises legitimately, or it reports failure — but it must
    // terminate and never return a nonsense finite schedule.
    if (!r.ok) {
      assert.match(r.reason, /interest/i);
    } else {
      assert.ok(r.months <= 40 * 12 + 1200, 'terminates within the safety cap');
    }
  });

  test('monthlyPayment guards against nonsense inputs', () => {
    assert.equal(monthlyPayment(0, 5, 360), 0);
    assert.equal(monthlyPayment(-1, 5, 360), 0);
    assert.equal(monthlyPayment(100000, 5, 0), 0);
  });
});

/* ------------------------------------------------------------------ */
/* 4. Overpayments, lump sums, rate changes                            */
/* ------------------------------------------------------------------ */

describe('mortgage: overpayments and rate changes', () => {
  const baseCase = { principal: 180000, annualRate: 4.5, years: 22 };

  test('overpaying shortens the term and reduces total interest', () => {
    const base = amortise(baseCase);
    const over = amortise({ ...baseCase, monthlyOverpay: 200 });
    assert.ok(over.months < base.months, 'term shortens');
    assert.ok(over.totalInterest < base.totalInterest, 'interest falls');
    near(
      over.schedule.reduce((a, x) => a + x.principal, 0),
      baseCase.principal,
      0.01,
      'capital repaid is unchanged'
    );
  });

  test('a lump sum earlier saves more than the same sum later', () => {
    const early = amortise({ ...baseCase, lumpSums: [{ month: 6, amount: 3000 }] });
    const late = amortise({ ...baseCase, lumpSums: [{ month: 186, amount: 3000 }] });
    const base = amortise(baseCase);
    const savedEarly = base.totalInterest - early.totalInterest;
    const savedLate = base.totalInterest - late.totalInterest;
    assert.ok(savedEarly > savedLate, 'earlier lump sum saves more');
  });

  test('overpayment starting later saves less than starting immediately', () => {
    const now = amortise({ ...baseCase, monthlyOverpay: 200, overpayStartMonth: 1 });
    const later = amortise({ ...baseCase, monthlyOverpay: 200, overpayStartMonth: 60 });
    const base = amortise(baseCase);
    assert.ok(
      base.totalInterest - now.totalInterest > base.totalInterest - later.totalInterest
    );
  });

  test('zero overpayment is identical to no overpayment', () => {
    const a = amortise(baseCase);
    const b = amortise({ ...baseCase, monthlyOverpay: 0, lumpSums: [] });
    assert.equal(a.months, b.months);
    near(a.totalInterest, b.totalInterest, 1e-9, 'interest unchanged');
  });

  test('a lump sum larger than the balance clears the loan without overpaying it', () => {
    const r = amortise({ ...baseCase, lumpSums: [{ month: 2, amount: 500000 }] });
    assert.equal(r.months, 2, 'cleared in month 2');
    near(r.schedule.at(-1).balance, 0, 1e-9, 'balance is zero, not negative');
    near(
      r.schedule.reduce((a, x) => a + x.principal, 0),
      baseCase.principal,
      0.01,
      'never repays more capital than was borrowed'
    );
  });

  test('a rate rise increases the payment from that month', () => {
    const r = amortise({ ...baseCase, rateChanges: [{ month: 25, rate: 8 }] });
    const before = atMonth(r.schedule, 24).payment;
    const after = atMonth(r.schedule, 25).payment;
    assert.ok(after > before, 'payment rises');
    assert.equal(atMonth(r.schedule, 25).rate, 8, 'rate is applied');
  });

  test('a rate change keeps the original end date', () => {
    const base = amortise(baseCase);
    const changed = amortise({ ...baseCase, rateChanges: [{ month: 25, rate: 8 }] });
    assert.equal(changed.months, base.months, 'term unchanged by a rate switch');
  });

  test('reduce-payment mode still repays exactly the capital borrowed', () => {
    const r = amortise({
      ...baseCase,
      monthlyOverpay: 200,
      overpayMode: 'reduce-payment',
    });
    near(
      r.schedule.reduce((a, x) => a + x.principal, 0),
      baseCase.principal,
      0.01,
      'capital repaid'
    );
  });
});

/* ------------------------------------------------------------------ */
/* 5. Yearly rollup and snapshot                                       */
/* ------------------------------------------------------------------ */

describe('mortgage: yearly summary and snapshot', () => {
  const c = { principal: 160000, annualRate: 5.2, years: 23 };

  test('yearly totals reconcile with the monthly schedule', () => {
    const r = amortise(c);
    const years = toYearly(r.schedule);
    near(
      years.reduce((a, y) => a + y.interest, 0),
      r.totalInterest,
      1e-6,
      'interest by year'
    );
    near(
      years.reduce((a, y) => a + y.principal, 0),
      c.principal,
      0.01,
      'capital by year'
    );
    assert.equal(years.length, Math.ceil(r.months / 12), 'one row per year');
  });

  test('year-end balance matches the closed-form figure', () => {
    const r = amortise(c);
    const years = toYearly(r.schedule);
    near(years[0].balance, refBalance(c.principal, c.annualRate, 276, 12), 0.02, 'end of year 1');
    near(years[4].balance, refBalance(c.principal, c.annualRate, 276, 60), 0.02, 'end of year 5');
  });

  test('the naive "first month capital x 12" shortcut understates progress', () => {
    // Guards the claim made on the mortgage-calculator page.
    const r = amortise(c);
    const naive = c.principal - r.schedule[0].principal * 12;
    const actual = atMonth(r.schedule, 12).balance;
    assert.ok(actual < naive, 'real balance falls faster than the shortcut suggests');
  });

  test('atMonth clamps out-of-range requests rather than throwing', () => {
    const r = amortise(c);
    assert.equal(atMonth(r.schedule, 0).month, 1, 'clamps low');
    assert.equal(atMonth(r.schedule, 99999).month, r.months, 'clamps high');
    assert.equal(atMonth([], 5), null, 'empty schedule');
  });

  test('interest falls and capital rises across the life of the loan', () => {
    const r = amortise(c);
    const first = r.schedule[0];
    const last = r.schedule.at(-1);
    assert.ok(last.interest < first.interest, 'interest portion shrinks');
    assert.ok(last.principal > first.principal, 'capital portion grows');
  });
});

/* ------------------------------------------------------------------ */
/* 6. Word engine                                                      */
/* ------------------------------------------------------------------ */

describe('word engine', () => {
  // A small hand-built index. Keys must be the word's letters sorted
  // alphabetically — that is the lookup the engine performs.
  const idx = {
    at: ['at'],
    aet: ['ate', 'eat', 'tea'],
    aert: ['rate', 'tear'],
    aerst: ['stare', 'tears'],
    eilnst: ['listen', 'silent'],
    eilns: ['lines'],
  };

  test('finds every subset word, grouped longest first', () => {
    const groups = findWords('rates', idx);
    assert.deepEqual(
      groups.map((g) => g.length),
      [5, 4, 3, 2],
      'groups descend by length'
    );
    assert.deepEqual(groups[0].words, ['stare', 'tears']);
    assert.deepEqual(groups.at(-1).words, ['at']);
  });

  test('is insensitive to case, order and punctuation', () => {
    const a = JSON.stringify(findWords('RATES', idx));
    const b = JSON.stringify(findWords('s-e t a r', idx));
    assert.equal(a, b, 'same letters, same answer');
  });

  test('empty and non-alphabetic input returns nothing', () => {
    assert.deepEqual(findWords('', idx), []);
    assert.deepEqual(findWords('   ', idx), []);
    assert.deepEqual(findWords('123!@#', idx), []);
  });

  test('letters with no matches return nothing', () => {
    assert.deepEqual(findWords('zzz', idx), []);
  });

  test('full-length anagrams use every letter', () => {
    const groups = findWords('listen', idx);
    assert.deepEqual(fullLengthAnagrams('listen', groups), ['listen', 'silent']);
  });

  test('no full-length anagram returns an empty list, not an error', () => {
    const groups = findWords('rates', idx);
    assert.deepEqual(fullLengthAnagrams('rateszzz', groups), []);
  });

  test('repeated letters are handled without duplicating results', () => {
    const groups = findWords('aatt', { at: ['at'] });
    assert.deepEqual(groups[0].words, ['at'], 'each word appears once');
  });
});

/* ------------------------------------------------------------------ */
/* 7. PDF page-range parsing                                           */
/* ------------------------------------------------------------------ */

describe('pdf page ranges', () => {
  test('single pages, converted to zero-based indices', () => {
    assert.deepEqual(parsePageRanges('1,3,5', 10), [0, 2, 4]);
  });

  test('hyphenated ranges are expanded', () => {
    assert.deepEqual(parsePageRanges('2-5', 10), [1, 2, 3, 4]);
  });

  test('open-ended range runs to the last page', () => {
    assert.deepEqual(parsePageRanges('8-', 10), [7, 8, 9]);
  });

  test('order is preserved, so it doubles as a reorder spec', () => {
    assert.deepEqual(parsePageRanges('3,1,2', 5), [2, 0, 1]);
  });

  test('whitespace is tolerated', () => {
    assert.deepEqual(parsePageRanges(' 1 - 3 ,  5 ', 10), [0, 1, 2, 4]);
  });

  test('out-of-range pages are ignored rather than throwing', () => {
    assert.deepEqual(parsePageRanges('50', 10), []);
    assert.deepEqual(parsePageRanges('8-99', 10), [7, 8, 9]);
  });

  test('page zero and negatives are rejected', () => {
    assert.deepEqual(parsePageRanges('0', 10), []);
    assert.deepEqual(parsePageRanges('-3', 10), []);
  });

  test('backwards ranges are ignored', () => {
    assert.deepEqual(parsePageRanges('7-3', 10), []);
  });

  test('empty and junk input returns nothing', () => {
    assert.deepEqual(parsePageRanges('', 10), []);
    assert.deepEqual(parsePageRanges('   ', 10), []);
    assert.deepEqual(parsePageRanges('abc', 10), []);
    assert.deepEqual(parsePageRanges(',,,', 10), []);
  });

  test('duplicates are kept, allowing a page to be repeated', () => {
    assert.deepEqual(parsePageRanges('2,2', 5), [1, 1]);
  });
});
