import { getSupabase } from "./db";
import type { CartItem, CountryPrice, Order, OrderStatusHistory, Product, ProductDocument, User } from "./types";

export async function getCartItemsWithProducts(userId: string) {
  const supabase = getSupabase();
  const { data: items, error } = await supabase
    .from("CartItem")
    .select("*")
    .eq("userId", userId);
  if (error) throw error;
  if (!items?.length) return [];

  const productIds = [...new Set(items.map((i) => i.productId))];
  const { data: products } = await supabase.from("Product").select("*").in("id", productIds);
  const { data: prices } = await supabase.from("CountryPrice").select("*").in("productId", productIds);

  const productMap = new Map((products || []).map((p) => [p.id, p as Product]));
  const pricesByProduct = new Map<string, CountryPrice[]>();
  for (const p of prices || []) {
    const list = pricesByProduct.get(p.productId) || [];
    list.push(p as CountryPrice);
    pricesByProduct.set(p.productId, list);
  }

  return items.map((item) => ({
    ...item,
    product: {
      ...productMap.get(item.productId)!,
      countryPrices: pricesByProduct.get(item.productId) || [],
    },
  }));
}

export async function getProductsWithRelations(activeOnly = false): Promise<(Product & { countryPrices: CountryPrice[]; documents: ProductDocument[] })[]> {
  const supabase = getSupabase();
  let q = supabase.from("Product").select("*").order("name");
  if (activeOnly) q = q.eq("active", true);
  const { data: products, error } = await q;
  if (error) throw error;
  if (!products?.length) return [];

  const ids = products.map((p) => p.id);
  const { data: prices } = await supabase.from("CountryPrice").select("*").in("productId", ids);
  const { data: docs } = await supabase.from("ProductDocument").select("*").in("productId", ids);

  const pricesByProduct = new Map<string, CountryPrice[]>();
  const docsByProduct = new Map<string, ProductDocument[]>();
  for (const p of prices || []) {
    const list = pricesByProduct.get(p.productId) || [];
    list.push(p as CountryPrice);
    pricesByProduct.set(p.productId, list);
  }
  for (const d of docs || []) {
    const list = docsByProduct.get(d.productId) || [];
    list.push(d as ProductDocument);
    docsByProduct.set(d.productId, list);
  }

  return products.map((p) => ({
    ...p,
    countryPrices: pricesByProduct.get(p.id) || [],
    documents: docsByProduct.get(p.id) || [],
  }));
}

export async function getProductById(id: string): Promise<Product & { countryPrices: CountryPrice[]; documents: ProductDocument[] }> {
  const supabase = getSupabase();
  const { data: product, error } = await supabase.from("Product").select("*").eq("id", id).single();
  if (error) throw error;
  const { data: prices } = await supabase.from("CountryPrice").select("*").eq("productId", id);
  const { data: docs } = await supabase.from("ProductDocument").select("*").eq("productId", id);
  return {
    ...(product as Product),
    countryPrices: (prices || []) as CountryPrice[],
    documents: (docs || []) as ProductDocument[],
  };
}

export type CartItemWithProduct = CartItem & {
  product: Product & { countryPrices: CountryPrice[] };
};

export async function getOrdersWithUsers(userId?: string) {
  const supabase = getSupabase();
  let q = supabase.from("Order").select("*").order("createdAt", { ascending: false });
  if (userId) q = q.eq("userId", userId);
  const { data: orders, error } = await q;
  if (error) throw error;
  if (!orders?.length) return [];

  const userIds = [...new Set(orders.map((o) => o.userId))];
  const { data: users } = await supabase.from("User").select("id, name, company").in("id", userIds);
  const userMap = new Map((users || []).map((u) => [u.id, u]));
  return orders.map((o) => ({ ...o, user: userMap.get(o.userId) }));
}

export async function getOrderById(id: string): Promise<
  Order & {
    user: Pick<User, "name" | "company" | "email"> | null;
    statusHistory: OrderStatusHistory[];
  }
> {
  const supabase = getSupabase();
  const { data: order, error } = await supabase.from("Order").select("*").eq("id", id).single();
  if (error) throw error;
  const { data: user } = await supabase
    .from("User")
    .select("name, company, email")
    .eq("id", order.userId)
    .single();
  const { data: statusHistory } = await supabase
    .from("OrderStatusHistory")
    .select("*")
    .eq("orderId", id)
    .order("createdAt", { ascending: true });
  return {
    ...(order as Order),
    user: user as Pick<User, "name" | "company" | "email"> | null,
    statusHistory: (statusHistory || []) as OrderStatusHistory[],
  };
}
