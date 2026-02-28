"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import SFViewer from "@/components/sf-viewer";

interface SubmissionData {
  id: string;
  studentId: string;
  assignmentId: string;
  status: string;
  sfFile: string;
  wordCount: number;
  eventCount: number;
  pasteCount: number;
  tabAwayCount: number;
  totalTimeSpent: number;
  snapshotCount: number;
  createdAt: string;
  submittedAt: string | null;
}

interface StudentInfo {
  id: string;
  name: string;
  email: string;
}

interface ClassInfo {
  id: string;
  name: string;
  assignments: { id: string; title: string }[];
}

export default function StudentSubmissionPage() {
  const params = useParams();
  const classId = params.classId as string;
  const assignmentId = params.assignmentId as string;
  const studentId = params.studentId as string;

  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId || !assignmentId || !studentId) return;

    const fetchData = async () => {
      try {
        // Fetch class info for breadcrumbs
        const classRes = await fetch(`/api/classes/${classId}`);
        if (classRes.ok) {
          const classData = await classRes.json();
          setClassInfo(classData);

          // Find student name from class data
          const enrollment = classData.students.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (s: any) => s.student.id === studentId
          );
          if (enrollment) {
            setStudent(enrollment.student);
          }
        }

        // Fetch submission
        const subRes = await fetch(
          `/api/submissions?assignmentId=${assignmentId}&studentId=${studentId}`
        );
        const submissions = await subRes.json();

        if (submissions.length > 0) {
          // Fetch full submission with sfFile content
          const fullRes = await fetch(`/api/submissions/${submissions[0].id}`);
          if (fullRes.ok) {
            const fullSub = await fullRes.json();
            setSubmission(fullSub);
          } else {
            setError("Failed to load submission details");
          }
        } else {
          setError("No submission found for this student");
        }
      } catch {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId, assignmentId, studentId]);

  const assignment = classInfo?.assignments.find((a) => a.id === assignmentId);

  if (loading) {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
        <p style={{ color: "#666" }}>Loading submission...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: "13px", color: "#888", marginBottom: "16px" }}>
          <a href="/teacher" style={{ color: "#1d4ed8", textDecoration: "none" }}>
            Dashboard
          </a>
          {classInfo && (
            <>
              {" / "}
              <a
                href={`/teacher/class/${classId}`}
                style={{ color: "#1d4ed8", textDecoration: "none" }}
              >
                {classInfo.name}
              </a>
            </>
          )}
          {assignment && (
            <>
              {" / "}
              <a
                href={`/teacher/class/${classId}/assignment/${assignmentId}`}
                style={{ color: "#1d4ed8", textDecoration: "none" }}
              >
                {assignment.title}
              </a>
            </>
          )}
        </div>

        <div
          style={{
            padding: "24px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
          }}
        >
          <p style={{ color: "#dc2626", margin: 0 }}>{error}</p>
          <a
            href={`/teacher/class/${classId}/assignment/${assignmentId}`}
            style={{ color: "#1d4ed8", fontSize: "14px", display: "inline-block", marginTop: "12px" }}
          >
            Back to submissions
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "12px" }}>
        <a href="/teacher" style={{ color: "#1d4ed8", textDecoration: "none" }}>
          Dashboard
        </a>
        {classInfo && (
          <>
            {" / "}
            <a
              href={`/teacher/class/${classId}`}
              style={{ color: "#1d4ed8", textDecoration: "none" }}
            >
              {classInfo.name}
            </a>
          </>
        )}
        {assignment && (
          <>
            {" / "}
            <a
              href={`/teacher/class/${classId}/assignment/${assignmentId}`}
              style={{ color: "#1d4ed8", textDecoration: "none" }}
            >
              {assignment.title}
            </a>
          </>
        )}
        {student && (
          <>
            {" / "}
            <span>{student.name}</span>
          </>
        )}
      </div>

      {/* Student info bar */}
      <div
        style={{
          padding: "12px 20px",
          background: "#f0f9ff",
          borderBottom: "1px solid #bae6fd",
          borderRadius: "8px",
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div>
          <strong>{student?.name}</strong>
          {student?.email && (
            <span style={{ color: "#666", marginLeft: "8px", fontSize: "13px" }}>
              ({student.email})
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "12px", fontSize: "13px", color: "#555" }}>
          <span>
            Status:{" "}
            <strong
              style={{
                color:
                  submission?.status === "SUBMITTED"
                    ? "#22c55e"
                    : submission?.status === "IN_PROGRESS"
                    ? "#f59e0b"
                    : "#888",
              }}
            >
              {submission?.status?.replace("_", " ")}
            </strong>
          </span>
          {submission?.submittedAt && (
            <span>
              Submitted: {new Date(submission.submittedAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* SF Viewer */}
      {submission?.sfFile ? (
        <SFViewer sfContent={submission.sfFile} />
      ) : (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#999",
            border: "1px solid #eee",
            borderRadius: "8px",
          }}
        >
          No .sf file content available for this submission.
        </div>
      )}
    </div>
  );
}
