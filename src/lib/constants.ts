import type { OrderStatus } from "@prisma/client";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  QUOTE_REQUESTED: "Quote Requested",
  QUOTE_APPROVED: "Quote Approved",
  PRODUCTION_STARTED: "Production Started",
  IN_PRODUCTION: "In Production",
  QUALITY_CHECK: "Quality Check",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "QUOTE_REQUESTED",
  "QUOTE_APPROVED",
  "PRODUCTION_STARTED",
  "IN_PRODUCTION",
  "QUALITY_CHECK",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
];

export const INCOTERMS = ["FOB", "CIF", "DAP", "EXW", "FCA"] as const;

export const COUNTRIES = [
  { code: "US", name: "United States", currency: "USD" },
  { code: "FR", name: "France", currency: "EUR" },
  { code: "DE", name: "Germany", currency: "EUR" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "CN", name: "China", currency: "CNY" },
  { code: "AE", name: "United Arab Emirates", currency: "AED" },
] as const;

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ar", label: "العربية" },
] as const;

export const DEMO_USERS = [
  { email: "admin@charles.com", password: "admin123", name: "System Administrator", role: "ADMIN" as const },
  { email: "sales@charles.com", password: "sales123", name: "Sarah Mitchell", role: "SALES" as const },
  { email: "client@charles.com", password: "client123", name: "Acme Industries", role: "CLIENT" as const, company: "Acme Industries", country: "US" },
];
