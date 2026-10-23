import { useState } from 'react';

// The instant-download consent gate.
//
// WHY: under the Consumer Contracts Regulations 2013 (reg 37) a buyer of a
// download only loses the 14-day right to cancel if they EXPRESSLY consent to
// immediate supply AND acknowledge losing that right. So the box starts
// unticked and the Buy button does nothing until it is ticked. The same
// statement is confirmed by email afterwards (reg 16(3)) — see the Worker.
//
// Do not pre-tick this box, and do not replace it with "by buying you agree".
//
// If href is null (no real Stripe Payment Link yet) the box shows a disabled
// "Coming soon" button and a contact line, with no consent box and no link.
export default function BuyBox({ href, priceLabel, termsHref, refundHref, contactEmail = 'hello@gazza.ltd' }) {
  const [agreed, setAgreed] = useState(false);
  const [nudge, setNudge] = useState(false);

  const go = (e) => {
    if (!agreed) {
      e.preventDefault();
      setNudge(true);
    }
  };

  if (!href) {
    return (
      <div className="buy-box buy-box-soon">
        <p className="buy-price"><span className="price">{priceLabel}</span> one-off · instant download · no account</p>
        <p>
          <button type="button" className="btn btn-buy is-disabled" disabled aria-disabled="true">
            Coming soon
          </button>
        </p>
        <p className="muted-block">
          Sales open soon. Email <a href={`mailto:${contactEmail}`}>{contactEmail}</a> to be notified.
        </p>
      </div>
    );
  }

  return (
    <div className="buy-box">
      <p className="buy-price"><span className="price">{priceLabel}</span> one-off · instant download · no account</p>

      <label className="consent" htmlFor="ccr-consent">
        <input id="ccr-consent" type="checkbox" checked={agreed}
          onChange={(e) => { setAgreed(e.target.checked); setNudge(false); }} />
        <span>
          <strong>I want to download the workbook straight away.</strong> I agree that
          supply starts immediately and I understand that once the download is made
          available I lose my 14-day right to cancel. This doesn't affect my rights if
          the workbook is faulty.
        </span>
      </label>

      <p>
        <a className={`btn btn-buy${agreed ? '' : ' is-disabled'}`} href={agreed ? href : undefined}
          role="button" aria-disabled={!agreed} onClick={go} rel="nofollow">
          Buy the tracker — {priceLabel}
        </a>
      </p>

      {nudge && (
        <p className="note note-warn" role="alert">
          Please tick the box to confirm you want instant download before you continue.
        </p>
      )}

      <p className="muted-block">
        Read our <a href={termsHref}>terms of sale</a> and <a href={refundHref}>refund policy</a>.
        We also offer a goodwill refund within 14 days. Payment is taken securely by Stripe.
      </p>
    </div>
  );
}
