FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Dependencies are installed in their own layer so source edits do not
# invalidate the npm cache.
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

FROM base AS runtime
RUN apk add --no-cache curl && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack && \
    rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
COPY public ./public

# Run unprivileged; the node image already provides this user.
USER node

EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD curl -fsS http://127.0.0.1:4000/api/v1/health || exit 1

CMD ["node", "src/server.js"]
