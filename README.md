# Nova Commerce

Full-stack premium e-commerce storefront with a React + Vite frontend, Express + MongoDB + Redis
API, and Nginx reverse proxy. Product imagery is real Apple, Samsung, boAt and Noise catalogue
photos downloaded locally and served by the API.

```
nova-commerce/
├── frontend/          React 19 + Vite + Tailwind CSS v4 SPA
├── backend/           Express API, Mongoose models, Redis cache, seed scripts
├── nginx/             SPA + /api + /images reverse proxy
└── docker-compose.yml Mongo (replica set) · Redis · API · Nginx
```

## Quick start (Docker)

Requires Docker Desktop. From the project root:

```bash
docker compose up -d --build
docker compose --profile seed run --rm seed
```

| Service | URL |
| ------- | --- |
| Storefront (Nginx) | http://localhost:8081 |
| API (direct) | http://localhost:4000/api/v1 |
| MongoDB | `localhost:27017` |
| Redis | `localhost:6379` |

> Port **8081** is used for the web container because **8080** is often already taken on Windows.
> Change it in `docker-compose.yml` if you prefer another host port.

Demo account created by the seed:

- Email: `demo@nova.test`
- Password: `Password123`

Promo codes: `NOVA10`, `WELCOME15`, `FREESHIP`, `SAVE25`.

Stop everything with `docker compose down`. Wipe volumes with `docker compose down -v`.

### API smoke test

```bash
docker compose exec -T api node src/scripts/smoke-api.mjs
```

## Local development (without Docker for the SPA)

1. Keep Mongo + Redis running via Compose:

```bash
docker compose up -d mongo mongo-init redis
```

2. Backend:

```bash
cd backend
cp .env.example .env
npm install
npm run seed          # loads catalogue.json into Mongo
npm run dev           # http://localhost:4000
```

3. Frontend (proxies `/api` and `/images` to the API via Vite):

```bash
cd frontend
npm install
npm run dev           # http://localhost:5173
```

Refresh the product catalogue (images + `catalogue.json`) with:

```bash
cd backend
npm run catalogue:fetch
npm run seed:fresh
```

## Architecture

```
Browser ──► Nginx (:80 / host :8081)
              ├─ /            → React SPA (built assets)
              ├─ /api/*       → Express API (:4000)
              └─ /images/*    → Express static (product photos)

Express
  ├─ MongoDB   products, users, carts, orders, reviews (replica set for transactions)
  └─ Redis     response cache, rate limits, refresh-token whitelist
```

### Frontend sections

| Section | Routes | Notes |
| ------- | ------ | ----- |
| Public | `/` | Hero, categories, deals, featured tabs — all API-driven |
| Shop | `/shop`, `/product/:slug` | Faceted filters, suggestions, related products |
| Auth | `/login`, `/signup` | JWT access token + httpOnly refresh cookie |
| Cart | `/cart` + drawer | Server-priced totals, promo codes, shipping |
| Checkout | `/checkout`, `/order-confirmed` | Validated multi-step; `POST /orders` |

### Backend layers

```
backend/src/
├── config/        env, mongo, redis
├── models/        Product, Category, Brand, User, Cart, Order, Review
├── services/      product filters, pricing, cache, JWT tokens
├── controllers/   products, auth, cart, orders, wishlist
├── middleware/    auth, validate (Zod), cache, rateLimit, errors
├── routes/        /api/v1/*
├── seed/          catalogue.json + seed.js
└── scripts/       fetch-catalogue.mjs, smoke-api.mjs
```

## Key APIs

Base path: `/api/v1` (also aliased at `/api`).

### Catalogue

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/products` | Fetch-all with combined filters, sort, pagination. Query: `q`, `category`, `brand`, `minPrice`, `maxPrice`, `minRating`, `inStock`, `onSale`, `tags`, `sort`, `page`, `limit`, `facets` |
| `GET` | `/products/filters` | Live facet metadata + counts for the current selection |
| `GET` | `/products/suggest?q=` | Lightweight typeahead suggestions |
| `GET` | `/products/:slug` | Product detail |
| `GET` | `/products/:slug/related` | Related products |
| `GET` | `/products/:slug/reviews` | Reviews |
| `POST` | `/products/:slug/reviews` | Create review (auth) |
| `GET` | `/categories` | Category taxonomy |
| `GET` | `/brands` | Brand taxonomy |
| `GET` | `/promotions` | Available promo codes |

### Auth / account

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `POST` | `/auth/register` | Create account + issue tokens |
| `POST` | `/auth/login` | Sign in (merges guest cart) |
| `POST` | `/auth/refresh` | Rotate refresh cookie → new access token |
| `POST` | `/auth/logout` | Revoke refresh token |
| `GET` | `/auth/me` | Current user |
| `POST` | `/auth/addresses` | Add a shipping address |

### Cart / wishlist / orders

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET/POST/PATCH/DELETE` | `/cart`, `/cart/items`, `/cart/promo`, `/cart/shipping` | Guest (`X-Session-Id`) or member cart |
| `GET/POST/DELETE` | `/wishlist`, `/wishlist/:slug` | Saved products (auth) |
| `POST` | `/orders` | Place order (transactional stock decrement) |
| `GET` | `/orders`, `/orders/:reference` | History / receipt |

### Example: fetch-all with filters

```bash
curl "http://localhost:4000/api/v1/products?brand=apple,samsung&minRating=4&sort=discount&limit=12&facets=1"
curl "http://localhost:4000/api/v1/products/filters?category=audio&inStock=true"
```

Responses wrap payloads as `{ success, data, meta? }` and set `X-Cache: HIT|MISS` on cacheable GETs.

## Frontend design system

Tokens live in `frontend/src/index.css` (`@theme`):

- **Palettes** — `ink`, `brand`, `accent`, plus semantic emerald / amber / rose
- **Typography** — Plus Jakarta Sans (display), Inter (body)
- **Elevation** — `shadow-soft`, `shadow-lift`, `shadow-pop`
- **Motion** — respects `prefers-reduced-motion`

Responsive from ~360px up with a mobile nav drawer and filter sheet.

## Environment

See `backend/.env.example`. Compose injects production defaults; override JWT secrets in a `.env`
next to `docker-compose.yml`:

```env
JWT_ACCESS_SECRET=replace-me
JWT_REFRESH_SECRET=replace-me-too
```

## Notes

- Card payments are simulated — only the last four digits are stored.
- Redis is optional at runtime: if it is down, caching and rate limiting degrade gracefully.
- Order placement prefers a MongoDB transaction (replica set) and falls back to sequential writes on a standalone `mongod`.
