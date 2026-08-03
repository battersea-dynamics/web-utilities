import { LANGUAGES } from './languages.js';

export default function LanguageSelect({ value, onChange }) {
  return (
    <div className="field" style={{ maxWidth: '12rem' }}>
      <label htmlFor="lang">Language</label>
      <select id="lang" value={value} onChange={(e) => onChange(e.target.value)}>
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} disabled={!l.available}>
            {l.label}
            {!l.available ? ' (coming soon)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
