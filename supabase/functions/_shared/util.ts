// Shared helpers for the Baddie Strands Edge Functions.
import { createClient, type User } from 'npm:@supabase/supabase-js@2';

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

export const env = (k: string, fallback = '') => Deno.env.get(k) ?? fallback;

/** Service-role client: bypasses row-level security. Server-side only. */
export const db = () =>
  createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });

export const ADMIN_EMAIL = env('ADMIN_EMAIL', 'baddiestrands@gmail.com').toLowerCase();

/** The signed-in user who called the function, or null. */
export async function caller(req: Request): Promise<User | null> {
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!jwt) return null;
  const { data } = await db().auth.getUser(jwt);
  return data.user ?? null;
}
export const isAdmin = (u: User | null) => (u?.email ?? '').toLowerCase() === ADMIN_EMAIL;

export const naira = (n: unknown) =>
  '₦' + Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const shortId = (id: string) => '#' + String(id).split('-')[0].toUpperCase();

export type Order = {
  id: string; user_id: string | null; status: string; total_amount: number; delivery_fee: number | null;
  payment_method: string | null; payment_ref: string | null; delivery_state: string | null;
  delivery_address: Record<string, string> | string | null; created_at: string;
  order_items: { product_name: string | null; product_id: number | null; length: string | null; color: string | null; quantity: number; unit_price: number }[];
};

export async function getOrder(id: string): Promise<Order | null> {
  const { data } = await db().from('orders').select('*, order_items(*)').eq('id', id).maybeSingle();
  return (data as Order) ?? null;
}

export function address(o: Order): Record<string, string> {
  const a = o.delivery_address;
  if (typeof a === 'string') { try { return JSON.parse(a); } catch { return {}; } }
  return a ?? {};
}
