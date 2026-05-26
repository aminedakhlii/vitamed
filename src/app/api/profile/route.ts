import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
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
    const user = await prisma.user.update({
      where: { id: session.id },
      data: {
        name: data.name,
        company: data.company,
        phone: data.phone,
        country: data.country,
        language: data.language,
      },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
