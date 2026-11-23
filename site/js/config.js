// ============================================================
// BADDIE STRANDS — shop settings
// Fill these in before going live. Use the SAME Supabase values
// in the admin dashboard's config.js.
// Until the Supabase values are filled in, the shop runs in
// DEMO MODE: products come from data.js, no sign-in is needed,
// and orders are kept only in the shopper's own browser.
// ============================================================

const BS_CONFIG = {
  supabaseUrl:       'YOUR_SUPABASE_PROJECT_URL',   // e.g. https://abcd1234.supabase.co
  supabaseAnonKey:   'YOUR_SUPABASE_ANON_KEY',      // Project Settings → API → anon public

  paystackPublicKey: 'pk_live_YOUR_PAYSTACK_PUBLIC_KEY',
  accessBankAcct:    '0000000000',                  // real account number
  accessBankName:    'Baddie Strands',

  whatsappNum:       '2347033247980',               // digits only
  email:             'baddiestrands@gmail.com',
  instagram:         'the_baddie_strands',
};
