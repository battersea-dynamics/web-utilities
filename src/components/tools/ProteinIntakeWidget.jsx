import { useMemo, useState } from 'react';
import { useNumber } from './useNumber.js';
import { proteinIntake, PROTEIN, LAST_VERIFIED_NUTRITION } from './healthEngine.js';

// Shows both published bands at once, always. See proteinIntake() for why
// there is no goal selector and nothing that reacts to a target weight.

export default function ProteinIntakeWidget() {
  const [units, setUnits] = useState('metric');

  const [kg, setKg, kgN] = useNumber(70);
  const [st, setSt, stN] = useNumber(11);
  const [lb, setLb, lbN] = useNumber(0);

  const weightKg = units === 'metric' ? kgN : (stN * 14 + lbN) * 0.45359237;

  const result = useMemo(() => proteinIntake(weightKg), [weightKg]);

  const g = (n) => `${Math.round(n)} g`;

  return (
    <div>
      <div className="field">
        <label>Units</label>
        <div className="seg stack-sm">
          <button type="button" className="seg-btn" aria-pressed={units === 'metric'}
            onClick={() => setUnits('metric')}>Metric (kg)</button>
          <button type="button" className="seg-btn" aria-pressed={units === 'imperial'}
            onClick={() => setUnits('imperial')}>Imperial (st, lb)</button>
        </div>
      </div>

      {units === 'metric' ? (
        <div className="field-grid stack">
          <div className="field">
            <label htmlFor="p-kg">Body weight (kg)</label>
            <input id="p-kg" type="number" min="0" max="650" step="0.1" value={kg}
              onChange={(e) => setKg(e.target.value)} />
          </div>
        </div>
      ) : (
        <div className="field-grid stack">
          <div className="field">
            <label htmlFor="p-st">Body weight (stone)</label>
            <input id="p-st" type="number" min="0" max="100" value={st}
              onChange={(e) => setSt(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="p-lb">and pounds</label>
            <input id="p-lb" type="number" min="0" max="13" value={lb}
              onChange={(e) => setLb(e.target.value)} />
          </div>
        </div>
      )}

      {!result.ok && <p className="note stack">{result.reason}</p>}

      {result.ok && (
        <>
          <div className="results">
            <div className="result primary">
              <div className="label">
                Reference intake ({PROTEIN.baselinePerKg} g/kg)
              </div>
              <div className="value">{g(result.baseline)}</div>
            </div>
            <div className="result">
              <div className="label">
                {/* toFixed, or 2.0 renders as "2" and looks like a different
                     figure from the one the source publishes. */}
                Training range ({PROTEIN.trainingMinPerKg.toFixed(1)}–
                {PROTEIN.trainingMaxPerKg.toFixed(1)} g/kg)
              </div>
              <div className="value">
                {g(result.trainingMin)} – {g(result.trainingMax)}
              </div>
            </div>
            <div className="result">
              <div className="label">
                Average requirement ({PROTEIN.averageRequirementPerKg} g/kg)
              </div>
              <div className="value">{g(result.averageRequirement)}</div>
            </div>
          </div>

          <p className="note">
            Three published figures, not three options. The reference intake is
            set to cover nearly everyone in a healthy adult population — it is
            not a minimum you fall below at your peril, which is why the lower
            average requirement is shown too. The training range comes from
            sports nutrition guidance and is quoted as a range because the
            evidence does not support a single number.
          </p>

          <p className="muted-block">
            Reference intake and average requirement: European Food Safety
            Authority population reference values for protein, verified{' '}
            {LAST_VERIFIED_NUTRITION}. Training range: the 2016 joint position paper of
            the Academy of Nutrition and Dietetics, Dietitians of Canada and
            the American College of Sports Medicine. Figures are for healthy
            adults. Protein needs differ in pregnancy, in childhood, and for
            anyone with kidney or liver disease — if any of those apply, the
            figures above are the wrong starting point and a GP or dietitian is
            the right one.
          </p>
        </>
      )}
    </div>
  );
}
