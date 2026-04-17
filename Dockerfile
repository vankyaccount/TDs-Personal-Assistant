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

RUN apk add --no-cache openssl

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

# --- Copy client build to where server expects it ---
COPY --from=client-build /app/client/dist ../client/dist

# --- Entrypoint ---
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

CMD ["/app/entrypoint.sh"]
