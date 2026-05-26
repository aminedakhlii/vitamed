# Charles Platform

Corporate B2B web app for client communication, product management, quotations, order tracking, and after-sales service.

**Next.js 16 · TypeScript · Tailwind · Supabase (PostgreSQL)**

## Quick start

1. Create a [Supabase](https://supabase.com) project
2. Run **`supabase/schema.sql`** in the Supabase SQL Editor
3. Copy env file and add your keys:

```bash
cp .env.example .env
```

4. Migrate existing local data (optional):

```bash
npm install
npm run db:migrate-to-supabase
```

5. Start the app:

```bash
npm run dev
```

Full guide: **[docs/SUPABASE.md](docs/SUPABASE.md)**

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable (anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server secret (API routes) |
| `JWT_SECRET` | Session signing secret |

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@charles.com | admin123 |
| Sales | sales@charles.com | sales123 |
| Client | client@charles.com | client123 |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run db:migrate-to-supabase` | Copy SQLite → Supabase |
| `npm run db:parse-catalog` | Parse VITAIMED PDF → JSON |
| `npm run build` | Production build |
