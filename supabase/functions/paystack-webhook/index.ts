// Paystack calls this after every successful charge — a backup in case the
// customer closes the page before the shop confirms. Deploy with --no-verify-jwt.
// Paystack dashboard → Settings → API Keys & Webhooks → Webhook URL:
//   https://<project-ref>.supabase.co/functions/v1/paystack-webhook
import { env } from '../_shared/util.ts';
import { confirmPayment } from '../_shared/paystack.ts';

async function signatureOk(raw: string, sig: string | null) {
  if (!sig) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env('PAYSTACK_SECRET_KEY')), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw)));
  const hex = [...mac].map(b => b.toString(16).padStart(2, '0')).join('');
  return hex === sig;
}

Deno.serve(async req => {
  if (req.method !== 'POST') return new Response('ok');
  const raw = await req.text();
  if (!(await signatureOk(raw, req.headers.get('x-paystack-signature')))) return new Response('bad signature', { status: 401 });
  try {
    const evt = JSON.parse(raw);
    if (evt?.event === 'charge.success' && evt?.data?.reference) {
      const r = await confirmPayment(String(evt.data.reference), evt.data.metadata?.order_id ? String(evt.data.metadata.order_id) : undefined);
      console.log('webhook', evt.data.reference, r);
    }
  } catch (e) { console.error(e); }
  return new Response('ok');   // always 200 so Paystack stops retrying
});
