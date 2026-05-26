# Charles Platform

Corporate B2B web application for client communication, product management, quotations, order tracking, and after-sales service.

Built with **Next.js 16**, **TypeScript**, **Tailwind CSS**, **Prisma**, and **SQLite**.

## MVP Features

- User authentication (register, login, password reset UI, role-based access)
- Product catalog with specifications, documents, and country-based pricing
- Shopping cart and quotation requests
- Order tracking with timeline and status updates
- Admin, sales, and client dashboards
- AI client follow-up automation queue
- In-app notification center
- After-sales support ticketing

## VITAIMED Catalogue Import

Products from `VITAIMED--Catalogue.pdf` (from page 14) can be loaded into the database:

```bash
npm run db:parse-catalog    # Extract products → prisma/vitaimed-products.json
npm run db:import-vitaimed  # Replace catalog products in the database
```

The catalogue PDF is also served at `/docs/VITAIMED--Catalogue.pdf` on each product’s documents tab. Pricing is set to **0** until you enter country prices in Admin → Manage Products.

## Managing Products (Admin)

1. Sign in as **admin@charles.com** / `admin123`
2. Open **Manage Products** in the sidebar (or go to `/dashboard/admin/products`)
3. Click **Add product** to create a new one, or **Edit** on an existing row
4. Use **Deactivate** to hide a product from the catalog (soft delete)

Sales and client accounts can browse the catalog but cannot add or edit products.

## Demo Accounts

| Role   | Email               | Password   |
|--------|---------------------|------------|
| Admin  | admin@charles.com   | admin123   |
| Sales  | sales@charles.com   | sales123   |
| Client | client@charles.com  | client123  |

## Getting Started

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — Start development server
- `npm run db:setup` — Run migrations and seed demo data
- `npm run build` — Production build

## Requirements

See `docs/req.txt` for the full specification. Mobile app scope is excluded from this MVP.
