"use client";

import { useState } from "react";

export default function Home() {
  const [seedStatus, setSeedStatus] = useState<string | null>(null);

  const handleSeed = async () => {
    setSeedStatus("Seeding...");
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      setSeedStatus(`Done! Teacher: ${data.teacher.name}, Students: ${data.students.map((s: { name: string }) => s.name).join(", ")}, Assignment: ${data.assignment.title}`);
    } catch (err) {
      setSeedStatus(`Error: ${err}`);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: "36px", marginBottom: "8px" }}>SF Editor</h1>
      <p style={{ color: "#666", fontSize: "18px", marginBottom: "40px" }}>
        Educational writing platform with keystroke logging and AI detection
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "40px",
        }}
      >
        {/* Student Card */}
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "24px",
          }}
        >
          <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>
            Student Editor
          </h2>
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "16px" }}>
            Write your essay with full keystroke logging. Every action is
            recorded in the .sf file format - keystrokes, paste events, tab
            switches, and more.
          </p>
          <a
            href="/editor"
            style={{
              display: "inline-block",
              padding: "8px 20px",
              background: "#1d4ed8",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            Open Editor
          </a>
        </div>

        {/* Teacher Card */}
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "24px",
          }}
        >
          <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>
            Teacher Viewer
          </h2>
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "16px" }}>
            Upload a .sf file to replay the student&apos;s entire writing
            session. See every keystroke, paste event, and tab switch on a
            timeline.
          </p>
          <a
            href="/viewer"
            style={{
              display: "inline-block",
              padding: "8px 20px",
              background: "#1d4ed8",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            Open Viewer
          </a>
        </div>
      </div>

      {/* How it works */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>How it works</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
          }}
        >
          {[
            {
              step: "1",
              title: "Write",
              desc: "Students write their essay in the editor. Every action is logged.",
            },
            {
              step: "2",
              title: "Snapshot",
              desc: "Students mark draft snapshots to show their progress.",
            },
            {
              step: "3",
              title: "Submit",
              desc: "The .sf file is saved with all events and snapshots.",
            },
            {
              step: "4",
              title: "Review",
              desc: "Teachers scrub through the timeline to review the writing process.",
            },
          ].map((item) => (
            <div key={item.step} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#1d4ed8",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 8px",
                  fontWeight: "bold",
                }}
              >
                {item.step}
              </div>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                {item.title}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* What gets logged */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>
          What the .sf file captures
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            fontSize: "14px",
          }}
        >
          {[
            "Every keystroke with timestamp",
            "Backspace and delete actions",
            "Copy & paste events (with content)",
            "Cut events",
            "Text selection and highlighting",
            "Formatting changes (bold, italic, etc.)",
            "Tab switching (leaving/returning)",
            "Student-marked draft snapshots",
          ].map((item) => (
            <div
              key={item}
              style={{
                padding: "8px 12px",
                background: "#f9f9f9",
                borderRadius: "4px",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Seed data button (for MVP testing) */}
      <div
        style={{
          padding: "16px",
          background: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: "4px",
          fontSize: "13px",
        }}
      >
        <strong>MVP Testing:</strong> Click below to seed the database with test
        users and an assignment.
        <div style={{ marginTop: "8px" }}>
          <button
            onClick={handleSeed}
            style={{
              padding: "6px 16px",
              background: "#f59e0b",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Seed Database
          </button>
          {seedStatus && (
            <span style={{ marginLeft: "12px", color: "#666" }}>
              {seedStatus}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
