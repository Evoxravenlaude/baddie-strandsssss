// ============================================================
// BADDIE STRANDS — shop settings
// Fill these in before going live. Use the SAME Supabase values
// in the admin dashboard's config.js.
// Until the Supabase values are filled in, the shop runs in
// DEMO MODE: products come from data.js, no sign-in is needed,
// and orders are kept only in the shopper's own browser.
// ============================================================

const BS_CONFIG = {
  supabaseUrl:       'https://lpjdgmxverblkqwtvgie.supabase.co',   // e.g. https://abcd1234.supabase.co
  supabaseAnonKey:   'sb_publishable_0szYg6a0WMOVGQCSPv2r2g_q7NtPbOH',      // Project Settings → API Keys → Publishable key (sb_publishable_…)

  paystackPublicKey: 'pk_test_1d88a00e562ac39d2e9a9a7498bae9b7e4510016',
  accessBankAcct:    '1410406048',                  // real account number
  accessBankName:    'Lukman Oluwatosin Hikmah',

  whatsappNum:       '2347033247980',               // digits only
  email:             'baddiestrands@gmail.com',
  instagram:         'the_baddie_strands',
  googleSignIn: false,
};
