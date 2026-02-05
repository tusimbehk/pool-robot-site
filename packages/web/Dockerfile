# Dockerfile for PoolClean Pro Web Application
# Multi-stage build for optimized production image

# Base image with dependencies
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables
ARG NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
ARG NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
ARG NEXT_PUBLIC_SEGMENT_WRITE_KEY
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_CHATWOOT_TOKEN

ENV NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=${NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}
ENV NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=${NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN}
ENV NEXT_PUBLIC_SEGMENT_WRITE_KEY=${NEXT_PUBLIC_SEGMENT_WRITE_KEY}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
ENV NEXT_PUBLIC_CHATWOOT_TOKEN=${NEXT_PUBLIC_CHATWOOT_TOKEN}

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm build

# Production runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
