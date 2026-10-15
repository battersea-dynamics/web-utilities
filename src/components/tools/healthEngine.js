// Health calculators: BMI, blood sugar units, protein intake and daily
// energy needs.
//
// ── REFERENCE DATA ────────────────────────────────────────────────────
// Every figure below comes from a published source, named inline. As with
// taxData.js, nothing here should be edited from memory.
//
// TWO VERIFICATION DATES, ON PURPOSE. The figures here come from different
// bodies on different revision cycles, and both dates are displayed to
// visitors. A single shared date would have to move whenever any one figure
// was re-checked, which would silently claim a verification that never
// happened — the BMI thresholds were last read in August, the nutrition
// figures in October. Keep them separate, and move only the one you actually
// checked.
//
// Sources, last verified 5 August 2026:
//   BMI categories ...... WHO. Corroborated by the WHO/Europe NCD fact sheet,
//                         which describes excess body weight as BMI over 25.
//   Glucose conversion .. 1 mmol/L = 18.0182 mg/dL, from the molar mass of
//                         glucose (180.156 g/mol).
//   HbA1c conversion .... IFCC (mmol/mol) = (10.93 × NGSP %) − 23.50.
//                         Self-checks: 48 mmol/mol → 6.5%, 53 → 7.0%.
//
// Sources, last verified 15 October 2026:
//   Protein PRI ......... EFSA, 0.83 g/kg body weight/day for adults of all
//                         ages. Average requirement 0.66 g/kg; the PRI adds
//                         the 97.5th percentile of the requirement
//                         distribution.
//   Protein, training ... 1.2–2.0 g/kg/day, from the 2016 joint position
//                         paper of the Academy of Nutrition and Dietetics,
//                         Dietitians of Canada and the American College of
//                         Sports Medicine (page 17). Quoted range, not a
//                         target for any individual.
//   BMR equation ........ Mifflin–St Jeor, Am J Clin Nutr 1990;51(2):241-7,
//                         doi:10.1093/ajcn/51.2.241. Derived from 498 healthy
//                         adults aged 19–78.
//   Activity multiplier . FAO/WHO/UNU 2004 "Human energy requirements",
//                         Table 5.3. PAL bands, plus the report's own worked
//                         representative values from Table 5.1.
//
// A NOTE ON MIXING SOURCES, because it looks inconsistent and isn't:
// FAO/WHO/UNU pairs its PAL bands with the older Schofield BMR equations,
// not Mifflin–St Jeor. We use Mifflin–St Jeor because it was derived on a
// modern population and predicts measured resting expenditure more closely,
// and the PAL multiplier is a ratio of total expenditure to BMR — it does
// not depend on which BMR equation produced the denominator. Both choices
// are named on the page so a reader can see what was used.

/** BMI thresholds and the blood sugar conversion factors. */
export const LAST_VERIFIED = '5 August 2026';
/** Protein reference values, the BMR equation and the activity bands. */
export const LAST_VERIFIED_NUTRITION = '15 October 2026';

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

/* ------------------------------------------------------------------ */
/* Protein                                                             */
/* ------------------------------------------------------------------ */

export const PROTEIN = {
  // EFSA population reference intake, adults of all ages.
  baselinePerKg: 0.83,
  // EFSA average requirement, shown for context so the PRI isn't mistaken
  // for a minimum below which something goes wrong.
  averageRequirementPerKg: 0.66,
  // Quoted range for people training regularly.
  trainingMinPerKg: 1.2,
  trainingMaxPerKg: 2.0,
};

/**
 * Protein reference figures for a given body weight.
 *
 * Deliberately returns BOTH bands every time rather than choosing one from a
 * dropdown. A calculator that picks a single number is making a personal
 * recommendation; this one converts published reference values into grams and
 * leaves the judgement to the reader. That is also why nothing here reacts to
 * a goal, a body-fat figure or a training split.
 *
 * @param {number} kg body weight in kilograms
 */
export function proteinIntake(kg) {
  if (!(kg > 0)) return { ok: false, reason: 'Enter a body weight.' };

  return {
    ok: true,
    kg,
    averageRequirement: PROTEIN.averageRequirementPerKg * kg,
    baseline: PROTEIN.baselinePerKg * kg,
    trainingMin: PROTEIN.trainingMinPerKg * kg,
    trainingMax: PROTEIN.trainingMaxPerKg * kg,
  };
}

/* ------------------------------------------------------------------ */
/* Daily energy needs                                                  */
/* ------------------------------------------------------------------ */

/**
 * FAO/WHO/UNU Table 5.3 lifestyle bands.
 *
 * `value` is the report's own worked example for that band in Table 5.1, not
 * a midpoint we invented. The band is carried alongside it because the honest
 * answer to "how many calories do I need" is a range — reporting only the
 * single figure would imply a precision the method does not have.
 */
export const PAL_BANDS = [
  {
    key: 'sedentary',
    label: 'Sedentary or light activity',
    min: 1.4,
    max: 1.69,
    value: 1.53,
    describes:
      'Desk or seated work, motor transport, little or no regular exercise.',
  },
  {
    key: 'active',
    label: 'Active or moderately active',
    min: 1.7,
    max: 1.99,
    value: 1.76,
    describes:
      'On your feet much of the day, or a sedentary job plus about an hour of moderate exercise most days.',
  },
  {
    key: 'vigorous',
    label: 'Vigorously active',
    min: 2.0,
    max: 2.4,
    value: 2.25,
    describes:
      'Heavy manual work, or several hours of strenuous activity daily. The report notes that above 2.40 is hard to sustain long term.',
  },
];

export const palBand = (key) =>
  PAL_BANDS.find((b) => b.key === key) || PAL_BANDS[0];

/**
 * Mifflin–St Jeor resting energy expenditure, in kcal/day.
 *
 * The sex term is the published constant (+5 male, −161 female), which is
 * what the equation was fitted with. It is a statistical intercept rather
 * than a statement about anybody, and the page says so.
 *
 * @param {number} kg weight in kilograms
 * @param {number} cm height in centimetres
 * @param {number} age years
 * @param {'male'|'female'} sex
 */
export function basalMetabolicRate(kg, cm, age, sex) {
  if (!(kg > 0) || !(cm > 0) || !(age > 0)) {
    return { ok: false, reason: 'Enter a height, weight and age.' };
  }

  const base = 10 * kg + 6.25 * cm - 5 * age;
  const value = sex === 'female' ? base - 161 : base + 5;

  return {
    ok: true,
    value,
    // Mifflin–St Jeor was derived on adults aged 19 to 78. Outside that it is
    // extrapolation, which the page needs to say rather than hide.
    outsideDerivedRange: age < 19 || age > 78,
  };
}

/**
 * Total daily energy expenditure: BMR × physical activity level.
 *
 * @param {number} kg
 * @param {number} cm
 * @param {number} age
 * @param {'male'|'female'} sex
 * @param {string} palKey one of PAL_BANDS
 */
export function dailyEnergy(kg, cm, age, sex, palKey = 'sedentary') {
  const bmr = basalMetabolicRate(kg, cm, age, sex);
  if (!bmr.ok) return bmr;

  const band = palBand(palKey);

  return {
    ok: true,
    bmr: bmr.value,
    outsideDerivedRange: bmr.outsideDerivedRange,
    band,
    // The representative figure, then the band it sits inside.
    value: bmr.value * band.value,
    low: bmr.value * band.min,
    high: bmr.value * band.max,
  };
}

export const round = (n, dp = 1) =>
  isFinite(n) ? Number(n.toFixed(dp)).toLocaleString('en-GB') : '—';
