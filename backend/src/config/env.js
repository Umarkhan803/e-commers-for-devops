import "dotenv/config";

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined)
    throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const isProduction = process.env.NODE_ENV === "production";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction,
  port: Number(process.env.PORT ?? 4000),
  apiPrefix: process.env.API_PREFIX ?? "/api/v1",

  mongoUri: required("MONGO_URI"),
  redisUrl: required("REDIS_URL", "redis://127.0.0.1:6379"),

  jwt: {
    accessSecret: required(
      "JWT_ACCESS_SECRET",
      isProduction ? undefined : "dev-access-secret-change-me",
    ),
    refreshSecret: required(
      "JWT_REFRESH_SECRET",
      isProduction ? undefined : "dev-refresh-secret-change-me",
    ),
    accessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL ?? "30d",
    refreshTtlSeconds: Number(
      process.env.JWT_REFRESH_TTL_SECONDS ?? 60 * 60 * 24 * 30,
    ),
  },

  cache: {
    // Product data changes rarely; catalogue reads are the hot path.
    productListTtl: Number(process.env.CACHE_PRODUCT_LIST_TTL ?? 120),
    productDetailTtl: Number(process.env.CACHE_PRODUCT_DETAIL_TTL ?? 300),
    filterTtl: Number(process.env.CACHE_FILTER_TTL ?? 600),
    suggestTtl: Number(process.env.CACHE_SUGGEST_TTL ?? 60),
  },

  rateLimit: {
    windowSeconds: Number(process.env.RATE_LIMIT_WINDOW ?? 60),
    max: Number(process.env.RATE_LIMIT_MAX ?? 300),
    authMax: Number(process.env.RATE_LIMIT_AUTH_MAX ?? 12),
  },

  corsOrigins: (
    process.env.CORS_ORIGINS ?? "http://localhost:5173,http://localhost:8080"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),

  tax: {
    rate: Number(process.env.TAX_RATE ?? 0.08),
  },
  shipping: {
    freeThreshold: Number(process.env.FREE_SHIPPING_THRESHOLD ?? 100),
    standardFee: Number(process.env.STANDARD_SHIPPING_FEE ?? 9.99),
    expressFee: Number(process.env.EXPRESS_SHIPPING_FEE ?? 24.99),
  },
};
