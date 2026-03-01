import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSFFile, htmlToPlainText, countWords } from "@/lib/sf-parser";
import { analyzeSFFile } from "@/lib/sf-analyzer";

// GET /api/submissions/[id] - Get a single submission with .sf content
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(submission);
}

// PUT /api/submissions/[id] - Update submission (auto-save or submit)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { sfFile, status } = body;

  const existing = await prisma.submission.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 }
    );
  }

  // If already submitted, don't allow updates
  if (existing.status === "SUBMITTED" || existing.status === "GRADED") {
    return NextResponse.json(
      { error: "Cannot update a submitted assignment" },
      { status: 403 }
    );
  }

  // Build update data
  const updateData: Record<string, unknown> = {};

  if (sfFile !== undefined) {
    updateData.sfFile = sfFile;

    // Compute stats from the .sf file
    try {
      const parsed = parseSFFile(sfFile);
      const events = parsed.events;

      const pasteCount = events.filter((e) => e.type === "paste").length;
      const tabAwayCount = events.filter((e) => e.type === "tab_away").length;

      // Calculate time spent from first to last event
      const timestamps = events.map((e) => e.timestamp);
      const totalTimeSpent =
        timestamps.length > 1
          ? Math.round(
              (Math.max(...timestamps) - Math.min(...timestamps)) / 1000
            )
          : 0;

      // Get word count from the latest snapshot
      let wordCountVal = 0;
      if (parsed.snapshots.length > 0) {
        const latest = parsed.snapshots[parsed.snapshots.length - 1];
        const text = htmlToPlainText(latest.content);
        wordCountVal = countWords(text);
      }

      updateData.eventCount = events.length;
      updateData.pasteCount = pasteCount;
      updateData.tabAwayCount = tabAwayCount;
      updateData.totalTimeSpent = totalTimeSpent;
      updateData.wordCount = wordCountVal;
      updateData.snapshotCount = parsed.snapshots.length;
    } catch {
      // If parsing fails, just save the raw sfFile without stats
    }
  }

  if (status !== undefined) {
    updateData.status = status;
    if (status === "SUBMITTED") {
      updateData.submittedAt = new Date();
    }
  }

  const submission = await prisma.submission.update({
    where: { id },
    data: updateData,
  });

  // Run AI analysis in the background when submission is finalized.
  // Fire-and-forget: the response returns immediately to the student,
  // and the analysis result is written to the DB when it completes.
  if (status === "SUBMITTED" && sfFile) {
    runAIAnalysis(id, sfFile);
  }

  return NextResponse.json(submission);
}

// Background AI analysis - runs without blocking the HTTP response
async function runAIAnalysis(submissionId: string, sfFile: string) {
  try {
    const parsed = parseSFFile(sfFile);
    const analysisResult = await analyzeSFFile(parsed);

    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        ai_detection_status: analysisResult.verdict,
        ai_detection_details: JSON.stringify(analysisResult),
      },
    });

    console.log(`AI Analysis for submission ${submissionId}: ${analysisResult.verdict} (confidence: ${analysisResult.confidence})`);
  } catch (error) {
    // Log but don't fail - this runs in the background after the response was already sent
    console.error(`AI analysis failed for submission ${submissionId}:`, error);
  }
}
