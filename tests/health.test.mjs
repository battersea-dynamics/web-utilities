// Verification for the health calculators.
//
// The conversions are fixed mathematical relationships, so they can be checked
// against independently published reference pairs — the diabetes diagnostic
// thresholds, which are quoted in both unit systems.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  bmi,
  convertGlucose,
  mmolToMgdl,
  mgdlToMmol,
  ifccToNgsp,
  ngspToIfcc,
  BMI_CATEGORIES,
  proteinIntake,
  PROTEIN,
  basalMetabolicRate,
  dailyEnergy,
  PAL_BANDS,
} from '../src/components/tools/healthEngine.js';

const near = (a, b, tol, msg) =>
  assert.ok(Math.abs(a - b) <= tol, `${msg}\n    got ${a}, expected ${b} (±${tol})`);

describe('BMI', () => {
  test('matches the textbook formula', () => {
    // 70 kg at 1.75 m => 70 / 3.0625
    near(bmi(70, 175).value, 22.857, 0.001, '70kg / 175cm');
  });

  test('categories land on the WHO thresholds', () => {
    const at = (v, cm = 175) => bmi((v * (cm / 100) ** 2), cm).category;
    assert.equal(at(17), 'Underweight');
    assert.equal(at(18.5), 'Healthy weight', 'lower bound is inclusive');
    assert.equal(at(24.9), 'Healthy weight');
    assert.equal(at(25), 'Overweight', '25 is overweight, not healthy');
    assert.equal(at(29.9), 'Overweight');
    assert.equal(at(30), 'Obesity class I');
    assert.equal(at(35), 'Obesity class II');
    assert.equal(at(40), 'Obesity class III');
  });

  test('the healthy range converts back to the same thresholds', () => {
    const r = bmi(70, 175);
    near(bmi(r.healthyMin, 175).value, 18.5, 0.01, 'lower bound');
    near(bmi(r.healthyMax, 175).value, 24.9, 0.01, 'upper bound');
  });

  test('metric and imperial agree', () => {
    // 5ft 9in = 175.26 cm, 11 st = 69.85 kg
    const metric = bmi(69.85, 175.26).value;
    const imperial = bmi(11 * 14 * 0.45359237, (5 * 12 + 9) * 2.54).value;
    near(metric, imperial, 0.01, 'same person, two unit systems');
  });

  test('rejects missing or impossible input rather than returning a number', () => {
    for (const [kg, cm] of [[0, 175], [70, 0], [-5, 175], [NaN, 175]]) {
      assert.equal(bmi(kg, cm).ok, false, `${kg}kg ${cm}cm`);
    }
    assert.equal(bmi(70, 5).ok, false, 'height in the wrong unit is caught');
  });

  test('every category is reachable', () => {
    const seen = new Set();
    for (let v = 10; v < 60; v += 0.1) seen.add(bmi(v * 3.0625, 175).category);
    assert.equal(seen.size, BMI_CATEGORIES.length);
  });
});

describe('blood glucose units', () => {
  test('7.0 mmol/L is 126 mg/dL — the diagnostic threshold in both systems', () => {
    near(mmolToMgdl(7.0), 126, 0.5, 'fasting diabetes threshold');
  });

  test('5.5 mmol/L is about 99 mg/dL', () => {
    near(mmolToMgdl(5.5), 99, 0.5, 'typical reading');
  });

  test('converting there and back returns the original', () => {
    for (const v of [3.9, 5.5, 7.8, 11.1, 20]) {
      near(mgdlToMmol(mmolToMgdl(v)), v, 1e-9, `${v} mmol/L round trip`);
    }
  });

  test('the factor is the molar mass of glucose, not a rounded 18', () => {
    // A rounded 18 drifts noticeably at higher readings.
    assert.ok(Math.abs(mmolToMgdl(20) - 20 * 18) > 0.3, 'precision matters at scale');
  });
});

describe('HbA1c units', () => {
  test('48 mmol/mol is 6.5% — a published reference pair', () => {
    near(ifccToNgsp(48), 6.5, 0.05, 'IFCC to DCCT');
  });

  test('53 mmol/mol is 7.0% — a published reference pair', () => {
    near(ifccToNgsp(53), 7.0, 0.05, 'IFCC to DCCT');
  });

  test('the reverse formula agrees with the forward one', () => {
    for (const v of [31, 42, 48, 53, 64, 86]) {
      near(ngspToIfcc(ifccToNgsp(v)), v, 1e-9, `${v} mmol/mol round trip`);
    }
  });

  test('it is a line with an offset, not a simple ratio', () => {
    // Doubling the percentage must not double the mmol/mol figure.
    assert.ok(Math.abs(ngspToIfcc(13) - 2 * ngspToIfcc(6.5)) > 10);
  });
});

