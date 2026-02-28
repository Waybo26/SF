import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/assignments - List assignments (optionally filter by student)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const teacherId = searchParams.get("teacherId");

  if (studentId) {
    // Get assignments for a specific student
    const assigned = await prisma.assignmentStudent.findMany({
      where: { studentId },
      include: {
        assignment: {
          include: {
            createdBy: { select: { name: true } },
            submissions: {
              where: { studentId },
              select: { id: true, status: true },
            },
          },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assignments = assigned.map((a: any) => ({
      ...a.assignment,
      submission: a.assignment.submissions[0] ?? null,
    }));

    return NextResponse.json(assignments);
  }

  if (teacherId) {
    // Get assignments created by a teacher
    const assignments = await prisma.assignment.findMany({
      where: { createdById: teacherId },
      include: {
        students: { include: { student: { select: { id: true, name: true } } } },
        submissions: {
          select: { id: true, studentId: true, status: true, wordCount: true, pasteCount: true, tabAwayCount: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(assignments);
  }

  // Return all assignments
  const assignments = await prisma.assignment.findMany({
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(assignments);
}
