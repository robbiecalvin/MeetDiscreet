# MeetDiscreet — Environment Specification

## 1. Purpose

This document defines the development, browser, backend, testing,
and deployment environment for MeetDiscreet.

It distinguishes approved technical direction from decisions that
have not yet been made.

Do not assume a service, runtime, command, or integration exists
because it appears in a planning document.

Follow the repository-root AGENTS.md and the approved application
architecture when implementing changes.

## 2. Current Technical Direction

MeetDiscreet uses:

- HTML for page structure.
- CSS for presentation and responsive layouts.
- JavaScript ES modules for browser functionality.
- Git for version control.
- GitHub for source storage.
- VS Code as Robbie’s primary editor.

Production functionality requires a separate backend for accounts,
permissions, subscriptions, bookings, private media, and communication.

The following remain unselected until recorded as approved decisions:


- Backend provider and runtime.
- Database provider.
- Authentication provider.
- Private media storage.
- Payment and payout provider.
- Realtime messaging infrastructure.
- Audio/video calling infrastructure.
- Production hosting provider.
- CI and deployment configuration.

Do not describe these services as configured or operational before
they have been implemented and verified.

## Verified Frontend Workflow

Robbie’s local platform is macOS. The cloud validation machine is Linux.
Use Node.js 24.22.1 (`.nvmrc`) and npm with the committed package-lock.json.
Vite 8.3.6 supplies the development server and build; Playwright 1.65.0 supplies
meaningful browser checks. No frontend framework or backend service is installed.

From the repository root:

```sh
npm ci
npm run dev
npm run build
npx playwright install chromium
npm test
```

On macOS, use `nvm install` and `nvm use` if nvm is already installed, or install
the pinned Node release with an equivalent trusted method. The browser-install
command prepares Chromium on a fresh Mac. Cloud tests reuse /usr/bin/chromium
when present; tests use downloaded Playwright Chromium elsewhere.

`npm run preview` serves the generated dist directory after a build.
The app uses synthetic fixtures and locally stored generated portraits; no
credentials, production services, or geolocation permission are required.
Agrandir is preferred but licensed webfont files are absent; system fonts are
a temporary fallback. Do not source font files from an unlicensed mirror.

In cloud commands, use `npm --cache /workspace/.npm-cache ci` if the inherited
user cache is not writable. This is an environment override, not a project
requirement. Live server processes must be restarted in new cloud tasks; use
the existing checkout and do not create a worktree unless explicitly requested.

## 3. Languages and Runtimes

### Browser

Use:

- Semantic HTML.
- Modern CSS.
- Standards-based JavaScript.
- JavaScript ES modules.

Prefer browser APIs supported by the agreed browser targets.

Do not introduce experimental features without a clear justification,
compatibility assessment, and suitable fallback.

### Development Tooling

Node.js may be used for:

- Local development tooling.
- Asset processing.
- Builds.
- Formatting and linting.
- Automated tests.

Select and pin a supported Node.js LTS release compatible with the
chosen tools when the development environment is established.

Record the actual version in the repository’s runtime configuration
and package metadata where appropriate.

Do not retain Node 18 merely because the framework previously named it.

### Backend

Backend languages and runtimes depend on the approved provider.

JavaScript, SQL, and provider-specific configuration may be required.
Do not assume Node.js APIs are available in every JavaScript runtime.

Introduce TypeScript only when justified by the selected tooling,
provider requirements, or an approved project decision.

Python and PHP are not required by the current frontend direction.
Do not introduce them without a concrete need.

## 4. Local Development

Robbie edits the project in VS Code.

The local workflow must support:

1. Opening the repository.
2. Installing declared dependencies when applicable.
3. Starting a documented local HTTP server.
4. Previewing pages in a browser.
5. Running relevant checks.
6. Committing and pushing changes to GitHub.

Do not depend on opening HTML through file:// URLs.

Use a local HTTP server so modules, routes, requests, and browser
security behaviour can be tested realistically.

Choose and document the actual development-server command during setup.

Do not invent npm scripts before creating and verifying them.

## 5. Operating System Compatibility

Do not assume Robbie’s computer uses a Linux filesystem or shell.

Keep normal frontend development portable across the confirmed
development operating systems.

A Linux-based CI environment may be selected independently.

Requirements:

- UTF-8 source files.
- Consistent filename casing.
- Relative or explicitly configured project paths.
- No user-specific absolute paths in application code.
- No dependency on an individual developer’s home directory.
- No reliance on globally installed packages.

Prefer npm scripts or portable JavaScript for shared automation.

If a script requires Bash or another platform-specific tool,
document that requirement and its purpose.

## 6. Package Management

Use npm when a Node-based toolchain is selected, unless an existing
approved project configuration specifies otherwise.

For an npm-managed project:

- Declare dependencies in package.json.
- Commit package-lock.json.
- Use npm ci for clean CI installations.
- Keep tooling dependencies local to the repository.
- Record the required runtime version.

Do not mix package managers or maintain competing lockfiles.

Do not introduce pnpm, yarn, pip, or composer without a project need
and an explicit recorded decision.

