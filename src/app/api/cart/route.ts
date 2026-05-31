import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCartItemsWithProducts } from "@/lib/queries";
import { newId } from "@/lib/id";
import { z } from "zod";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await getCartItemsWithProducts(session.id);
  return NextResponse.json(items);
}

const addSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive().default(1),
  color: z.string().optional(),
  size: z.string().optional(),
  packaging: z.string().optional(),
  deliveryNotes: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = addSchema.parse(await request.json());
    const supabase = getSupabase();

    let q = supabase
      .from("CartItem")
      .select("*")
      .eq("userId", session.id)
      .eq("productId", data.productId);
    if (data.color) q = q.eq("color", data.color);
    else q = q.is("color", null);
    if (data.size) q = q.eq("size", data.size);
    else q = q.is("size", null);

    const { data: existing } = await q.maybeSingle();

    if (existing) {
      const { data: updated, error } = await supabase
        .from("CartItem")
        .update({ quantity: existing.quantity + data.quantity })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      const { data: product } = await supabase.from("Product").select("*").eq("id", data.productId).single();
      return NextResponse.json({ ...updated, product });
    }

    const row = {
      id: newId(),
      userId: session.id,
      productId: data.productId,
      quantity: data.quantity,
      color: data.color ?? null,
      size: data.size ?? null,
      packaging: data.packaging ?? null,
      deliveryNotes: data.deliveryNotes ?? null,
    };
    const { data: item, error } = await supabase.from("CartItem").insert(row).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const { data: product } = await supabase.from("Product").select("*").eq("id", data.productId).single();
    return NextResponse.json({ ...item, product });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

const patchSchema = z.object({
  id: z.string(),
  quantity: z.number().int().min(1),
});

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, quantity } = patchSchema.parse(await request.json());
    const { data, error } = await getSupabase()
      .from("CartItem")
      .update({ quantity })
      .eq("id", id)
      .eq("userId", session.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await getSupabase().from("CartItem").delete().eq("id", id).eq("userId", session.id);
  return NextResponse.json({ success: true });
}
