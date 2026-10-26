// Which files each product delivers. To add a product: add an entry here,
// upload its files to R2 under these exact keys, and set metadata
// "product" = <key> on its Stripe Payment Link.
export const PRODUCTS = {
  'mtd-tracker': {
    name: 'Making Tax Digital (MTD) Income Tax Readiness Tracker 2027-28',
    // Env var holding this product's Payment Link ID (plink_...), used as a fallback
    // when the Payment Link has no "product" metadata.
    paymentLinkVar: 'PAYMENT_LINK_MTD',
    files: [
      { id: 'workbook', label: 'Download the workbook (.xlsx)',
        key: 'mtd-tracker/mtd-readiness-tracker-2027-28.xlsx',
        filename: 'MTD-Readiness-Tracker-2027-28.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    ],
  },
  'winter-arc-tracker': {
    name: 'Winter Arc 90-Day Habit Tracker',
    paymentLinkVar: 'PAYMENT_LINK_WINTER_ARC',
    files: [
      { id: 'colour', label: 'Download the colour edition (PDF)',
        key: 'winter-arc/winter-arc-tracker-A4.pdf',
        filename: 'winter-arc-tracker-A4.pdf', contentType: 'application/pdf' },
      { id: 'printer', label: 'Download the ink-saver / printer-friendly edition (PDF)',
        key: 'winter-arc/winter-arc-tracker-A4-printer-friendly.pdf',
        filename: 'winter-arc-tracker-A4-printer-friendly.pdf', contentType: 'application/pdf' },
    ],
  },
};

/** Work out the product slug from a Stripe Checkout Session. */
export function productForSession(session, env = {}, products = PRODUCTS) {
  const meta = session?.metadata?.product;
  if (meta && products[meta]) return meta;
  const plink = session?.payment_link;
  if (plink) {
    for (const [slug, p] of Object.entries(products)) {
      if (p.paymentLinkVar && env[p.paymentLinkVar] && env[p.paymentLinkVar] === plink) return slug;
    }
  }
  // client_reference_id carries the consent version (e.g. ccr-2026-10-v1), but
  // also accept "<product>:<version>" in case it is ever extended that way.
  const ref = session?.client_reference_id || '';
  const slug = ref.split(':')[0];
  if (products[slug]) return slug;
  return null;
}
