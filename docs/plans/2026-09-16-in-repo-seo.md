# Eterja In-Repository SEO Implementation Plan

**Goal:** Improve the crawlable initial HTML, search/share metadata, structured-data context, and mobile delivery performance using only files controlled by this repository.
**Branch:** `fix/in-repo-seo`
**Execution:** Current checkout, no worktree; tasks run sequentially.

## Current-State Findings

- The production URL is fixed at `https://swissaustral.com/eterja/` and documented in `README.md:101`.
- `index.html:25` contains an empty React root, so the initial response contains no H1, product copy, internal links, form, or references.
- The application uses `createRoot` in `src/main.jsx:6`; hydration is not currently enabled.
- React 19 and Vite 8 are already installed. React server rendering and Vite’s SSR build API can provide static HTML without another dependency.
- Components are suitable for static rendering: `useReveal` starts with deterministic `idle` state and accesses browser APIs only inside an effect; `Contact` accesses `window.turnstile` only inside effects or event handlers.
- The production base is `/eterja/`; the external proxy strips that prefix before forwarding to this Nginx container.
- The hero image is a 74 KB progressive JPEG but is discovered through CSS rather than initial HTML.
- Below-fold editorial imagery totals roughly 1 MB. None of the `<img>` elements declares intrinsic dimensions or loading behavior.
- Turnstile’s script is loaded globally in `index.html:18-22`, while its widget is only used in the last page section.
- Nginx currently provides neither explicit compression nor long-lived caching for hashed assets.

## Requirements

- Keep all work limited to `/eterja/` resources and this repository.
- Preserve the existing page design, content, contact flow, GTM behavior, Turnstile validation, `/eterja/` public base, and external proxy contract.
- Make the full React page available in the built initial HTML.
- Hydrate the prerendered markup without replacing it or producing hydration warnings.
- Add page-owned canonical, favicon, social metadata, and truthful structured data.
- Improve hero discovery, below-fold image delivery, Turnstile loading, compression, and caching.
- Add no runtime framework or SEO dependency.
- Do not fabricate reviews, offers, claims, certifications, efficacy, or organization details.

## Non-Goals

- `robots.txt`, XML sitemap, parent-site navigation, host redirects, DNS, reverse-proxy configuration, Search Console, or GTM portal configuration.
- Keyword expansion, copy rewriting, new landing-page sections, or visual redesign.
- Product rich-result eligibility through fabricated `Offer`, `AggregateRating`, or `Review` data.
- Migration to an SSR application server.
- Changes to the backend contact API or email workflow.

## Acceptance Criteria

- [ ] Built `dist/index.html` contains the page H1, primary product copy, CTA links, contact form, and references before JavaScript runs.
- [ ] The client uses `hydrateRoot`, and production browser checks show no hydration mismatch.
- [ ] Initial HTML contains exactly one absolute canonical for `https://swissaustral.com/eterja/`.
- [ ] Initial HTML contains favicon, Open Graph, Twitter Card, and valid JSON-LD metadata.
- [ ] The social image resolves beneath `/eterja/` and has a 1200×630 presentation.
- [ ] The hero image is discoverable from initial HTML and retains the current visual treatment.
- [ ] Turnstile is not requested on initial page load and becomes available before the contact section is reached.
- [ ] Below-fold images use lazy loading, asynchronous decoding, and intrinsic dimensions without changing their rendered layout.
- [ ] Large editorial images are reduced without visible degradation at their displayed sizes.
- [ ] Hashed assets receive immutable caching and compressible text assets support gzip.
- [ ] Existing GTM, contact, animation, accessibility, and `/eterja/` base-path behavior remain intact.
- [ ] Frontend lint, tests, test-mode build, backend tests, and backend typecheck pass.
- [ ] Production Lighthouse improves from the recorded performance baseline of 76/LCP 4.5 s without reducing SEO 92 or accessibility 96.

## Minimal-Solution Decision

**Selected ladder rung:** 4 — use native React 19 rendering/hydration and Vite 8 build APIs.

**Why it holds:** The installed versions already provide static server rendering, hydration, asset handling, and programmatic builds. No prerender package or SEO library is required.

**Skipped:** An SSR server, a routing framework migration, a third-party prerender plugin, runtime metadata management, a schema-generation dependency, and an image-processing dependency in the production build.

**Add only when:** Introduce a framework-level SSG solution only if this project gains multiple independently routed pages, dynamic page data, or per-route metadata.

## Design

The production build remains a static Nginx deployment. Vite builds the browser application normally, a separate Vite SSR build compiles a server entry that renders the same `App` tree, and a repository build script injects the render result into the built `index.html`. The browser entry hydrates that markup. Metadata is static because there is one public URL. JSON-LD uses only visible facts. Turnstile loads dynamically when its placeholder approaches the viewport and the existing submit-time token check remains the final guard.

## Tasks

### Task 1: Add complete page-owned metadata

**Objective:** Ensure crawlers and social clients receive canonical, identity, preview, and structured-data signals in initial HTML.

**Expected files (advisory):**
- Modify: `index.html`
- Create: `public/eterja-social.jpg`
- Modify: `src/production-build.test.js`

