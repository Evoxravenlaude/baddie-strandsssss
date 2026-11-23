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
3. **Edge Functions, secrets and schema deploy automatically** with GitHub Actions (`.github/workflows/supabase.yml`) on every push to `main` that touches `supabase/`. Add these under GitHub → Settings → Secrets and variables → Actions:

| Secret | Value |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | supabase.com → Account → Access Tokens |
| `SUPABASE_PROJECT_REF` | first part of the Supabase URL |
| `SUPABASE_DB_URL` | Project Settings → Database → Connection string → Session pooler URI (with password) |
| `PAYSTACK_SECRET_KEY` | `sk_test_…` now, `sk_live_…` later |
| `BREVO_API_KEY` | Brevo → SMTP & API → API keys |
| `EMAIL_FROM` | `Baddie Strands <your-verified-sender>` |
| `BANK_ACCOUNT` | real Access Bank number (same as `site/js/config.js`) |

Optional overrides: `ADMIN_EMAIL`, `SHOP_URL`, `ADMIN_URL`, `BANK_NAME`, `BANK_ACCOUNT_NAME`, `WHATSAPP_NUMBER`. To run it by hand (or apply the schema on purpose): Actions → Supabase deploy → Run workflow.

Manual alternative from the repo root (no `init` needed, `supabase/config.toml` is included):

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy --use-api
npx supabase secrets set --env-file ./secrets.env    # never commit this file
```

## Email providers

This shop uses **Brevo**. The code also supports these; set the key for **one** of them. If more than one is set, add `EMAIL_PROVIDER=brevo|resend|zeptomail` to choose.

| Provider | Secret | Free allowance | Notes |
| --- | --- | --- | --- |
| Brevo | `BREVO_API_KEY` | 300 emails/day | Also sends newsletters to subscribers |
| Resend | `RESEND_API_KEY` | 100 emails/day | Simplest developer setup |
| Zoho ZeptoMail | `ZEPTOMAIL_TOKEN` (+ `ZEPTOMAIL_HOST=api.zeptomail.eu` for EU accounts) | First 10,000 emails free | Then pay-as-you-go, transactional only |

The same provider's **SMTP** details go into Supabase → Authentication → Emails → SMTP Settings for sign-in codes. ZeptoMail SMTP: host `smtp.zeptomail.com`, port 587, username `emailapikey`, password = your send-mail token.

Paystack webhook URL: `https://<your-project-ref>.supabase.co/functions/v1/paystack-webhook`

The full walkthrough (Paystack account, email templates, test checklist) is in the **Go-live guide**.
