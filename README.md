# DataHub

A minimal **Next.js 16** landing page — the starting point for a from-scratch rebuild.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-149eca) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)

---

## What this is

A single-page landing site with hero, features, how-it-works, use-cases, and footer sections. All content lives inline in `app/components/landing.tsx` — there is no backend, no auth, no database, and no API.

Everything else will be built on top of this foundation.

---

## Tech stack

| Layer     | Choice                          |
|-----------|---------------------------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language  | TypeScript 5                    |
| UI        | React 19 + Tailwind CSS 4       |
| Fonts     | Geist + Geist Mono              |

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For local-only binding (no LAN access), use `npm run dev:local`.

---

## Project structure

```
app/
├── components/
│   └── landing.tsx        # the only component — hero, features, how-it-works, use-cases, footer
├── page.tsx               # renders <Landing />
├── layout.tsx             # root layout (fonts, CSS vars, gradient background)
├── globals.css            # theme tokens + animations
└── favicon.ico

public/                    # static assets
```

---

## Customizing the landing copy

All text, brand name, and color live in one place: `app/components/landing.tsx`.

- **Brand** — change `appConfig.name` and `appConfig.tagline`
- **Pill / hero accent** — `appConfig.landing.pill` and `appConfig.landing.heroAccent`
- **Feature list** — `appConfig.landing.features[]`
- **How-it-works steps** — `appConfig.landing.howItWorks[]`
- **Use cases** — `appConfig.landing.useCases[]`

Page metadata (browser tab title + description) is in `app/layout.tsx`.

## Customizing the theme

The accent palette is set as CSS variables on `<html>` in `app/layout.tsx` (the `accentStyle` object). The base dark surface / border / text tokens live in `app/globals.css`.

---

## Useful scripts

```bash
npm run dev         # dev server bound to 0.0.0.0 (LAN accessible)
npm run dev:local   # dev server bound to localhost only
npm run build       # production build
npm run start       # serve production build on 0.0.0.0
npm run start:local # serve production build on localhost
npm run lint        # ESLint
```

---

## Conventions

- **No comments in source files** — code is self-documenting.
- **Tailwind theme tokens** — use `bg-bg`, `bg-surface`, `border-border`, `text-fg`, `text-muted`, `text-accent`, `text-danger`, etc. (defined in `app/globals.css`).
- **Animations** — `animate-fadeInUp`, `animate-slideInLeft`, plus `delay-1`...`delay-8`.
- **Icons** — text symbols, not an icon library. Keep the bundle small.

---

## License

MIT — use, fork, ship. Happy hacking!
