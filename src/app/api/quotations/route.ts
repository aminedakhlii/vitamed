import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { getSession, createNotification } from "@/lib/auth";
import { newId, nowIso } from "@/lib/id";
import { z } from "zod";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  let q = supabase.from("Quotation").select("*").order("createdAt", { ascending: false });
  if (session.role === "CLIENT") q = q.eq("userId", session.id);

  const { data: quotations, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = [...new Set((quotations || []).map((q) => q.userId))];
  const { data: users } = await supabase
    .from("User")
    .select("id, name, email, company")
    .in("id", userIds);
  const userMap = new Map((users || []).map((u) => [u.id, u]));

  return NextResponse.json(
    (quotations || []).map((q) => ({ ...q, user: userMap.get(q.userId) }))
  );
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
    const now = nowIso();
    const quotation = {
      id: newId(),
      userId: session.id,
      items: JSON.stringify(data.items),
      notes: data.notes ?? null,
      incoterm: data.incoterm ?? null,
      country: data.country ?? null,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    };

    const { error } = await getSupabase().from("Quotation").insert(quotation);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const { data: salesUsers } = await getSupabase().from("User").select("id").eq("role", "SALES");
    for (const u of salesUsers || []) {
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
