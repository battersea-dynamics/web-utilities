// UK tax rates and bands used by the finance calculators.
//
// EVERY figure here is transcribed from an official source, listed below.
// Nothing in this file should be edited from memory — check the source first.
//
// Sources, last verified 4 August 2026:
//   SDLT (England & NI) ... gov.uk/stamp-duty-land-tax/residential-property-rates
//   LBTT (Scotland) ....... revenue.scot/taxes/land-buildings-transaction-tax/residential-property
//   LBTT ADS .............. revenue.scot — 8% for contracts from 5 December 2024
//   LTT (Wales) ........... gov.wales/land-transaction-tax-rates-and-bands
//   Income tax ............ gov.uk/income-tax-rates (2026 to 2027 tax year)
//   Scottish income tax ... gov.uk/scottish-income-tax (2026 to 2027 tax year)
//   National Insurance .... gov.uk/national-insurance-rates-letters (Class 1, category A)
//
// Rates change with Budgets. When they do, update this file and the
// LAST_VERIFIED date, which is displayed on the pages so visitors can judge
// how current the figures are.

export const LAST_VERIFIED = '4 August 2026';
export const TAX_YEAR = '2026/27';

/* ------------------------------------------------------------------ */
/* Property transaction taxes                                          */
/* ------------------------------------------------------------------ */

// Each regime lists bands as { upTo, rate }. `upTo: null` means "and above".
// Rates are percentages applied to the slice of price within that band.
export const PROPERTY_TAX = {
  england: {
    name: 'England & Northern Ireland',
    tax: 'Stamp Duty Land Tax',
    abbr: 'SDLT',
    authority: 'HMRC',
    sourceUrl: 'https://www.gov.uk/stamp-duty-land-tax/residential-property-rates',
    bands: [
      { upTo: 125000, rate: 0 },
      { upTo: 250000, rate: 2 },
      { upTo: 925000, rate: 5 },
      { upTo: 1500000, rate: 10 },
      { upTo: null, rate: 12 },
    ],
    // First-time buyer relief replaces the bands entirely, and is withdrawn
    // completely above the cliff-edge price.
    firstTimeBuyer: {
      maxPrice: 500000,
      bands: [
        { upTo: 300000, rate: 0 },
        { upTo: 500000, rate: 5 },
      ],
    },
    // Additional property: 5 percentage points added to every band.
    additional: { type: 'surcharge-per-band', points: 5, minPrice: 40000 },
  },

  scotland: {
    name: 'Scotland',
    tax: 'Land and Buildings Transaction Tax',
    abbr: 'LBTT',
    authority: 'Revenue Scotland',
    sourceUrl: 'https://revenue.scot/taxes/land-buildings-transaction-tax/residential-property',
    bands: [
      { upTo: 145000, rate: 0 },
      { upTo: 250000, rate: 2 },
      { upTo: 325000, rate: 5 },
      { upTo: 750000, rate: 10 },
      { upTo: null, rate: 12 },
    ],
    // Scotland raises the nil-rate band rather than using separate bands,
    // and there is no upper price limit on the relief.
    firstTimeBuyer: {
      maxPrice: null,
      nilRateBand: 175000,
    },
    // The Additional Dwelling Supplement is a flat charge on the WHOLE price,
    // not a per-band surcharge — a genuinely different calculation.
    additional: { type: 'flat-on-total', rate: 8, minPrice: 40000 },
  },

  wales: {
    name: 'Wales',
    tax: 'Land Transaction Tax',
    abbr: 'LTT',
    authority: 'Welsh Revenue Authority',
    sourceUrl: 'https://www.gov.wales/land-transaction-tax-rates-and-bands',
    bands: [
      { upTo: 225000, rate: 0 },
      { upTo: 400000, rate: 6 },
      { upTo: 750000, rate: 7.5 },
      { upTo: 1500000, rate: 10 },
      { upTo: null, rate: 12 },
    ],
    // Wales has no first-time buyer relief at all — a common misconception,
    // and worth surfacing in the UI rather than silently ignoring.
    firstTimeBuyer: null,
    // Wales uses an entirely separate higher-rates table rather than adding
    // points to the main one.
    additional: {
      type: 'separate-bands',
      minPrice: 40000,
      bands: [
        { upTo: 180000, rate: 4 },
        { upTo: 250000, rate: 7.5 },
        { upTo: 400000, rate: 9 },
        { upTo: 750000, rate: 11.5 },
        { upTo: 1500000, rate: 14 },
        { upTo: null, rate: 16 },
      ],
    },
  },
};

/* ------------------------------------------------------------------ */
/* Income tax and National Insurance                                   */
/* ------------------------------------------------------------------ */

export const PERSONAL_ALLOWANCE = 12570;
// Allowance falls by £1 for every £2 of income above this, reaching zero
// at £125,140.
export const PA_TAPER_THRESHOLD = 100000;

// Bands are expressed as taxable income *above* the personal allowance,
// matching how GOV.UK presents them.
export const INCOME_TAX = {
  rUK: {
    name: 'England, Wales & Northern Ireland',
    bands: [
      { upTo: 37700, rate: 20, label: 'Basic rate' },
      { upTo: 112570, rate: 40, label: 'Higher rate' },
      { upTo: null, rate: 45, label: 'Additional rate' },
    ],
  },
  scotland: {
    name: 'Scotland',
    bands: [
      { upTo: 3967, rate: 19, label: 'Starter rate' },
      { upTo: 16956, rate: 20, label: 'Basic rate' },
      { upTo: 31092, rate: 21, label: 'Intermediate rate' },
      { upTo: 62430, rate: 42, label: 'Higher rate' },
      { upTo: 112570, rate: 45, label: 'Advanced rate' },
      { upTo: null, rate: 48, label: 'Top rate' },
    ],
  },
};

// Class 1 employee National Insurance, category A. Payroll actually works
// per pay period; annual equivalents are used here, which is standard for a
// salary calculator and accurate for steady earnings.
export const NATIONAL_INSURANCE = {
  primaryThreshold: 12570,
  upperEarningsLimit: 50270,
  mainRate: 8,
  upperRate: 2,
};
