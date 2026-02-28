"use client";

import { useState, useEffect } from "react";

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface ClassSummary {
  id: string;
  name: string;
  description: string;
  studentCount: number;
  assignmentCount: number;
}

export default function TeacherPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch teachers on mount
  useEffect(() => {
    fetch("/api/users?role=TEACHER")
      .then((r) => r.json())
      .then((data) => {
        setTeachers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch classes when teacher is selected
  useEffect(() => {
    if (!selectedTeacher) {
      setClasses([]);
      return;
    }
    setLoading(true);
    fetch(`/api/classes?teacherId=${selectedTeacher}`)
      .then((r) => r.json())
      .then((data) => {
        setClasses(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedTeacher]);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>
        Teacher Dashboard
      </h1>
      <p style={{ color: "#666", marginBottom: "24px", fontSize: "14px" }}>
        Select your identity to view your classes and student submissions.
        (In the full app, this would be handled by authentication.)
      </p>

      {/* Teacher selector */}
      <div style={{ marginBottom: "32px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "4px",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          Select Teacher:
        </label>
        <select
          value={selectedTeacher}
          onChange={(e) => setSelectedTeacher(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          <option value="">Choose a teacher...</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.email})
            </option>
          ))}
        </select>
      </div>

      {/* Classes list */}
      {selectedTeacher && !loading && classes.length === 0 && (
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

      {loading && selectedTeacher && (
        <p style={{ color: "#666", fontSize: "14px" }}>Loading...</p>
      )}
    </div>
  );
}
