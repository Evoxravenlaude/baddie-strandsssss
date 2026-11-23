// Sends order emails.
//  - The shop calls { order_id, event: 'placed' } after a bank-transfer order.
//  - The admin dashboard calls 'paid' | 'shipped' | 'delivered' when the stage changes.
import { cors, json, caller, isAdmin, getOrder } from '../_shared/util.ts';
import { orderEmails } from '../_shared/email.ts';

const EVENTS = ['placed', 'paid', 'shipped', 'delivered'] as const;
type Ev = typeof EVENTS[number];

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  try {
    const { order_id, event } = await req.json();
    if (!order_id || !EVENTS.includes(event)) return json({ error: 'order_id and a valid event are required' }, 400);
    const user = await caller(req);
    const o = await getOrder(order_id);
    if (!o) return json({ error: 'not found' }, 404);
    const owner = !!user && user.id === o.user_id;
    // customers may only trigger the "order placed" email for their own new transfer order
    const allowed = isAdmin(user) || (owner && event === 'placed' && o.status === 'Pending');
    if (!allowed) return json({ error: 'not allowed' }, 403);
    await orderEmails(o, event as Ev);
    return json({ sent: true });
  } catch (e) {
    console.error(e);
    return json({ sent: false, error: 'server error' }, 500);
  }
});
