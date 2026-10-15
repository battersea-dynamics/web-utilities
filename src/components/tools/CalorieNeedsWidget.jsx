import { useMemo, useState } from 'react';
import { useNumber } from './useNumber.js';
import { dailyEnergy, PAL_BANDS, LAST_VERIFIED_NUTRITION } from './healthEngine.js';

// Reports a range, not a single number. The activity multiplier is a band in
// the source, and collapsing it to one figure would imply a precision the
// method does not have — see PAL_BANDS in healthEngine.js.

export default function CalorieNeedsWidget() {
  const [units, setUnits] = useState('metric');
  const [sex, setSex] = useState('female');
  const [pal, setPal] = useState('sedentary');

  const [cm, setCm, cmN] = useNumber(170);
  const [kg, setKg, kgN] = useNumber(70);
  const [ft, setFt, ftN] = useNumber(5);
  const [inch, setInch, inchN] = useNumber(7);
  const [st, setSt, stN] = useNumber(11);
  const [lb, setLb, lbN] = useNumber(0);
  const [age, setAge, ageN] = useNumber(40);

  const heightCm = units === 'metric' ? cmN : (ftN * 12 + inchN) * 2.54;
  const weightKg = units === 'metric' ? kgN : (stN * 14 + lbN) * 0.45359237;

  const result = useMemo(
    () => dailyEnergy(weightKg, heightCm, ageN, sex, pal),
    [weightKg, heightCm, ageN, sex, pal]
  );

  const kcal = (n) => `${Math.round(n).toLocaleString('en-GB')} kcal`;
  const band = PAL_BANDS.find((b) => b.key === pal);

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
            <label htmlFor="c-cm">Height (cm)</label>
            <input id="c-cm" type="number" min="0" max="272" value={cm}
              onChange={(e) => setCm(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="c-kg">Weight (kg)</label>
            <input id="c-kg" type="number" min="0" max="650" step="0.1" value={kg}
              onChange={(e) => setKg(e.target.value)} />
          </div>
        </div>
      ) : (
        <div className="field-grid stack">
          <div className="field">
            <label htmlFor="c-ft">Height (feet)</label>
            <input id="c-ft" type="number" min="0" max="8" value={ft}
              onChange={(e) => setFt(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="c-in">Height (inches)</label>
            <input id="c-in" type="number" min="0" max="11" value={inch}
              onChange={(e) => setInch(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="c-st">Weight (stone)</label>
            <input id="c-st" type="number" min="0" max="100" value={st}
              onChange={(e) => setSt(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="c-lb">and pounds</label>
            <input id="c-lb" type="number" min="0" max="13" value={lb}
              onChange={(e) => setLb(e.target.value)} />
          </div>
        </div>
      )}

      <div className="field-grid stack">
        <div className="field">
          <label htmlFor="c-age">Age (years)</label>
          <input id="c-age" type="number" min="0" max="120" value={age}
            onChange={(e) => setAge(e.target.value)} />
        </div>
        <div className="field">
          <label>Sex used by the equation</label>
          <div className="seg">
            <button type="button" className="seg-btn" aria-pressed={sex === 'female'}
              onClick={() => setSex('female')}>Female</button>
            <button type="button" className="seg-btn" aria-pressed={sex === 'male'}
              onClick={() => setSex('male')}>Male</button>
          </div>
        </div>
      </div>

      <div className="field stack">
        <label htmlFor="c-pal">Lifestyle</label>
        <select id="c-pal" value={pal} onChange={(e) => setPal(e.target.value)}>
          {PAL_BANDS.map((b) => (
            <option key={b.key} value={b.key}>{b.label}</option>
          ))}
        </select>
        {band && <p className="dropzone-hint">{band.describes}</p>}
      </div>

      {!result.ok && <p className="note stack">{result.reason}</p>}

      {result.ok && (
        <>
          <div className="results">
            <div className="result primary">
              <div className="label">Daily energy need</div>
              <div className="value">
                {kcal(result.low)} – {kcal(result.high)}
              </div>
            </div>
            <div className="result">
              <div className="label">Representative figure</div>
              <div className="value">{kcal(result.value)}</div>
            </div>
            <div className="result">
              <div className="label">At complete rest (BMR)</div>
              <div className="value">{kcal(result.bmr)}</div>
            </div>
          </div>

          <p className="note">
            The range is the honest answer. Your resting figure is multiplied by
            an activity level, and the source publishes that level as a band
            ({result.band.min.toFixed(2)}–{result.band.max.toFixed(2)} for this
            lifestyle) rather than one value. The representative figure is the
            worked example the same report uses, shown so you have a single
            number if you need one — but two people with identical measurements
            and the same lifestyle genuinely differ by hundreds of calories.
          </p>

          {result.outsideDerivedRange && (
            <p className="note">
              The equation was derived from adults aged 19 to 78. Outside that
              age range this is an extrapolation and should be treated as a
              rough indication only.
            </p>
          )}

          <p className="muted-block">
            Resting rate: the Mifflin–St Jeor equation (American Journal of
            Clinical Nutrition, 1990), derived from 498 healthy adults.
            Activity bands: FAO/WHO/UNU <em>Human energy requirements</em>
            {' '}(2004), Table 5.3. Verified {LAST_VERIFIED_NUTRITION}. Equations of this
            kind predict measured resting expenditure to within roughly 10% for
            most healthy adults and less reliably for others, so treat the
            result as an estimate rather than a measurement. It does not
            account for pregnancy, breastfeeding, illness, or any medical
            condition affecting metabolism.
          </p>
        </>
      )}
    </div>
  );
}
