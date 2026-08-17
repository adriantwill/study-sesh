FROM node:22-slim AS base

# Install dependencies
FROM base AS deps
# python3 and make/g++ might still be needed for other native modules, 
# but we removed the heavy graphics libraries
RUN apt-get update && apt-get install -y \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Build arguments for Next.js static generation
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG APP_VERSION=development
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN --mount=type=secret,id=DATABASE_URL,required=true \
    --mount=type=secret,id=BETTER_AUTH_SECRET,required=true \
    --mount=type=secret,id=BETTER_AUTH_URL,required=true \
    export DATABASE_URL="$(cat /run/secrets/DATABASE_URL)" && \
    export BETTER_AUTH_SECRET="$(cat /run/secrets/BETTER_AUTH_SECRET)" && \
    export BETTER_AUTH_URL="$(cat /run/secrets/BETTER_AUTH_URL)" && \
    printf '{"version":"%s"}\n' "$APP_VERSION" > public/version.json && \
    npm run build

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install runtime dependencies for pdf-poppler
RUN apt-get update && apt-get install -y \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy node_modules from deps stage
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

RUN mkdir -p temp && chown nextjs:nodejs temp

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
