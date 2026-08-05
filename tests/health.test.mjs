// Verification for the health calculators.
//
// The conversions are fixed mathematical relationships, so they can be checked
// against independently published reference pairs — the diabetes diagnostic
// thresholds, which are quoted in both unit systems.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  bmi,
  convertGlucose,
  mmolToMgdl,
  mgdlToMmol,
  ifccToNgsp,
  ngspToIfcc,
  BMI_CATEGORIES,
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