describe('convertGlucose dispatch', () => {
  test('each unit returns the matching pair', () => {
    const g = convertGlucose(5.5, 'mmol');
    near(g.mmol, 5.5, 1e-9, 'input preserved');
    near(g.mgdl, 99.1, 0.1, 'converted');

    const a = convertGlucose(48, 'ifcc');
    near(a.ifcc, 48, 1e-9, 'input preserved');
    near(a.ngsp, 6.54, 0.01, 'converted');
  });

  test('rejects zero, negative and unknown units', () => {
    assert.equal(convertGlucose(0, 'mmol').ok, false);
    assert.equal(convertGlucose(-1, 'mmol').ok, false);
    assert.equal(convertGlucose(5, 'furlongs').ok, false);
  });
});

describe('protein intake', () => {
  test('the per-kg multipliers match the published sources', () => {
    // EFSA population reference intake and average requirement, and the
    // 2016 Academy of Nutrition and Dietetics / Dietitians of Canada / ACSM
    // range for people training regularly. If one of these is ever edited
    // from memory, this test is what notices.
    assert.equal(PROTEIN.baselinePerKg, 0.83, 'EFSA PRI is 0.83 g/kg/day');
    assert.equal(PROTEIN.averageRequirementPerKg, 0.66, 'EFSA AR is 0.66 g/kg/day');
    assert.equal(PROTEIN.trainingMinPerKg, 1.2);
    assert.equal(PROTEIN.trainingMaxPerKg, 2.0);
  });

  test('70 kg gives the figures quoted in the worked example', () => {
    const r = proteinIntake(70);
    assert.ok(r.ok);
    near(r.averageRequirement, 46.2, 0.05, 'average requirement at 70 kg');
    near(r.baseline, 58.1, 0.05, 'reference intake at 70 kg');
    near(r.trainingMin, 84, 0.05, 'training floor at 70 kg');
    near(r.trainingMax, 140, 0.05, 'training ceiling at 70 kg');
  });

  test('the reference intake always exceeds the average requirement', () => {
    // The PRI is the AR plus a safety margin, so this ordering is structural,
    // not a coincidence of one weight.
    for (const kg of [45, 60, 70, 85, 110]) {
      const r = proteinIntake(kg);
      assert.ok(r.baseline > r.averageRequirement, `ordering broken at ${kg} kg`);
      assert.ok(r.trainingMin > r.baseline, `training floor below PRI at ${kg} kg`);
    }
  });

  test('both bands are always returned', () => {
    // The page is only defensible because it reports every published figure
    // rather than selecting one. Returning a single number would be the
    // change that quietly turns this into a recommendation.
    const r = proteinIntake(70);
    for (const k of ['averageRequirement', 'baseline', 'trainingMin', 'trainingMax']) {
      assert.ok(typeof r[k] === 'number', `${k} missing from the result`);
    }
  });

  test('a missing weight is refused rather than answered', () => {
    assert.equal(proteinIntake(0).ok, false);
    assert.equal(proteinIntake(-5).ok, false);
  });
});

