# SwissAustral® Eterja SC — Landing page

B2B landing page for **SwissAustral® Eterja SC**
(recombinant SOD + Catalase System), built from the design handoff at
`~/syncthing/Documents/SwissAustral/digital_marketing_plan/cosmetics_sod_catalase/design_handoff.md`.

The page ships as a static SPA plus a small contact API: the form renders a
Cloudflare Turnstile widget, submits to `POST /api/contact`, and a valid
submission is delivered over SMTP as a visitor receipt plus an internal
report. Production is served at https://swissaustral.com/eterja/ via Docker
Compose (Nginx frontend, Bun backend).

## Status

Production-ready. The contact form is live (no more inert mockup): backend
validation, Turnstile verification, per-IP rate limiting, and TLS-only SMTP
delivery. Google Tag Manager is injected at build time and receives a single
`generate_lead` event after a successful send.

## Stack

- React 19 (Vite 8) + Tailwind CSS v4 (`@tailwindcss/vite`), served by Nginx
- Contact API: Bun + TypeScript (Nodemailer), private to the Compose network
- Anti-abuse: Cloudflare Turnstile (explicit render, server-side Siteverify)
- Analytics: Google Tag Manager (build-time injection)
- Google Fonts: Montserrat (display) + DM Sans (body)

## Environment variables

### Frontend (build time — `.env.example`)

| Variable | Purpose |
| --- | --- |
| `VITE_TURNSTILE_SITE_KEY` | Turnstile public site key, baked into the bundle. Production builds must use a real, non-test key. |
| `VITE_GOOGLE_TAG_MANAGER_ID` | GTM container ID (must match `GTM-[A-Z0-9]+`), injected into the built HTML. Required for production builds; a missing or malformed ID fails the build. |
| `VITE_CONTACT_API_URL` | Optional contact endpoint override for local development. When unset, the built app posts to `/eterja/api/contact` (base-relative). |

These are build-time values: changing any of them requires rebuilding the
frontend image.

### Backend (runtime — `backend/.env.example` and `.env.example`)

`backend/.env.example` templates a local API (`PRODUCTION=false`, origin
`http://localhost:5173`). The root `.env.example` templates the production
Compose stack (`PRODUCTION=true`, origin `https://swissaustral.com`).

