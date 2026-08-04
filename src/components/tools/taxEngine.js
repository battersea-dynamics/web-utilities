// Calculation engine for the property tax, take-home pay and compound
// interest tools. Pure functions only — all rates come from taxData.js.

import {
  PROPERTY_TAX,
  PERSONAL_ALLOWANCE,
  PA_TAPER_THRESHOLD,
  INCOME_TAX,
  NATIONAL_INSURANCE,
} from './taxData.js';

/* ------------------------------------------------------------------ */
/* Property transaction tax                                            */
/* ------------------------------------------------------------------ */

/** Apply a progressive band table to a price, returning per-band detail. */
function applyBands(price, bands) {
  const rows = [];
  let lower = 0;
  let total = 0;

  for (const band of bands) {
    const upper = band.upTo === null ? Infinity : band.upTo;
    if (price <= lower) break;
    const slice = Math.min(price, upper) - lower;
    if (slice > 0) {
      const tax = (slice * band.rate) / 100;
      total += tax;
      rows.push({ from: lower, to: upper, rate: band.rate, slice, tax });
    }
    lower = upper;
  }
  return { total, rows };
}

/**
 * Work out the property transaction tax due.
 *
 * @param {number} price purchase price
 * @param {'england'|'scotland'|'wales'} region
 * @param {{firstTimeBuyer?: boolean, additionalProperty?: boolean}} opts
 */
export function propertyTax(price, region, opts = {}) {
  const regime = PROPERTY_TAX[region];
  if (!regime) return { ok: false, reason: 'Unknown region.' };
  if (!(price > 0)) {
    return {
      ok: false,
      reason: 'Enter a purchase price.',
      total: 0,
      rows: [],
      regime,
    };
  }

  const wantsFTB = Boolean(opts.firstTimeBuyer);
  const isAdditional = Boolean(opts.additionalProperty);
  const add = regime.additional;
  const surchargeApplies = isAdditional && price >= add.minPrice;

  const notes = [];
  let rows = [];
  let total = 0;
  let ftbApplied = false;

  if (surchargeApplies) {
    // An additional-property purchase never gets first-time buyer relief.
    if (wantsFTB) {
      notes.push(
        'First-time buyer relief does not apply when you already own another property.'
      );
    }

    if (add.type === 'surcharge-per-band') {
      const bumped = regime.bands.map((b) => ({ ...b, rate: b.rate + add.points }));
      ({ total, rows } = applyBands(price, bumped));
      notes.push(`Includes the ${add.points}% additional property surcharge on every band.`);
    } else if (add.type === 'separate-bands') {
      ({ total, rows } = applyBands(price, add.bands));
      notes.push('Uses the separate higher-rates table for additional properties.');
    } else if (add.type === 'flat-on-total') {
      const base = applyBands(price, regime.bands);
      const supplement = (price * add.rate) / 100;
      total = base.total + supplement;
      rows = base.rows;
      notes.push(
        `Includes the ${add.rate}% Additional Dwelling Supplement, charged on the whole price rather than band by band.`
      );
    }
  } else {
    if (isAdditional && price < add.minPrice) {
      notes.push(
        `The additional property surcharge only applies at £${add.minPrice.toLocaleString('en-GB')} and above.`
      );
    }

    const ftb = regime.firstTimeBuyer;
    if (wantsFTB && !ftb) {
      notes.push('There is no first-time buyer relief in Wales — standard rates apply.');
    }

    if (wantsFTB && ftb && ftb.maxPrice !== null && price > ftb.maxPrice) {
      notes.push(
        `First-time buyer relief is withdrawn entirely above £${ftb.maxPrice.toLocaleString('en-GB')}, so standard rates apply.`
      );
    }

    const useFTB =
      wantsFTB && ftb && (ftb.maxPrice === null || price <= ftb.maxPrice);

    if (useFTB) {
      ftbApplied = true;
      if (ftb.bands) {
        ({ total, rows } = applyBands(price, ftb.bands));
      } else if (ftb.nilRateBand) {
        // Scotland: raise the nil-rate band and keep the rest of the table.
        const raised = [{ upTo: ftb.nilRateBand, rate: 0 }].concat(
          regime.bands.filter((b) => b.upTo === null || b.upTo > ftb.nilRateBand)
        );
        ({ total, rows } = applyBands(price, raised));
      }
    } else {
      ({ total, rows } = applyBands(price, regime.bands));
    }
  }

  const standard = applyBands(price, regime.bands).total;

  return {
    ok: true,
    regime,
    total,
    rows,
    notes,
    ftbApplied,
    surchargeApplied: surchargeApplies,
    savingVsStandard: standard - total,
    effectiveRate: price > 0 ? (total / price) * 100 : 0,
  };
}

/* ------------------------------------------------------------------ */
/* Take-home pay                                                       */
/* ------------------------------------------------------------------ */

/** Personal allowance after the taper that applies above £100,000. */
export function personalAllowanceFor(income) {
  if (income <= PA_TAPER_THRESHOLD) return PERSONAL_ALLOWANCE;
  const reduction = (income - PA_TAPER_THRESHOLD) / 2;
  return Math.max(0, PERSONAL_ALLOWANCE - reduction);
}

/**
 * @param {number} salary gross annual salary
 * @param {'rUK'|'scotland'} region
 * @param {{pensionPercent?: number}} opts
 */
