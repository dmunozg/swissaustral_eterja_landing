# Production Deployment Integration Plan

**Goal:** Add a production-ready contact backend, Cloudflare Turnstile, Docker deployment, and Google Tag Manager using the Catalase architecture, targeting `https://swissaustral.com/eterja/`.
**Branch:** `feature/production-contact-stack`
**Execution:** Current checkout, no worktree; tasks run sequentially.

## Current-State Findings

- The project is a React 19/Vite 8 SPA served from the repository root.
- The contact form is inert; no backend, environment configuration, analytics, Docker files, or automated tests exist.
- Existing commands are `npm run build` and `npm run lint`.
- The Catalase repository provides the reusable Bun/TypeScript, SMTP, Turnstile, Docker/Nginx, and GTM patterns.
- Agreed scope: deploy at `/eterja/`; send visitor receipt plus internal report; require name, email, message; company and role are optional.

## Requirements

- Submit through a same-origin API with independent backend validation.
- Require Cloudflare Turnstile in production; validate action and hostname server-side.
- Deliver a receipt and internal report via SMTP; rate-limit submissions by client IP.
- Serve Vite output through Nginx, with Bun private to Compose.
- Build for `/eterja/`, inject GTM at build time, and emit `generate_lead` only after success.
- Fail unsafe/missing production configuration and document operations.

## Non-Goals

- CRM/webhook, persistent rate limiting, mail queues/retries, GTM portal configuration, consent management, WhatsApp, prerendering/SEO work, frontend directory restructure, redesign/copy changes, and unrelated lint cleanup.

## Acceptance Criteria

- [ ] Production assets and API URLs use `/eterja/`.
- [ ] Name, email, message, and a valid Turnstile token are required; company/role are optional and validated when supplied.
- [ ] Invalid, oversized, foreign-origin, rate-limited, or Turnstile-rejected requests send no email.
- [ ] Valid messages send visitor receipt first, then internal report.
- [ ] The frontend provides accessible submission states, resets only on success, and resets Turnstile after attempts.
- [ ] Production rejects missing/test Turnstile credentials and missing/malformed GTM IDs.
- [ ] GTM receives only `{ event: "generate_lead" }` after successful delivery.
- [ ] Compose exposes Nginx only; Bun is internal.
- [ ] Tests, typecheck, lint, production build, and Compose validation pass.

## Minimal-Solution Decision

**Selected ladder rung:** 2 — reuse an existing project pattern.

**Why it holds:** The Catalase repository implements the requested architecture and security boundaries; Eterja needs only field-schema and path adaptations.

**Skipped:** Hosted form provider, database, Redis, mail queue, React Turnstile dependency, monorepo framework, and frontend move.

**Add only when:** Add distributed rate limiting or queued mail only for multiple backend replicas or a reliable-retry requirement.

## Design

The browser explicitly renders Turnstile (`action: "contact"`), obtains a token, and posts JSON to a configured development endpoint or `${import.meta.env.BASE_URL}api/contact` in production. The external proxy strips `/eterja`; Nginx proxies `/api/` to `backend:3000`. The backend checks method/path, exact origin, JSON/content/body limits, fields, rate limit, and Turnstile Siteverify action/hostname before mail side effects. It sends the receipt followed by report. The frontend resets values only on success and emits `generate_lead` then.

Field limits: `name` 100 required; `company` 150 optional; `role` 150 optional; `email` 254 required; `message` 5000 required; `turnstileToken` 2048 required.

Frontend build variables: `VITE_TURNSTILE_SITE_KEY`, `VITE_GOOGLE_TAG_MANAGER_ID`, `VITE_CONTACT_API_URL`. Backend runtime variables: `NODE_ENV`, `PRODUCTION`, `PORT`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `EMAIL_REPORT_TO`, `PRODUCTION_ORIGIN`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_EXPECTED_HOSTNAME`, `TURNSTILE_TIMEOUT_MS`, `TRUST_PROXY`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`.

Production defaults: origin `https://swissaustral.com`, expected hostname `swissaustral.com`, port `3000`, timeout `5000`, and 5 requests / 10 minutes.

## Tasks

### Task 1: Establish backend configuration and validation

**Objective:** Create a fail-fast, testable configuration layer and define the Eterja payload contract.

**Expected files (advisory):**
- Create: `backend/package.json`, `backend/tsconfig.json`, `backend/src/config.ts`, `backend/src/contact.ts`, `backend/src/config.test.ts`, `backend/src/contact.test.ts`

**Steps:**
1. Add Bun/TypeScript package and strict compiler configuration.
2. Port validated config loading and production Turnstile test-key rejection.
3. Require SMTP, sender, recipient, origin, and security settings.
4. Define optional company/role plus required fields and limits.
5. Test configuration and payload boundaries.

**Non-goals:** Server startup, SMTP calls, frontend changes.

**Verification:** `cd backend && bun test src/config.test.ts src/contact.test.ts && bunx tsc --noEmit`.

**Complete when:** Invalid production configuration fails by name and payload tests cover required, optional, malformed, and oversized fields.

### Task 2: Implement protected contact endpoint

**Objective:** Add deterministic security-bounded `POST /api/contact` handling.

**Expected files (advisory):**
- Modify: `backend/src/contact.ts`
- Create: `backend/src/server.ts`, `backend/src/turnstile.ts`, `backend/src/server.test.ts`
- Modify: `backend/src/contact.test.ts`

