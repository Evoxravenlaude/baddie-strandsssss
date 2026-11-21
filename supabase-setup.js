// ============================================
// BADDIE STRANDS — Supabase Client Setup
// Referenced by both index.html and admin.html
// Replace the two values below before deploying.
// Until they are replaced, the shop runs in DEMO MODE:
// sign-in is skipped and orders/sign-ups are kept in the
// visitor's own browser only.
// ============================================

const SUPABASE_URL  = 'YOUR_SUPABASE_PROJECT_URL';   // e.g. https://xyzxyz.supabase.co
const SUPABASE_ANON = 'YOUR_SUPABASE_ANON_KEY';       // from Project Settings → API

window.BS_SUPABASE_READY = false;
try {
  if (window.supabase && /^https:\/\//.test(SUPABASE_URL) && !SUPABASE_ANON.startsWith('YOUR_')) {
    const { createClient } = window.supabase;
    window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
    window.BS_SUPABASE_READY = true;
  }
} catch (e) {
  console.warn('[BS] Supabase not configured — running in demo mode.', e);
}
