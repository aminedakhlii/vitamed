# Supabase setup (no Prisma migrations)

## 1. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Save your database password

## 2. Create tables (one-time)

1. Open **SQL Editor** in Supabase
2. Paste and run the full contents of **`supabase/schema.sql`**
3. Confirm tables appear under **Table Editor** (`User`, `Product`, `Order`, etc.)

## 3. Get API keys

**Project Settings → API**

| Variable | Where |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (secret — server only) |

Copy `.env.example` → `.env` and fill in values.

## 4. Migrate data from local SQLite

If you still have `prisma/dev.db` with your catalogue and demo users:

```bash
npm install
npm run db:migrate-to-supabase
```

This copies all rows from SQLite into Supabase (users, products, orders, etc.).

## 5. Run locally

```bash
npm run dev
```

Login: `admin@charles.com` / `admin123` (after migration)

## 6. Deploy on Vercel

Add environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`

Connect GitHub repo → Deploy. No database migrations run at build time.

## Notes

- The app uses **custom JWT auth** (not Supabase Auth). Server routes use the **service role** key to read/write data.
- The **anon/publishable key** is available for future client-side Supabase usage.
- Re-run `npm run db:migrate-to-supabase` anytime to refresh Supabase from your local SQLite backup.
