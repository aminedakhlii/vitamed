import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, createNotification } from "@/lib/auth";
import { z } from "zod";
import type { OrderStatus } from "@prisma/client";

const schema = z.object({
  status: z.enum([
    "QUOTE_REQUESTED",
    "QUOTE_APPROVED",
    "PRODUCTION_STARTED",
    "IN_PRODUCTION",
    "QUALITY_CHECK",
    "PACKED",
    "SHIPPED",
    "DELIVERED",
  ]),
  note: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SALES")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { status, note } = schema.parse(await request.json());

    const order = await prisma.order.update({
      where: { id },
      data: { status: status as OrderStatus },
      include: { user: true },
    });

    await prisma.orderStatusHistory.create({
      data: { orderId: id, status: status as OrderStatus, note },
    });

    const type = status === "SHIPPED" ? "SHIPPING" : "ORDER";
    await createNotification(
      order.userId,
      "Order Status Updated",
      `Order ${order.orderNumber} is now: ${status.replace(/_/g, " ")}${note ? ` — ${note}` : ""}`,
      type
    );

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