describe('daily energy needs', () => {
  test('Mifflin-St Jeor reproduces the published equation', () => {
    // 10×kg + 6.25×cm − 5×age, then +5 male / −161 female.
    // 40-year-old woman, 170 cm, 70 kg: 700 + 1062.5 − 200 − 161 = 1401.5
    near(basalMetabolicRate(70, 170, 40, 'female').value, 1401.5, 0.01, 'female BMR');
    // Same measurements, male constant: 700 + 1062.5 − 200 + 5 = 1567.5
    near(basalMetabolicRate(70, 170, 40, 'male').value, 1567.5, 0.01, 'male BMR');
  });

  test('the sex constants differ by exactly 166', () => {
    // +5 and −161 in the simplified equation come from the single 166×sex
    // term in the paper's original combined regression.
    const f = basalMetabolicRate(70, 170, 40, 'female').value;
    const m = basalMetabolicRate(70, 170, 40, 'male').value;
    near(m - f, 166, 0.01, 'the published sex term is 166 kcal');
  });

  test('the activity bands match FAO/WHO/UNU Table 5.3', () => {
    const byKey = Object.fromEntries(PAL_BANDS.map((b) => [b.key, b]));
    assert.deepEqual([byKey.sedentary.min, byKey.sedentary.max], [1.4, 1.69]);
    assert.deepEqual([byKey.active.min, byKey.active.max], [1.7, 1.99]);
    assert.deepEqual([byKey.vigorous.min, byKey.vigorous.max], [2.0, 2.4]);
  });

  test('the representative values are the report’s own worked examples', () => {
    // From Table 5.1, not midpoints we chose. A midpoint would be 1.545,
    // 1.845 and 2.20 — if these ever become those, someone has "tidied" them.
    const byKey = Object.fromEntries(PAL_BANDS.map((b) => [b.key, b]));
    assert.equal(byKey.sedentary.value, 1.53);
    assert.equal(byKey.active.value, 1.76);
    assert.equal(byKey.vigorous.value, 2.25);
  });

  test('every representative value sits inside its own band', () => {
    for (const b of PAL_BANDS) {
      assert.ok(b.value >= b.min && b.value <= b.max, `${b.key} value outside its band`);
    }
  });

  test('the result is a range, with the headline figure inside it', () => {
    const r = dailyEnergy(70, 170, 40, 'female', 'sedentary');
    assert.ok(r.ok);
    near(r.bmr, 1401.5, 0.01, 'BMR');
    near(r.low, 1401.5 * 1.4, 0.01, 'bottom of the band');
    near(r.high, 1401.5 * 1.69, 0.01, 'top of the band');
    assert.ok(r.low < r.value && r.value < r.high, 'headline figure outside the range');
  });

  test('an hour of daily exercise moves you up a band, as the report describes', () => {
    const sed = dailyEnergy(70, 170, 40, 'female', 'sedentary');
    const act = dailyEnergy(70, 170, 40, 'female', 'active');
    assert.ok(act.value > sed.value, 'the active band should not be lower');
    assert.equal(act.bmr, sed.bmr, 'BMR must not change with activity');
  });

  test('ages outside the derivation range are flagged, not hidden', () => {
    assert.equal(basalMetabolicRate(70, 170, 40, 'female').outsideDerivedRange, false);
    assert.equal(basalMetabolicRate(70, 170, 15, 'female').outsideDerivedRange, true);
    assert.equal(basalMetabolicRate(70, 170, 85, 'female').outsideDerivedRange, true);
  });

  test('incomplete input is refused rather than answered', () => {
    assert.equal(basalMetabolicRate(0, 170, 40, 'female').ok, false);
    assert.equal(basalMetabolicRate(70, 0, 40, 'female').ok, false);
    assert.equal(basalMetabolicRate(70, 170, 0, 'female').ok, false);
    assert.equal(dailyEnergy(0, 170, 40, 'female', 'sedentary').ok, false);
  });

  test('an unknown lifestyle key falls back rather than crashing', () => {
    const r = dailyEnergy(70, 170, 40, 'female', 'nonsense');
    assert.ok(r.ok);
    assert.equal(r.band.key, 'sedentary', 'unknown keys should take the lowest band');
  });
});

describe('verification dates', () => {
  test('the two dates are kept separate', async () => {
    // Added after a near-miss: bumping one shared date for the new nutrition
    // figures also changed the date displayed on the BMI and blood sugar
    // pages, claiming a check of the WHO thresholds that nobody had done.
    const m = await import('../src/components/tools/healthEngine.js');
    assert.ok(m.LAST_VERIFIED, 'BMI/glucose date missing');
    assert.ok(m.LAST_VERIFIED_NUTRITION, 'nutrition date missing');
    assert.notEqual(
      m.LAST_VERIFIED,
      m.LAST_VERIFIED_NUTRITION,
      'the dates have been merged — re-check both sets of figures before doing that'
    );
  });

  test('each widget cites the date for the figures it actually uses', () => {
    const read = (f) =>
      fs.readFileSync(new URL(`../src/components/tools/${f}`, import.meta.url), 'utf8');
    for (const f of ['BmiWidget.jsx', 'BloodSugarWidget.jsx']) {
      assert.ok(!read(f).includes('LAST_VERIFIED_NUTRITION'), `${f} cites the wrong date`);
    }
    for (const f of ['ProteinIntakeWidget.jsx', 'CalorieNeedsWidget.jsx']) {
      const src = read(f);
      assert.ok(src.includes('LAST_VERIFIED_NUTRITION'), `${f} should cite the nutrition date`);
      assert.ok(
        !/LAST_VERIFIED[^_]/.test(src.replace(/LAST_VERIFIED_NUTRITION/g, '')),
        `${f} also cites the BMI date`
      );
    }
  });
});
