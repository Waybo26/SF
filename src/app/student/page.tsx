"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { LoginModal } from "@/components/login-modal";

interface ClassSummary {
  id: string;
  name: string;
  description: string;
  teacher: { id: string; name: string };
  studentCount: number;
  assignmentCount: number;
  progress: {
    submitted: number;
    inProgress: number;
    notStarted: number;
    total: number;
  };
}

export default function StudentDashboard() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "STUDENT") return;
    setLoading(true);
    fetch(`/api/classes?studentId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        setClasses(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (isLoading) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
        <p style={{ color: "#666", fontSize: "14px" }}>Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "24px" }}>
          Student Dashboard
        </h1>
        <p style={{ color: "#666", marginBottom: "24px", fontSize: "14px" }}>
          You need to log in as a student to access your classes.
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

  if (user.role !== "STUDENT") {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "24px" }}>
          Student Dashboard
        </h1>
        <p style={{ color: "#666", marginBottom: "24px", fontSize: "14px" }}>
          You are logged in as a teacher. This page is only available to students.
        </p>
        <a
          href="/teacher"
          style={{
            padding: "10px 24px",
            background: "#1d4ed8",
            color: "white",
            borderRadius: "4px",
            fontSize: "14px",
            textDecoration: "none",
          }}
        >
          Go to Teacher Dashboard
        </a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "4px" }}>My Classes</h1>
      <p style={{ color: "#666", marginBottom: "32px", fontSize: "14px" }}>
        Welcome, {user.name}. Select a class to view your assignments.
      </p>

      {loading && (
        <p style={{ color: "#666", fontSize: "14px" }}>Loading classes...</p>
      )}

      {!loading && classes.length === 0 && (
        <p style={{ color: "#999", fontSize: "14px" }}>
          No classes found. Make sure to seed the database first (go to home
          page).
        </p>
      )}

      {classes.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {classes.map((cls) => {
            const progressPercent =
              cls.progress.total > 0
                ? Math.round(
                    (cls.progress.submitted / cls.progress.total) * 100
                  )
                : 0;

            return (
              <a
                key={cls.id}
                href={`/student/class/${cls.id}`}
                style={{
                  display: "block",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "24px",
                  textDecoration: "none",
                  color: "inherit",
                  transition:
                    "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
                  background: "white",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#1d4ed8";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(29,78,216,0.1)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Class name */}
                <h3
                  style={{
                    fontSize: "17px",
                    margin: "0 0 6px 0",
                    color: "#1d4ed8",
                    fontWeight: 600,
                  }}
                >
                  {cls.name}
                </h3>

                {/* Teacher */}
                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    margin: "0 0 12px 0",
                  }}
                >
                  {cls.teacher.name}
                </p>

                {/* Description (truncated) */}
                <p
                  style={{
                    fontSize: "13px",
                    color: "#94a3b8",
                    margin: "0 0 16px 0",
                    lineHeight: "1.4",
                  }}
                >
                  {cls.description.length > 100
                    ? cls.description.slice(0, 100) + "..."
                    : cls.description}
                </p>

                {/* Progress bar */}
                <div style={{ marginBottom: "10px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      color: "#64748b",
                      marginBottom: "4px",
                    }}
                  >
                    <span>
                      {cls.progress.submitted}/{cls.progress.total} completed
                    </span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      background: "#f1f5f9",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${progressPercent}%`,
                        height: "100%",
                        background:
                          progressPercent === 100 ? "#22c55e" : "#3b82f6",
                        borderRadius: "3px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Stats row */}
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    fontSize: "12px",
                    color: "#94a3b8",
                  }}
                >
                  <span>{cls.assignmentCount} assignments</span>
                  <span>{cls.studentCount} students</span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
