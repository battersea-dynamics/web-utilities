// Verification for the property tax, take-home pay and compound interest
// calculators.
//
// The property tax cases are taken from worked examples published by the
// authorities themselves — HMRC and Revenue Scotland — so these are checks
// against an independent source rather than against our own arithmetic.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  propertyTax,
  takeHomePay,
  compoundInterest,
  personalAllowanceFor,
} from '../src/components/tools/taxEngine.js';
import { PROPERTY_TAX, PERSONAL_ALLOWANCE } from '../src/components/tools/taxData.js';

const near = (a, b, tol, msg) =>
  assert.ok(
    Math.abs(a - b) <= tol,
    `${msg}\n    got ${a}, expected ${b} (tolerance ${tol})`
  );

/* ------------------------------------------------------------------ */

describe('property tax: official worked examples', () => {
  test('GOV.UK — £295,000 in England pays £4,750', () => {
    near(propertyTax(295000, 'england').total, 4750, 0.01, 'SDLT standard');
  });

  test('GOV.UK — first-time buyer at £500,000 pays £10,000', () => {
    near(
      propertyTax(500000, 'england', { firstTimeBuyer: true }).total,
      10000,
      0.01,
      'SDLT first-time buyer'
    );
  });

  test('Revenue Scotland — £135,000 pays nothing', () => {
    near(propertyTax(135000, 'scotland').total, 0, 0.01, 'below nil-rate band');
  });

  test('Revenue Scotland — £235,000 pays £1,800', () => {
    near(propertyTax(235000, 'scotland').total, 1800, 0.01, 'LBTT two bands');
  });

  test('Revenue Scotland — £875,000 pays £63,350', () => {
    near(propertyTax(875000, 'scotland').total, 63350, 0.01, 'LBTT all bands');
  });

  test('Revenue Scotland — first-time buyer relief is worth up to £600', () => {
    const saved =
      propertyTax(300000, 'scotland').total -
      propertyTax(300000, 'scotland', { firstTimeBuyer: true }).total;
    near(saved, 600, 0.01, 'LBTT FTB relief cap');
  });
});

describe('property tax: regime differences', () => {
  test('the three nations genuinely differ on the same price', () => {
    const e = propertyTax(300000, 'england').total;
    const s = propertyTax(300000, 'scotland').total;
    const w = propertyTax(300000, 'wales').total;
    assert.ok(e !== s && s !== w, 'no two regimes should coincide here');
  });

  test('Wales has no first-time buyer relief', () => {
    const std = propertyTax(300000, 'wales').total;
    const ftb = propertyTax(300000, 'wales', { firstTimeBuyer: true });
    assert.equal(ftb.total, std, 'relief must not be applied');
    assert.equal(ftb.ftbApplied, false);
    assert.ok(ftb.notes.some((n) => /no first-time buyer relief/i.test(n)), 'and it must say so');
  });

  test('England first-time buyer relief is withdrawn above £500,000', () => {
    const at = propertyTax(500000, 'england', { firstTimeBuyer: true }).total;
    const over = propertyTax(510000, 'england', { firstTimeBuyer: true });
    assert.ok(at < propertyTax(500000, 'england').total, 'relief applies at the cap');
    assert.equal(over.total, propertyTax(510000, 'england').total, 'standard rates above it');
    assert.equal(over.ftbApplied, false);
  });

  test("Scotland's supplement is charged on the whole price, not band by band", () => {
    const price = 300000;
    const std = propertyTax(price, 'scotland').total;
    const add = propertyTax(price, 'scotland', { additionalProperty: true }).total;
    near(add - std, price * 0.08, 0.01, 'flat 8% of the full price');
  });

  test('England adds 5 points to every band for additional properties', () => {
    const price = 300000;
    const std = propertyTax(price, 'england').total;
    const add = propertyTax(price, 'england', { additionalProperty: true }).total;
    near(add - std, price * 0.05, 0.01, '5% of the whole price, via the bands');
  });

  test('the surcharge does not apply below £40,000', () => {
    for (const region of ['england', 'scotland', 'wales']) {
      const a = propertyTax(35000, region, { additionalProperty: true });
      const b = propertyTax(35000, region);
      assert.equal(a.total, b.total, `${region}: no surcharge under the threshold`);
    }
  });

  test('an additional property never also gets first-time buyer relief', () => {
    const r = propertyTax(280000, 'england', {
      firstTimeBuyer: true,
      additionalProperty: true,
    });
    assert.equal(r.ftbApplied, false);
    assert.ok(r.notes.some((n) => /does not apply/i.test(n)));
  });

  test('band slices always sum to the total', () => {
    for (const region of Object.keys(PROPERTY_TAX)) {
      for (const price of [50000, 300000, 800000, 2000000]) {
        const r = propertyTax(price, region);
        const summed = r.rows.reduce((a, x) => a + x.tax, 0);
        // Scotland's flat supplement sits outside the band rows by design.
        near(summed, r.total, 0.01, `${region} at ${price}`);
      }
    }
  });

  test('zero and negative prices are rejected, not crashed on', () => {
    for (const p of [0, -1, NaN]) {
      const r = propertyTax(p, 'england');
      assert.equal(r.ok, false);
      assert.ok(r.reason);
    }
  });

  test('tax never exceeds the purchase price', () => {
    for (const region of Object.keys(PROPERTY_TAX)) {
      const r = propertyTax(5000000, region, { additionalProperty: true });
      assert.ok(r.total < 5000000, `${region}: sanity`);
    }
  });
});

/* ------------------------------------------------------------------ */

