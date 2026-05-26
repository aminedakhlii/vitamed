import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await getSupabase()
    .from("Notification")
    .select("*")
    .eq("userId", session.id)
    .order("createdAt", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, markAll } = await request.json();
  const supabase = getSupabase();

  if (markAll) {
    await supabase.from("Notification").update({ read: true }).eq("userId", session.id);
    return NextResponse.json({ success: true });
  }

  if (id) {
    await supabase.from("Notification").update({ read: true }).eq("id", id).eq("userId", session.id);
  }

  return NextResponse.json({ success: true });
}
