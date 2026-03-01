import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/classes/[classId] - Get class detail
// Query params:
//   ?studentId=X  - student-scoped view (only this student's submissions)
//   (none)        - teacher/full view (all students, all submissions)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const { classId } = await params;
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");

  // Student-scoped view
  if (studentId) {
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: { select: { id: true, name: true } },
        students: {
          where: { studentId },
          select: { enrolledAt: true },
        },
        assignments: {
          include: {
            submissions: {
              where: { studentId },
              select: {
                id: true,
                studentId: true,
                status: true,
                wordCount: true,
                eventCount: true,
                pasteCount: true,
                tabAwayCount: true,
                totalTimeSpent: true,
                snapshotCount: true,
                createdAt: true,
                submittedAt: true,
                ai_detection_status: true,
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

    // Check student is enrolled
    if (classData.students.length === 0) {
      return NextResponse.json(
        { error: "Student not enrolled in this class" },
        { status: 403 }
      );
    }

    // Flatten: each assignment gets a single `submission` field (or null)
    const result = {
      id: classData.id,
      name: classData.name,
      description: classData.description,
      teacher: classData.teacher,
      assignments: classData.assignments.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        dueDate: a.dueDate,
        createdAt: a.createdAt,
        submission: a.submissions[0] || null,
      })),
    };

    return NextResponse.json(result);
  }

  // Teacher/full view (original behavior)
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
              ai_detection_status: true,
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
