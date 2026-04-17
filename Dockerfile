# ---- Stage 1: Build Client ----
FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# ---- Stage 2: Build Server ----
FROM node:22-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ .
RUN npx prisma generate
RUN npm run build

# ---- Stage 3: Production ----
FROM node:22-alpine

# Install nginx + openssl (needed by Prisma)
RUN apk add --no-cache nginx openssl

# --- Setup server ---
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy compiled output and prisma assets from build stage
COPY --from=server-build /app/server/dist ./dist
COPY --from=server-build /app/server/node_modules/.prisma ./node_modules/.prisma
COPY --from=server-build /app/server/node_modules/@prisma ./node_modules/@prisma
COPY --from=server-build /app/server/prisma ./prisma
COPY --from=server-build /app/server/tsconfig.json ./

# Prisma CLI for runtime migrations
RUN npm install prisma

# --- Setup client ---
COPY --from=client-build /app/client/dist /usr/share/nginx/html

# --- Nginx config ---
COPY nginx.conf /etc/nginx/http.d/default.conf

# Ensure nginx pid/log dirs exist
RUN mkdir -p /run/nginx /var/log/nginx

# --- Entrypoint ---
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 80

CMD ["/app/entrypoint.sh"]
