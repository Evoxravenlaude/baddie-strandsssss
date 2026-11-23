// Order emails. Works with Brevo (BREVO_API_KEY), Resend (RESEND_API_KEY)
// or Zoho ZeptoMail (ZEPTOMAIL_TOKEN). Set ONE of them; if several are set,
// EMAIL_PROVIDER = 'brevo' | 'resend' | 'zeptomail' picks which.
import { env, naira, shortId, address, ADMIN_EMAIL, type Order } from './util.ts';

const FROM = env('EMAIL_FROM', 'Baddie Strands <onboarding@resend.dev>');   // "Name <address>"
const SHOP = env('SHOP_URL', 'https://baddie-strands.vercel.app');
const WHATSAPP = env('WHATSAPP_NUMBER', '2347033247980');

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!to) return false;
  const m = FROM.match(/^\s*(.*?)\s*<(.+)>\s*$/);
  const fromName = m ? m[1] : 'Baddie Strands', fromEmail = m ? m[2] : FROM;
  const pick = env('EMAIL_PROVIDER').toLowerCase();
  const use = (name: string, key: string) => (pick ? pick === name : true) && !!env(key);
  try {
    if (use('zeptomail', 'ZEPTOMAIL_TOKEN')) {
      // ZeptoMail: token from Mail Agents → SMTP/API → API. EU accounts: ZEPTOMAIL_HOST=api.zeptomail.eu
      const token = env('ZEPTOMAIL_TOKEN').replace(/^zoho-enczapikey\s+/i, '');
      const r = await fetch(`https://${env('ZEPTOMAIL_HOST', 'api.zeptomail.com')}/v1.1/email`, {
        method: 'POST',
        headers: { Authorization: `Zoho-enczapikey ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          from: { address: fromEmail, name: fromName },
          to: [{ email_address: { address: to } }],
          reply_to: [{ address: ADMIN_EMAIL, name: fromName }],
          subject, htmlbody: html,
        }),
      });
      if (!r.ok) console.error('zeptomail', r.status, await r.text());
      return r.ok;
    }
    if (use('resend', 'RESEND_API_KEY')) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM, to: [to], subject, html, reply_to: ADMIN_EMAIL }),
      });
      if (!r.ok) console.error('resend', r.status, await r.text());
      return r.ok;
    }
    if (use('brevo', 'BREVO_API_KEY')) {
      const r = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': env('BREVO_API_KEY'), 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ sender: { name: fromName, email: fromEmail }, to: [{ email: to }], replyTo: { email: ADMIN_EMAIL }, subject, htmlContent: html }),
      });
      if (!r.ok) console.error('brevo', r.status, await r.text());
      return r.ok;
    }
    console.warn('No email provider set: add BREVO_API_KEY, RESEND_API_KEY or ZEPTOMAIL_TOKEN.');
  } catch (e) { console.error('email error', e); }
  return false;
}

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function layout(title: string, intro: string, o: Order, extra = '') {
  const a = address(o);
  const rows = (o.order_items ?? []).map(i =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #f3c6d8">${esc(i.product_name ?? 'Item')} ${i.length ? '· ' + esc(i.length) : ''} ${i.color ? '· ' + esc(i.color) : ''} × ${i.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #f3c6d8;text-align:right">${naira(i.unit_price * i.quantity)}</td></tr>`).join('');
  return `<!doctype html><html><body style="margin:0;background:#0a0a0a;font-family:Helvetica,Arial,sans-serif;color:#0a0a0a">
  <div style="max-width:560px;margin:0 auto;padding:28px 16px">
    <p style="font-family:Georgia,serif;font-style:italic;font-size:30px;color:#ff3385;margin:0 0 18px">Baddie Strands</p>
    <div style="background:#ffd3e4;border-radius:18px;padding:26px">
      <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:26px;margin:0 0 8px">${esc(title)}</h1>
      <p style="margin:0 0 18px;line-height:1.5">${intro}</p>
      ${extra}
      <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:18px 0 6px">Order ${shortId(o.id)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
        ${o.delivery_fee ? `<tr><td style="padding:8px 0">Delivery — ${esc(o.delivery_state)}</td><td style="padding:8px 0;text-align:right">${naira(o.delivery_fee)}</td></tr>` : ''}
        <tr><td style="padding:12px 0;font-family:Georgia,serif;font-size:18px">Total</td><td style="padding:12px 0;text-align:right;font-family:Georgia,serif;font-size:18px;color:#d6006a">${naira(o.total_amount)}</td></tr>
      </table>
      <p style="font-size:13px;line-height:1.5;margin:14px 0 0"><b>Delivering to:</b> ${esc(a.name)}, ${esc(a.address)}, ${esc(a.city)}, ${esc(a.state ?? o.delivery_state)} · ${esc(a.phone)}</p>
    </div>
    <p style="color:#ffd3e4;font-size:13px;line-height:1.6;margin:18px 4px">Questions? Reply to this email or chat with us on <a style="color:#ff3385" href="https://wa.me/${WHATSAPP}">WhatsApp</a>.<br><a style="color:#ff3385" href="${SHOP}">${SHOP.replace(/^https?:\/\//, '')}</a></p>
  </div></body></html>`;
}

const bankBox = (o: Order) => {
  const acct = env('BANK_ACCOUNT'), name = env('BANK_ACCOUNT_NAME', 'Baddie Strands'), bank = env('BANK_NAME', 'Access Bank');
  return `<div style="background:#0a0a0a;color:#ffd3e4;border-radius:14px;padding:16px 18px;margin-bottom:6px;font-size:14px;line-height:1.6">
    Please transfer <b style="color:#ff3385">${naira(o.total_amount)}</b><br>
    ${acct ? `${esc(bank)} · <b>${esc(acct)}</b> · ${esc(name)}` : 'We’ll send our bank details on WhatsApp shortly.'}<br>
    Use <b>${shortId(o.id)}</b> as the reference, then send your receipt on WhatsApp.</div>`;
};

/** Sends the right emails for an order event. */
export async function orderEmails(o: Order, event: 'placed' | 'paid' | 'shipped' | 'delivered') {
  const a = address(o), first = (a.name ?? '').split(' ')[0] || 'queen';
  const to = a.email ?? '';
  const adminView = env('ADMIN_URL') ? `<p style="margin:0 0 14px"><a href="${env('ADMIN_URL')}#orders" style="color:#d6006a">Open the dashboard →</a></p>` : '';
  if (event === 'placed') {
    await sendEmail(to, `Your Baddie Strands order ${shortId(o.id)}`, layout(`Thank you, ${first}!`, 'We’ve saved your order. It’s confirmed as soon as your transfer arrives.', o, bankBox(o)));
    await sendEmail(ADMIN_EMAIL, `New order ${shortId(o.id)} — ${naira(o.total_amount)} by bank transfer`, layout('New order (bank transfer)', `${esc(a.name)} placed an order. Check your bank app for ${naira(o.total_amount)}, then mark it paid in the dashboard.`, o, adminView));
  }
  if (event === 'paid') {
    await sendEmail(to, `Payment confirmed — order ${shortId(o.id)}`, layout(`It’s yours, ${first}.`, 'Payment confirmed. We’re grooming and boxing your order now and will message you when it’s on its way.', o));
    await sendEmail(ADMIN_EMAIL, `Paid order ${shortId(o.id)} — ${naira(o.total_amount)}`, layout('Paid order to send', `${esc(a.name)}’s payment is confirmed. Time to pack it.`, o, adminView));
  }
  if (event === 'shipped') await sendEmail(to, `Your order is on its way — ${shortId(o.id)}`, layout('On its way', `Good news, ${esc(first)} — your order is with the rider. We’ll keep you posted on WhatsApp.`, o));
  if (event === 'delivered') await sendEmail(to, `Delivered — ${shortId(o.id)}`, layout('Delivered', `Your order has arrived. Enjoy it, ${esc(first)} — and tag us when you slay.`, o));
}
