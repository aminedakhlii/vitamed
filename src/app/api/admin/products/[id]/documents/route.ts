import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { newId } from "@/lib/id";
import { z } from "zod";

const docSchema = z.object({
  name: z.string().min(1),
  docType: z.string().min(1),
  fileUrl: z.string().url("Must be a valid URL"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: productId } = await params;

  try {
    const data = docSchema.parse(await request.json());
    const doc = { id: newId(), productId, ...data };

    const { data: created, error } = await getSupabase()
      .from("ProductDocument")
      .insert(doc)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[api:admin:documents] post error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
