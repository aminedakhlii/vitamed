import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { getSession, createNotification } from "@/lib/auth";
import { newId, nowIso } from "@/lib/id";
import { z } from "zod";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  let q = supabase.from("SupportTicket").select("*").order("createdAt", { ascending: false });
  if (session.role === "CLIENT") q = q.eq("userId", session.id);

  const { data: tickets, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = new Set<string>();
  for (const t of tickets || []) {
    userIds.add(t.userId);
    if (t.assignedToId) userIds.add(t.assignedToId);
  }
  const { data: users } = await supabase
    .from("User")
    .select("id, name, email, company")
    .in("id", [...userIds]);
  const userMap = new Map((users || []).map((u) => [u.id, u]));

  return NextResponse.json(
    (tickets || []).map((t) => ({
      ...t,
      user: userMap.get(t.userId),
      assignedTo: t.assignedToId ? userMap.get(t.assignedToId) : null,
    }))
  );
}

const createSchema = z.object({
  type: z.enum(["COMPLAINT", "RETURN", "REPLACEMENT", "FEEDBACK"]),
  subject: z.string().min(3),
  description: z.string().min(10),
  orderId: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = createSchema.parse(await request.json());
    const supabase = getSupabase();
    const { count } = await supabase.from("SupportTicket").select("*", { count: "exact", head: true });
    const ticketNumber = `TKT-2026-${String((count || 0) + 1).padStart(4, "0")}`;
    const now = nowIso();

    const ticket = {
      id: newId(),
      ticketNumber,
      userId: session.id,
      assignedToId: null,
      orderId: data.orderId ?? null,
      type: data.type,
      subject: data.subject,
      description: data.description,
      status: "OPEN",
      attachments: "[]",
      createdAt: now,
      updatedAt: now,
    };

    const { error } = await supabase.from("SupportTicket").insert(ticket);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const { data: staff } = await supabase.from("User").select("id").in("role", ["SALES", "ADMIN"]);
    for (const u of staff || []) {
      await createNotification(u.id, "New Support Ticket", `${session.name}: ${data.subject}`, "COMPLAINT", "/support");
    }

    return NextResponse.json(ticket);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
