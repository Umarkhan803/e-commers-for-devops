# Nova — Premium E-Commerce Storefront UI

A production-style, component-driven e-commerce front end built with React, Vite and Tailwind CSS
v4. It covers the full shopping journey: browsing and faceted filtering, product detail, cart,
authentication, and a validated multi-step checkout.

Everything runs client-side against an in-memory catalogue, so there is no backend to start and no
network calls to mock. Product artwork is generated as inline SVG, which keeps the app fully offline
and every card visually consistent.

## Getting started

```bash
npm install
npm run dev
```

The dev server prints a local URL (default `http://localhost:5173`) and opens it automatically.

| Script            | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR       |
| `npm run build`   | Production build into `dist/`            |
| `npm run preview` | Serve the production build locally       |

Requires Node 18 or newer.

## Screens

| Home | Shop with filters |
| --- | --- |
| ![Home page](docs/screenshots/home.png) | ![Shop page](docs/screenshots/shop.png) |

| Product detail | Checkout |
| --- | --- |
| ![Product detail](docs/screenshots/product-detail.png) | ![Checkout payment step](docs/screenshots/checkout.png) |

## Architecture

The app is split by **section** (a functional area of the store) and by **component** (reusable UI
building blocks). Sections own page-level state and routing; components stay presentational and
reusable across sections.

```
src/
├── main.jsx                 Entry point — mounts the provider stack
├── App.jsx                  Route map, grouped by section
│
├── sections/                ── Application sections ──
│   ├── public/              Marketing surface: Hero, TrustBar, CategoryRail,
│   │                        DealsSection, FeaturedTabs, PromoSplit, Testimonials, NotFound
│   ├── auth/                AuthLayout shell + Login + Signup
│   ├── shop/                Shop (filtering) + ProductDetail
│   ├── cart/                CartPage
│   └── checkout/            Checkout (3 steps) + OrderConfirmation
│
├── components/              ── Reusable components ──
│   ├── ui/                  Button, Badge, Rating, Field (inputs/select/checkbox/radio),
│   │                        Modal, Drawer, QuantityStepper, Misc (PriceTag, EmptyState, …)
│   ├── layout/              Navbar, SearchBar, Footer, StoreLayout
│   ├── product/             ProductCard, ProductGrid, FilterPanel, ShopToolbar,
│   │                        QuickViewModal, Reviews
│   ├── cart/                CartDrawer, CartLineItem, OrderSummary
│   └── checkout/            CheckoutSteps, CheckoutForms (shipping/payment/review)
│
├── context/                 ── State layer ──
│   ├── CartContext.jsx      Lines, totals maths, shipping method, promo codes, drawer
│   ├── AuthContext.jsx      Simulated session with localStorage persistence
│   ├── WishlistContext.jsx  Saved product IDs
│   └── ToastContext.jsx     Notification queue + renderer
│
├── lib/
│   ├── filtering.js         Search matching, sorting, facet counts, URL serialisation
│   ├── productImage.js      SVG product artwork generator
│   └── utils.js             Currency formatting, class joining, storage helpers
│
├── hooks/useOverlay.js      Scroll lock, escape key, focus trap
├── data/products.js         Catalogue: 29 products, 8 categories, 10 brands, reviews
└── index.css                Design tokens (@theme), keyframes, component classes
```

### Sections and routes

| Section          | Routes                             | Notes                                              |
| ---------------- | ---------------------------------- | -------------------------------------------------- |
| Public           | `/`                                | Hero, categories, flash deals, featured, reviews   |
| Product browsing | `/shop`, `/product/:productId`     | Faceted filtering; detail with specs and reviews   |
| Authentication   | `/login`, `/signup`                | Rendered outside store chrome in a split layout    |
| Cart             | `/cart` + slide-over drawer        | Quantity, removal, live totals                     |
| Checkout         | `/checkout`, `/order-confirmed`    | Shipping → payment → review, validated per step    |

## How the main features work

**Instant search.** The header `SearchBar` filters the catalogue on every keystroke and shows the
top six matches with keyboard navigation (arrows, Enter, Escape). Press `/` anywhere to focus it.
Submitting sends you to `/shop?q=…`.

**Filters.** Category, brand, price range, minimum rating, availability, free delivery and sort are
all combined with the keyword in `filterAndSortProducts`. The filter panel shows a live result count
next to each facet value, computed with that facet excluded so the numbers reflect what each option
would actually yield.

**URL as state.** Shop filters serialise to the query string, so any filtered view is linkable,
shareable, and works with the browser back button. Deep links like
`/shop?category=audio&rating=4&availability=in-stock&sort=price-asc` render directly.

**Cart maths.** `CartContext` derives subtotal, product savings, promo discount, shipping and tax
(8.25%) from the line items. Standard shipping is free above $250, with a progress meter nudging
toward the threshold. Try promo codes `NOVA10`, `WELCOME25` or `SHIPFREE`.

**Checkout validation.** Each step has its own validator. Continuing runs it and blocks on failure,
marking every offending field and raising a toast. Card entry is formatted as you type and the
expiry is checked against the current date. The confirm button additionally gates on accepting the
terms.

**Authentication.** Login accepts any valid email with a 6+ character password; signup includes a
live password-strength meter and requirement checklist. The session persists in `localStorage`, and
checkout prefills from it. Signed-out users see a login prompt inside the checkout flow.

## Design system

Tokens live in the `@theme` block of `src/index.css`, so Tailwind generates utilities from them
directly:

- **Palettes** — `ink` (neutral), `brand` (indigo), `accent` (sky), plus semantic emerald/amber/rose
- **Typography** — Plus Jakarta Sans for headings, Inter for body
- **Elevation** — `shadow-soft`, `shadow-lift`, `shadow-pop`
- **Motion** — `animate-fade-up`, `animate-scale-in`, `animate-slide-left/right`, `animate-float`

Light theme with dark accent surfaces (navbar strip, membership panel, auth brand panel, footer).
Layouts are responsive from 360px up, with a mobile navigation drawer, a mobile filter sheet, and
grid-to-rail switches on the deal carousels. All animation respects
`prefers-reduced-motion`.

## Accessibility

Semantic landmarks and a skip link, labelled form fields with `aria-invalid` and error messaging,
focus trapping and scroll locking in the modal and drawers, Escape to dismiss, `aria-pressed` and
`aria-selected` on toggles and tabs, visible focus rings throughout, and live-region toasts.

## Notes

This is a front-end UI project. Payments, sessions and orders are simulated in the browser — no card
data is transmitted or stored, and refreshing clears any in-flight order confirmation.
# e-commers-for-devops
