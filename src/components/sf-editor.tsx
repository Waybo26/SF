"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import { FontSize } from "@/extensions/font-size";
import { LineSpacing } from "@/extensions/line-spacing";
import { Indent } from "@/extensions/indent";
import { FirstLineIndent } from "@/extensions/first-line-indent";
import { useEffect, useRef, useState, useCallback } from "react";
import { SFLogger } from "@/lib/sf-logger";
import { KeystrokeLogger } from "@/extensions/keystroke-logger";
import { PasteLogger } from "@/extensions/paste-logger";
import { SelectionLogger } from "@/extensions/selection-logger";
import { countWords, htmlToPlainText } from "@/lib/sf-parser";

// ── Constants ────────────────────────────────────────────────────────

const FONT_FAMILIES = [
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Arial", value: "Arial" },
  { label: "Georgia", value: "Georgia" },
  { label: "Courier New", value: "Courier New" },
  { label: "Helvetica", value: "Helvetica" },
];

const FONT_SIZES = [
  "8pt", "9pt", "10pt", "11pt", "12pt", "14pt", "16pt",
  "18pt", "20pt", "24pt", "28pt", "36pt", "48pt",
];

const LINE_SPACINGS = [
  { label: "1.0", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.5", value: "1.5" },
  { label: "2.0", value: "2" },
  { label: "2.5", value: "2.5" },
  { label: "3.0", value: "3" },
];

const TEXT_COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#cccccc",
  "#c0392b", "#e74c3c", "#e67e22", "#f39c12", "#f1c40f",
  "#27ae60", "#2ecc71", "#1abc9c", "#2980b9", "#3498db",
  "#8e44ad", "#9b59b6", "#2c3e50", "#7f8c8d", "#95a5a6",
];

const HIGHLIGHT_COLORS = [
  "#fef08a", "#bbf7d0", "#bfdbfe", "#e9d5ff", "#fecaca",
  "#fed7aa", "#d9f99d", "#a5f3fc", "#fbcfe8", "#e2e8f0",
];

// ── Props ────────────────────────────────────────────────────────────

interface SFEditorProps {
  studentId: string;
  assignmentId: string;
  submissionId?: string;
  initialContent?: string;
  initialSubmitted?: boolean;
  onSave?: (sfJson: string) => void;
  onSubmit?: (sfJson: string) => void;
}

// ── Toolbar Button ───────────────────────────────────────────────────

function TBtn({
  active,
  disabled,
  onClick,
  title,
  children,
  style,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "28px",
        height: "28px",
        borderRadius: "4px",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: active ? "#d3e3fd" : "transparent",
        color: active ? "#1a73e8" : "#444",
        fontSize: "13px",
        fontWeight: active ? 700 : 400,
        opacity: disabled ? 0.4 : 1,
        flexShrink: 0,
        transition: "background 0.1s",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled)
          e.currentTarget.style.background = "#f1f3f4";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

/** Vertical separator line between toolbar groups */
function Sep() {
  return (
    <div
      style={{
        width: "1px",
        height: "20px",
        background: "#dadce0",
        margin: "0 4px",
        flexShrink: 0,
      }}
    />
  );
}

// ── Color Picker Popover ─────────────────────────────────────────────

function ColorPicker({
  colors,
  activeColor,
  onSelect,
  onClose,
  label,
}: {
  colors: string[];
  activeColor: string | null;
  onSelect: (color: string) => void;
  onClose: () => void;
  label: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        marginTop: "4px",
        background: "white",
        border: "1px solid #dadce0",
        borderRadius: "8px",
        padding: "8px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
        zIndex: 100,
        width: "180px",
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#666",
          marginBottom: "6px",
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => {
              onSelect(color);
              onClose();
            }}
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "3px",
              border:
                activeColor === color
                  ? "2px solid #1a73e8"
                  : "1px solid #dadce0",
              background: color,
              cursor: "pointer",
              padding: 0,
            }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          onSelect("");
          onClose();
        }}
        style={{
          marginTop: "6px",
          fontSize: "11px",
          color: "#1a73e8",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "2px 0",
        }}
      >
        Remove
      </button>
    </div>
  );
}

