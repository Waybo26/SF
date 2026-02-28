import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/classes/[classId] - Get class detail with assignments, students, and submission stats
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const { classId } = await params;

  const classData = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      teacher: { select: { id: true, name: true } },
      students: {
        include: {
          student: { select: { id: true, name: true, email: true } },
        },
        orderBy: { student: { name: "asc" } },
      },
      assignments: {
        include: {
          submissions: {
            select: {
              id: true,
              studentId: true,
              status: true,
              wordCount: true,
              pasteCount: true,
              tabAwayCount: true,
              eventCount: true,
              totalTimeSpent: true,
              snapshotCount: true,
              createdAt: true,
              submittedAt: true,
            },
          },
          _count: {
            select: {
              students: true,
              submissions: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!classData) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  return NextResponse.json(classData);
}
