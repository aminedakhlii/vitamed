import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { getSession, createNotification } from "@/lib/auth";
import { newId, nowIso } from "@/lib/id";
import type { OrderStatus } from "@/lib/types";
import { z } from "zod";

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
    const supabase = getSupabase();

    const { data: order, error } = await supabase
      .from("Order")
      .update({ status, updatedAt: nowIso() })
      .eq("id", id)
      .select()
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await supabase.from("OrderStatusHistory").insert({
      id: newId(),
      orderId: id,
      status: status as OrderStatus,
      note: note ?? null,
      createdAt: nowIso(),
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
