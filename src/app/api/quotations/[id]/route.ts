import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { getSession, createNotification } from "@/lib/auth";
import { nowIso } from "@/lib/id";
import { z } from "zod";

const respondSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  message: z.string().min(1, "A message to the client is required"),
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
    const { action, message } = respondSchema.parse(await request.json());
    const status = action === "APPROVE" ? "APPROVED" : "REJECTED";
    const supabase = getSupabase();

    const { data: proposal, error } = await supabase
      .from("Quotation")
      .update({
        status,
        salesMessage: message,
        respondedAt: nowIso(),
        updatedAt: nowIso(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    await createNotification(
      proposal.userId,
      action === "APPROVE" ? "Proposal Approved ✓" : "Proposal Requires Revision",
      message,
      "ORDER",
      "/proposals"
    );

    return NextResponse.json(proposal);
  } catch (err) {
    console.error("[api:quotations/:id] patch error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
