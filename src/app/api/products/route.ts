import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getProductsWithRelations } from "@/lib/queries";
import { newId, nowIso } from "@/lib/id";
import { z } from "zod";

const priceSchema = z.object({
  country: z.string(),
  currency: z.string(),
  price: z.number().positive(),
});

const productSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
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

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await getProductsWithRelations();
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = productSchema.parse(body);
    const supabase = getSupabase();

    const { data: existing } = await supabase.from("Product").select("id").eq("code", data.code).maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "Product code already exists" }, { status: 409 });
    }

    const now = nowIso();
    const product = {
      id: newId(),
      code: data.code,
      name: data.name,
      category: data.category,
      description: data.description,
      specifications: JSON.stringify(data.specifications || {}),
      colors: JSON.stringify(data.colors || []),
      sizes: JSON.stringify(data.sizes || []),
      materials: data.materials || "",
      certifications: data.certifications || "",
      modelNumber: data.modelNumber ?? null,
      imageUrl: data.imageUrl ?? null,
      active: data.active ?? true,
      createdAt: now,
      updatedAt: now,
    };

    const { error } = await supabase.from("Product").insert(product);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    if (data.countryPrices?.length) {
      await supabase.from("CountryPrice").insert(
        data.countryPrices.map((p) => ({
          id: newId(),
          productId: product.id,
          ...p,
        }))
      );
    }

    const full = await getProductsWithRelations();
    const created = full.find((p) => p.id === product.id);
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message || "Validation failed" }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
