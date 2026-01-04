FROM node:20-slim AS base

# Install dependencies
FROM base AS deps
RUN apt-get update && apt-get install -y python3 make g++ libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm cache clean --force

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Build arguments for Next.js static generation
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install runtime dependencies for canvas
RUN apt-get update && apt-get install -y libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libjpeg62-turbo libgif7 librsvg2-2 fonts-liberation fontconfig && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
