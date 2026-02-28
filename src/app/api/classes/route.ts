import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/classes - List classes (optionally filter by teacherId)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get("teacherId");

  const where: Record<string, string> = {};
  if (teacherId) where.teacherId = teacherId;

  const classes = await prisma.class.findMany({
    where,
    include: {
      teacher: { select: { id: true, name: true } },
      students: {
        include: {
          student: { select: { id: true, name: true } },
        },
      },
      assignments: {
        select: {
          id: true,
          title: true,
          dueDate: true,
          _count: {
            select: { submissions: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Flatten the response
  const result = classes.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    createdAt: c.createdAt,
    teacher: c.teacher,
    studentCount: c.students.length,
    assignmentCount: c.assignments.length,
  }));

  return NextResponse.json(result);
}
