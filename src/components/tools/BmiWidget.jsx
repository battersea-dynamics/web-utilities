import { useState, useMemo } from 'react';
import { bmi, LAST_VERIFIED } from './healthEngine.js';

export default function BmiWidget() {
  const [units, setUnits] = useState('metric');

  // Metric
  const [cm, setCm] = useState(175);
  const [kg, setKg] = useState(70);
  // Imperial
  const [ft, setFt] = useState(5);
  const [inch, setInch] = useState(9);
  const [st, setSt] = useState(11);
  const [lb, setLb] = useState(0);

  const heightCm = units === 'metric' ? cm : (ft * 12 + Number(inch)) * 2.54;
  const weightKg = units === 'metric' ? kg : (st * 14 + Number(lb)) * 0.45359237;

  const result = useMemo(() => bmi(weightKg, heightCm), [weightKg, heightCm]);

  const kgToSt = (v) => {
    const total = v / 0.45359237;
    return `${Math.floor(total / 14)} st ${Math.round(total % 14)} lb`;
  };

  return (
    <div>
      <div className="field">
        <label>Units</label>
        <div className="seg stack-sm">
          <button type="button" className="seg-btn" aria-pressed={units === 'metric'}
            onClick={() => setUnits('metric')}>Metric (cm, kg)</button>
          <button type="button" className="seg-btn" aria-pressed={units === 'imperial'}
            onClick={() => setUnits('imperial')}>Imperial (ft, st)</button>
        </div>
      </div>

      {units === 'metric' ? (
        <div className="field-grid stack">
          <div className="field">
            <label htmlFor="cm">Height (cm)</label>
            <input id="cm" type="number" min="0" max="272" value={cm}
              onChange={(e) => setCm(Number(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="kg">Weight (kg)</label>
            <input id="kg" type="number" min="0" max="650" step="0.1" value={kg}
              onChange={(e) => setKg(Number(e.target.value))} />
          </div>
        </div>
      ) : (
        <div className="field-grid stack">
          <div className="field">
            <label htmlFor="ft">Height (feet)</label>
            <input id="ft" type="number" min="0" max="8" value={ft}
              onChange={(e) => setFt(Number(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="in">Height (inches)</label>
            <input id="in" type="number" min="0" max="11" value={inch}
              onChange={(e) => setInch(Number(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="st">Weight (stone)</label>
            <input id="st" type="number" min="0" max="100" value={st}
              onChange={(e) => setSt(Number(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="lb">Weight (pounds)</label>
            <input id="lb" type="number" min="0" max="13" value={lb}
              onChange={(e) => setLb(Number(e.target.value))} />
          </div>
        </div>
      )}

      {!result.ok && <p className="note stack">{result.reason}</p>}

      {result.ok && (
        <>
          <div className="results">
            <div className="result primary">
              <div className="label">Your BMI</div>
              <div className="value">{result.value.toFixed(1)}</div>
            </div>
            <div className="result">
              <div className="label">WHO category</div>
              <div className="value">{result.category}</div>
            </div>
            <div className="result">
              <div className="label">Healthy range for your height</div>
              <div className="value">
                {units === 'metric'
                  ? `${result.healthyMin.toFixed(0)}–${result.healthyMax.toFixed(0)} kg`
                  : `${kgToSt(result.healthyMin)} – ${kgToSt(result.healthyMax)}`}
              </div>
            </div>
          </div>

          <p className="note">
            BMI is a screening figure, not a diagnosis. It uses only height and weight,
            so it cannot tell muscle from fat — a very muscular person can register as
            overweight while carrying little fat. It is also less reliable for people
            under 18, over 65, pregnant, or with a limb difference.
          </p>

          <p className="muted-block">
            Categories are the World Health Organization adult thresholds, verified{' '}
            {LAST_VERIFIED}. NICE advises lower thresholds for people of South Asian,
            Chinese, Black African, African-Caribbean and Middle Eastern family
            background, because health risks appear at a lower BMI — see the{' '}
            <a href="https://www.nhs.uk/health-assessment-tools/calculate-your-body-mass-index/"
              target="_blank" rel="noopener noreferrer">NHS BMI tool</a> for guidance
            that accounts for this. If you have any concern about your weight, a GP is
            the right place to take it.
          </p>
        </>
      )}
    </div>
  );
}
