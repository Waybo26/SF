"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { LoginModal } from "@/components/login-modal";

interface SubmissionData {
  id: string;
  status: string;
  wordCount: number;
  eventCount: number;
  totalTimeSpent: number;
  createdAt: string;
  submittedAt: string | null;
}

interface AssignmentData {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  createdAt: string;
  submission: SubmissionData | null;
}

interface ClassDetail {
  id: string;
  name: string;
  description: string;
  teacher: { id: string; name: string };
  assignments: AssignmentData[];
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; thumbBg: string; thumbIcon: string }
> = {
  NOT_STARTED: {
    label: "Not Started",
    color: "#64748b",
    bg: "#f1f5f9",
    thumbBg: "#f8fafc",
    thumbIcon: "📄",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "#2563eb",
    bg: "#dbeafe",
    thumbBg: "#eff6ff",
    thumbIcon: "✏️",
  },
  SUBMITTED: {
    label: "Submitted",
    color: "#16a34a",
    bg: "#dcfce7",
    thumbBg: "#f0fdf4",
    thumbIcon: "✅",
  },
  GRADED: {
    label: "Graded",
    color: "#7c3aed",
    bg: "#ede9fe",
    thumbBg: "#f5f3ff",
    thumbIcon: "⭐",
  },
};

function getStatusConfig(status: string | undefined) {
  return STATUS_CONFIG[status || "NOT_STARTED"] || STATUS_CONFIG.NOT_STARTED;
}

function isDueSoon(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 2;
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function formatTimeSpent(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

export default function StudentClassPage() {
  const params = useParams();
  const classId = params.classId as string;
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClassData = useCallback(() => {
    if (!user || user.role !== "STUDENT" || !classId) return;
    setLoading(true);
    fetch(`/api/classes/${classId}?studentId=${user.id}`)
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
  }, [user, classId]);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  // Refetch when the page becomes visible again so status is always current.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchClassData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchClassData]);

  // Auth loading
  if (authLoading) {
    return (
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
        <p style={{ color: "#666", fontSize: "14px" }}>Loading...</p>
      </div>
    );
  }

  // Not logged in
  if (!isLoggedIn || !user) {
    return (
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "24px" }}>My Assignments</h1>
        <p style={{ color: "#666", marginBottom: "24px", fontSize: "14px" }}>
          You need to log in as a student to view assignments.
        </p>
        <button
          onClick={() => setShowLogin(true)}
          style={{
            padding: "10px 24px",
            background: "#1d4ed8",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Login
        </button>
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      </div>
    );
  }

  // Wrong role
  if (user.role !== "STUDENT") {
    return (
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
        <p style={{ color: "#666", fontSize: "14px" }}>
          This page is only available to students.
        </p>
      </div>
    );
  }

  // Data loading
  if (loading) {
    return (
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
        <p style={{ color: "#666", fontSize: "14px" }}>Loading class...</p>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
        <p style={{ color: "#dc2626", fontSize: "14px" }}>
          {error || "Class not found"}
        </p>
        <a href="/student" style={{ color: "#1d4ed8", fontSize: "14px" }}>
          Back to My Classes
        </a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "16px" }}>
        <a
          href="/student"
          style={{ color: "#1d4ed8", textDecoration: "none" }}
        >
          My Classes
        </a>
        {" / "}
        <span style={{ color: "#64748b" }}>{classData.name}</span>
      </div>

      {/* Class header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "4px" }}>
          {classData.name}
        </h1>
        <p style={{ color: "#666", fontSize: "14px", margin: "0 0 8px 0" }}>
          {classData.description}
        </p>
        <div
          style={{
            display: "flex",
            gap: "16px",
            fontSize: "13px",
            color: "#94a3b8",
          }}
        >
          <span>Teacher: {classData.teacher.name}</span>
          <span>{classData.assignments.length} assignments</span>
        </div>
      </div>

      {/* Assignments heading */}
      <h2 style={{ fontSize: "18px", marginBottom: "20px", color: "#334155" }}>
        Assignments
      </h2>

      {classData.assignments.length === 0 ? (
        <p style={{ color: "#999", fontSize: "14px" }}>
          No assignments yet for this class.
        </p>
      ) : (
        /* Google Docs-style card grid */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "20px",
          }}
        >
          {classData.assignments.map((assignment) => {
            const status = assignment.submission?.status || "NOT_STARTED";
            const config = getStatusConfig(status);
            const overdue = isOverdue(assignment.dueDate);
            const dueSoon = isDueSoon(assignment.dueDate);
            const isComplete = status === "SUBMITTED" || status === "GRADED";

            return (
              <a
                key={assignment.id}
                href={`/student/class/${classId}/write/${assignment.id}`}
                style={{
                  display: "block",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  textDecoration: "none",
                  color: "inherit",
                  overflow: "hidden",
                  transition:
                    "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
                  background: "white",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 16px rgba(0,0,0,0.10)";
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                {/* Thumbnail area */}
                <div
                  style={{
                    background: config.thumbBg,
                    borderBottom: "1px solid #e2e8f0",
                    padding: "28px 16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    minHeight: "120px",
                  }}
                >
                  <span style={{ fontSize: "36px" }}>{config.thumbIcon}</span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: config.color,
                      background: config.bg,
                      padding: "2px 10px",
                      borderRadius: "999px",
                      letterSpacing: "0.3px",
                      textTransform: "uppercase",
                    }}
                  >
                    {config.label}
                  </span>
                </div>

                {/* Card body */}
                <div style={{ padding: "14px 16px 16px" }}>
                  {/* Title */}
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      margin: "0 0 8px 0",
                      color: "#1e293b",
                      lineHeight: "1.3",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {assignment.title}
                  </h3>

                  {/* Due date */}
                  {assignment.dueDate && (
                    <p
                      style={{
                        fontSize: "12px",
                        margin: "0 0 6px 0",
                        color:
                          overdue && !isComplete
                            ? "#dc2626"
                            : dueSoon && !isComplete
                              ? "#f59e0b"
                              : "#94a3b8",
                        fontWeight:
                          (overdue || dueSoon) && !isComplete ? 600 : 400,
                      }}
                    >
                      {overdue && !isComplete
                        ? "Overdue"
                        : dueSoon && !isComplete
                          ? "Due soon"
                          : "Due"}{" "}
                      {new Date(assignment.dueDate).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </p>
                  )}

                  {/* Word count & time (if work has started) */}
                  {assignment.submission &&
                    assignment.submission.status !== "NOT_STARTED" && (
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          fontSize: "11px",
                          color: "#94a3b8",
                        }}
                      >
                        {assignment.submission.wordCount > 0 && (
                          <span>{assignment.submission.wordCount} words</span>
                        )}
                        {assignment.submission.totalTimeSpent > 0 && (
                          <span>
                            {formatTimeSpent(
                              assignment.submission.totalTimeSpent
                            )}
                          </span>
                        )}
                      </div>
                    )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