A simple static phase does not require a package manager solely
for the sake of having one.

## 7. Dependency Policy

Prefer native HTML, CSS, JavaScript, and established platform features
where they adequately satisfy the requirement.

Add dependencies when they materially improve:

- Correctness.
- Security.
- Accessibility.
- Interoperability.
- Testing.
- Maintainability.
- Necessary application functionality.

For a new dependency:

1. Explain its purpose.
2. Check compatibility with the selected environment.
3. Consider maintenance and licensing.
4. Avoid duplicating existing functionality.
5. Record any significant operational implications.

Do not build custom cryptography, payment processing, or authentication
merely to avoid dependencies.

Do not introduce a large frontend framework without agreement.

## 8. Frontend Architecture and Assets

Prefer an understandable multipage frontend with reusable components
and JavaScript modules.

A lightweight build process may be introduced when it provides clear
benefits for shared templates, asset handling, or deployment.

Requirements:

- Shared design tokens.
- Reusable navigation and footer.
- Consistent component behaviour.
- Explicit page entry points.
- Appropriate loading, empty, and error states.
- Responsive images and media.
- Accessible forms and controls.

Use base-path-aware asset and navigation URLs where necessary.

Do not assume the application will always run at a domain root.

Keep public frontend assets separate from user-uploaded media.

Public build output must never contain restricted profile information,
private messages, protected media originals, or secrets.

## 9. Backend Environment

Production must provide trusted server-side functionality for:

- Authentication and session validation.
- Account ownership and role permissions.
- Subscription entitlements.
- Companion publishing status.
- Listing and boost allowances.
- Booking requests and availability.
- Authoritative price calculations.
- Payment verification.
- Revenue allocation.
- Private media authorization.
- Messaging and call authorization.
- Moderation and audit events.

Do not treat browser state as authoritative.

A static page, hidden button, localStorage flag, or client-side route
guard cannot enforce production permissions.

Document the selected backend’s runtime capabilities and limitations
before using provider-specific APIs.

## 10. Database and Storage

Select database and storage services through the architecture process.

When implemented:

- Version database migrations.
- Define ownership and access policies.
- Separate public and restricted data.
- Protect financial records from client modification.
- Define backup and recovery procedures.
- Define retention and deletion behaviour.
- Use separate development and production resources.

Store protected user media in private storage.

Deliver restricted media only after authorization using an appropriate
scoped access mechanism.

Do not upload private media to GitHub or include it in static builds.

Use separate safe previews when displaying locked media.

## 11. Environment Separation

Maintain distinct environments:

### Local Development

For implementation and synthetic test data.

### Preview or Staging

For integration checks and review.

Use test accounts and payment-provider test mode.
Restrict access appropriately when the environment contains
nonpublic information.

### Production

For real users, approved live integrations, and operational monitoring.

Each environment must have explicitly configured:

- Frontend origin.
- Backend endpoint.
- Authentication redirects.
- Media storage.
- Payment mode and credentials.
- Webhook endpoints.
- Notification configuration where applicable.

Do not connect an unrestricted preview to production data.

Do not copy real messages, private media, or personal account data into
development fixtures.

## 12. Configuration and Secrets

Keep nonsecret configuration and configuration templates in version control.

Keep secret values outside version control.

If dotenv-style files are used:

- Commit a documented example file.
- Exclude local secret-bearing files from Git.
- Document required variables.
- Separate browser-public values from server-only secrets.

Environment-variable names do not make browser values private.
Anything bundled into frontend JavaScript can be inspected.

Never expose:

- Service-role credentials.
- Payment secret keys.
- Webhook signing secrets.
- Private signing keys.
- Administrative tokens.
- Database credentials.

Public client identifiers may be exposed only when intended for browser
use and backed by correctly enforced permissions.

Do not assume repository-root config.toml controls the hosted Codex
environment or application runtime.

Verify supported configuration locations and settings.

## 13. Authentication and Session Configuration

Configure authentication against the actual environment origins.

Verify:

- Sign-up and sign-in redirects.
- Email confirmation links.
- Password reset links.
- Session expiry and refresh.
- Logout behaviour.
- Role and ownership checks.
- Local and deployed callback URLs.

Use HTTPS in deployed environments.

Apply cookie, token, CSRF, and CORS controls appropriate to the chosen
authentication architecture.

Do not store secrets or session tokens in logs.

The entrance age gate is a frontend eligibility prompt.
It must not grant backend permissions or replace account-level checks.

## 14. Payments and External Services

Use provider test mode during development and integration testing.

Before live use, confirm the selected provider supports:

- The actual business model.
- Operating countries and currencies.
- Recurring subscriptions.
- Marketplace revenue allocation and payouts.
- Required refund and dispute handling.

Implement server-side payment verification.

Verify webhook signatures and process events idempotently.

Do not grant entitlements based solely on checkout redirects or
browser-reported success.

Keep test and live credentials separate.

Do not test with real customer transactions merely to verify an interface.

A future change in the platform’s content scope requires reassessing
provider suitability before using the changed service in production.

## 15. Messaging and Audio/Video Calls

