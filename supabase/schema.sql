-- Run once in Supabase Dashboard → SQL Editor
-- Creates all tables (no Prisma migrations). RLS disabled for custom JWT auth + service role.

create extension if not exists "pgcrypto";

-- Users
create table if not exists "User" (
  id text primary key,
  email text unique not null,
  "passwordHash" text not null,
  name text not null,
  role text not null default 'CLIENT' check (role in ('ADMIN', 'SALES', 'CLIENT')),
  language text not null default 'en',
  country text,
  company text,
  phone text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "Product" (
  id text primary key,
  code text unique not null,
  name text not null,
  category text not null,
  description text not null,
  specifications text not null default '{}',
  colors text not null default '[]',
  sizes text not null default '[]',
  materials text not null default '',
  certifications text not null default '',
  "modelNumber" text,
  "imageUrl" text,
  active boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "ProductDocument" (
  id text primary key,
  "productId" text not null references "Product"(id) on delete cascade,
  name text not null,
  "docType" text not null,
  "fileUrl" text not null
);

create table if not exists "CountryPrice" (
  id text primary key,
  "productId" text not null references "Product"(id) on delete cascade,
  country text not null,
  currency text not null,
  price double precision not null,
  unique ("productId", country)
);

create table if not exists "CartItem" (
  id text primary key,
  "userId" text not null references "User"(id) on delete cascade,
  "productId" text not null references "Product"(id) on delete cascade,
  quantity integer not null default 1,
  color text,
  size text,
  packaging text,
  "deliveryNotes" text,
  unique ("userId", "productId", color, size)
);

create table if not exists "Quotation" (
  id text primary key,
  "userId" text not null references "User"(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED')),
  items text not null,
  notes text,
  incoterm text,
  country text,
  "salesMessage" text,
  "respondedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "Order" (
  id text primary key,
  "orderNumber" text unique not null,
  "userId" text not null references "User"(id) on delete cascade,
  "quotationId" text references "Quotation"(id) on delete set null,
  status text not null default 'QUOTE_REQUESTED',
  incoterm text,
  "destinationCountry" text,
  "shippingCost" double precision,
  "estimatedDelivery" timestamptz,
  "trackingNumber" text,
  items text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "OrderStatusHistory" (
  id text primary key,
  "orderId" text not null references "Order"(id) on delete cascade,
  status text not null,
  note text,
  "createdAt" timestamptz not null default now()
);

create table if not exists "Notification" (
  id text primary key,
  "userId" text not null references "User"(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'SYSTEM',
  read boolean not null default false,
  link text,
  "createdAt" timestamptz not null default now()
);

create table if not exists "SupportTicket" (
  id text primary key,
  "ticketNumber" text unique not null,
  "userId" text not null references "User"(id) on delete cascade,
  "assignedToId" text references "User"(id) on delete set null,
  "orderId" text references "Order"(id) on delete set null,
  type text not null,
  subject text not null,
  description text not null,
  status text not null default 'OPEN',
  attachments text not null default '[]',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "FollowUp" (
  id text primary key,
  "clientId" text not null references "User"(id) on delete cascade,
  "salesUserId" text references "User"(id) on delete set null,
  type text not null,
  subject text not null,
  message text not null,
  "scheduledAt" timestamptz not null,
  completed boolean not null default false,
  automated boolean not null default true,
  "createdAt" timestamptz not null default now()
);

-- Optional: allow anon/authenticated access if you use client-side Supabase later
alter table "User" enable row level security;
alter table "Product" enable row level security;
alter table "ProductDocument" enable row level security;
alter table "CountryPrice" enable row level security;
alter table "CartItem" enable row level security;
alter table "Quotation" enable row level security;
alter table "Order" enable row level security;
alter table "OrderStatusHistory" enable row level security;
alter table "Notification" enable row level security;
alter table "SupportTicket" enable row level security;
alter table "FollowUp" enable row level security;

-- Service role bypasses RLS. For anon key from the app API, use permissive policies or only call Supabase from server with service role.
create policy "service_all_users" on "User" for all using (true) with check (true);
create policy "service_all_products" on "Product" for all using (true) with check (true);
create policy "service_all_product_documents" on "ProductDocument" for all using (true) with check (true);
create policy "service_all_country_prices" on "CountryPrice" for all using (true) with check (true);
create policy "service_all_cart_items" on "CartItem" for all using (true) with check (true);
create policy "service_all_quotations" on "Quotation" for all using (true) with check (true);
create policy "service_all_orders" on "Order" for all using (true) with check (true);
create policy "service_all_order_status_history" on "OrderStatusHistory" for all using (true) with check (true);
create policy "service_all_notifications" on "Notification" for all using (true) with check (true);
create policy "service_all_support_tickets" on "SupportTicket" for all using (true) with check (true);
create policy "service_all_follow_ups" on "FollowUp" for all using (true) with check (true);
