import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, hashPassword, roleDashboardPath } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  company: z.string().optional(),
  country: z.string().optional(),
  language: z.string().default("en"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: await hashPassword(data.password),
        name: data.name,
        role: "CLIENT",
        company: data.company,
        country: data.country,
        language: data.language,
      },
    });

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      language: user.language,
      country: user.country,
    };

    await createSession(sessionUser);

    return NextResponse.json({
      user: sessionUser,
      redirect: roleDashboardPath(user.role),
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