// ── Main Editor Component ────────────────────────────────────────────

export default function SFEditor({
  studentId,
  assignmentId,
  submissionId,
  initialContent,
  initialSubmitted = false,
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
  const [isSubmitted, setIsSubmitted] = useState(initialSubmitted);

  // ── Toast notification ────────────────────────────────────────────
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  // ── Page pagination ──────────────────────────────────────────────
  // 11in page = 1056px at 96dpi. Content area per page = 11in - 1in top - 1in bottom = 9in = 864px.
  const PAGE_HEIGHT_PX = 11 * 96; // 1056px — full page including padding
  const PAGE_CONTENT_PX = 9 * 96; // 864px — writable area per page
  const PAGE_GAP_PX = 20; // gap between visual pages
  const [numPages, setNumPages] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);

  // Watch the content height and recalculate page count
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const recalc = () => {
      // scrollHeight of the content wrapper (inside 1in padding)
      const h = el.scrollHeight;
      const pages = Math.max(1, Math.ceil(h / PAGE_CONTENT_PX));
      setNumPages(pages);
    };

    recalc();

    const ro = new ResizeObserver(recalc);
    ro.observe(el);

    // Also recalc on any DOM mutation (e.g. typing, paste, delete)
    const mo = new MutationObserver(recalc);
    mo.observe(el, { childList: true, subtree: true, characterData: true });

    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [PAGE_CONTENT_PX]);

  // Total height of the page card: N pages + (N-1) gaps
  const pageCardHeight = numPages * PAGE_HEIGHT_PX + (numPages - 1) * PAGE_GAP_PX;

  // Color picker popover state
  const [showTextColor, setShowTextColor] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [showLineSpacing, setShowLineSpacing] = useState(false);
  const textColorRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineSpacingRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        showTextColor &&
        textColorRef.current &&
        !textColorRef.current.contains(e.target as Node)
      ) {
        setShowTextColor(false);
      }
      if (
        showHighlight &&
        highlightRef.current &&
        !highlightRef.current.contains(e.target as Node)
      ) {
        setShowHighlight(false);
      }
      if (
        showLineSpacing &&
        lineSpacingRef.current &&
        !lineSpacingRef.current.contains(e.target as Node)
      ) {
        setShowLineSpacing(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTextColor, showHighlight, showLineSpacing]);

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
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: "Start writing your essay here...",
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      LineSpacing,
      Indent,
      FirstLineIndent,
      KeystrokeLogger.configure({ logger }),
      PasteLogger.configure({ logger }),
      SelectionLogger.configure({ logger }),
    ],
    content: loggerRef.current?.getCurrentContent() || "",
    editable: !isSubmitted,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      logger.updateContent(html);
      const text = htmlToPlainText(html);
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
      if (!isSubmitted && editor) {
        logger.updateContent(editor.getHTML());
        const sfJson = logger.serialize();
        onSave(sfJson);
        setLastSaved(new Date().toLocaleTimeString());
        showToast("Auto-saved");
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [logger, onSave, isSubmitted, editor, showToast]);

  // Save snapshot
  const handleSaveSnapshot = useCallback(() => {
    if (!editor || !snapshotLabel.trim()) return;
    const html = editor.getHTML();
    logger.createSnapshot(snapshotLabel.trim(), html);
    showToast(`Snapshot "${snapshotLabel.trim()}" saved`);
    setSnapshotLabel("");
    setShowSnapshotInput(false);
    setEventCount(logger.getEventCount());
  }, [editor, logger, snapshotLabel, showToast]);

  // Submit
  const handleSubmit = useCallback(() => {
    if (!editor) return;
    const confirmed = window.confirm(
      "Are you sure you want to submit? You will not be able to edit after submission."
    );
    if (!confirmed) return;

    const html = editor.getHTML();
    logger.updateContent(html);
    logger.createSnapshot("Final Submission", html);
    logger.markSubmitted();

    const sfJson = logger.serialize();
    setIsSubmitted(true);
    showToast("Submitted successfully");

    if (onSubmit) {
      onSubmit(sfJson);
    }
  }, [editor, logger, onSubmit, showToast]);

  // Manual save
  const handleManualSave = useCallback(() => {
    if (!onSave || !editor) return;
    logger.updateContent(editor.getHTML());
    const sfJson = logger.serialize();
    onSave(sfJson);
    setLastSaved(new Date().toLocaleTimeString());
    showToast("Saved");
  }, [logger, onSave, editor, showToast]);

  // Download .sf file
  const handleDownload = useCallback(() => {
    if (editor) {
      logger.updateContent(editor.getHTML());
    }
    const sfJson = logger.serialize();
    const blob = new Blob([sfJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submission-${assignmentId}.sf`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logger, assignmentId, editor]);

  // Format elapsed time
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // ── Helpers to read current formatting state from editor ──────────

  const currentFontFamily =
    editor?.getAttributes("textStyle").fontFamily || "";
  const currentFontSize =
    editor?.getAttributes("textStyle").fontSize || "";
  const currentTextColor =
    editor?.getAttributes("textStyle").color || "";
  const currentHighlight =
    editor?.getAttributes("highlight").color || "";

  return (
    <div
      className="sf-editor-root"
      style={{
        display: "grid",
        gridTemplateRows: "auto 1fr auto auto",
        height: "100%",
        background: "#e8eaed",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: "hidden",
      }}
    >
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div
        className="sf-toolbar"
        style={{
          zIndex: 50,
          display: "flex",
          gap: "2px",
          padding: "4px 8px",
          background: "#f8f9fa",
          border: "1px solid #dadce0",
          borderBottom: "1px solid #dadce0",
          flexWrap: "wrap",
          alignItems: "center",
          minHeight: "40px",
          justifyContent: "center",
        }}
      >
        {/* ── Dashboard link ───────────────────────────────────── */}
        <a
          href="/student"
          title="Back to Dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            borderRadius: "4px",
            color: "#5f6368",
            marginRight: "4px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#e8eaed")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1.5l-6.5 5V14a.5.5 0 00.5.5h4V10h4v4.5h4a.5.5 0 00.5-.5V6.5L8 1.5z" />
          </svg>
        </a>

        <div style={{ width: "1px", height: "20px", background: "#dadce0", margin: "0 4px" }} />

        {/* ── Font Family ──────────────────────────────────────── */}
        <select
          value={currentFontFamily}
          disabled={isSubmitted}
          onChange={(e) => {
            const val = e.target.value;
            if (val) {
              editor?.chain().focus().setFontFamily(val).run();
            } else {
              editor?.chain().focus().unsetFontFamily().run();
            }
          }}
          title="Font"
          style={{
            height: "28px",
            border: "1px solid transparent",
            borderRadius: "4px",
            background: "transparent",
            fontSize: "12px",
            color: "#333",
            cursor: isSubmitted ? "not-allowed" : "pointer",
            padding: "0 4px",
            maxWidth: "130px",
            outline: "none",
          }}
        >
          <option value="">Default</option>
          {FONT_FAMILIES.map((f) => (
            <option
              key={f.value}
              value={f.value}
              style={{ fontFamily: f.value }}
            >
              {f.label}
            </option>
          ))}
        </select>

        <Sep />

        {/* ── Font Size ────────────────────────────────────────── */}
        <select
          value={currentFontSize}
          disabled={isSubmitted}
          onChange={(e) => {
            const val = e.target.value;
            if (val) {
              editor?.chain().focus().setFontSize(val).run();
            } else {
              editor?.chain().focus().unsetFontSize().run();
            }
          }}
          title="Font size"
          style={{
            height: "28px",
            border: "1px solid transparent",
            borderRadius: "4px",
            background: "transparent",
            fontSize: "12px",
            color: "#333",
            cursor: isSubmitted ? "not-allowed" : "pointer",
            padding: "0 4px",
            width: "58px",
            outline: "none",
          }}
        >
          <option value="">Size</option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <Sep />

        {/* ── Bold / Italic / Underline / Strikethrough ────────── */}
        <TBtn
          active={editor?.isActive("bold")}
          disabled={isSubmitted}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
          style={{ fontWeight: 700 }}
        >
          B
        </TBtn>
        <TBtn
          active={editor?.isActive("italic")}
          disabled={isSubmitted}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
          style={{ fontStyle: "italic" }}
        >
          I
        </TBtn>
        <TBtn
          active={editor?.isActive("underline")}
          disabled={isSubmitted}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
          style={{ textDecoration: "underline" }}
        >
          U
        </TBtn>
        <TBtn
          active={editor?.isActive("strike")}
          disabled={isSubmitted}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          title="Strikethrough"
          style={{ textDecoration: "line-through" }}
        >
          S
        </TBtn>

        <Sep />

        {/* ── Text Color ───────────────────────────────────────── */}
        <div ref={textColorRef} style={{ position: "relative" }}>
          <TBtn
            disabled={isSubmitted}
            onClick={() => {
              setShowTextColor(!showTextColor);
              setShowHighlight(false);
              setShowLineSpacing(false);
            }}
            title="Text color"
          >
            <span style={{ position: "relative" }}>
              A
              <span
                style={{
                  position: "absolute",
                  bottom: "-2px",
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: currentTextColor || "#000",
                  borderRadius: "1px",
                }}
              />
            </span>
          </TBtn>
          {showTextColor && (
            <ColorPicker
              colors={TEXT_COLORS}
              activeColor={currentTextColor}
              onSelect={(color) => {
                if (color) {
                  editor?.chain().focus().setColor(color).run();
                } else {
                  editor?.chain().focus().unsetColor().run();
                }
              }}
              onClose={() => setShowTextColor(false)}
              label="Text color"
            />
          )}
        </div>

        {/* ── Highlight ────────────────────────────────────────── */}
        <div ref={highlightRef} style={{ position: "relative" }}>
          <TBtn
            active={editor?.isActive("highlight")}
            disabled={isSubmitted}
            onClick={() => {
              setShowHighlight(!showHighlight);
              setShowTextColor(false);
              setShowLineSpacing(false);
            }}
            title="Highlight color"
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "16px",
                height: "16px",
                borderRadius: "2px",
                background: currentHighlight || "#fef08a",
                color: "#333",
                fontSize: "11px",
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              H
            </span>
          </TBtn>
          {showHighlight && (
            <ColorPicker
              colors={HIGHLIGHT_COLORS}
              activeColor={currentHighlight}
              onSelect={(color) => {
                if (color) {
                  editor
                    ?.chain()
                    .focus()
                    .toggleHighlight({ color })
                    .run();
                } else {
                  editor?.chain().focus().unsetHighlight().run();
                }
              }}
              onClose={() => setShowHighlight(false)}
              label="Highlight color"
            />
          )}
        </div>

        <Sep />

        {/* ── Text Alignment ───────────────────────────────────── */}
        <TBtn
          active={editor?.isActive({ textAlign: "left" })}
          disabled={isSubmitted}
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
          title="Align left"
        >
          {/* Left align icon (3 bars, left-aligned) */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="1" y="2" width="12" height="1.5" rx="0.5" />
            <rect x="1" y="6" width="8" height="1.5" rx="0.5" />
            <rect x="1" y="10" width="10" height="1.5" rx="0.5" />
          </svg>
        </TBtn>
        <TBtn
          active={editor?.isActive({ textAlign: "center" })}
          disabled={isSubmitted}
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
          title="Align center"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="1" y="2" width="12" height="1.5" rx="0.5" />
            <rect x="3" y="6" width="8" height="1.5" rx="0.5" />
            <rect x="2" y="10" width="10" height="1.5" rx="0.5" />
          </svg>
        </TBtn>
        <TBtn
          active={editor?.isActive({ textAlign: "right" })}
          disabled={isSubmitted}
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
          title="Align right"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="1" y="2" width="12" height="1.5" rx="0.5" />
            <rect x="5" y="6" width="8" height="1.5" rx="0.5" />
            <rect x="3" y="10" width="10" height="1.5" rx="0.5" />
          </svg>
        </TBtn>
        <TBtn
          active={editor?.isActive({ textAlign: "justify" })}
          disabled={isSubmitted}
          onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
          title="Justify"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="1" y="2" width="12" height="1.5" rx="0.5" />
            <rect x="1" y="6" width="12" height="1.5" rx="0.5" />
            <rect x="1" y="10" width="12" height="1.5" rx="0.5" />
          </svg>
        </TBtn>

        <Sep />

        {/* ── Line Spacing ─────────────────────────────────────── */}
        <div ref={lineSpacingRef} style={{ position: "relative" }}>
          <TBtn
            disabled={isSubmitted}
            onClick={() => {
              setShowLineSpacing(!showLineSpacing);
              setShowTextColor(false);
              setShowHighlight(false);
            }}
            title="Line spacing"
            style={{ width: "auto", padding: "0 6px", fontSize: "11px" }}
          >
            {/* Line spacing icon */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="5" y="2" width="8" height="1.2" rx="0.5" />
              <rect x="5" y="6.4" width="8" height="1.2" rx="0.5" />
              <rect x="5" y="10.8" width="8" height="1.2" rx="0.5" />
              <path d="M2.5 3.5 L1 5 L1.8 5 L1.8 9 L1 9 L2.5 10.5 L4 9 L3.2 9 L3.2 5 L4 5 Z" />
            </svg>
          </TBtn>
          {showLineSpacing && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: "4px",
                background: "white",
                border: "1px solid #dadce0",
                borderRadius: "8px",
                padding: "4px 0",
                boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                zIndex: 100,
                minWidth: "100px",
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {LINE_SPACINGS.map((ls) => (
                <button
                  key={ls.value}
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().setLineSpacing(ls.value).run();
                    setShowLineSpacing(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "6px 16px",
                    fontSize: "12px",
                    color: "#333",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f1f3f4")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {ls.label}
                </button>
              ))}
              <div
                style={{
                  height: "1px",
                  background: "#dadce0",
                  margin: "4px 0",
                }}
              />
              <button
                type="button"
                onClick={() => {
                  editor?.chain().focus().unsetLineSpacing().run();
                  setShowLineSpacing(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "6px 16px",
                  fontSize: "12px",
                  color: "#1a73e8",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f1f3f4")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                Default
              </button>
            </div>
          )}
        </div>

        <Sep />

        {/* ── Indent / Outdent ─────────────────────────────────── */}
        <TBtn
          active={!!editor?.getAttributes("paragraph").textIndent || !!editor?.getAttributes("heading").textIndent}
          disabled={isSubmitted}
          onClick={() => editor?.chain().focus().toggleFirstLineIndent().run()}
          title="First-line indent (0.5in)"
          style={{ fontSize: "11px", fontWeight: 600, width: "auto", padding: "0 5px" }}
        >
          {/* First-line indent icon: paragraph symbol with indented first line */}
          <svg width="16" height="14" viewBox="0 0 16 14" fill="currentColor">
            <rect x="5" y="2" width="10" height="1.2" rx="0.5" />
            <rect x="1" y="6" width="14" height="1.2" rx="0.5" />
            <rect x="1" y="10" width="14" height="1.2" rx="0.5" />
          </svg>
        </TBtn>
        <TBtn
          disabled={isSubmitted}
          onClick={() => editor?.chain().focus().outdent().run()}
          title="Decrease indent (Shift+Tab)"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="1" y="1" width="12" height="1.2" rx="0.5" />
            <rect x="5" y="4.6" width="8" height="1.2" rx="0.5" />
            <rect x="5" y="8.2" width="8" height="1.2" rx="0.5" />
            <rect x="1" y="11.8" width="12" height="1.2" rx="0.5" />
            <path d="M3.5 5.5 L1 7 L3.5 8.5 Z" />
          </svg>
        </TBtn>
        <TBtn
          disabled={isSubmitted}
          onClick={() => editor?.chain().focus().indent().run()}
          title="Increase indent (Tab)"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="1" y="1" width="12" height="1.2" rx="0.5" />
            <rect x="5" y="4.6" width="8" height="1.2" rx="0.5" />
            <rect x="5" y="8.2" width="8" height="1.2" rx="0.5" />
            <rect x="1" y="11.8" width="12" height="1.2" rx="0.5" />
            <path d="M1 5.5 L3.5 7 L1 8.5 Z" />
          </svg>
        </TBtn>

        <Sep />

        {/* ── Lists ────────────────────────────────────────────── */}
        <TBtn
          active={editor?.isActive("bulletList")}
          disabled={isSubmitted}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <circle cx="2.5" cy="3" r="1.2" />
            <rect x="5" y="2.2" width="8" height="1.5" rx="0.5" />
            <circle cx="2.5" cy="7" r="1.2" />
            <rect x="5" y="6.2" width="8" height="1.5" rx="0.5" />
            <circle cx="2.5" cy="11" r="1.2" />
            <rect x="5" y="10.2" width="8" height="1.5" rx="0.5" />
          </svg>
        </TBtn>
        <TBtn
          active={editor?.isActive("orderedList")}
          disabled={isSubmitted}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="currentColor"
            style={{ fontSize: "7px" }}
          >
            <text x="1" y="4" fontSize="5" fontWeight="700">
              1.
            </text>
            <rect x="5" y="2.2" width="8" height="1.5" rx="0.5" />
            <text x="1" y="8" fontSize="5" fontWeight="700">
              2.
            </text>
            <rect x="5" y="6.2" width="8" height="1.5" rx="0.5" />
            <text x="1" y="12" fontSize="5" fontWeight="700">
              3.
            </text>
            <rect x="5" y="10.2" width="8" height="1.5" rx="0.5" />
          </svg>
        </TBtn>

        <Sep />

        {/* ── Headings ─────────────────────────────────────────── */}
        <TBtn
          active={editor?.isActive("heading", { level: 1 })}
          disabled={isSubmitted}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 1 }).run()
          }
          title="Heading 1"
          style={{ fontSize: "12px", fontWeight: 700 }}
        >
          H1
        </TBtn>
        <TBtn
          active={editor?.isActive("heading", { level: 2 })}
          disabled={isSubmitted}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
          title="Heading 2"
          style={{ fontSize: "11px", fontWeight: 700 }}
        >
          H2
        </TBtn>
        <TBtn
          active={editor?.isActive("heading", { level: 3 })}
          disabled={isSubmitted}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 3 }).run()
          }
          title="Heading 3"
          style={{ fontSize: "10px", fontWeight: 700 }}
        >
          H3
        </TBtn>

        <Sep />

        {/* ── Blockquote ───────────────────────────────────────── */}
        <TBtn
          active={editor?.isActive("blockquote")}
          disabled={isSubmitted}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="1" y="2" width="2" height="10" rx="0.5" />
            <rect x="5" y="3" width="8" height="1.5" rx="0.5" />
            <rect x="5" y="6.5" width="8" height="1.5" rx="0.5" />
            <rect x="5" y="10" width="5" height="1.5" rx="0.5" />
          </svg>
        </TBtn>
      </div>

      {/* ── Editor Area (Page Card) ──────────────────────────── */}
      <div
        style={{
          padding: "30px 0 60px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflowY: "auto",
          minHeight: 0,
          background: "#e8eaed",
          position: "relative",
        }}
      >
        {/* Toast notification */}
        {toast && (
          <div
            style={{
              position: "sticky",
              top: 8,
              zIndex: 100,
              padding: "6px 16px",
              background: "#323232",
              color: "#fff",
              fontSize: "13px",
              borderRadius: "6px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              pointerEvents: "none",
              marginBottom: -32,
            }}
          >
            {toast}
          </div>
        )}
        <div
          className="sf-editor-page"
          onClick={() => editor?.commands.focus()}
          style={{
            width: "8.5in",
            height: `${pageCardHeight}px`,
            padding: "0 1in",
            cursor: "text",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
            fontSize: "12pt",
            lineHeight: "1.5",
            fontFamily: '"Times New Roman", Times, serif',
            color: "#000",
            boxSizing: "border-box",
            position: "relative",
            /* White background repeats every page-height with a gap between */
            backgroundColor: "transparent",
            backgroundImage: `repeating-linear-gradient(to bottom, white 0px, white ${PAGE_HEIGHT_PX}px, transparent ${PAGE_HEIGHT_PX}px, transparent ${PAGE_HEIGHT_PX + PAGE_GAP_PX}px)`,
            backgroundPosition: "top",
          }}
        >
          {/* Page break overlay — thin line at each boundary */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: "none",
            zIndex: 1,
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent ${PAGE_HEIGHT_PX - 1}px, #c0c4c8 ${PAGE_HEIGHT_PX - 1}px, #c0c4c8 ${PAGE_HEIGHT_PX}px, transparent ${PAGE_HEIGHT_PX}px, transparent ${PAGE_HEIGHT_PX + PAGE_GAP_PX}px)`,
            backgroundPosition: "top",
          }} />
          {/* Content wrapper — 1in top padding per page via paddingTop,
              the content flows continuously. */}
          <div
            ref={contentRef}
            style={{
              position: "relative",
              zIndex: 3,
              paddingTop: "1in",
              paddingBottom: "1in",
              minHeight: `${PAGE_CONTENT_PX}px`,
            }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* ── Snapshot / Actions Bar ─────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          padding: "8px 20px",
          alignItems: "center",
          flexWrap: "wrap",
          width: "100%",
          boxSizing: "border-box",
          background: "#f8f9fa",
          borderTop: "1px solid #dadce0",
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
                border: "1px solid #dadce0",
                borderRadius: "4px",
                flex: 1,
                minWidth: "200px",
                fontSize: "13px",
              }}
            />
            <button
              onClick={handleSaveSnapshot}
              disabled={!snapshotLabel.trim()}
              style={{
                padding: "6px 16px",
                background: "#1a73e8",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: snapshotLabel.trim() ? "pointer" : "not-allowed",
                opacity: snapshotLabel.trim() ? 1 : 0.5,
                fontSize: "13px",
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
                background: "#f1f3f4",
                border: "1px solid #dadce0",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
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
              background: "#1a73e8",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isSubmitted ? "not-allowed" : "pointer",
              opacity: isSubmitted ? 0.5 : 1,
              fontSize: "13px",
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
            background: "#f1f3f4",
            border: "1px solid #dadce0",
            borderRadius: "4px",
            cursor: isSubmitted ? "not-allowed" : "pointer",
            fontSize: "13px",
          }}
        >
          Save
        </button>

        <button
          onClick={handleDownload}
          style={{
            padding: "6px 16px",
            background: "#f1f3f4",
            border: "1px solid #dadce0",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Download .sf
        </button>

        <button
          onClick={handleSubmit}
          disabled={isSubmitted}
          style={{
            padding: "6px 16px",
            background: isSubmitted ? "#9ca3af" : "#188038",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isSubmitted ? "not-allowed" : "pointer",
            fontSize: "13px",
          }}
        >
          {isSubmitted ? "Submitted" : "Submit"}
        </button>
      </div>

      {/* ── Status Bar ────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          padding: "6px 12px",
          background: "#f0f1f3",
          borderTop: "1px solid #dadce0",
          fontSize: "12px",
          color: "#5f6368",
          flexWrap: "wrap",
          justifyContent: "center",
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
          <span style={{ color: "#188038", fontWeight: 600 }}>
            SUBMITTED
          </span>
        )}
      </div>
    </div>
  );
}