**Steps:**
1. Add bounded streaming JSON parsing, exact-origin check, and rate limiter.
2. Verify Turnstile with timeout; require valid response, action `contact`, and configured hostname.
3. Add generic responses and security headers.
4. Test valid, invalid, foreign-origin, rate-limited, and rejected-token cases.

**Non-goals:** SMTP implementation and public container exposure.

**Verification:** `cd backend && bun test src/contact.test.ts src/server.test.ts && bunx tsc --noEmit`.

**Complete when:** Only valid, allowed, non-rate-limited requests reach the mail dependency.

### Task 3: Add safe SMTP delivery

**Objective:** Send visitor receipt and internal report with TLS SMTP.

**Expected files (advisory):**
- Create: `backend/src/email.ts`
- Modify: `backend/src/server.ts`, `backend/src/contact.ts`, `backend/package.json`
- Modify: `backend/src/contact.test.ts`

**Steps:**
1. Configure Nodemailer with TLS 1.2 minimum and certificate verification.
2. Escape HTML and strip unsafe control characters.
3. Include optional fields only when present and set report reply-to to visitor.
4. Preserve receipt-then-report ordering and test it.

**Non-goals:** Queueing, retrying, templates, attachments, CRM.

**Verification:** `cd backend && bun test && bunx tsc --noEmit`.

**Complete when:** Both messages are safe and mail delivery failure returns a generic error.

### Task 4: Wire frontend form and Turnstile

**Objective:** Make the contact form accessible and functional.

**Expected files (advisory):**
- Modify: `index.html`, `src/components/Contact.jsx`

**Steps:**
1. Load Turnstile explicit-render script and manage its lifecycle.
2. Use FormData, required/maxLength fields, and client token checking.
3. Submit to configurable local or base-relative production endpoint.
4. Implement accessible idle/pending/success/error/rate-limit states and reset rules.

**Non-goals:** Visual redesign or locked-copy change other than necessary status text.

**Verification:** `npm run lint && npm run build`; manually test keyboard submission, validations, failure preservation, and success reset.

**Complete when:** UI and backend contracts match and all states are accessible.

### Task 5: Add GTM and lead-event integration

**Objective:** Inject GTM safely and track successful leads without personal data.

**Expected files (advisory):**
- Modify: `vite.config.js`, `src/components/Contact.jsx`, `package.json`
- Create: `src/google-tag.js`, `src/google-tag.test.js`, `src/production-build.test.js`

**Steps:**
1. Add dependency-free GTM Vite HTML transform.
2. Validate/require GTM ID for production builds.
3. Add guarded `trackGenerateLead` and call only after API success.
4. Test event payload and generated HTML placement.

**Non-goals:** Google portal configuration, ads, personal data collection, consent UI.

**Verification:** `VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA VITE_GOOGLE_TAG_MANAGER_ID=GTM-TEST123 npm run build && npm test` (test-mode validation is permitted; normal builds reject test keys).

**Complete when:** Built HTML has both GTM snippets and success emits only `{ event: "generate_lead" }`.

### Task 6: Containerize development and production

**Objective:** Add the two-container Docker topology without moving the frontend.

**Expected files (advisory):**
- Create: `Dockerfile`, `nginx.conf`, `compose.yml`, `compose.dev.yml`, `backend/Dockerfile`, `.env.example`, `backend/.env.example`
- Modify: `.gitignore`

**Steps:**
1. Add Node-build/Nginx runtime frontend image and Bun production backend image.
2. Add Nginx SPA fallback and `/api/` proxy.
3. Add production Compose with Nginx exposed, Bun private, production flags, restart policies.
4. Add Vite/Bun development Compose services.
5. Ensure compatibility with `/eterja/` prefix stripping.

**Non-goals:** TLS, Traefik installation, Kubernetes, registry publishing, scaling.

**Verification:** `docker compose config --quiet && docker compose -f compose.dev.yml config --quiet && docker compose build`.

**Complete when:** Static frontend image contains Nginx only and secrets are backend runtime-only.

### Task 7: Document and final production checks

**Objective:** Make deployment reproducible.

**Expected files (advisory):**
- Modify: `README.md`

**Steps:**
1. Replace mockup status with operations documentation.
2. Document environments, local/prod startup, SMTP, `/eterja/` stripping, proxy header trust, Turnstile, GTM, and known limitations.
3. Execute project-wide checks.

**Non-goals:** External Traefik/configuration-provider edits.

**Verification:** `npm ci && npm run lint && npm test && VITE_TURNSTILE_SITE_KEY=<real-site-key> VITE_GOOGLE_TAG_MANAGER_ID=<real-container-id> npm run build && cd backend && bun install --frozen-lockfile && bun test && bunx tsc --noEmit && cd .. && docker compose config --quiet && docker compose -f compose.dev.yml config --quiet && docker compose build`.

**Complete when:** All checks pass and the README enables deployment without the Catalase repository.

## Risks and Approved Simplifications

- Rate limiting is process-local; add shared storage only for multiple replicas.
- Receipt can succeed while report fails; add a queue only for transactional delivery requirements.
- GTM and public Turnstile key are build-time values; changing them requires rebuilding.
- `TRUST_PROXY=true` requires an external proxy that overwrites forwarded client IP and restricts direct Nginx access.
- Credentials, GTM ID, and Turnstile values are deployment prerequisites and must not be committed.

## Execution Handoff

- Use `feature/production-contact-stack` from current `main`; preserve existing local commits.
- No worktrees; execute all tasks sequentially.
- Do not expand into SEO, WhatsApp, redesign, or external infrastructure work.
