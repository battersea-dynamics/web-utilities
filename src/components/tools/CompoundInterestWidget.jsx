import { useState, useMemo } from 'react';
import { compoundInterest, gbp } from './taxEngine.js';

export default function CompoundInterestWidget() {
  const [initial, setInitial] = useState(1000);
  const [monthlyContribution, setMonthlyContribution] = useState(200);
  const [annualRate, setAnnualRate] = useState(5);
  const [years, setYears] = useState(20);
  const [annualContributionIncrease, setIncrease] = useState(0);
  const [showTable, setShowTable] = useState(false);

  const result = useMemo(
    () =>
      compoundInterest({
        initial,
        monthlyContribution,
        annualRate,
        years,
        annualContributionIncrease,
      }),
    [initial, monthlyContribution, annualRate, years, annualContributionIncrease]
  );

  // The same money with no growth at all, to show what the interest actually added.
  const withoutGrowth = initial + monthlyContribution * Math.round(years * 12);

  return (
    <div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="initial">Starting amount (£)</label>
          <input id="initial" type="number" min="0" step="100" value={initial}
            onChange={(e) => setInitial(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="monthly">Added each month (£)</label>
          <input id="monthly" type="number" min="0" step="25" value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="rate">Interest rate (% a year)</label>
          <input id="rate" type="number" min="0" max="30" step="0.1" value={annualRate}
            onChange={(e) => setAnnualRate(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="years">Years</label>
          <input id="years" type="number" min="1" max="60" step="1" value={years}
            onChange={(e) => setYears(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="inc">Increase contributions (% a year)</label>
          <input id="inc" type="number" min="0" max="20" step="0.5"
            value={annualContributionIncrease}
            onChange={(e) => setIncrease(Number(e.target.value))} />
        </div>
      </div>

      {!result.ok && <p className="note stack">{result.reason}</p>}

      {result.ok && (
        <>
          <div className="results">
            <div className="result primary">
              <div className="label">Final balance</div>
              <div className="value">{gbp(result.finalBalance)}</div>
            </div>
            <div className="result">
              <div className="label">You put in</div>
              <div className="value">{gbp(result.totalContributed)}</div>
            </div>
            <div className="result">
              <div className="label">Interest earned</div>
              <div className="value">{gbp(result.totalInterest)}</div>
            </div>
            <div className="result">
              <div className="label">Interest share</div>
              <div className="value">
                {result.finalBalance > 0
                  ? ((result.totalInterest / result.finalBalance) * 100).toFixed(0)
                  : 0}
                %
              </div>
            </div>
          </div>

          {result.totalInterest > 0 && (
            <p className="note">
              Under a mattress the same money would be{' '}
              <strong>{gbp(withoutGrowth)}</strong>. Compounding added{' '}
              <strong>{gbp(result.finalBalance - withoutGrowth)}</strong> on top of what you
              paid in.
            </p>
          )}

          <details className="disclosure" open={showTable}
            onToggle={(e) => setShowTable(e.currentTarget.open)}>
            <summary>Year-by-year growth</summary>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {['Year', 'Paid in', 'Interest', 'Balance'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.yearly.map((y) => (
                    <tr key={y.year}>
                      <td>{Number.isInteger(y.year) ? y.year : y.year.toFixed(1)}</td>
                      <td>{gbp(y.contributed)}</td>
                      <td>{gbp(y.interest)}</td>
                      <td>{gbp(y.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <p className="muted-block">
            Interest is compounded monthly and contributions are added at the end of each month.
            Figures are before inflation and before any tax on the interest.
          </p>
        </>
      )}
    </div>
  );
}