describe('take-home pay', () => {
  test('the personal allowance tapers to zero at £125,140', () => {
    assert.equal(personalAllowanceFor(50000), PERSONAL_ALLOWANCE);
    assert.equal(personalAllowanceFor(100000), PERSONAL_ALLOWANCE);
    assert.equal(personalAllowanceFor(110000), 7570);
    assert.equal(personalAllowanceFor(125140), 0);
    assert.equal(personalAllowanceFor(200000), 0);
  });

  test('at the higher-rate threshold, tax and NI match the published rates', () => {
    const r = takeHomePay(50270, 'rUK');
    // 20% of the full basic-rate band of £37,700.
    near(r.incomeTax, 7540, 0.01, 'basic rate in full');
    // 8% between the primary threshold and the upper earnings limit.
    near(r.nationalInsurance, 3016, 0.01, 'NI main rate in full');
  });

  test('below the personal allowance there is no income tax', () => {
    const r = takeHomePay(12000, 'rUK');
    near(r.incomeTax, 0, 0.01, 'no tax');
    near(r.nationalInsurance, 0, 0.01, 'no NI either');
    near(r.takeHome, 12000, 0.01, 'keeps everything');
  });

  test('Scotland taxes middle and high earners more', () => {
    for (const salary of [50000, 100000]) {
      const rUK = takeHomePay(salary, 'rUK').takeHome;
      const scot = takeHomePay(salary, 'scotland').takeHome;
      assert.ok(scot < rUK, `Scotland keeps less at £${salary}`);
    }
  });

  test('Scotland keeps slightly more at low incomes, via the 19% starter rate', () => {
    assert.ok(takeHomePay(20000, 'scotland').takeHome > takeHomePay(20000, 'rUK').takeHome);
  });

  test('the 60% trap shows up as a marginal rate above 60%', () => {
    const r = takeHomePay(110000, 'rUK');
    assert.ok(r.marginalRate > 60, `expected over 60%, got ${r.marginalRate}`);
    assert.ok(r.marginalRate < 65, 'but not absurdly high');
  });

  test('pension contributions reduce income tax but not National Insurance', () => {
    const none = takeHomePay(40000, 'rUK', { pensionPercent: 0 });
    const some = takeHomePay(40000, 'rUK', { pensionPercent: 10 });
    assert.ok(some.incomeTax < none.incomeTax, 'less income tax');
    near(some.nationalInsurance, none.nationalInsurance, 0.01, 'NI unchanged');
  });

  test('the parts always add back up to the salary', () => {
    for (const salary of [15000, 35000, 60000, 110000, 200000]) {
      const r = takeHomePay(salary, 'rUK', { pensionPercent: 5 });
      near(
        r.takeHome + r.incomeTax + r.nationalInsurance + r.pension,
        salary,
        0.01,
        `£${salary} reconciles`
      );
    }
  });

  test('take-home always rises with salary', () => {
    let last = -Infinity;
    for (let s = 10000; s <= 200000; s += 5000) {
      const t = takeHomePay(s, 'rUK').takeHome;
      assert.ok(t > last, `no cliff edge at £${s}`);
      last = t;
    }
  });

  test('zero and invalid salaries are rejected', () => {
    for (const s of [0, -100, NaN]) {
      assert.equal(takeHomePay(s, 'rUK').ok, false);
    }
  });
});

/* ------------------------------------------------------------------ */

describe('compound interest', () => {
  test('with no contributions it matches the compound growth formula', () => {
    const r = compoundInterest({
      initial: 1000,
      monthlyContribution: 0,
      annualRate: 5,
      years: 30,
    });
    const expected = 1000 * Math.pow(1 + 0.05 / 12, 360);
    near(r.finalBalance, expected, 0.01, 'monthly compounding');
  });

  test('at 0% the balance is exactly what was paid in', () => {
    const r = compoundInterest({
      initial: 1000,
      monthlyContribution: 100,
      annualRate: 0,
      years: 10,
    });
    near(r.finalBalance, 1000 + 100 * 120, 0.01, 'no growth');
    near(r.totalInterest, 0, 0.01, 'no interest');
  });

  test('contributions and interest reconcile with the final balance', () => {
    const r = compoundInterest({
      initial: 500,
      monthlyContribution: 250,
      annualRate: 6,
      years: 15,
    });
    near(r.totalContributed + r.totalInterest, r.finalBalance, 0.01, 'reconciles');
    near(r.totalContributed, 500 + 250 * 180, 0.01, 'contributions counted once');
  });

  test('longer terms and higher rates both increase the balance', () => {
    const base = { initial: 1000, monthlyContribution: 100, annualRate: 5, years: 10 };
    assert.ok(
      compoundInterest({ ...base, years: 20 }).finalBalance >
        compoundInterest(base).finalBalance
    );
    assert.ok(
      compoundInterest({ ...base, annualRate: 8 }).finalBalance >
        compoundInterest(base).finalBalance
    );
  });

  test('rising contributions beat flat ones', () => {
    const base = { initial: 0, monthlyContribution: 200, annualRate: 5, years: 20 };
    assert.ok(
      compoundInterest({ ...base, annualContributionIncrease: 3 }).finalBalance >
        compoundInterest(base).finalBalance
    );
  });

  test('one row per year, and the last row matches the final balance', () => {
    const r = compoundInterest({
      initial: 1000,
      monthlyContribution: 200,
      annualRate: 5,
      years: 20,
    });
    assert.equal(r.yearly.length, 20);
    near(r.yearly.at(-1).balance, r.finalBalance, 0.01, 'final year');
  });

  test('nothing to project is reported rather than returning zeroes', () => {
    assert.equal(compoundInterest({ initial: 0, monthlyContribution: 0, years: 10 }).ok, false);
    assert.equal(compoundInterest({ initial: 1000, years: 0 }).ok, false);
  });
});
