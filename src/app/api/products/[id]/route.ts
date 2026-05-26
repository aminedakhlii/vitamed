import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
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
  const product = await prisma.product.findUnique({
    where: { id },
    include: { countryPrices: true, documents: true },
  });

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
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

    if (data.code) {
      const duplicate = await prisma.product.findFirst({
        where: { code: data.code, NOT: { id } },
      });
      if (duplicate) {
        return NextResponse.json({ error: "Product code already in use" }, { status: 409 });
      }
    }

    if (data.countryPrices) {
      await prisma.countryPrice.deleteMany({ where: { productId: id } });
      await prisma.countryPrice.createMany({
        data: data.countryPrices.map((p) => ({ ...p, productId: id })),
      });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.specifications !== undefined && {
          specifications: JSON.stringify(data.specifications),
        }),
        ...(data.colors !== undefined && { colors: JSON.stringify(data.colors) }),
        ...(data.sizes !== undefined && { sizes: JSON.stringify(data.sizes) }),
        ...(data.materials !== undefined && { materials: data.materials }),
        ...(data.certifications !== undefined && { certifications: data.certifications }),
        ...(data.modelNumber !== undefined && { modelNumber: data.modelNumber }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.active !== undefined && { active: data.active }),
      },
      include: { countryPrices: true },
    });

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

  await prisma.product.update({
    where: { id },
    data: { active: false },
  });

  return NextResponse.json({ success: true });
}
