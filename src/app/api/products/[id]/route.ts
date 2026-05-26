import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getProductById } from "@/lib/queries";
import { newId, nowIso } from "@/lib/id";
import { z } from "zod";

const priceSchema = z.object({
  country: z.string(),
  currency: z.string(),
  price: z.number().positive(),
});

const productSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  specifications: z.record(z.string(), z.string()).optional(),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  materials: z.string().optional(),
  certifications: z.string().optional(),
  modelNumber: z.string().optional(),
  imageUrl: z.string().optional(),
  active: z.boolean().optional(),
  countryPrices: z.array(priceSchema).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const product = await getProductById(id);
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data = productSchema.parse(body);
    const supabase = getSupabase();

    if (data.code) {
      const { data: duplicate } = await supabase
        .from("Product")
        .select("id")
        .eq("code", data.code)
        .neq("id", id)
        .maybeSingle();
      if (duplicate) {
        return NextResponse.json({ error: "Product code already in use" }, { status: 409 });
      }
    }

    if (data.countryPrices) {
      await supabase.from("CountryPrice").delete().eq("productId", id);
      if (data.countryPrices.length) {
        await supabase.from("CountryPrice").insert(
          data.countryPrices.map((p) => ({ id: newId(), productId: id, ...p }))
        );
      }
    }

    const updates: Record<string, unknown> = { updatedAt: nowIso() };
    if (data.code !== undefined) updates.code = data.code;
    if (data.name !== undefined) updates.name = data.name;
    if (data.category !== undefined) updates.category = data.category;
    if (data.description !== undefined) updates.description = data.description;
    if (data.specifications !== undefined) updates.specifications = JSON.stringify(data.specifications);
    if (data.colors !== undefined) updates.colors = JSON.stringify(data.colors);
    if (data.sizes !== undefined) updates.sizes = JSON.stringify(data.sizes);
    if (data.materials !== undefined) updates.materials = data.materials;
    if (data.certifications !== undefined) updates.certifications = data.certifications;
    if (data.modelNumber !== undefined) updates.modelNumber = data.modelNumber;
    if (data.imageUrl !== undefined) updates.imageUrl = data.imageUrl;
    if (data.active !== undefined) updates.active = data.active;

    const { error } = await supabase.from("Product").update(updates).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const product = await getProductById(id);
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await getSupabase().from("Product").update({ active: false, updatedAt: nowIso() }).eq("id", id);
  return NextResponse.json({ success: true });
}
