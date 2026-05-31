import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { getSession, createNotification } from "@/lib/auth";
import { newId, nowIso } from "@/lib/id";
import { z } from "zod";

const createOrderSchema = z.object({
  proposalId: z.string(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "CLIENT") {
    return NextResponse.json({ error: "Only clients can confirm orders" }, { status: 403 });
  }

  try {
    const { proposalId } = createOrderSchema.parse(await request.json());
    const supabase = getSupabase();

    const { data: proposal, error: propErr } = await supabase
      .from("Quotation")
      .select("*")
      .eq("id", proposalId)
      .eq("userId", session.id)
      .eq("status", "APPROVED")
      .single();

    if (propErr || !proposal) {
      return NextResponse.json({ error: "Approved proposal not found" }, { status: 404 });
    }

    // Check not already converted
    const { data: existing } = await supabase
      .from("Order")
      .select("id")
      .eq("quotationId", proposalId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Proposal already converted to an order" }, { status: 409 });
    }

    const orderNumber = `ORD-${Date.now()}`;
    const now = nowIso();

    const { data: order, error: orderErr } = await supabase
      .from("Order")
      .insert({
        id: newId(),
        orderNumber,
        userId: session.id,
        quotationId: proposalId,
        status: "QUOTE_APPROVED",
        incoterm: proposal.incoterm,
        destinationCountry: proposal.country,
        items: proposal.items,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (orderErr || !order) {
      console.error("[api:orders] insert error:", orderErr?.message);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    const { data: salesUsers } = await supabase
      .from("User")
      .select("id")
      .eq("role", "SALES");

    for (const u of salesUsers || []) {
      await createNotification(
        u.id,
        "Order Confirmed",
        `${session.name} confirmed order ${orderNumber} from an approved proposal.`,
        "ORDER",
        `/orders/${order.id}`
      );
    }

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error("[api:orders] unexpected error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
