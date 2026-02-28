"use client";

import { useState, useEffect, useCallback } from "react";
import SFEditor from "@/components/sf-editor";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  submission?: { id: string; status: string } | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function EditorPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [initialSfContent, setInitialSfContent] = useState<string | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [status, setStatus] = useState<string>("");

  // Fetch students on mount
  useEffect(() => {
    fetch("/api/users?role=STUDENT")
      .then((r) => r.json())
      .then((data) => setStudents(data))
      .catch(() => {});
  }, []);

  // Fetch assignments when student is selected
  useEffect(() => {
    if (!selectedStudent) return;
    fetch(`/api/assignments?studentId=${selectedStudent}`)
      .then((r) => r.json())
      .then((data) => setAssignments(data))
      .catch(() => {});
  }, [selectedStudent]);

  // Start writing: create or load submission
  const handleStartWriting = useCallback(async () => {
    if (!selectedStudent || !selectedAssignment) return;

    setStatus("Loading...");

    // Check if submission already exists
    const listRes = await fetch(
      `/api/submissions?assignmentId=${selectedAssignment}&studentId=${selectedStudent}`
    );
    const existing = await listRes.json();

    if (existing.length > 0) {
      // Load existing submission
      const sub = existing[0];
      setSubmissionId(sub.id);

      // Fetch full submission with sfFile
      const fullRes = await fetch(`/api/submissions/${sub.id}`);
      const full = await fullRes.json();
      if (full.sfFile) {
        setInitialSfContent(full.sfFile);
      }
      setStatus(`Resuming submission (${sub.status})`);
    } else {
      // Create new submission
      const createRes = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: selectedAssignment,
          studentId: selectedStudent,
        }),
      });
      const created = await createRes.json();
      setSubmissionId(created.id);
      setStatus("New submission created");
    }

    setEditorReady(true);
  }, [selectedStudent, selectedAssignment]);

  // Auto-save handler
  const handleSave = useCallback(
    async (sfJson: string) => {
      if (!submissionId) return;
      try {
        await fetch(`/api/submissions/${submissionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sfFile: sfJson }),
        });
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    },
    [submissionId]
  );

  // Submit handler
  const handleSubmit = useCallback(
    async (sfJson: string) => {
      if (!submissionId) return;
      try {
        await fetch(`/api/submissions/${submissionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sfFile: sfJson, status: "SUBMITTED" }),
        });
        setStatus("Submitted successfully!");
      } catch (err) {
        console.error("Submit failed:", err);
        setStatus("Submit failed");
      }
    },
    [submissionId]
  );

  // If editor is ready, show it
  if (editorReady && selectedStudent && selectedAssignment) {
    const assignment = assignments.find((a) => a.id === selectedAssignment);
    return (
      <div>
        {/* Assignment info bar */}
        <div
          style={{
            padding: "12px 24px",
            background: "#f0f9ff",
            borderBottom: "1px solid #bae6fd",
            fontSize: "14px",
          }}
        >
          <strong>{assignment?.title}</strong>
          {assignment?.description && (
            <span style={{ color: "#666", marginLeft: "12px" }}>
              {assignment.description}
            </span>
          )}
          {assignment?.dueDate && (
            <span style={{ color: "#999", marginLeft: "12px" }}>
              Due: {new Date(assignment.dueDate).toLocaleDateString()}
            </span>
          )}
          {status && (
            <span style={{ color: "#059669", marginLeft: "12px" }}>
              {status}
            </span>
          )}
        </div>

        <SFEditor
          studentId={selectedStudent}
          assignmentId={selectedAssignment}
          submissionId={submissionId ?? undefined}
          initialContent={initialSfContent ?? undefined}
          onSave={handleSave}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  // Setup screen: select student and assignment
  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "24px" }}>
        Student Editor
      </h1>

      <p style={{ color: "#666", marginBottom: "24px", fontSize: "14px" }}>
        Select your identity and assignment to begin writing. (In the full app,
        this would be handled by authentication.)
      </p>

      {/* Student selector */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "4px",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          Select Student:
        </label>
        <select
          value={selectedStudent}
          onChange={(e) => {
            setSelectedStudent(e.target.value);
            setSelectedAssignment("");
            setEditorReady(false);
          }}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          <option value="">Choose a student...</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.email})
            </option>
          ))}
        </select>
      </div>

      {/* Assignment selector */}
      {selectedStudent && (
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            Select Assignment:
          </label>
          {assignments.length === 0 ? (
            <p style={{ color: "#999", fontSize: "14px" }}>
              No assignments found. Make sure to seed the database first (go to
              home page).
            </p>
          ) : (
            <select
              value={selectedAssignment}
              onChange={(e) => {
                setSelectedAssignment(e.target.value);
                setEditorReady(false);
              }}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              <option value="">Choose an assignment...</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                  {a.submission
                    ? ` (${a.submission.status})`
                    : " (Not started)"}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Start button */}
      {selectedStudent && selectedAssignment && (
        <button
          onClick={handleStartWriting}
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
          Start Writing
        </button>
      )}
    </div>
  );
}
