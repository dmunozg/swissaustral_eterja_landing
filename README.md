# SwissAustral® Eterja SC — Landing page mockup

Visual mockup of the B2B landing page for **SwissAustral® Eterja SC**
(recombinant SOD + Catalase System), built from the design handoff at
`~/syncthing/Documents/SwissAustral/digital_marketing_plan/cosmetics_sod_catalase/design_handoff.md`.

## Status

Static design mockup. CTAs are anchor links; the contact form is inert (no
submission, no Turnstile integration). Copy follows the locked handoff.

## Stack

- React 19 (Vite)
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Google Fonts: Montserrat (display) + DM Sans (body)

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Structure

| File | Section |
| --- | --- |
| `src/components/Header.jsx` | Fixed top bar (logo + dossier CTA) |
| `src/components/Hero.jsx` | Section 1 — hero (skin macro) |
| `src/components/Challenge.jsx` | Section 2 — the formulation challenge |
| `src/components/Origin.jsx` | Section 3 — product + Patagonian origin (glacier) |
| `src/components/Mechanism.jsx` | Section 4 — tandem pathway |
| `src/components/Combination.jsx` | Section 5 — the combination |
| `src/components/Contact.jsx` | Section 6 — contact form (static) |
| `src/components/Footer.jsx` | Disclaimer + references |
| `src/components/ui.jsx` | Shared primitives |

## Palette (locked)

- Warm ivory `#F7F1E8` · Ivory deep `#F1E8DA`
- Espresso `#2E2620` · Warm taupe `#76675F`
- Soft skin `#D8B5A3` · Muted terracotta `#C0654B`
- Glacial blue `#6F9EAB` (CTA) · Glacial deep `#52808D`
- Glacial soft `#DCEAEC` · Glacier pale `#EAF2F3`
