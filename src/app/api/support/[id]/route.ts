import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { getSession, createNotification } from "@/lib/auth";
import { nowIso } from "@/lib/id";
import { z } from "zod";

const patchSchema = z.object({
  action: z.enum(["ACCEPT", "RESOLVE", "CLOSE"]),
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
    const { action } = patchSchema.parse(await request.json());
    const supabase = getSupabase();

    const statusMap: Record<string, string> = {
      ACCEPT: "IN_PROGRESS",
      RESOLVE: "RESOLVED",
      CLOSE: "CLOSED",
    };

    const updatePayload: Record<string, string | null> = {
      status: statusMap[action],
      updatedAt: nowIso(),
    };

    if (action === "ACCEPT") {
      updatePayload.assignedToId = session.id;
    }

    const { data: ticket, error } = await supabase
      .from("SupportTicket")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (action === "ACCEPT") {
      await createNotification(
        ticket.userId,
        "Support Ticket Assigned",
        `Your ticket "${ticket.subject}" has been picked up and is now being handled.`,
        "COMPLAINT",
        "/support"
      );
    }

    return NextResponse.json(ticket);
  } catch (err) {
    console.error("[api:support/:id] patch error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
