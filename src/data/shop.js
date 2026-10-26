// The paid products on the site, and the URLs the shop pages depend on.
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

// Second product: a printable PDF for the health (wellbeing) hub. It has its
// own Payment Link so each product can go on sale independently. While this
// is the REPLACE_ME placeholder its page shows a disabled "Coming soon"
// button. The paid PDF is NOT in public/ — it is delivered after payment only.
export const WINTER_ARC = {
  slug: 'winter-arc-tracker',
  name: 'Winter Arc 90-Day Habit Tracker',
  price: 4.5,
  priceLabel: '£4.50',
  currency: 'GBP',
};
export const WINTER_ARC_PAYMENT_LINK = 'https://buy.stripe.com/dRm4gzd3C61ZcrW9JbeIw00';

// Shown on the Winter Arc page and its hub card. Keep in sync with the PDF footer.
export const WELLBEING_NOTICE = 'General wellbeing tracker, not medical advice.';

// Stripe Payment Link (Dashboard → Payment Links → Copy link).
// Looks like https://buy.stripe.com/xxxxxxxx. TODO: replace before launch.
export const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/4gM8wP6Fe0HF4Zu6wZeIw01';

// Consent wording version, sent to Stripe as client_reference_id so each
// order records which version of the instant-download wording the buyer saw.
// Bump it whenever the tick-box text changes.
export const CONSENT_VERSION = 'ccr-2026-10-v1';

// Public URL of the delivery Worker (see worker/ in the update pack).
export const DELIVERY_API = 'https://shop.gazza.ltd';

// Seller details shown on the legal pages.
export const SELLER = {
  name: 'Battersea Dynamics Limited',
  companyNumber: '15356775',
  registeredOffice: '5th Floor, 167-169 Great Portland Street, London, W1W 5PF',
  email: 'hello@gazza.ltd',
};

export const LEGAL_LAST_UPDATED = '26 October 2026';
export const TERMS_VERSION = '1.1';

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

// Shown on every product, legal and checker page. Keep wording in sync with the workbook.
export const NOT_HMRC_NOTICE = 'This is an independent spreadsheet from Battersea Dynamics Ltd to help you organise your records and prepare for Making Tax Digital (MTD). It is not affiliated with or endorsed by HMRC, it does not submit anything to HMRC, and it is not MTD-compatible software; you will still need HMRC-recognised software or bridging software to file.';
export const NOT_HMRC_NOTICE_CHECKER = 'This is an independent checker from Battersea Dynamics Ltd to help you prepare for Making Tax Digital (MTD). It is not affiliated with or endorsed by HMRC, it does not submit anything to HMRC, and it is not MTD-compatible software; you will still need HMRC-recognised software or bridging software to file.';
