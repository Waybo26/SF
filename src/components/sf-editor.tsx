"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEffect, useRef, useState, useCallback } from "react";
import { SFLogger } from "@/lib/sf-logger";
import { KeystrokeLogger } from "@/extensions/keystroke-logger";
import { PasteLogger } from "@/extensions/paste-logger";
import { SelectionLogger } from "@/extensions/selection-logger";
import { countWords, htmlToPlainText } from "@/lib/sf-parser";

interface SFEditorProps {
  studentId: string;
  assignmentId: string;
  submissionId?: string;
  initialContent?: string;
  onSave?: (sfJson: string) => void;
  onSubmit?: (sfJson: string) => void;
}

export default function SFEditor({
  studentId,
  assignmentId,
  submissionId,
  initialContent,
  onSave,
  onSubmit,
}: SFEditorProps) {
  const loggerRef = useRef<SFLogger | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [showSnapshotInput, setShowSnapshotInput] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Initialize logger
  if (!loggerRef.current) {
    if (initialContent) {
      try {
        loggerRef.current = SFLogger.fromJSON(initialContent);
      } catch {
        loggerRef.current = new SFLogger(studentId, assignmentId);
      }
    } else {
      loggerRef.current = new SFLogger(studentId, assignmentId);
    }
  }

  const logger = loggerRef.current;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: "Start writing your essay here...",
      }),
      KeystrokeLogger.configure({ logger }),
      PasteLogger.configure({ logger }),
      SelectionLogger.configure({ logger }),
    ],
    content: "",
    editable: !isSubmitted,
    onUpdate: ({ editor }) => {
      const text = htmlToPlainText(editor.getHTML());
      setWordCount(countWords(text));
      setEventCount(logger.getEventCount());
    },
  });

  // Page Visibility API - tab detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logger.logTabAway();
      } else {
        logger.logTabReturn();
      }
      setEventCount(logger.getEventCount());
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [logger]);

  // Elapsed time timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(logger.getElapsedTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [logger]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!onSave) return;
    const interval = setInterval(() => {
      if (!isSubmitted) {
        const sfJson = logger.serialize();
        onSave(sfJson);
        setLastSaved(new Date().toLocaleTimeString());
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [logger, onSave, isSubmitted]);

  // Save snapshot
  const handleSaveSnapshot = useCallback(() => {
    if (!editor || !snapshotLabel.trim()) return;
    const html = editor.getHTML();
    logger.createSnapshot(snapshotLabel.trim(), html);
    setSnapshotLabel("");
    setShowSnapshotInput(false);
    setEventCount(logger.getEventCount());
  }, [editor, logger, snapshotLabel]);

  // Submit
  const handleSubmit = useCallback(() => {
    if (!editor) return;
    const confirmed = window.confirm(
      "Are you sure you want to submit? You will not be able to edit after submission."
    );
    if (!confirmed) return;

    // Create a final snapshot
    const html = editor.getHTML();
    logger.createSnapshot("Final Submission", html);
    logger.markSubmitted();

    const sfJson = logger.serialize();
    setIsSubmitted(true);

    if (onSubmit) {
      onSubmit(sfJson);
    }
  }, [editor, logger, onSubmit]);

  // Manual save
  const handleManualSave = useCallback(() => {
    if (!onSave) return;
    const sfJson = logger.serialize();
    onSave(sfJson);
    setLastSaved(new Date().toLocaleTimeString());
  }, [logger, onSave]);

  // Download .sf file
  const handleDownload = useCallback(() => {
    const sfJson = logger.serialize();
    const blob = new Blob([sfJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submission-${assignmentId}.sf`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logger, assignmentId]);

  // Format elapsed time
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          padding: "8px",
          borderBottom: "1px solid #ddd",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={isSubmitted}
          style={{
            padding: "4px 8px",
            fontWeight: editor?.isActive("bold") ? "bold" : "normal",
            background: editor?.isActive("bold") ? "#e0e0e0" : "#f5f5f5",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: isSubmitted ? "not-allowed" : "pointer",
          }}
        >
          B
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={isSubmitted}
          style={{
            padding: "4px 8px",
            fontStyle: editor?.isActive("italic") ? "italic" : "normal",
            background: editor?.isActive("italic") ? "#e0e0e0" : "#f5f5f5",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: isSubmitted ? "not-allowed" : "pointer",
          }}
        >
          I
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          disabled={isSubmitted}
          style={{
            padding: "4px 8px",
            textDecoration: editor?.isActive("underline")
              ? "underline"
              : "none",
            background: editor?.isActive("underline") ? "#e0e0e0" : "#f5f5f5",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: isSubmitted ? "not-allowed" : "pointer",
          }}
        >
          U
        </button>

        <span style={{ borderLeft: "1px solid #ccc", margin: "0 4px", height: "24px" }} />

        <button
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 1 }).run()
          }
          disabled={isSubmitted}
          style={{
            padding: "4px 8px",
            background: editor?.isActive("heading", { level: 1 })
              ? "#e0e0e0"
              : "#f5f5f5",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: isSubmitted ? "not-allowed" : "pointer",
          }}
        >
          H1
        </button>
        <button
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
          disabled={isSubmitted}
          style={{
            padding: "4px 8px",
            background: editor?.isActive("heading", { level: 2 })
              ? "#e0e0e0"
              : "#f5f5f5",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: isSubmitted ? "not-allowed" : "pointer",
          }}
        >
          H2
        </button>

        <span style={{ borderLeft: "1px solid #ccc", margin: "0 4px", height: "24px" }} />

        <button
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={isSubmitted}
          style={{
            padding: "4px 8px",
            background: editor?.isActive("bulletList") ? "#e0e0e0" : "#f5f5f5",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: isSubmitted ? "not-allowed" : "pointer",
          }}
        >
          • List
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          disabled={isSubmitted}
          style={{
            padding: "4px 8px",
            background: editor?.isActive("orderedList")
              ? "#e0e0e0"
              : "#f5f5f5",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: isSubmitted ? "not-allowed" : "pointer",
          }}
        >
          1. List
        </button>

        <span style={{ borderLeft: "1px solid #ccc", margin: "0 4px", height: "24px" }} />

        <button
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          disabled={isSubmitted}
          style={{
            padding: "4px 8px",
            background: editor?.isActive("blockquote") ? "#e0e0e0" : "#f5f5f5",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: isSubmitted ? "not-allowed" : "pointer",
          }}
        >
          &ldquo; Quote
        </button>
      </div>

      {/* Editor */}
      <div
        style={{
          border: "1px solid #ddd",
          borderTop: "none",
          minHeight: "400px",
          padding: "16px",
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Snapshot Section */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          padding: "12px 0",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {showSnapshotInput ? (
          <>
            <input
              type="text"
              value={snapshotLabel}
              onChange={(e) => setSnapshotLabel(e.target.value)}
              placeholder="Snapshot label (e.g., 'First Draft')"
              onKeyDown={(e) => e.key === "Enter" && handleSaveSnapshot()}
              style={{
                padding: "6px 10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                flex: 1,
                minWidth: "200px",
              }}
            />
            <button
              onClick={handleSaveSnapshot}
              disabled={!snapshotLabel.trim()}
              style={{
                padding: "6px 16px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: snapshotLabel.trim() ? "pointer" : "not-allowed",
                opacity: snapshotLabel.trim() ? 1 : 0.5,
              }}
            >
              Save Snapshot
            </button>
            <button
              onClick={() => {
                setShowSnapshotInput(false);
                setSnapshotLabel("");
              }}
              style={{
                padding: "6px 12px",
                background: "#f5f5f5",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowSnapshotInput(true)}
            disabled={isSubmitted}
            style={{
              padding: "6px 16px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isSubmitted ? "not-allowed" : "pointer",
              opacity: isSubmitted ? 0.5 : 1,
            }}
          >
            Save Draft Snapshot
          </button>
        )}

        <div style={{ flex: 1 }} />

        <button
          onClick={handleManualSave}
          disabled={isSubmitted}
          style={{
            padding: "6px 16px",
            background: "#f5f5f5",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: isSubmitted ? "not-allowed" : "pointer",
          }}
        >
          Save
        </button>

        <button
          onClick={handleDownload}
          style={{
            padding: "6px 16px",
            background: "#f5f5f5",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Download .sf
        </button>

        <button
          onClick={handleSubmit}
          disabled={isSubmitted}
          style={{
            padding: "6px 16px",
            background: isSubmitted ? "#9ca3af" : "#22c55e",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isSubmitted ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitted ? "Submitted" : "Submit"}
        </button>
      </div>

      {/* Status Bar */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          padding: "8px 12px",
          background: "#f9f9f9",
          border: "1px solid #eee",
          borderRadius: "4px",
          fontSize: "13px",
          color: "#666",
          flexWrap: "wrap",
        }}
      >
        <span>Words: {wordCount}</span>
        <span>Events: {eventCount}</span>
        <span>Time: {formatTime(elapsedTime)}</span>
        <span>Snapshots: {logger.getSnapshots().length}</span>
        {lastSaved && <span>Last saved: {lastSaved}</span>}
        {submissionId && (
          <span style={{ color: "#999" }}>ID: {submissionId}</span>
        )}
        {isSubmitted && (
          <span style={{ color: "#22c55e", fontWeight: "bold" }}>
            SUBMITTED
          </span>
        )}
      </div>
    </div>
  );
}
