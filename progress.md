# Better Auth Integration Progress

## Goal

Add Better Auth with Google OAuth without using Supabase Auth.

## Architecture Decision

- Use Better Auth as the auth system.
- Store auth data in Postgres.
- Use Supabase Postgres temporarily.
- Later, migrate auth tables and app tables to regular PostgreSQL.
- Do not couple this project to Supabase Auth.

## Learning Rule

I want to understand all auth code before it is added.

- Do not add app code unless I explicitly approve that step.
- Before each code step, explain what file will change and why.
- Keep changes small enough to review and understand.
- Update this file as we move through the integration.

## Schema Strategy

Use Option B:

- Generate the Better Auth schema first.
- Inspect the generated schema before applying it.
- Do not run DB migrations until the generated tables are reviewed.

## Current Status

- [x] Decided not to use Supabase Auth
- [x] Switched from Auth.js plan to Better Auth
- [x] Chose schema strategy: generate first, inspect, then apply
- [x] Choose exact Better Auth database setup
- [x] Add Better Auth dependencies
- [x] Create minimal Better Auth config for schema generation
- [x] Generate Better Auth schema
- [x] Review generated auth tables
- [ ] Apply approved schema to Postgres
- [ ] Add Google OAuth config
- [ ] Add auth API route
- [ ] Add sign-in and sign-out UI
- [ ] Protect app routes
- [ ] Add user ownership to uploads, tables, and folders
- [ ] Add authorization checks for edits and deletes

## Next Step

Approve and apply the reviewed Better Auth schema to Postgres.

Current setup:

- Use Better Auth with `pg`.
- Use Supabase Postgres through `DATABASE_URL`.
- Use Supabase Session Pooler locally if the direct database URL fails on IPv6.
- Generated schema file: `better-auth_migrations/2026-05-16T18-28-36.572Z.sql`

No app code or DB migration should be added in the next step without approval.
