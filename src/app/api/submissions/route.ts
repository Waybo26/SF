import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSnowflakeConnection } from "@/lib/snowflake";
import { parseSFFile, htmlToPlainText } from "@/lib/sf-parser";

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

  // If sfFile is provided, perform AI detection
  if (sfFile) {
    try {
      // Parse the SF file
      const parsedSfFile = parseSFFile(sfFile);
      
      // Extract plain text from the latest snapshot
      // Assuming the last snapshot is the "latest" content
      const latestSnapshot = parsedSfFile.snapshots[parsedSfFile.snapshots.length - 1];
      const plainTextContent = latestSnapshot ? htmlToPlainText(latestSnapshot.content) : "";

      if (plainTextContent) {
        // Connect to Snowflake
        const connection = await getSnowflakeConnection();

        // Define prompt for AI detection
        const prompt = "Analyze the following text for AI-generated content. Respond ONLY with 'AI' or 'Human'. If unsure, respond 'Unsure'. Text:";
        const model = "mistral-large2";

        // Execute AI query
        const aiResult = await new Promise<any>((resolve, reject) => {
          connection.execute({
            sqlText: "SELECT SNOWFLAKE.CORTEX.AI_COMPLETE(?, ?, ?) AS ai_detection_result",
            binds: [prompt, model, plainTextContent],
            complete: (err, stmt, rows) => {
              if (err) {
                console.error("Snowflake AI query error:", err);
                reject(err);
              } else {
                resolve(rows);
              }
            },
          });
        });

        // Extract AI result
        const aiStatus = aiResult?.[0]?.AI_DETECTION_RESULT;

        if (aiStatus) {
          // Update submission with AI detection result
          await prisma.submission.update({
            where: { id: submission.id },
            data: { ai_detection_status: aiStatus },
          });
          
          console.log(`AI Detection Result for submission ${submission.id}: ${aiStatus}`);
        }
      }
    } catch (error) {
      // Log error but don't fail the submission
      console.error("Error during AI detection:", error);
    }
  }

  return NextResponse.json(submission, { status: 201 });
}
