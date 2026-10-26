// Optional: emails the download links via Resend. If RESEND_API_KEY is not set,
// nothing is sent and the on-screen thank-you page still works.
export async function sendDownloadEmail(env, { to, productName, links, consent, orderRef }, fetchImpl = fetch) {
  if (!env.RESEND_API_KEY) return { skipped: true };
  const from = env.EMAIL_FROM || 'gazza.ltd <orders@gazza.ltd>';
  const hours = env.LINK_TTL_HOURS || 72, max = env.MAX_DOWNLOADS || 5;
  const list = links.map((l) => `<li><a href="${l.url}">${l.label}</a></li>`).join('');
  const text = links.map((l) => `${l.label}: ${l.url}`).join('\n');
  const consentLine = 'Before buying you asked for instant download and confirmed you understand you lose your 14-day right to cancel once the download is made available. This does not affect your rights if the product is faulty.';
  const res = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from, to: [to], reply_to: env.SUPPORT_EMAIL || 'hello@gazza.ltd',
      subject: `Your download: ${productName}`,
      html: `<p>Thank you for buying the ${productName}.</p><ul>${list}</ul><p>Each link works for ${hours} hours and up to ${max} downloads.</p><p><small>Order reference: ${orderRef}. ${consentLine} (Consent wording version: ${consent || 'n/a'}.)</small></p><p>Battersea Dynamics Limited</p>`,
      text: `Thank you for buying the ${productName}.\n\n${text}\n\nEach link works for ${hours} hours and up to ${max} downloads.\n\nOrder reference: ${orderRef}. ${consentLine} (Consent wording version: ${consent || 'n/a'}.)\n\nBattersea Dynamics Limited`,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}`);
  return { sent: true };
}