Select the necessary realtime and calling infrastructure explicitly.

Document:

- Connection authorization.
- Conversation membership.
- Attachment access.
- Call signaling.
- Relay or managed connectivity requirements.
- Credential expiry.
- Reconnection behaviour.
- Supported browsers.
- Usage costs.

Use HTTPS or the browser’s supported secure local-development context
for camera and microphone features.

Request device permissions only when needed.

Do not enable call recording by default.

## 16. Test Environment

Define real test commands when the relevant tooling is installed.

Do not list npm test, lint, or build commands as available until their
scripts exist.

Use:

- Unit tests for pricing and domain rules.
- Integration tests for permissions and service boundaries.
- Browser tests for critical user journeys.
- Visual inspection for page layouts and responsive behaviour.

Keep routine tests deterministic and isolated.

Use controlled clocks for time-sensitive rules where practical.
Use test accounts and isolated services for integration tests.

Do not require production credentials for routine test execution.

Report separately:

- Checks passed.
- Checks failed.
- Checks not run.
- Behaviour requiring manual verification.

## 17. Browser and Device Coverage

Before launch, define a supported browser matrix.

At minimum, assess the intended experience across:

- Chromium-based desktop browsers.
- Firefox.
- Safari.
- iOS Safari.
- Android Chrome.

Record actual tested browser versions.

Validate representative narrow mobile, tablet, and desktop layouts.

Check:

- Touch and keyboard interaction.
- Focus visibility.
- Modal and age-gate behaviour.
- Form validation.
- Media playback.
- File uploads.
- Authentication redirects.
- Calls where supported.
- Reduced-motion preferences.

Do not claim cross-browser compatibility without appropriate checks.

## 18. Build Expectations

Builds must:

- Run from declared dependencies.
- Work in a clean environment.
- Avoid undocumented global tools.
- Run non-interactively in CI.
- Produce a clearly defined output directory.
- Exclude secrets and private data.

Commit source files and lockfiles as appropriate.

Do not commit generated output unless the selected deployment process
requires it.

Prefer reproducible builds from the same source, dependency lockfile,
and configuration.

Do not confuse reproducible builds with identical application behaviour
when real users, payments, or timestamps change.

## 19. Deployment

Use GitHub for source control and an approved production hosting service.

GitHub Pages is not the production hosting target for MeetDiscreet’s
commercial marketplace.

Document:

- Deployment source and branch.
- Build command, if applicable.
- Output directory.
- Environment configuration.
- Domain and HTTPS setup.
- Backend deployment.
- Database migration process.
- Authentication redirects.
- Payment webhook URLs.
- Post-deployment checks.
- Rollback procedure.

A frontend deployment does not establish that backend integrations
are operational.

Verify public page routes, direct links, assets, and restricted flows
after deployment.

## 20. Time, Scheduling, and Money

### Time

Store absolute event timestamps consistently, normally in UTC.

For bookings, also retain the relevant IANA time-zone identifier
and the intended local schedule where needed.

Do not rely on the browser or server’s default time zone.

Display the booking time zone explicitly where ambiguity is possible.

Handle daylight-saving transitions, including ambiguous or nonexistent
local times.

Recurring availability must retain its intended local time zone.

Distinguish calendar dates from absolute timestamps.

### Money

Use integer minor currency units with an explicit currency code.

Define rounding centrally.

Do not use floating-point calculations as the authority for financial totals.

Keep provider processing costs, platform allocations, refunds, taxes,
and companion earnings distinguishable.

## 21. Runtime Safety and Observability

Avoid:

- eval-style execution.
- Unsafe insertion of user content into HTML.
- Shell command injection.
- SQL string interpolation.
- Unvalidated redirects.
- Unsafe upload processing.
- Hardcoded credentials.

Use appropriate validation and context-specific output escaping.

Log relevant failures and state transitions without exposing:

- Passwords.
- Tokens.
- Payment credentials.
- Private messages.
- Sensitive profile information.
- Private media URLs.

Configure monitoring according to the selected services.
Do not claim monitoring or backups exist before they are configured.

## 22. Determinism and Idempotency

Use deterministic calculations for:

- Prices.
- Revenue allocations.
- Entitlement checks.
- Posting allowances.
- Boost allowances.
- Booking state transitions.

Use idempotency controls for:

- Payment events.
- Subscription updates.
- Deposit confirmation.
- Refund processing.
- Payout records.
- Retried background jobs.

Do not prohibit randomness where it is necessary.

Use cryptographically secure randomness for tokens and other
security-sensitive identifiers through established platform APIs
or trusted libraries.

Use stable synthetic fixtures for repeatable tests.

## 23. Environment Acceptance

Before describing an environment as ready, verify:

- Required configuration is documented.
- Dependencies install successfully.
- The documented preview process works.
- Relevant checks run.
- Secrets remain server-side.
- Environment resources are correctly separated.
- Deployed routes and assets resolve.
- Authentication callbacks work.
- Backend permissions are enforced.
- Payment mode matches the environment.
- Critical integrations have been tested.
- Remaining limitations are recorded.

Update this document when the actual environment changes.