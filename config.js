// ============================================================
// BADDIE STRANDS — Store settings
// One place for contact details, payment keys and bank details.
// Change a value here and it updates everywhere on the site.
// ============================================================

const BS_CONFIG = {
  storeName: 'Baddie Strands',
  motto: 'Your Hair, Your Crown',
  founded: 2020,
  city: 'Abuja',

  // ── Contact ────────────────────────────────────────────────
  whatsapp: '2347033247980',              // digits only, no + or spaces
  whatsappDisplay: '+234 703 324 7980',
  email: 'baddiestrands@gmail.com',       // shown to customers
  adminEmail: 'baddiestrands@gmail.com',  // receives order notifications
  instagram: 'the_baddie_strands',        // handle without the @

  // ── Business hours (West Africa Time) ──────────────────────
  // days: 0 = Sunday … 6 = Saturday. Hours are 24-hour clock.
  timeZone: 'Africa/Lagos',
  hours: [
    { label: 'Monday – Saturday', days: [1, 2, 3, 4, 5, 6], open: 9, close: 21 },
    { label: 'Sunday', days: [0], open: 12, close: 18 }
  ],

  // ── Card payments (Paystack) ───────────────────────────────
  // paystack.com → Settings → API Keys & Webhooks → Public key
  paystackPublicKey: 'pk_live_YOUR_PAYSTACK_PUBLIC_KEY',

  // ── Bank transfer ──────────────────────────────────────────
  // Bank transfer stays switched off at checkout until the
  // account number below is replaced with a real one.
  bank: {
    name: 'Access Bank',
    accountName: 'Baddie Strands',
    accountNumber: '0000000000'
  },

  // ── Email (EmailJS) ────────────────────────────────────────
  // emailjs.com → create two templates:
  //   1. Sign-in code → {{to_email}}, {{otp_code}}, {{brand_name}}
  //   2. New order    → {{to_email}}, {{order_id}}, {{customer_name}},
  //      {{customer_email}}, {{customer_phone}}, {{delivery_address}},
  //      {{delivery_notes}}, {{items_list}}, {{order_subtotal}},
  //      {{delivery_fee}}, {{order_total}}, {{payment_method}},
  //      {{payment_ref}}, {{order_date}}
  emailjsPublicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
  emailjsService: 'YOUR_EMAILJS_SERVICE_ID',
  emailjsOtpTpl: 'template_otp_verify',
  emailjsOrderTpl: 'template_order_notify'
};

// True once a placeholder value has been replaced with a real one.
BS_CONFIG.ready = {
  paystack: () => !/YOUR_/.test(BS_CONFIG.paystackPublicKey),
  emailjs: () => !/YOUR_/.test(BS_CONFIG.emailjsPublicKey) && !/YOUR_/.test(BS_CONFIG.emailjsService),
  bank: () => !/^0+$/.test(String(BS_CONFIG.bank.accountNumber || '0'))
};

BS_CONFIG.waLink = (text) =>
  'https://wa.me/' + BS_CONFIG.whatsapp + (text ? '?text=' + encodeURIComponent(text) : '');

if (typeof module !== 'undefined') module.exports = { BS_CONFIG };
