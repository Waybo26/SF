"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface ClassDetail {
  id: string;
  name: string;
  description: string;
  teacher: { id: string; name: string };
  students: { student: { id: string; name: string; email: string } }[];
  assignments: {
    id: string;
    title: string;
    description: string;
    dueDate: string | null;
    createdAt: string;
    submissions: {
      id: string;
      studentId: string;
      status: string;
      wordCount: number;
    }[];
    _count: { students: number; submissions: number };
  }[];
}

export default function ClassDetailPage() {
  const params = useParams();
  const classId = params.classId as string;
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) return;
    fetch(`/api/classes/${classId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Class not found");
        return r.json();
      })
      .then((data) => {
        setClassData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [classId]);

  if (loading) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
        <p style={{ color: "#666" }}>Loading...</p>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
        <p style={{ color: "#dc2626" }}>{error || "Class not found"}</p>
        <a href="/teacher" style={{ color: "#1d4ed8", fontSize: "14px" }}>
          Back to Dashboard
        </a>
      </div>
    );
  }

  const getSubmissionSummary = (assignment: ClassDetail["assignments"][0]) => {
    const total = assignment._count.students;
    const submitted = assignment.submissions.filter(
      (s) => s.status === "SUBMITTED" || s.status === "GRADED"
    ).length;
    const inProgress = assignment.submissions.filter(
      (s) => s.status === "IN_PROGRESS"
    ).length;
    return { total, submitted, inProgress, notStarted: total - submitted - inProgress };
  };

  const isDueSoon = (dueDate: string | null) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 3;
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "16px" }}>
        <a href="/teacher" style={{ color: "#1d4ed8", textDecoration: "none" }}>
          Dashboard
        </a>
        {" / "}
        <span>{classData.name}</span>
      </div>

      {/* Class header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "4px" }}>
          {classData.name}
        </h1>
        <p style={{ color: "#666", fontSize: "14px", margin: "0 0 8px 0" }}>
          {classData.description}
        </p>
        <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#888" }}>
          <span>Teacher: {classData.teacher.name}</span>
          <span>{classData.students.length} students enrolled</span>
          <span>{classData.assignments.length} assignments</span>
        </div>
      </div>

      {/* Assignments */}
      <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>Assignments</h2>

      {classData.assignments.length === 0 ? (
        <p style={{ color: "#999", fontSize: "14px" }}>No assignments yet.</p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {classData.assignments.map((assignment) => {
            const summary = getSubmissionSummary(assignment);
            const dueSoon = isDueSoon(assignment.dueDate);
            const overdue = isOverdue(assignment.dueDate);

            return (
              <a
                key={assignment.id}
                href={`/teacher/class/${classId}/assignment/${assignment.id}`}
                style={{
                  display: "block",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "16px 20px",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#1d4ed8";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(29,78,216,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#ddd";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "15px", margin: "0 0 4px 0", color: "#1d4ed8" }}>
                      {assignment.title}
                    </h3>
                    <p style={{ fontSize: "12px", color: "#888", margin: "0 0 8px 0" }}>
                      {assignment.description.length > 120
                        ? assignment.description.slice(0, 120) + "..."
                        : assignment.description}
                    </p>
                    {assignment.dueDate && (
                      <span
                        style={{
                          fontSize: "12px",
                          color: overdue ? "#dc2626" : dueSoon ? "#f59e0b" : "#888",
                          fontWeight: overdue || dueSoon ? "bold" : "normal",
                        }}
                      >
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        {overdue && " (Overdue)"}
                        {dueSoon && !overdue && " (Due soon)"}
                      </span>
                    )}
                  </div>

                  {/* Submission stats */}
                  <div style={{ display: "flex", gap: "12px", flexShrink: 0, marginLeft: "16px" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "18px", fontWeight: "bold", color: "#22c55e" }}>
                        {summary.submitted}
                      </div>
                      <div style={{ fontSize: "10px", color: "#999" }}>Submitted</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "18px", fontWeight: "bold", color: "#f59e0b" }}>
                        {summary.inProgress}
                      </div>
                      <div style={{ fontSize: "10px", color: "#999" }}>In Progress</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "18px", fontWeight: "bold", color: "#ccc" }}>
                        {summary.notStarted}
                      </div>
                      <div style={{ fontSize: "10px", color: "#999" }}>Not Started</div>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
