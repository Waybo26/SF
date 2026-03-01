import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/classes - List classes
// Query params:
//   ?teacherId=X  - filter by teacher
//   ?studentId=X  - filter by enrolled student (includes progress summary)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get("teacherId");
  const studentId = searchParams.get("studentId");

  // Student-scoped query: find classes the student is enrolled in
  if (studentId) {
    const classes = await prisma.class.findMany({
      where: {
        students: {
          some: { studentId },
        },
      },
      include: {
        teacher: { select: { id: true, name: true } },
        students: true,
        assignments: {
          include: {
            submissions: {
              where: { studentId },
              select: {
                id: true,
                status: true,
                wordCount: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = classes.map((c) => {
      const totalAssignments = c.assignments.length;
      const submissions = c.assignments
        .map((a) => a.submissions[0])
        .filter(Boolean);
      const submitted = submissions.filter(
        (s) => s.status === "SUBMITTED" || s.status === "GRADED"
      ).length;
      const inProgress = submissions.filter(
        (s) => s.status === "IN_PROGRESS"
      ).length;

      return {
        id: c.id,
        name: c.name,
        description: c.description,
        createdAt: c.createdAt,
        teacher: c.teacher,
        studentCount: c.students.length,
        assignmentCount: totalAssignments,
        progress: {
          submitted,
          inProgress,
          notStarted: totalAssignments - submitted - inProgress,
          total: totalAssignments,
        },
      };
    });

    return NextResponse.json(result);
  }

  // Teacher / general query (original behavior)
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
