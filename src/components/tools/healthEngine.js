// Health calculators: BMI and blood sugar unit conversion.
//
// ── REFERENCE DATA ────────────────────────────────────────────────────
// Every figure below comes from a published source, named inline. As with
// taxData.js, nothing here should be edited from memory.
//
// Sources, last verified 5 August 2026:
//   BMI categories ...... WHO. Corroborated by the WHO/Europe NCD fact sheet,
//                         which describes excess body weight as BMI over 25.
//   Glucose conversion .. 1 mmol/L = 18.0182 mg/dL, from the molar mass of
//                         glucose (180.156 g/mol).
//   HbA1c conversion .... IFCC (mmol/mol) = (10.93 × NGSP %) − 23.50.
//                         Self-checks: 48 mmol/mol → 6.5%, 53 → 7.0%.

export const LAST_VERIFIED = '5 August 2026';

/** WHO adult BMI categories. `upTo` is exclusive. */
export const BMI_CATEGORIES = [
  { upTo: 18.5, label: 'Underweight' },
  { upTo: 25, label: 'Healthy weight' },
  { upTo: 30, label: 'Overweight' },
  { upTo: 35, label: 'Obesity class I' },
  { upTo: 40, label: 'Obesity class II' },
  { upTo: null, label: 'Obesity class III' },
];

export const GLUCOSE_FACTOR = 18.0182;

/* ------------------------------------------------------------------ */
/* BMI                                                                 */
/* ------------------------------------------------------------------ */

/**
 * @param {number} kg weight in kilograms
 * @param {number} cm height in centimetres
 */
export function bmi(kg, cm) {
  if (!(kg > 0) || !(cm > 0)) {
    return { ok: false, reason: 'Enter a height and a weight.' };
  }
  const m = cm / 100;
  const value = kg / (m * m);

  // Guard against physically implausible input rather than returning a
  // confident-looking number for a typo.
  if (!isFinite(value) || value > 200) {
    return { ok: false, reason: 'Those figures do not look right — check the units.' };
  }

  const category = BMI_CATEGORIES.find((c) => c.upTo === null || value < c.upTo).label;

  // The healthy-weight span for this height, which is more actionable than
  // the single number.
  const healthyMin = 18.5 * m * m;
  const healthyMax = 24.9 * m * m;

  return {
    ok: true,
    value,
    category,
    healthyMin,
    healthyMax,
    // Distance from the healthy range, or null when already inside it.
    toHealthy:
      value < 18.5 ? healthyMin - kg : value >= 25 ? kg - healthyMax : null,
  };
}

/* ------------------------------------------------------------------ */
/* Blood sugar units                                                   */
/* ------------------------------------------------------------------ */

/** mmol/L → mg/dL */
export const mmolToMgdl = (v) => v * GLUCOSE_FACTOR;
/** mg/dL → mmol/L */
export const mgdlToMmol = (v) => v / GLUCOSE_FACTOR;

// The two directions are usually published as separate rounded formulas:
//   mmol/mol = (10.93 × %) − 23.5      and      % = (0.0915 × mmol/mol) + 2.15
// They are not exact inverses of each other — 0.0915 × 10.93 = 1.000095 — so
// using both as written makes a value drift slightly every time it is
// converted back and forth. We treat the first as canonical and derive the
// second algebraically, which keeps round trips exact while still matching
// the published reference pairs (48 mmol/mol → 6.5%, 53 → 7.0%).

/** HbA1c: DCCT/NGSP % → IFCC mmol/mol */
export const ngspToIfcc = (v) => 10.93 * v - 23.5;
/** HbA1c: IFCC mmol/mol → DCCT/NGSP % — exact inverse of the above */
export const ifccToNgsp = (v) => (v + 23.5) / 10.93;

/**
 * Convert a blood sugar reading between units.
 * @param {number} value
 * @param {'mmol'|'mgdl'|'ifcc'|'ngsp'} from
 */
export function convertGlucose(value, from) {
  if (!(value > 0)) return { ok: false, reason: 'Enter a reading.' };

  if (from === 'mmol') return { ok: true, mmol: value, mgdl: mmolToMgdl(value) };
  if (from === 'mgdl') return { ok: true, mmol: mgdlToMmol(value), mgdl: value };
  if (from === 'ifcc') return { ok: true, ifcc: value, ngsp: ifccToNgsp(value) };
  if (from === 'ngsp') return { ok: true, ifcc: ngspToIfcc(value), ngsp: value };
  return { ok: false, reason: 'Unknown unit.' };
}

export const round = (n, dp = 1) =>
  isFinite(n) ? Number(n.toFixed(dp)).toLocaleString('en-GB') : '—';
