import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, verifyPassword, roleDashboardPath } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = schema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

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
