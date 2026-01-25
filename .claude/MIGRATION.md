# Future Migration Guide

## Current Stack
- Supabase Postgres (standard SQL, portable)
- Supabase Storage (abstracted in `src/lib/storage.ts`)
- No auth yet

## Migration Targets

### Database: Supabase → Neon Postgres
- Dump: `pg_dump` from Supabase
- Import to Neon
- Swap connection string
- Replace Supabase client with Drizzle or Prisma
- Queries are standard CRUD, map 1:1

### Storage: Supabase → Cloudflare R2
- R2 has zero egress fees
- S3-compatible API
- Update `src/lib/storage.ts` only:
```ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

export async function uploadFile(path: string, file: File) {
  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: path,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type,
  }));
  return { error: null };
}

export async function getPublicUrl(path: string): Promise<string> {
  return `https://${BUCKET}.${ACCOUNT_ID}.r2.dev/${path}`;
}
```

### Auth: Add Auth.js (not Passport.js)
- Auth.js is Next.js native, Passport.js is Express-era
- Google OAuth ~15 lines config
- Works with App Router + server actions
- Install: `npm install next-auth@beta`
- Docs: https://authjs.dev

## Pricing Comparison

| Service | Free Tier | Paid |
|---------|-----------|------|
| Supabase | 500MB DB, 1GB storage | $25/mo minimum |
| Neon | 512MB, scales to zero | Pay-per-use |
| R2 | 10GB storage, free egress | $0.015/GB storage |
| Auth.js | Free (self-hosted) | - |

## When to Migrate
- Approaching Supabase free limits
- Adding auth (natural breakpoint)
- Frustrated with Supabase pricing/reliability

## Current Lock-in Points
- `src/lib/storage.ts` - storage abstraction (ready to swap)
- `src/lib/supabase/` - client setup
- `src/app/actions.ts` - uses Supabase query builder (standard SQL)
