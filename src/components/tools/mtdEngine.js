// Making Tax Digital for Income Tax: who has to join, and when.
//
// Qualifying income = gross self-employment turnover + gross UK/foreign
// property income (before expenses). Each start date is tested against the
// Self Assessment return two tax years earlier, and the test is strictly
// "more than" — a figure exactly on the threshold does not bring you in.
//
// Source: GOV.UK, "Find out if and when you need to use Making Tax Digital
// for Income Tax". Keep LAST_VERIFIED in step with a real check of that page.

export const MTD_LAST_VERIFIED = '19 October 2026';

export const MTD_PHASES = [
  { taxYear: '2024/25', key: 'y2425', threshold: 50000, start: '6 April 2026' },
  { taxYear: '2025/26', key: 'y2526', threshold: 30000, start: '6 April 2027' },
  { taxYear: '2026/27', key: 'y2627', threshold: 20000, start: '6 April 2028' },
];

/** Gross self-employment turnover plus gross property income. */
export function qualifyingIncome(selfEmployment, property) {
  const se = Number(selfEmployment);
  const pr = Number(property);
  return (Number.isFinite(se) ? Math.max(0, se) : 0) + (Number.isFinite(pr) ? Math.max(0, pr) : 0);
}

/**
 * @param {Record<string, {selfEmployment:number, property:number}>} years keyed by MTD_PHASES[].key
 * @returns {{ rows: Array, start: object|null }}
 */
export function mtdStart(years) {
  const rows = MTD_PHASES.map((p) => {
    const y = years[p.key] || { selfEmployment: 0, property: 0 };
    const income = qualifyingIncome(y.selfEmployment, y.property);
    return { ...p, income, over: income > p.threshold };
  });
  const start = rows.find((r) => r.over) || null;
  return { rows, start };
}
