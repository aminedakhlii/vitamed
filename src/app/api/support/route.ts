import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, createNotification } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where =
    session.role === "CLIENT"
      ? { userId: session.id }
      : {};

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: {
      user: { select: { name: true, email: true, company: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tickets);
}

const createSchema = z.object({
  type: z.enum(["COMPLAINT", "RETURN", "REPLACEMENT", "FEEDBACK"]),
  subject: z.string().min(3),
  description: z.string().min(10),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = createSchema.parse(await request.json());
    const count = await prisma.supportTicket.count();
    const ticketNumber = `TKT-2026-${String(count + 1).padStart(4, "0")}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: session.id,
        type: data.type,
        subject: data.subject,
        description: data.description,
      },
    });

    const salesUsers = await prisma.user.findMany({ where: { role: { in: ["SALES", "ADMIN"] } } });
    for (const u of salesUsers) {
      await createNotification(
        u.id,
        "New Support Ticket",
        `${session.name}: ${data.subject}`,
        "COMPLAINT"
      );
    }

    return NextResponse.json(ticket);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
