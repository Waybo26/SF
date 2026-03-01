"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface ClassDetail {
  id: string;
  name: string;
  teacher: { id: string; name: string };
  students: { student: { id: string; name: string; email: string } }[];
  assignments: {
    id: string;
    title: string;
    description: string;
    dueDate: string | null;
    submissions: {
      id: string;
      studentId: string;
      status: string;
      wordCount: number;
      pasteCount: number;
      tabAwayCount: number;
      eventCount: number;
      totalTimeSpent: number;
      snapshotCount: number;
      createdAt: string;
      submittedAt: string | null;
      ai_detection_status: string | null;
    }[];
    _count: { students: number; submissions: number };
  }[];
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const classId = params.classId as string;
  const assignmentId = params.assignmentId as string;
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;
    fetch(`/api/classes/${classId}`)
      .then((r) => r.json())
      .then((data) => {
        setClassData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [classId]);

  if (loading) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
        <p style={{ color: "#666" }}>Loading...</p>
      </div>
    );
  }

  if (!classData) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
        <p style={{ color: "#dc2626" }}>Class not found</p>
        <a href="/teacher" style={{ color: "#1d4ed8", fontSize: "14px" }}>Back to Dashboard</a>
      </div>
    );
  }

  const assignment = classData.assignments.find((a) => a.id === assignmentId);
  if (!assignment) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
        <p style={{ color: "#dc2626" }}>Assignment not found</p>
        <a href={`/teacher/class/${classId}`} style={{ color: "#1d4ed8", fontSize: "14px" }}>
          Back to {classData.name}
        </a>
      </div>
    );
  }

  // Build student rows with submission data
  const studentRows = classData.students.map((enrollment) => {
    const student = enrollment.student;
    const submission = assignment.submissions.find((s) => s.studentId === student.id);
    return { student, submission };
  });

  // Sort: submitted first, then in progress, then not started
  const statusOrder: Record<string, number> = {
    SUBMITTED: 0,
    GRADED: 0,
    IN_PROGRESS: 1,
    NOT_STARTED: 2,
  };
  studentRows.sort((a, b) => {
    const aOrder = statusOrder[a.submission?.status ?? "NOT_STARTED"] ?? 2;
    const bOrder = statusOrder[b.submission?.status ?? "NOT_STARTED"] ?? 2;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.student.name.localeCompare(b.student.name);
  });

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m < 60) return `${m}m ${s}s`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "SUBMITTED":
      case "GRADED":
        return { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" };
      case "IN_PROGRESS":
        return { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" };
      default:
        return { background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb" };
    }
  };

  const getAIStatusStyle = (status: string | null) => {
    switch (status) {
      case "LIKELY_HUMAN":
        return { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" };
      case "SUSPICIOUS":
        return { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" };
      case "LIKELY_AI_ASSISTED":
        return { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" };
      default:
        return { background: "#f3f4f6", color: "#9ca3af", border: "1px solid #e5e7eb" };
    }
  };

  const getAIStatusLabel = (status: string | null) => {
    switch (status) {
      case "LIKELY_HUMAN":
        return "Likely Human";
      case "SUSPICIOUS":
        return "Suspicious";
      case "LIKELY_AI_ASSISTED":
        return "Likely AI";
      default:
        return "Pending";
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "16px" }}>
        <a href="/teacher" style={{ color: "#1d4ed8", textDecoration: "none" }}>
          Dashboard
        </a>
        {" / "}
        <a
          href={`/teacher/class/${classId}`}
          style={{ color: "#1d4ed8", textDecoration: "none" }}
        >
          {classData.name}
        </a>
        {" / "}
        <span>{assignment.title}</span>
      </div>

      {/* Assignment header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "22px", marginBottom: "4px" }}>
          {assignment.title}
        </h1>
        <p style={{ color: "#666", fontSize: "14px", margin: "0 0 8px 0" }}>
          {assignment.description}
        </p>
        {assignment.dueDate && (
          <span style={{ fontSize: "13px", color: "#888" }}>
            Due: {new Date(assignment.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Student submissions table */}
      <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>
        Student Submissions ({studentRows.length} students)
      </h2>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e5e5" }}>
              <th style={{ textAlign: "left", padding: "8px 12px", color: "#666", fontWeight: 600 }}>
                Student
              </th>
              <th style={{ textAlign: "center", padding: "8px 12px", color: "#666", fontWeight: 600 }}>
                Status
              </th>
              <th style={{ textAlign: "center", padding: "8px 12px", color: "#666", fontWeight: 600 }}>
                Words
              </th>
              <th style={{ textAlign: "center", padding: "8px 12px", color: "#666", fontWeight: 600 }}>
                Events
              </th>
              <th style={{ textAlign: "center", padding: "8px 12px", color: "#666", fontWeight: 600 }}>
                Pastes
              </th>
              <th style={{ textAlign: "center", padding: "8px 12px", color: "#666", fontWeight: 600 }}>
                Tab Switches
              </th>
              <th style={{ textAlign: "center", padding: "8px 12px", color: "#666", fontWeight: 600 }}>
                Time Spent
              </th>
              <th style={{ textAlign: "center", padding: "8px 12px", color: "#666", fontWeight: 600 }}>
                AI Analysis
              </th>
              <th style={{ textAlign: "center", padding: "8px 12px", color: "#666", fontWeight: 600 }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {studentRows.map(({ student, submission }) => {
              const status = submission?.status ?? "NOT_STARTED";
              const hasSubmission = submission && status !== "NOT_STARTED";
              const statusStyle = getStatusStyle(status);
              const highPaste = submission && submission.pasteCount > 5;
              const highTabAway = submission && submission.tabAwayCount > 5;

              return (
                <tr
                  key={student.id}
                  style={{ borderBottom: "1px solid #f0f0f0" }}
                >
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 500 }}>{student.name}</div>
                    <div style={{ fontSize: "11px", color: "#999" }}>{student.email}</div>
                  </td>
                  <td style={{ textAlign: "center", padding: "10px 12px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: 600,
                        ...statusStyle,
                      }}
                    >
                      {status.replace("_", " ")}
                    </span>
                  </td>
                  <td style={{ textAlign: "center", padding: "10px 12px", color: hasSubmission ? "#333" : "#ccc" }}>
                    {hasSubmission ? submission.wordCount : "-"}
                  </td>
                  <td style={{ textAlign: "center", padding: "10px 12px", color: hasSubmission ? "#333" : "#ccc" }}>
                    {hasSubmission ? submission.eventCount : "-"}
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      padding: "10px 12px",
                      color: highPaste ? "#dc2626" : hasSubmission ? "#333" : "#ccc",
                      fontWeight: highPaste ? "bold" : "normal",
                    }}
                  >
                    {hasSubmission ? submission.pasteCount : "-"}
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      padding: "10px 12px",
                      color: highTabAway ? "#dc2626" : hasSubmission ? "#333" : "#ccc",
                      fontWeight: highTabAway ? "bold" : "normal",
                    }}
                  >
                    {hasSubmission ? submission.tabAwayCount : "-"}
                  </td>
                  <td style={{ textAlign: "center", padding: "10px 12px", color: hasSubmission ? "#333" : "#ccc" }}>
                    {hasSubmission ? formatTime(submission.totalTimeSpent) : "-"}
                  </td>
                  <td style={{ textAlign: "center", padding: "10px 12px" }}>
                    {hasSubmission && submission.status === "SUBMITTED" ? (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: 600,
                          ...getAIStatusStyle(submission.ai_detection_status),
                        }}
                      >
                        {getAIStatusLabel(submission.ai_detection_status)}
                      </span>
                    ) : (
                      <span style={{ color: "#ccc", fontSize: "12px" }}>-</span>
                    )}
                  </td>
                  <td style={{ textAlign: "center", padding: "10px 12px" }}>
                    {hasSubmission ? (
                      <a
                        href={`/teacher/class/${classId}/assignment/${assignmentId}/student/${student.id}`}
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          background: "#1d4ed8",
                          color: "white",
                          textDecoration: "none",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      >
                        View
                      </a>
                    ) : (
                      <span style={{ color: "#ccc", fontSize: "12px" }}>-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
