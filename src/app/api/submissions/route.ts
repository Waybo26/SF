import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/submissions - List submissions (optionally filter by assignmentId)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get("assignmentId");
  const studentId = searchParams.get("studentId");

  const where: Record<string, string> = {};
  if (assignmentId) where.assignmentId = assignmentId;
  if (studentId) where.studentId = studentId;

  const submissions = await prisma.submission.findMany({
    where,
    select: {
      id: true,
      assignmentId: true,
      studentId: true,
      status: true,
      totalTimeSpent: true,
      wordCount: true,
      eventCount: true,
      pasteCount: true,
      tabAwayCount: true,
      snapshotCount: true,
      createdAt: true,
      submittedAt: true,
      ai_detection_status: true,
      ai_detection_details: true,
      // Exclude sfFile from list queries (it can be large)
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(submissions);
}

// POST /api/submissions - Create a new submission
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { assignmentId, studentId, sfFile } = body;

  if (!assignmentId || !studentId) {
    return NextResponse.json(
      { error: "assignmentId and studentId are required" },
      { status: 400 }
    );
  }

  // Check if submission already exists
  const existing = await prisma.submission.findUnique({
    where: {
      assignmentId_studentId: { assignmentId, studentId },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Submission already exists for this student and assignment", id: existing.id },
      { status: 409 }
    );
  }

  // Create submission with initial status
  const submission = await prisma.submission.create({
    data: {
      assignmentId,
      studentId,
      sfFile: sfFile ?? "",
      status: "IN_PROGRESS",
    },
  });

  return NextResponse.json(submission, { status: 201 });
}
