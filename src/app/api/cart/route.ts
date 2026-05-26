import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.cartItem.findMany({
    where: { userId: session.id },
    include: { product: { include: { countryPrices: true } } },
  });

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
    const existing = await prisma.cartItem.findFirst({
      where: {
        userId: session.id,
        productId: data.productId,
        color: data.color ?? null,
        size: data.size ?? null,
      },
    });

    if (existing) {
      const updated = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + data.quantity },
        include: { product: true },
      });
      return NextResponse.json(updated);
    }

    const item = await prisma.cartItem.create({
      data: { userId: session.id, ...data },
      include: { product: true },
    });
    return NextResponse.json(item);
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

  await prisma.cartItem.deleteMany({ where: { id, userId: session.id } });
  return NextResponse.json({ success: true });
}
