import { useState } from 'react';

/**
 * State for a number input that behaves the way people expect while typing.
 *
 * The obvious approach — `value={n}` with `onChange={e => setN(Number(e.target.value))}`
 * — is broken in a subtle but very annoying way. Clearing the field gives an
 * empty string, `Number('')` is 0, so React immediately puts a "0" back in the
 * box you just emptied. Typing then appends to it and you get "0123", and the
 * only way out is to reach back and delete the leading zero.
 *
 * The cause is that a half-typed field is a legitimate state that isn't a
 * number yet: "", "-", "1." and "1e" all occur on the way to a valid value and
 * none survives Number() intact.
 *
 * So the text is kept exactly as typed, and a numeric view is derived from it
 * for calculations. Empty or unparseable input falls back to `fallback`, which
 * the engines already handle — they return a readable message rather than
 * pretending the answer is zero.
 *
 * @param {number|string} initial starting value
 * @param {number} fallback numeric value to use when the field is empty
 * @returns {[string, (v: string) => void, number]} [text, setText, numericValue]
 *
 * @example
 *   const [price, setPrice, priceN] = useNumber(300000);
 *   <input value={price} onChange={(e) => setPrice(e.target.value)} />
 *   // …then use priceN wherever the number is needed
 */
export function useNumber(initial, fallback = 0) {
  const [text, setText] = useState(String(initial));
  const trimmed = text.trim();
  const parsed = Number(trimmed);
  const value = trimmed === '' || !isFinite(parsed) ? fallback : parsed;
  return [text, setText, value];
}