export function takeHomePay(salary, region = 'rUK', opts = {}) {
  const table = INCOME_TAX[region] || INCOME_TAX.rUK;
  if (!(salary > 0)) {
    return { ok: false, reason: 'Enter a salary.' };
  }

  const pensionPercent = Math.max(0, Math.min(100, opts.pensionPercent || 0));
  const pension = (salary * pensionPercent) / 100;

  // Workplace pensions under a net-pay arrangement come out before income tax
  // but after National Insurance, which is why NI below uses the gross figure.
  const taxableGross = Math.max(0, salary - pension);
  const allowance = personalAllowanceFor(taxableGross);
  const taxable = Math.max(0, taxableGross - allowance);

  const bandRows = [];
  let incomeTax = 0;
  let lower = 0;
  for (const band of table.bands) {
    const upper = band.upTo === null ? Infinity : band.upTo;
    if (taxable <= lower) break;
    const slice = Math.min(taxable, upper) - lower;
    if (slice > 0) {
      const tax = (slice * band.rate) / 100;
      incomeTax += tax;
      bandRows.push({ label: band.label, rate: band.rate, slice, tax });
    }
    lower = upper;
  }

  const ni = NATIONAL_INSURANCE;
  let nationalInsurance = 0;
  if (salary > ni.primaryThreshold) {
    const mainSlice = Math.min(salary, ni.upperEarningsLimit) - ni.primaryThreshold;
    nationalInsurance += (Math.max(0, mainSlice) * ni.mainRate) / 100;
  }
  if (salary > ni.upperEarningsLimit) {
    nationalInsurance += ((salary - ni.upperEarningsLimit) * ni.upperRate) / 100;
  }

  const takeHome = salary - incomeTax - nationalInsurance - pension;

  return {
    ok: true,
    region: table.name,
    salary,
    pension,
    pensionPercent,
    allowance,
    taxable,
    incomeTax,
    nationalInsurance,
    takeHome,
    bandRows,
    monthly: takeHome / 12,
    weekly: takeHome / 52,
    effectiveTaxRate: salary > 0 ? ((incomeTax + nationalInsurance) / salary) * 100 : 0,
    // What you keep from the next £100 earned.
    marginalRate: marginalRateAt(salary, region),
  };
}

/** Combined income tax + NI rate on the next pound earned. */
function marginalRateAt(salary, region) {
  const step = 100;
  const a = quickNet(salary, region);
  const b = quickNet(salary + step, region);
  return ((step - (b - a)) / step) * 100;
}

function quickNet(salary, region) {
  const table = INCOME_TAX[region] || INCOME_TAX.rUK;
  const allowance = personalAllowanceFor(salary);
  const taxable = Math.max(0, salary - allowance);
  let tax = 0;
  let lower = 0;
  for (const band of table.bands) {
    const upper = band.upTo === null ? Infinity : band.upTo;
    if (taxable <= lower) break;
    tax += ((Math.min(taxable, upper) - lower) * band.rate) / 100;
    lower = upper;
  }
  const ni = NATIONAL_INSURANCE;
  let nic = 0;
  if (salary > ni.primaryThreshold) {
    nic += ((Math.min(salary, ni.upperEarningsLimit) - ni.primaryThreshold) * ni.mainRate) / 100;
  }
  if (salary > ni.upperEarningsLimit) {
    nic += ((salary - ni.upperEarningsLimit) * ni.upperRate) / 100;
  }
  return salary - tax - nic;
}

/* ------------------------------------------------------------------ */
/* Compound interest                                                   */
/* ------------------------------------------------------------------ */

/**
 * Month-by-month projection, so contributions and compounding interact
 * correctly rather than being approximated by a single closed-form formula.
 *
 * @param {object} opts
 * @param {number} opts.initial opening balance
 * @param {number} opts.monthlyContribution added at the end of each month
 * @param {number} opts.annualRate percent
 * @param {number} opts.years
 * @param {number} [opts.annualContributionIncrease] percent uplift each year
 */
export function compoundInterest({
  initial = 0,
  monthlyContribution = 0,
  annualRate = 5,
  years = 10,
  annualContributionIncrease = 0,
}) {
  if (!(years > 0)) return { ok: false, reason: 'Enter a number of years.' };
  if (initial <= 0 && monthlyContribution <= 0) {
    return { ok: false, reason: 'Enter a starting amount or a monthly contribution.' };
  }

  const months = Math.round(years * 12);
  const r = annualRate / 100 / 12;

  let balance = initial;
  let contributed = initial;
  let contribution = monthlyContribution;
  const yearly = [];

  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    balance += interest + contribution;
    contributed += contribution;

    if (m % 12 === 0) {
      yearly.push({
        year: m / 12,
        balance,
        contributed,
        interest: balance - contributed,
      });
      // Uplift next year's contributions, for anyone modelling pay rises.
      contribution *= 1 + annualContributionIncrease / 100;
    }
  }

  // Capture a final partial year if the term isn't whole.
  if (months % 12 !== 0) {
    yearly.push({
      year: months / 12,
      balance,
      contributed,
      interest: balance - contributed,
    });
  }

  return {
    ok: true,
    months,
    finalBalance: balance,
    totalContributed: contributed,
    totalInterest: balance - contributed,
    yearly,
  };
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
