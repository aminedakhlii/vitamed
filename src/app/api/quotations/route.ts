import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, createNotification } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where =
    session.role === "CLIENT"
      ? { userId: session.id }
      : session.role === "SALES"
        ? {}
        : {};

  const quotations = await prisma.quotation.findMany({
    where,
    include: { user: { select: { name: true, email: true, company: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(quotations);
}

const createSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      quantity: z.number(),
      unitPrice: z.number().optional(),
      color: z.string().optional(),
      size: z.string().optional(),
      packaging: z.string().optional(),
    })
  ),
  notes: z.string().optional(),
  incoterm: z.string().optional(),
  country: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = createSchema.parse(await request.json());

    const quotation = await prisma.quotation.create({
      data: {
        userId: session.id,
        items: JSON.stringify(data.items),
        notes: data.notes,
        incoterm: data.incoterm,
        country: data.country,
        status: "PENDING",
      },
    });

    const salesUsers = await prisma.user.findMany({ where: { role: "SALES" } });
    for (const u of salesUsers) {
      await createNotification(
        u.id,
        "New Quotation Request",
        `${session.name} submitted a quotation request.`,
        "ORDER"
      );
    }

    await createNotification(
      session.id,
      "Quotation Submitted",
      "Your quotation request has been received. Our team will respond shortly.",
      "ORDER"
    );

    return NextResponse.json(quotation);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
