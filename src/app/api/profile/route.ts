import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { nowIso } from "@/lib/id";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  company: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  language: z.string(),
});

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = schema.parse(await request.json());
    const { data: user, error } = await getSupabase()
      .from("User")
      .update({
        name: data.name,
        company: data.company ?? null,
        phone: data.phone ?? null,
        country: data.country ?? null,
        language: data.language,
        updatedAt: nowIso(),
      })
      .eq("id", session.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