| Variable | Purpose (default) |
| --- | --- |
| `NODE_ENV`, `PRODUCTION` | `production`/`true` in Compose. In production the API refuses to start without a real (non-test) Turnstile secret. |
| `PORT` | API port (3000). |
| `SMTP_HOST`, `SMTP_PORT` | SMTP server (port 587). |
| `SMTP_USER`, `SMTP_PASS` | SMTP credentials. Runtime-only; never baked into images. |
| `EMAIL_FROM` | Sender for both the receipt and the report. |
| `EMAIL_REPORT_TO` | Internal lead recipient; the report's reply-to is set to the visitor. |
| `PRODUCTION_ORIGIN` | Exact origin the browser submits from (`https://swissaustral.com` in production, `http://localhost:5173` locally). Any other origin is rejected. |
| `TURNSTILE_SECRET_KEY` | Turnstile secret key for Siteverify. Cloudflare test keys are rejected when `PRODUCTION=true`. |
| `TURNSTILE_EXPECTED_HOSTNAME` | Hostname tokens must have been issued for (defaults to the `PRODUCTION_ORIGIN` hostname, `swissaustral.com`). |
| `TURNSTILE_TIMEOUT_MS` | Siteverify timeout (5000). |
| `TRUST_PROXY` | `true` in Compose; see [Forwarding headers](#forwarding-headers-trust-boundary). |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS` | Max submissions per client IP per window (5 per 600000 ms = 10 minutes). |

## Local development

### Docker (dev stack)

```bash
docker compose -f compose.dev.yml up
```

- Frontend (Vite dev server) → http://localhost:5173
- Backend (Bun, watch mode) → http://localhost:3000
- The dev compose file points the form at `http://127.0.0.1:3000/api/contact`
  and falls back to the Cloudflare test site key when
  `VITE_TURNSTILE_SITE_KEY` is unset.
- Backend runtime values are read from the root `.env` (optional). Use local
  values there — `PRODUCTION=false`,
  `PRODUCTION_ORIGIN=http://localhost:5173`, `TRUST_PROXY=false` (i.e. the
  values from `backend/.env.example`); the production-shaped template would
  reject the local origin. Fill the SMTP fields in `.env` to test real
  delivery.

### Direct

```bash
npm install
npm run dev              # http://localhost:5173

cd backend
bun install
bun run dev              # http://localhost:3000, watch mode
```

Set `VITE_CONTACT_API_URL=http://127.0.0.1:3000/api/contact` in the root
`.env` so the dev server reaches the cross-origin API. The API reads
`backend/.env` automatically (start from `backend/.env.example`).

## Production

### Public path and proxy stripping

The site is published at **https://swissaustral.com/eterja/**. The Vite build
uses base `/eterja/`, so asset and API URLs are prefixed with `/eterja/`
publicly. The external reverse proxy in front of this stack **must strip the
`/eterja` prefix** before forwarding, so Nginx sees the site at root
(`/eterja/` → `/`, `/eterja/assets/…` → `/assets/…`,
`/eterja/api/contact` → `/api/contact`). Without stripping, assets and the
SPA fallback 404. That proxy configuration lives outside this repository and
is a deployment prerequisite; this repo ships no proxy config to edit.

### Build and start

1. Create the root `.env` from `.env.example` with real values: SMTP
   credentials, `EMAIL_FROM`/`EMAIL_REPORT_TO`, a real (non-test)
   `TURNSTILE_SECRET_KEY`, plus `VITE_TURNSTILE_SITE_KEY` and
   `VITE_GOOGLE_TAG_MANAGER_ID`. Never commit `.env`.
2. Build and start the stack (Nginx is the only published service; the
   backend is private to the Compose network):

```bash
docker compose up -d --build
```

Compose passes `VITE_TURNSTILE_SITE_KEY` and `VITE_GOOGLE_TAG_MANAGER_ID` as
build args to the frontend image. A production build **fails without a valid
GTM ID**, and the backend **refuses to start with a missing or test
Turnstile secret** — so a production deployment must be built with a real,
non-test Turnstile site key and a valid GTM ID. This repository and the
images contain no credentials; all secrets are deployment-time prerequisites.

### SMTP policy

The API requires TLS for mail: TLS 1.2 minimum, full certificate
verification, and `requireTLS` — STARTTLS on port 587, implicit TLS on 465.
Plaintext or unverifiable SMTP sessions are not attempted.

### Forwarding headers (trust boundary)

In production, `TRUST_PROXY=true`, so the backend treats the first
`X-Forwarded-For` entry as the client identity for rate limiting. That is only
safe when the external proxy **overwrites** the forwarded client IP on every
request and **direct access to the container's port 80 is blocked outside the
proxy**; otherwise a visitor can spoof `X-Forwarded-For` and evade the rate
limit. Nginx passes the header through to the API; it does not set it here.

### Turnstile setup

- Create a Turnstile widget for hostname **`swissaustral.com`** with action
  **`contact`**. Both sides must match: the frontend renders the widget with
  `action: 'contact'`, and the backend's Siteverify check rejects tokens with
  a different `action` or `hostname`.
- Use the widget's site key as `VITE_TURNSTILE_SITE_KEY` at build time and its
  secret key as `TURNSTILE_SECRET_KEY` at runtime.
- Cloudflare's public test keys work for local development only; they are
  rejected when `PRODUCTION=true`.
- Tokens are single-use; the widget resets after every submission attempt.

### Google Tag Manager

- Provide `VITE_GOOGLE_TAG_MANAGER_ID` at build time. The standard GTM head
  snippet and noscript iframe are injected into the built HTML; production
  builds fail without an ID matching `GTM-[A-Z0-9]+`.
- After a successful contact send, the frontend pushes exactly
  `{ event: "generate_lead" }` to the dataLayer — no other analytics events,
  and no personal data is ever passed to GTM.
- Configuring the container (tags, triggers) in the Google Tag Manager portal
  is an external prerequisite.

### Contact flow (reference)

Only `POST /api/contact` is served; requests must carry the exact
`PRODUCTION_ORIGIN`, a JSON body ≤ 16 KiB, and valid fields — `name` ≤ 100,
`email` ≤ 254, `message` ≤ 5000, plus the Turnstile token (required);
`company` ≤ 150 and `role` ≤ 150 (optional). Processing order: origin →
body/field validation → rate limit → Turnstile Siteverify (bounded by
`TURNSTILE_TIMEOUT_MS`) → mail. On success the **visitor receipt is sent
first, then the internal report**. All responses are generic
(400/403/429/500) with strict security headers.

## Known limitations

- **Rate limiting is process-local.** The per-IP window lives in the backend
  process's memory: it resets on restart or redeploy, and multiple backend
  replicas would each keep an independent limit. Add shared storage only if
  that becomes a requirement.
- **No SMTP queue or retry.** The two messages are sent sequentially with no
  retry or queue. If either delivery fails, the API returns 500; a receipt may
  already have reached the visitor when the internal report fails. Add a queue
  only for transactional-delivery requirements.
- **Build-time values are baked in.** The Turnstile site key and GTM ID live
  in the frontend build; changing them requires rebuilding and redeploying
  the frontend image.
- **`TRUST_PROXY=true` assumes an unspoofable `X-Forwarded-For`** — see the
  trust-boundary note above.

## Repository layout

| Path | Purpose |
| --- | --- |
| `src/` | React SPA (one component per page section) |
| `index.html` | HTML shell; loads the Turnstile script (GTM is injected at build time) |
| `vite.config.js` | Vite config, `/eterja/` base, GTM injection and validation |
| `Dockerfile`, `nginx.conf` | Frontend image: Nginx serving the built SPA and proxying `/api/` to the backend |
| `backend/` | Bun/TypeScript contact API, with its own `Dockerfile` and `.env.example` |
| `compose.yml` | Production stack: Nginx published, backend private |
| `compose.dev.yml` | Development stack: Vite + Bun watch mode |
| `.env.example`, `backend/.env.example` | Environment templates (see above) |

## SPA structure

| File | Section |
| --- | --- |
| `src/components/Header.jsx` | Fixed top bar (logo + dossier CTA) |
| `src/components/Hero.jsx` | Section 1 — hero (skin macro) |
| `src/components/Challenge.jsx` | Section 2 — the formulation challenge |
| `src/components/Origin.jsx` | Section 3 — product + Patagonian origin (glacier) |
| `src/components/Mechanism.jsx` | Section 4 — tandem pathway |
| `src/components/Combination.jsx` | Section 5 — the combination |
| `src/components/Contact.jsx` | Section 6 — contact form (Turnstile + contact API) |
| `src/components/Footer.jsx` | Disclaimer + references |
| `src/components/ui.jsx` | Shared primitives |

## Palette (locked)

- Warm ivory `#F7F1E8` · Ivory deep `#F1E8DA`
- Espresso `#2E2620` · Warm taupe `#76675F`
- Soft skin `#D8B5A3` · Muted terracotta `#C0654B`
- Glacial blue `#6F9EAB` (CTA) · Glacial deep `#52808D`
- Glacial soft `#DCEAEC` · Glacier pale `#EAF2F3`
