# Baddie Strands

One repo, three parts:

| Folder | What it is | Where it runs |
| --- | --- | --- |
| `site/` | The shop (Home, Shop, Hair care, Delivery, Contact) | Vercel project `baddie-strands`, Root Directory `site` |
| `admin/` | Shop dashboard: orders, products, hair care, subscribers | Vercel project `baddie-strands-admin`, Root Directory `admin` |
| `supabase/` | Database setup (`schema.sql`) + Edge Functions (Paystack + emails) | Supabase, deployed with the Supabase CLI |

Both sites are plain static files, so no build command is needed. Pushing to GitHub redeploys both Vercel projects. The `supabase/` folder is ignored by Vercel.

## First-time setup

1. **Supabase:** run `supabase/schema.sql` in SQL Editor. Put the Project URL + anon key in `site/js/config.js` and `admin/config.js`.
2. **Vercel:** import this repo twice: once with Root Directory `site`, once with `admin`. Framework preset: Other.
3. **Edge Functions** (from this repo's root):

```bash
npm install -g supabase
supabase login
supabase init                       # keeps the existing supabase/functions and schema.sql
supabase link --project-ref <your-project-ref>
supabase functions deploy paystack-verify
supabase functions deploy order-notify
supabase functions deploy paystack-webhook --no-verify-jwt
```

4. **Secrets** (one email provider is enough):

```bash
supabase secrets set \
  PAYSTACK_SECRET_KEY=sk_test_xxx \
  BREVO_API_KEY=xkeysib-xxx \
  EMAIL_FROM="Baddie Strands <orders@yourdomain.com>" \
  ADMIN_EMAIL=baddiestrands@gmail.com \
  SHOP_URL=https://baddie-strands.vercel.app \
  ADMIN_URL=https://baddie-strands-admin.vercel.app \
  BANK_NAME="Access Bank" BANK_ACCOUNT=0123456789 BANK_ACCOUNT_NAME="Baddie Strands" \
  WHATSAPP_NUMBER=2347033247980
```

## Email providers

Set the key for **one** of these. If more than one is set, add `EMAIL_PROVIDER=brevo|resend|zeptomail` to choose.

| Provider | Secret | Free allowance | Notes |
| --- | --- | --- | --- |
| Brevo | `BREVO_API_KEY` | 300 emails/day | Also sends newsletters to subscribers |
| Resend | `RESEND_API_KEY` | 100 emails/day | Simplest developer setup |
| Zoho ZeptoMail | `ZEPTOMAIL_TOKEN` (+ `ZEPTOMAIL_HOST=api.zeptomail.eu` for EU accounts) | First 10,000 emails free | Then pay-as-you-go, transactional only |

The same provider's **SMTP** details go into Supabase → Authentication → Emails → SMTP Settings for sign-in codes. ZeptoMail SMTP: host `smtp.zeptomail.com`, port 587, username `emailapikey`, password = your send-mail token.

Paystack webhook URL: `https://<your-project-ref>.supabase.co/functions/v1/paystack-webhook`

The full walkthrough (Paystack account, email templates, test checklist) is in the **Go-live guide**.
