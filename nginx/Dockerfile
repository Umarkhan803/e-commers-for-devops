

FROM node:22-alpine AS frontend-build
WORKDIR /build

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
ENV VITE_API_BASE_URL=/api/v1
RUN npm run build

FROM nginx:1.27-alpine AS runtime

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/conf.d/ /etc/nginx/conf.d/
COPY --from=frontend-build /build/dist /usr/share/nginx/html

RUN mkdir -p /var/cache/nginx/images && chown -R nginx:nginx /var/cache/nginx

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
