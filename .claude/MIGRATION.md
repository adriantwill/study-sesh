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

### Database: Supabase → Self-hosted Postgres (VPS)
Best for learning SQL, Linux sysadmin, and database management.

**Setup on VPS:**
```bash
sudo apt install postgresql
sudo -u postgres createuser studysesh -P  # prompts for password
sudo -u postgres createdb studysesh -O studysesh
```

**Connection from Docker app:**
```bash
# .env
DATABASE_URL="postgresql://studysesh:password@host.docker.internal:5432/studysesh"
# or use Docker bridge IP: 172.17.0.1
```

**Allow Docker connections** (edit `/etc/postgresql/*/main/pg_hba.conf`):
```
host    studysesh    studysesh    172.17.0.0/16    scram-sha-256
```

**Restart Postgres:**
```bash
sudo systemctl restart postgresql
```

**Replace Supabase client with postgres.js:**
```typescript
// src/lib/db.ts
import postgres from 'postgres'
const sql = postgres(process.env.DATABASE_URL!)
export default sql

// Usage in actions.ts
const questions = await sql`SELECT * FROM questions WHERE upload_id = ${id}`
```

**Backup cron job** (add to `/etc/cron.daily/pg-backup`):
```bash
#!/bin/bash
pg_dump -U studysesh studysesh | gzip > /backups/studysesh-$(date +%Y%m%d).sql.gz
find /backups -mtime +7 -delete  # keep 7 days
```

**Migration steps:**
1. Export from Supabase: Dashboard → Settings → Database → Connection string → `pg_dump`
2. Import: `psql -U studysesh -d studysesh < dump.sql`
3. Install postgres.js: `npm install postgres`
4. Replace Supabase queries with raw SQL
5. Update env vars

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
| VPS Postgres | Free (uses VPS resources) | - |
| R2 | 10GB storage, free egress | $0.015/GB storage |
| Auth.js | Free (self-hosted) | - |

## When to Migrate
- Approaching Supabase free limits
- Adding auth (natural breakpoint)
- Frustrated with Supabase pricing/reliability
- Want to learn SQL/sysadmin (self-hosted Postgres)

## Current Lock-in Points
- `src/lib/storage.ts` - storage abstraction (ready to swap)
- `src/lib/supabase/` - client setup
- `src/app/actions.ts` - uses Supabase query builder (standard SQL)
