import { useMemo } from 'react';
import { useNumber } from './useNumber.js';
import { mtdStart, MTD_PHASES, MTD_LAST_VERIFIED } from './mtdEngine.js';

const gbp = (n) => `£${Math.round(n).toLocaleString('en-GB')}`;
const label = { y2425: '2024/25', y2526: '2025/26', y2627: '2026/27 (estimate)' };

export default function MtdCheckerWidget() {
  const [se25, setSe25, se25N] = useNumber(20000);
  const [pr25, setPr25, pr25N] = useNumber(13000);
  const [se26, setSe26, se26N] = useNumber(22000);
  const [pr26, setPr26, pr26N] = useNumber(14000);
  const [se27, setSe27, se27N] = useNumber(22000);
  const [pr27, setPr27, pr27N] = useNumber(14000);

  const fields = {
    y2425: [se25, setSe25, pr25, setPr25],
    y2526: [se26, setSe26, pr26, setPr26],
    y2627: [se27, setSe27, pr27, setPr27],
  };

  const result = useMemo(
    () =>
      mtdStart({
        y2425: { selfEmployment: se25N, property: pr25N },
        y2526: { selfEmployment: se26N, property: pr26N },
        y2627: { selfEmployment: se27N, property: pr27N },
      }),
    [se25N, pr25N, se26N, pr26N, se27N, pr27N]
  );

  return (
    <div>
      <div className="field-grid stack">
        {MTD_PHASES.map((p) => {
          const [se, setSe, pr, setPr] = fields[p.key];
          return [
            <div className="field" key={`${p.key}-se`}>
              <label htmlFor={`${p.key}-se`}>{label[p.key]} self-employment turnover (£)</label>
              <input id={`${p.key}-se`} type="number" min="0" step="1000" value={se}
                onChange={(e) => setSe(e.target.value)} />
            </div>,
            <div className="field" key={`${p.key}-pr`}>
              <label htmlFor={`${p.key}-pr`}>{label[p.key]} property income (£)</label>
              <input id={`${p.key}-pr`} type="number" min="0" step="1000" value={pr}
                onChange={(e) => setPr(e.target.value)} />
            </div>,
          ];
        })}
      </div>

      <div className="results">
        <div className="result primary">
          <div className="label">You need MTD for Income Tax from</div>
          <div className="value">{result.start ? result.start.start : 'Not yet'}</div>
        </div>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tax year checked</th>
              <th>Your qualifying income</th>
              <th>Threshold</th>
              <th>Start if over</th>
              <th>Over?</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((r) => (
              <tr key={r.key}>
                <td className="label-cell">{r.taxYear}</td>
                <td>{gbp(r.income)}</td>
                <td>{gbp(r.threshold)}</td>
                <td>{r.start}</td>
                <td>{r.over ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="note">
        {result.start
          ? <>Your {result.start.taxYear} qualifying income of {gbp(result.start.income)} is
              over {gbp(result.start.threshold)}, so you need MTD-compatible software and
              quarterly updates from <strong>{result.start.start}</strong>.</>
          : <>On these figures you are under every announced threshold. Re-check each year —
              the £20,000 threshold applies from April 2028.</>}
      </p>

      <p className="muted-block">
        Thresholds verified {MTD_LAST_VERIFIED} against{' '}
        <a href="https://www.gov.uk/guidance/find-out-if-and-when-you-need-to-use-making-tax-digital-for-income-tax"
          target="_blank" rel="noopener noreferrer">GOV.UK</a>. This checker isn't tax advice.
        It applies the published thresholds to the figures you enter and doesn't take
        account of exemptions or deferrals. If you're close to a threshold, check GOV.UK
        or speak to an accountant. Nothing you type leaves your browser.
      </p>
    </div>
  );
}
