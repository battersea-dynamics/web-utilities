// The one paid product on the site, and the URLs the shop pages depend on.
//
// Everything a person has to fill in after setting up Stripe and the
// delivery Worker lives here, so it is changed in one place rather than
// hunted for across several pages.

export const PRODUCT = {
  slug: 'mtd-tracker',
  name: 'Making Tax Digital (MTD) Income Tax Readiness Tracker 2027-28',
  price: 9,
  priceLabel: '£9',
  currency: 'GBP',
};

// Stripe Payment Link (Dashboard → Payment Links → Copy link).
// Looks like https://buy.stripe.com/xxxxxxxx. TODO: replace before launch.
export const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/REPLACE_ME';

// Consent wording version, sent to Stripe as client_reference_id so each
// order records which version of the instant-download wording the buyer saw.
// Bump it whenever the tick-box text changes.
export const CONSENT_VERSION = 'ccr-2026-10-v1';

// Public URL of the delivery Worker (see worker/ in the update pack).
export const DELIVERY_API = 'https://shop.gazza.ltd';

// Seller details shown on the legal pages. TODO: fill in before launch.
export const SELLER = {
  name: 'Battersea Dynamics Limited',
  companyNumber: '15356775',
  registeredOffice: '[REGISTERED OFFICE ADDRESS]',
  email: 'hello@gazza.ltd',
};

export const LEGAL_LAST_UPDATED = '[DATE]';
export const TERMS_VERSION = '1.0';

/** Checkout URL with the consent version attached. */
// Sales are "open" only once a real Payment Link is set. While the link is empty
// or still the REPLACE_ME placeholder, checkoutUrl() returns null and BuyBox
// shows a disabled "Coming soon" button instead of linking anywhere.
export const isPaymentLinkLive = (link = STRIPE_PAYMENT_LINK) =>
  typeof link === 'string' && link.trim() !== '' && !link.includes('REPLACE_ME');

export const checkoutUrl = (link = STRIPE_PAYMENT_LINK) =>
  isPaymentLinkLive(link)
    ? `${link}?client_reference_id=${encodeURIComponent(CONSENT_VERSION)}`
    : null;

// Shown on every product, legal and checker page. Keep wording in sync with the workbook and delivery email.
export const NOT_HMRC_NOTICE = 'This is an independent spreadsheet from Battersea Dynamics Ltd to help you organise your records and prepare for Making Tax Digital (MTD). It is not affiliated with or endorsed by HMRC, it does not submit anything to HMRC, and it is not MTD-compatible software; you will still need HMRC-recognised software or bridging software to file.';
export const NOT_HMRC_NOTICE_CHECKER = 'This is an independent checker from Battersea Dynamics Ltd to help you prepare for Making Tax Digital (MTD). It is not affiliated with or endorsed by HMRC, it does not submit anything to HMRC, and it is not MTD-compatible software; you will still need HMRC-recognised software or bridging software to file.';
