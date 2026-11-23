// Called by the shop right after a card payment.
// Body: { order_id, reference }. Caller must be the customer who owns the order.
import { cors, json, caller, isAdmin, getOrder } from '../_shared/util.ts';
import { confirmPayment } from '../_shared/paystack.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  try {
    const { order_id, reference } = await req.json();
    if (!order_id || !reference) return json({ error: 'order_id and reference are required' }, 400);
    const user = await caller(req);
    const o = await getOrder(order_id);
    if (!o) return json({ error: 'not found' }, 404);
    if (!user || (user.id !== o.user_id && !isAdmin(user))) return json({ error: 'not allowed' }, 403);
    const result = await confirmPayment(String(reference), String(order_id));
    return json(result);
  } catch (e) {
    console.error(e);
    return json({ paid: false, error: 'server error' }, 500);
  }
});
