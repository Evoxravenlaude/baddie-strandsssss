// Confirms a Paystack payment with Paystack's own servers before an order
// is marked paid. Used by both paystack-verify (instant) and the webhook (backup).
import { db, env, getOrder } from './util.ts';
import { orderEmails } from './email.ts';

export async function confirmPayment(reference: string, orderIdHint?: string): Promise<{ paid: boolean; reason?: string }> {
  const secret = env('PAYSTACK_SECRET_KEY');
  if (!secret) return { paid: false, reason: 'PAYSTACK_SECRET_KEY not set' };

  const r = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!r.ok) return { paid: false, reason: `paystack ${r.status}` };
  const tx = (await r.json())?.data;
  if (tx?.status !== 'success') return { paid: false, reason: `transaction ${tx?.status}` };

  const orderId = String(tx?.metadata?.order_id ?? orderIdHint ?? '');
  if (!orderId || (orderIdHint && orderIdHint !== orderId)) return { paid: false, reason: 'order mismatch' };
  const o = await getOrder(orderId);
  if (!o) return { paid: false, reason: 'order not found' };

  // already confirmed (e.g. webhook arrived first). A 'Cancelled' order can
  // still be paid: unpaid card checkouts are auto-cancelled after 2 hours to
  // free their stock, and a late payment brings the order back.
  if (o.status !== 'Pending' && o.status !== 'Cancelled') return { paid: ['Processing', 'Shipped', 'Delivered'].includes(o.status) };

  const expected = Math.round(Number(o.total_amount) * 100);
  if (tx.currency !== 'NGN' || Number(tx.amount) < expected) {
    console.error('amount mismatch', { orderId, expected, got: tx.amount, currency: tx.currency });
    return { paid: false, reason: 'amount mismatch' };
  }

  const { data, error } = await db().from('orders')
    .update({ status: 'Processing', payment_ref: reference, payment_method: 'Paystack Card', updated_at: new Date().toISOString() })
    .eq('id', orderId).in('status', ['Pending', 'Cancelled']).select('id');
  if (error) { console.error(error); return { paid: false, reason: 'update failed' }; }
  if (data?.length) {
    const fresh = await getOrder(orderId);
    if (fresh) await orderEmails(fresh, 'paid');
  }
  return { paid: true };
}
