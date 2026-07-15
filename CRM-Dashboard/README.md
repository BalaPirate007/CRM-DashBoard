# Kresola — CRM Dashboard & Weather App

Take-home submission for the Dale Edge Software Development Intern assessment (Round 3).

Two static, framework-free front-end projects that share one design system, one sound
engine and one theme (light/dark) toggle:

- **`/crm`** — the Major Project: a SaaS CRM dashboard (Login, Dashboard, Customers, Orders, Settings)
- **`/weather`** — the Minor Project: a weather lookup app, linked from the CRM sidebar

Both are built with plain **HTML, CSS and vanilla JavaScript** (no build step), styled to
match the monochrome reference dashboard provided in the brief, and wired to a real, free,
key-free weather API (Open‑Meteo) so the weather app is fully functional out of the box.

## 1. Running it locally

No `npm install` or build step is required — it's static HTML/CSS/JS. You only need a
local server so `fetch()` and relative paths work correctly (opening the HTML file
directly with `file://` will block the weather API call in some browsers).

```bash
# from the project root
npx serve .
# or
python3 -m http.server 5500
```

Then open:
- `http://localhost:5500/crm/index.html` — CRM login
- `http://localhost:5500/weather/index.html` — Weather app (also linked from the CRM sidebar under "Tools")

**Demo login:** any email format + a password of 6+ characters. It's a static demo with
no real backend, so any value in that shape signs you in.

## 2. Folder structure

```
project/
├─ index.html              # redirects to /crm/index.html
├─ crm/
│  ├─ index.html            # Login
│  ├─ dashboard.html        # KPI cards, charts, activity feed
│  ├─ customers.html        # Search / sort / filter / paginate
│  ├─ orders.html           # Search / filter / edit status / delete
│  ├─ settings.html         # Profile form, theme + sound switches
│  ├─ css/style.css         # Shared design system (used by /weather too)
│  └─ js/
│     ├─ app.js             # Theme, click-sound engine, auth guard, toasts
│     ├─ sidebar.js         # Renders the sidebar once so every page stays in sync
│     ├─ icons.js           # Inline SVG icon set (no external icon font)
│     ├─ data.js            # Static mock data (customers, orders, chart data)
│     ├─ dashboard.js / customers.js / orders.js / settings.js
└─ weather/
   ├─ index.html
   ├─ css/style.css         # Extends crm/css/style.css
   └─ js/weather.js         # Open-Meteo geocoding + forecast calls
```

## 3. How the two projects stay "in sync"

- `weather/index.html` links `crm/css/style.css` directly, so both projects always share
  the exact same colors, spacing, buttons and cards — a change to one design token updates
  both apps.
- `weather` also loads `crm/js/app.js` and `crm/js/icons.js`, so the **theme toggle** and
  **click-sound engine** are the literal same code running in both projects, not a copy.
- The sidebar is generated once from `crm/js/sidebar.js` and injected into every CRM page,
  so navigation links/active states can't drift out of sync between pages.

## 4. Feature notes

- **Sound**: every button/link click plays a tiny Web Audio beep generated in-browser
  (no audio files to load). It can be muted from Settings → Sound.
- **Theme**: light/dark is stored in `localStorage` and applied instantly on every page.
- **Customers / Orders**: search, column sorting, dropdown filtering and pagination are
  all implemented client-side over static mock data. Orders also support editing a
  status (via modal) and deleting a row (with a confirm modal); both persist to
  `localStorage` so they survive a refresh.
- **Settings**: profile form has real validation (name length, email format, phone
  format) and Save/Reset actually read/write `localStorage`.
- **Weather**: uses [Open-Meteo](https://open-meteo.com/) (free, no API key) for city
  geocoding and the 5-day forecast. Handles an unknown city, a slow/failed request
  (8s timeout), and a loading skeleton. The last searched city is saved to
  `localStorage` and re-loaded automatically on refresh.

## 5. Assumptions & known limitations

- No backend/database — everything is static JSON/mock data plus `localStorage`, as the
  brief explicitly allows.
- Login accepts any well-formed email + 6-character password; there's no real user
  database to check against.
- Charts use Chart.js from a CDN; the weather app calls the public Open-Meteo API, so an
  internet connection is required for those two specific features — everything else
  works fully offline.
- Currency values are illustrative mock data, not tied to any real accounting logic.
- Tested at common breakpoints (desktop, tablet, ~375px mobile); extremely small/old
  browsers aren't specifically targeted.

## 6. AI usage disclosure

> Personalize this section honestly before you submit — it's part of what's being
> evaluated. Below is an accurate starting draft for this specific build; edit it to
> reflect what you actually reviewed, changed, or wrote yourself.

- **AI tool used:** Claude (Anthropic), via the Claude chat interface.
- **What it assisted with:** scaffolding the full folder structure, the shared design
  system (`style.css`), the sidebar/theme/sound engine (`app.js`, `sidebar.js`), all five
  CRM pages and their JS controllers, and the weather app's Open-Meteo integration.
- **What I wrote/changed myself:** _(fill in — e.g. adjusted color tokens, rewrote the
  mock data set, changed validation rules, fixed a bug in pagination, added/removed a
  feature, tuned copy, etc.)_
- **One technical decision made independently:** _(fill in — e.g. "I chose Open-Meteo
  over OpenWeatherMap because it needs no API key, which keeps the demo runnable for
  reviewers without asking them to create an account," or a decision of your own.)_

## 7. Deployment

Since this is static HTML/CSS/JS, any static host works with zero configuration:

- **Vercel / Netlify**: drag-and-drop the project folder, or connect the GitHub repo —
  no build command needed (leave "build command" empty, output directory `.`).
- **GitHub Pages**: enable Pages on the repo, serving from the root of the `main` branch.

The root `index.html` redirects to `crm/index.html` so the deployed URL lands directly
on the login page.
