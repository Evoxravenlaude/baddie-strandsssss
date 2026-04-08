// ============================================
// BADDIE STRANDS — Supabase Client Setup
// Referenced by both index.html and admin.html
// Replace the two values below before deploying
// ============================================

const SUPABASE_URL  = 'YOUR_SUPABASE_PROJECT_URL';   // e.g. https://xyzxyz.supabase.co
const SUPABASE_ANON = 'YOUR_SUPABASE_ANON_KEY';       // from Project Settings → API

const { createClient } = supabase;
window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
