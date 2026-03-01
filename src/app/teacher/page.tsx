"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { LoginModal } from "@/components/login-modal";

interface ClassSummary {
  id: string;
  name: string;
  description: string;
  studentCount: number;
  assignmentCount: number;
}

export default function TeacherPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch classes when logged in as teacher
  useEffect(() => {
    if (!user || user.role !== "TEACHER") return;
    setLoading(true);
    fetch(`/api/classes?teacherId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        setClasses(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  // Loading auth state
  if (isLoading) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
        <p style={{ color: "#666", fontSize: "14px" }}>Loading...</p>
      </div>
    );
  }

  // Not logged in
  if (!isLoggedIn || !user) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>
          Teacher Dashboard
        </h1>
        <p style={{ color: "#666", marginBottom: "24px", fontSize: "14px" }}>
          You need to log in as a teacher to access the dashboard.
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

  // Logged in but not a teacher
  if (user.role !== "TEACHER") {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>
          Teacher Dashboard
        </h1>
        <p style={{ color: "#666", marginBottom: "24px", fontSize: "14px" }}>
          You are logged in as a student. The dashboard is only available to teachers.
        </p>
        <a
          href="/editor"
          style={{
            padding: "10px 24px",
            background: "#1d4ed8",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            textDecoration: "none",
          }}
        >
          Go to Student Editor
        </a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>
        Teacher Dashboard
      </h1>
      <p style={{ color: "#666", marginBottom: "24px", fontSize: "14px" }}>
        Welcome, {user.name}. View your classes and student submissions below.
      </p>

      {/* Classes list */}
      {!loading && classes.length === 0 && (
        <p style={{ color: "#999", fontSize: "14px" }}>
          No classes found. Make sure to seed the database first (go to home page).
        </p>
      )}

      {classes.length > 0 && (
        <div>
          <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>
            Your Classes
          </h2>
          <div style={{ display: "grid", gap: "16px" }}>
            {classes.map((cls) => (
              <a
                key={cls.id}
                href={`/teacher/class/${cls.id}`}
                style={{
                  display: "block",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "20px",
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
                  <div>
                    <h3 style={{ fontSize: "16px", margin: "0 0 6px 0", color: "#1d4ed8" }}>
                      {cls.name}
                    </h3>
                    <p style={{ fontSize: "13px", color: "#666", margin: 0 }}>
                      {cls.description}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "16px", flexShrink: 0, marginLeft: "16px" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "20px", fontWeight: "bold", color: "#333" }}>
                        {cls.studentCount}
                      </div>
                      <div style={{ fontSize: "11px", color: "#999" }}>Students</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "20px", fontWeight: "bold", color: "#333" }}>
                        {cls.assignmentCount}
                      </div>
                      <div style={{ fontSize: "11px", color: "#999" }}>Assignments</div>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <p style={{ color: "#666", fontSize: "14px" }}>Loading...</p>
      )}
    </div>
  );
}
