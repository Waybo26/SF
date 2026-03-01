"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import SFEditor from "@/components/sf-editor";
import { useAuth } from "@/components/auth-provider";
import { LoginModal } from "@/components/login-modal";

interface AssignmentInfo {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
}

export default function StudentWritePage() {
  const params = useParams();
  const classId = params.classId as string;
  const assignmentId = params.assignmentId as string;
  const { user, isLoggedIn, isLoading: authLoading, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  // Auto-open login modal when not logged in
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      setShowLogin(true);
    }
  }, [authLoading, isLoggedIn]);

  const [assignment, setAssignment] = useState<AssignmentInfo | null>(null);
  const [className, setClassName] = useState<string>("");
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [initialSfContent, setInitialSfContent] = useState<string | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [status, setStatus] = useState<string>("Loading...");
  const [loading, setLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Ref so callbacks always see the latest submissionId without re-creating.
  const submissionIdRef = useRef<string | null>(null);
  useEffect(() => {
    submissionIdRef.current = submissionId;
  }, [submissionId]);

  // Load class data and check for an existing submission.
  // No submission is created here — creation is deferred to the first
  // auto-save or manual save so that merely opening the page does not
  // mark the assignment as "In Progress".
  useEffect(() => {
    if (!user || user.role !== "STUDENT" || !classId || !assignmentId) return;

    const controller = new AbortController();
    const signal = controller.signal;

    async function init() {
      try {
        // Fetch class detail (student-scoped) to get assignment info
        const classRes = await fetch(
          `/api/classes/${classId}?studentId=${user!.id}`,
          { signal }
        );
        if (!classRes.ok) throw new Error("Class not found");
        const classData = await classRes.json();
        if (signal.aborted) return;
        setClassName(classData.name);

        const assignmentData = classData.assignments.find(
          (a: AssignmentInfo) => a.id === assignmentId
        );
        if (!assignmentData) throw new Error("Assignment not found");
        setAssignment(assignmentData);

        // Check for existing submission
        const listRes = await fetch(
          `/api/submissions?assignmentId=${assignmentId}&studentId=${user!.id}`,
          { signal }
        );
        const existing = await listRes.json();
        if (signal.aborted) return;

        if (existing.length > 0) {
          const sub = existing[0];
          setSubmissionId(sub.id);

          // If already submitted, mark as non-editable
          if (sub.status === "SUBMITTED" || sub.status === "GRADED") {
            setIsSubmitted(true);
          }

          // Load full submission content
          const fullRes = await fetch(`/api/submissions/${sub.id}`, { signal });
          const full = await fullRes.json();
          if (signal.aborted) return;
          if (full.sfFile) {
            setInitialSfContent(full.sfFile);
          }
          setStatus(`Resuming (${sub.status})`);
        } else {
          // No existing submission — editor will start fresh.
          // Submission record is created on first save (see ensureSubmission).
          setStatus("Ready");
        }

        setEditorReady(true);
      } catch (err) {
        if (signal.aborted) return;
        setStatus(
          err instanceof Error ? err.message : "Failed to load assignment"
        );
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    }

    init();

    return () => controller.abort();
  }, [user, classId, assignmentId]);

  // Create the submission record on-demand (first save or submit).
  // Returns the submission ID, or null if creation failed.
  // Handles 409 (already exists) by extracting the existing ID.
  const ensureSubmission = useCallback(async (): Promise<string | null> => {
    // Already have one
    if (submissionIdRef.current) return submissionIdRef.current;

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, studentId: user!.id }),
      });
      const data = await res.json();

      if (res.ok) {
        setSubmissionId(data.id);
        submissionIdRef.current = data.id;
        return data.id;
      }

      // 409 — submission already exists (race condition / StrictMode double-fire)
      if (res.status === 409 && data.id) {
        setSubmissionId(data.id);
        submissionIdRef.current = data.id;
        return data.id;
      }

      console.error("Failed to create submission:", data.error);
      return null;
    } catch (err) {
      console.error("Failed to create submission:", err);
      return null;
    }
  }, [assignmentId, user]);

  // Auto-save handler — creates the submission record on first call
  const handleSave = useCallback(
    async (sfJson: string) => {
      const id = await ensureSubmission();
      if (!id) return;
      try {
        await fetch(`/api/submissions/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sfFile: sfJson }),
        });
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    },
    [ensureSubmission]
  );

  // Submit handler — creates the submission record if needed
  const handleSubmit = useCallback(
    async (sfJson: string) => {
      const id = await ensureSubmission();
      if (!id) {
        setStatus("Submit failed — could not create submission");
        return;
      }
      try {
        await fetch(`/api/submissions/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sfFile: sfJson, status: "SUBMITTED" }),
        });
        setIsSubmitted(true);
        setStatus("Submitted successfully!");
      } catch (err) {
        console.error("Submit failed:", err);
        setStatus("Submit failed");
      }
    },
    [ensureSubmission]
  );

  // Auth loading
  if (authLoading) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}>
        <p style={{ color: "#666", fontSize: "14px" }}>Loading...</p>
      </div>
    );
  }

  // Not logged in
  if (!isLoggedIn || !user) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "24px" }}>Write</h1>
        <p style={{ color: "#666", marginBottom: "24px", fontSize: "14px" }}>
          You need to log in as a student to write.
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
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}>
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "24px" }}>
          The editor is only available to students.
        </p>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <a
            href="/teacher"
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
            Go to Teacher Dashboard
          </a>
          <button
            onClick={async () => {
              await logout();
              setShowLogin(true);
            }}
            style={{
              padding: "10px 24px",
              background: "transparent",
              color: "#1d4ed8",
              border: "1px solid #1d4ed8",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Switch Account
          </button>
        </div>
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      </div>
    );
  }

  // Still loading data
  if (loading) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}>
        <p style={{ color: "#666", fontSize: "14px" }}>Loading assignment...</p>
      </div>
    );
  }

  // Error state
  if (!editorReady || !assignment) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}>
        <p style={{ color: "#dc2626", fontSize: "14px" }}>{status}</p>
        <a
          href={`/student/class/${classId}`}
          style={{ color: "#1d4ed8", fontSize: "14px" }}
        >
          Back to class
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Assignment info bar with breadcrumb */}
      <div
        style={{
          padding: "12px 24px",
          background: "#f0f9ff",
          borderBottom: "1px solid #bae6fd",
          fontSize: "14px",
        }}
      >
        {/* Breadcrumb */}
        <div
          style={{
            fontSize: "12px",
            color: "#94a3b8",
            marginBottom: "6px",
          }}
        >
          <a
            href="/student"
            style={{ color: "#1d4ed8", textDecoration: "none" }}
          >
            My Classes
          </a>
          {" / "}
          <a
            href={`/student/class/${classId}`}
            style={{ color: "#1d4ed8", textDecoration: "none" }}
          >
            {className}
          </a>
          {" / "}
          <span style={{ color: "#64748b" }}>Write</span>
        </div>

        <strong>{assignment.title}</strong>
        {assignment.description && (
          <span style={{ color: "#666", marginLeft: "12px" }}>
            {assignment.description}
          </span>
        )}
        {assignment.dueDate && (
          <span style={{ color: "#999", marginLeft: "12px" }}>
            Due: {new Date(assignment.dueDate).toLocaleDateString()}
          </span>
        )}
        {status && (
          <span style={{ color: "#059669", marginLeft: "12px" }}>{status}</span>
        )}
      </div>

      <SFEditor
        studentId={user.id}
        assignmentId={assignmentId}
        submissionId={submissionId ?? undefined}
        initialContent={initialSfContent ?? undefined}
        initialSubmitted={isSubmitted}
        onSave={handleSave}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
