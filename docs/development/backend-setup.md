# Development backend setup

Supabase Free was selected for the first real backend increment. Keep this in a
Free organization; do not enable paid upgrades. Supabase's current documentation
says Free organizations support two active free projects, subject to quotas.
Check the dashboard's plan and usage limits before changing settings.

## Scope

- Email/password development accounts, confirmation, recovery/reset, and sign-out.
- Private owner-only profile and listing drafts.
- No public publishing, account roles, paid entitlements, payments, messaging,
  real discovery data, uploads, or completed eligibility verification.
- Private experience catalogue snapshots require the additional migration below.

Use test accounts/data until final eligibility, Privacy/Terms, support, moderation,
and launch controls are established. The frontend flag is a deployment switch,
not an authorization boundary; database policies enforce ownership.

## Apply the migration

In the new Supabase project's SQL Editor, run the complete file:

[supabase/migrations/202611080001_private_drafts.sql](../../supabase/migrations/202611080001_private_drafts.sql)

Run this initial migration once on the new project. It uses a transaction, creates
two private tables, enables/forces RLS, revokes anonymous grants, and adds separate
owner-only select/insert/update/delete policies. It does not modify existing auth
users or publish anything. Do not run it repeatedly over an existing schema.

The code agent has the public project URL/key but no admin or database credential;
those cannot apply migrations. Never share the database password, a secret key,
or service_role key in chat or browser environment variables.

## Add private catalogue storage

After the initial migration, run this separate migration once when setting up
catalogue persistence:

[202611090001_experience_drafts.sql](../../supabase/migrations/202611090001_experience_drafts.sql)

It creates owner-only `experience_catalogue_drafts`, with a validated JSON array
snapshot, private grants/RLS, and server-maintained update timestamps. The 200 KB
snapshot ceiling is an operational payload limit, not a commercial allowance.
Only added/updated catalogue items are saved; the unfinished item composer is not.
Amounts retain their exact minor-unit draft format without selecting currency or
creating live prices. Nothing is published. Missing migration errors allow retry;
existing profile/listing drafts remain separate. This migration has been tested
locally but has not been applied to the hosted project by the agent.

## Authentication settings

Keep email confirmation enabled. In Authentication → URL Configuration:

- Site URL: the existing Netlify HTTPS site origin.
- Redirect allowlist: that same site's `/?page=auth-callback` and
  `/?page=auth-callback&type=recovery` routes. If the dashboard requires a pattern,
  limit it to the exact site origin; do not allow arbitrary external domains.
- For local development only, add the matching localhost callback URLs for port 5173.

The app constructs redirects from its own origin; it does not accept a return URL
from user input. Auth links use the SDK's PKCE flow. Browser-managed verification
state must be available in the browser opening the link. SDK 2.119.0 appends an
`sb_flow_id`; the callback captures it before removing it from the URL and passes
it explicitly to the supported exchange method. Keep redirect patterns scoped to
the exact Netlify origin, including callback query variations. Callback codes/errors are
removed from the address bar before exchange; Netlify headers disable referrers.

Supabase's default email sender has restrictions and rate limits. Use the project
owner/team test email first; delivery to other recipients may require a separately
configured SMTP service. Do not disable confirmation to disguise a delivery problem.
No paid mail provider is selected or required by this code change.

## Browser configuration

Copy `.env.example` to ignored `.env.local` locally. In Netlify, add these as build
variables, then deploy the new commit after database/settings validation:

| Variable | Value |
|---|---|
| VITE_SUPABASE_URL | HTTPS Project URL from Supabase Connect/Data API |
| VITE_SUPABASE_PUBLISHABLE_KEY | New `sb_publishable_...` browser key |
| VITE_ENABLE_BACKEND | `true` for this development integration; default `false` |

These are browser-visible values. The build rejects secret/service_role/legacy JWT
keys in this slot and restricts the configured Project URL to HTTPS Supabase project
hosts. No admin key is needed in the app. Changing Vite variables needs a new build.

The SDK uses its supported default browser token storage and refresh mechanism.
Passwords are not persisted or logged by application code. Browser tokens remain
sensitive to same-origin script compromise; headers disallow external scripts,
framing, objects, and external form submission. This is not a complete security
review. Sign-out clears owner draft state; stale account-load results are discarded.

## Validation

- `npm run build`
- `npm test` for frontend regressions and PostgreSQL policy checks.
- `npm run test:backend-ui` for mocked-provider browser integration tests.

Database tests run the actual migration in PGlite (PostgreSQL) using a test auth.uid
function. They exercise real grants/RLS for owner, another account, anonymous, and
invalid/spoofed writes. They do not validate hosted Supabase configuration, JWT
verification, email delivery, or live account lifecycle. Mocked UI tests do not
replace live authentication/storage checks.

For live validation, use two test accounts: save/reload each account's drafts;
verify cross-account read/update/delete denial, sign-out state clearing, confirmation,
recovery/reset, and anonymous denial. Do not claim the integration ready before
these checks run against the configured project.

## Cloud networking

The current cloud policy blocks the project domain. Add only the exact project
hostname to the environment's allowed domains to enable live validation. Public
Netlify visitors use their own network; cloud egress settings do not configure
Netlify variables or Supabase redirect settings. Draft configuration tools have
returned INVALID_ARGUMENT, so their persistence must not be assumed.

## Sources

- [Supabase billing](https://supabase.com/docs/guides/platform/billing-on-supabase)
- [Row level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Password authentication](https://supabase.com/docs/guides/auth/passwords)
- [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [SMTP limitations](https://supabase.com/docs/guides/auth/auth-smtp)

Official billing/RLS source was also inspected in the supabase/supabase GitHub docs
because this cloud environment blocks the supabase.com documentation host.