**Steps:**
1. Add failing assertions for canonical, favicon, Open Graph, Twitter, and parseable JSON-LD while preserving GTM-first ordering.
2. Generate a 1200×630 JPEG derivative from approved hero imagery without adding unverified claims.
3. Add canonical, favicon, Open Graph, Twitter, and image metadata directly to `index.html`.
4. Add JSON-LD for the page and product/brand relationship using only visible facts.
5. Verify Vite’s `/eterja/` public URL rewriting.

**Non-goals:** Parent-site schema consolidation; offer, price, rating, review, FAQ, medical, or efficacy schema; host redirects or sitemap changes.

**Verification:** `npm test`; then `VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA VITE_GOOGLE_TAG_MANAGER_ID=GTM-TEST123 npm run build:test`.

### Task 2: Prerender the React application and hydrate it

**Objective:** Place the complete landing-page markup in the built initial HTML while preserving all existing client interactions.

**Expected files (advisory):**
- Modify: `index.html`, `src/main.jsx`, `package.json`, `README.md`
- Create: `src/entry-server.jsx`, `scripts/build.mjs`, `src/prerender.test.js`

**Steps:**
1. Add failing tests for a pure HTML-injection helper that replaces one outlet and rejects missing, duplicate, or empty output.
2. Replace the empty root with a stable prerender outlet.
3. Add the server entry that renders the same application tree as the browser.
4. Add a build orchestrator that runs client build, temporary SSR build, render, injection, output verification, and cleanup.
5. Change browser mounting from `createRoot` to `hydrateRoot`.
6. Route `build` and `build:test` through the orchestrator while retaining environment validation.
7. Document prerendered static output.
8. Verify with JavaScript disabled and enabled.

**Non-goals:** Runtime SSR, multiple routes, data fetching during prerender, React Server Components, or a prerender dependency.

**Verification:** Focused injection tests, `npm test`, and a test-mode build whose output includes H1, CTA links, form, and references.

### Task 3: Improve critical and deferred resource loading

**Objective:** Improve mobile LCP and reduce unnecessary initial network/JavaScript work without changing visual composition.

**Expected files (advisory):**
- Modify: `index.html`, `src/components/Contact.jsx`, `src/components/Header.jsx`, `src/components/Challenge.jsx`, `src/components/Origin.jsx`, `src/components/Mechanism.jsx`, `src/components/Combination.jsx`, `src/components/Footer.jsx`, `src/production-build.test.js`
- Possibly modify/create: optimized files under `src/assets/`

**Steps:**
1. Preload the hero JPEG.
2. Remove eager Turnstile from `index.html`.
3. Load Turnstile once with `IntersectionObserver` before the contact section enters view, preserving existing render, cleanup, reset, and submit validation behavior.
4. Add intrinsic dimensions to every image; keep header eager, and use lazy loading plus async decoding for below-fold images and footer logo.
5. Recompress or provide optimized alternatives for largest editorial JPEGs with current crop behavior.
6. Perform mobile and desktop visual comparison.

**Non-goals:** Removing hero parallax; replacing its background implementation; changing imagery/copy; delaying Turnstile until submit; runtime image library.

**Verification:** `npm run lint && npm test`, test-mode build, browser-network inspection, and form smoke test.

### Task 4: Configure static-delivery compression and caching

**Objective:** Reduce transferred text bytes and safely cache content-hashed frontend assets.

**Expected files (advisory):**
- Modify: `nginx.conf`
- Possibly modify: `README.md`

**Steps:**
1. Add gzip for appropriate text types.
2. Cache `/assets/` with `public, max-age=31536000, immutable`.
3. Set HTML to revalidate/no-cache.
4. Leave `/api/` unchanged and prior to generic static routing.
5. Document the caching policy.

**Non-goals:** CDN/proxy changes, Brotli installation, immutable caching for unhashed public files, backend API caching.

**Verification:** `docker compose config --quiet`, build/start image, and response-header checks.

## Final Verification

```bash
npm run lint
npm test
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA VITE_GOOGLE_TAG_MANAGER_ID=GTM-TEST123 npm run build:test
cd backend && bun test && bunx tsc --noEmit
```

Recheck raw HTML, JSON-LD, mobile/desktop rendering, console, hydration, anchors, Turnstile, Lighthouse, and baseline regression.

## Risks and Approved Simplifications

- Build-time prerendering adds a second Vite compilation but avoids a server, framework migration, or dependency.
- Static canonical/social URLs assume the documented URL remains fixed.
- Static JSON-LD uses only visible facts.
- Committed optimized image derivatives require manual regeneration when source imagery changes.
- Turnstile remains after dynamic insertion to preserve its lifecycle.
- Lab Lighthouse does not establish field Core Web Vitals.

## Execution Handoff

- Create or switch to `fix/in-repo-seo` from the agreed base branch.
- Do not use git worktrees.
- Execute tasks sequentially and verify each before continuing.
- Expected file lists are advisory; justify necessary deviations.
- Do not expand into parent-host SEO infrastructure or unrelated design changes.
