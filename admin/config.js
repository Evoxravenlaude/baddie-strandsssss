// ============================================================
// BADDIE STRANDS — admin connection settings
//
// Paste the same two Supabase values as in the shop's config.js
// (Supabase: Project Settings, API). Until both are filled in,
// the dashboard runs in demo mode with sample data.
// ============================================================
window.BS_CONFIG = {
  supabaseUrl: '',   // looks like https://abcdefgh.supabase.co
  supabaseKey: '',   // the "anon" "public" key
  shopUrl: 'https://baddie-strands.vercel.app',  // your shop's address, for "See it on the shop" links
  isAdmin: true      // keeps you signed in on this device; leave as true
};
