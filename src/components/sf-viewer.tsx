"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { parseSFFile } from "@/lib/sf-parser";
import { SFPlaybackEngine } from "@/lib/sf-playback";
import Timeline from "./timeline";
import EventLog from "./event-log";
import type { SFFile } from "@/lib/sf-types";

interface SFViewerProps {
  sfContent?: string; // Pre-loaded .sf JSON content
}

const PAGE_WIDTH_PX = 816; // 8.5in @ 96dpi
const PAGE_CONTENT_HEIGHT_PX = 864; // 9in writable area
const PAGE_MARGIN_TOP_PX = 96; // 1in top margin
const PAGE_MARGIN_SIDE_PX = 96; // 1in left/right margin

function getPageCount(contentHeight: number): number {
  return Math.max(1, Math.ceil(Math.max(contentHeight, 1) / PAGE_CONTENT_HEIGHT_PX));
}

export default function SFViewer({ sfContent }: SFViewerProps) {
  const [sfFile, setSfFile] = useState<SFFile | null>(null);
  const [engine, setEngine] = useState<SFPlaybackEngine | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(10); // 10x speed
  const [error, setError] = useState<string | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load .sf content
  const loadContent = useCallback((json: string) => {
    try {
      const parsed = parseSFFile(json);
      setSfFile(parsed);
      const eng = new SFPlaybackEngine(parsed);
      setEngine(eng);
      setCurrentTime(eng.getStartTime());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse .sf file");
    }
  }, []);

  // Load from prop
  useEffect(() => {
    if (sfContent) {
      loadContent(sfContent);
    }
  }, [sfContent, loadContent]);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      loadContent(content);
    };
    reader.readAsText(file);
  };

  // Playback controls
  useEffect(() => {
    if (!isPlaying || !engine) return;

    playIntervalRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 100 * playbackSpeed; // Advance by 100ms * speed
        if (next >= engine.getEndTime()) {
          setIsPlaying(false);
          return engine.getEndTime();
        }
        return next;
      });
    }, 100);

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, engine]);

  const handleSeek = (timestamp: number) => {
    setCurrentTime(timestamp);
  };

  const handlePlayPause = () => {
    if (!engine) return;
    if (currentTime >= engine.getEndTime()) {
      setCurrentTime(engine.getStartTime());
    }
    setIsPlaying(!isPlaying);
  };

  const jumpToSnapshot = (snapshotId: string) => {
    if (!sfFile) return;
    const snapshot = sfFile.snapshots.find((s) => s.id === snapshotId);
    if (snapshot) {
      setCurrentTime(snapshot.timestamp);
      setSelectedSnapshot(snapshotId);
    }
  };

  // Get current state
  const currentContent = engine ? engine.getStateAtTime(currentTime) : "";
  const markers = engine ? engine.getTimelineMarkers() : [];
  const allEvents = engine ? engine.getAllEvents() : [];
  const stats = engine ? engine.getStats() : null;
  const snapshots = engine ? engine.getSnapshots() : [];

  useEffect(() => {
    const updatePageGuides = () => {
      const el = contentRef.current;
      if (!el) {
        setPageCount(1);
        return;
      }
      setPageCount(getPageCount(el.scrollHeight));
    };

    updatePageGuides();
    window.addEventListener("resize", updatePageGuides);
    return () => window.removeEventListener("resize", updatePageGuides);
  }, [currentContent]);

  // Format duration
  const formatDuration = (ms: number) => {
    const totalSeconds = Math.round(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  // No file loaded - show upload
  if (!sfFile || !engine) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}>
        <h2 style={{ marginBottom: "20px" }}>SF File Viewer</h2>

        {error && (
          <div
            style={{
              padding: "12px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "4px",
              color: "#dc2626",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            border: "2px dashed #ccc",
            borderRadius: "8px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <p style={{ marginBottom: "16px", color: "#666" }}>
            Upload a .sf file to view the writing session
          </p>
          <input
            type="file"
            accept=".sf,.json"
            onChange={handleFileUpload}
            style={{ cursor: "pointer" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h2 style={{ margin: 0 }}>SF File Viewer</h2>
        <label
          style={{
            padding: "6px 12px",
            background: "#f5f5f5",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Load another file
          <input
            type="file"
            accept=".sf,.json"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {/* Stats Panel */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          {[
            {
              label: "Duration",
              value: formatDuration(stats.totalDuration),
            },
            { label: "Total Events", value: stats.eventCount },
            { label: "Keystrokes", value: stats.keystrokeCount },
            { label: "Backspaces", value: stats.backspaceCount },
            {
              label: "Pastes",
              value: stats.pasteCount,
              highlight: stats.pasteCount > 5,
            },
            {
              label: "Pasted Chars",
              value: stats.totalPastedChars,
              highlight: stats.totalPastedChars > 500,
            },
            {
              label: "Tab Switches",
              value: stats.tabAwayCount,
              highlight: stats.tabAwayCount > 5,
            },
            {
              label: "Time Away",
              value: formatDuration(stats.totalTabAwayMs),
              highlight: stats.totalTabAwayMs > 300000,
            },
            { label: "Snapshots", value: stats.snapshotCount },
            { label: "Cuts", value: stats.cutCount },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: "12px",
                background: stat.highlight ? "#fef2f2" : "#f9f9f9",
                border: `1px solid ${stat.highlight ? "#fecaca" : "#eee"}`,
                borderRadius: "4px",
              }}
            >
              <div
                style={{ fontSize: "11px", color: "#999", marginBottom: "4px" }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: stat.highlight ? "#dc2626" : "#333",
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Metadata */}
      <div
        style={{
          fontSize: "12px",
          color: "#888",
          marginBottom: "12px",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <span>Student: {sfFile.metadata.studentId}</span>
        <span>Assignment: {sfFile.metadata.assignmentId}</span>
        <span>Created: {new Date(sfFile.metadata.createdAt).toLocaleString()}</span>
        {sfFile.metadata.submittedAt && (
          <span>
            Submitted: {new Date(sfFile.metadata.submittedAt).toLocaleString()}
          </span>
        )}
      </div>

      {/* Timeline */}
      <Timeline
        startTime={engine.getStartTime()}
        endTime={engine.getEndTime()}
        currentTime={currentTime}
        markers={markers}
        onSeek={handleSeek}
      />

      {/* Playback Controls */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          padding: "8px 0",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={handlePlayPause}
          style={{
            padding: "6px 16px",
            background: isPlaying ? "#f97316" : "#22c55e",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>

        <button
          onClick={() => setCurrentTime(engine.getStartTime())}
          style={{
            padding: "6px 12px",
            background: "#f5f5f5",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Reset
        </button>

        <span style={{ fontSize: "13px", color: "#666" }}>Speed:</span>
        {[1, 5, 10, 50, 100].map((speed) => (
          <button
            key={speed}
            onClick={() => setPlaybackSpeed(speed)}
            style={{
              padding: "4px 8px",
              background: playbackSpeed === speed ? "#1d4ed8" : "#f5f5f5",
              color: playbackSpeed === speed ? "white" : "#333",
              border: "1px solid #ccc",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            {speed}x
          </button>
        ))}
      </div>

      {/* Snapshots Navigation */}
      {snapshots.length > 0 && (
        <div style={{ padding: "8px 0" }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              marginBottom: "6px",
            }}
          >
            Snapshots (Student-marked drafts):
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {snapshots.map((snapshot) => (
              <button
                key={snapshot.id}
                onClick={() => jumpToSnapshot(snapshot.id)}
                style={{
                  padding: "4px 12px",
                  background:
                    selectedSnapshot === snapshot.id ? "#3b82f6" : "#f5f5f5",
                  color: selectedSnapshot === snapshot.id ? "white" : "#333",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                {snapshot.label} (
                {new Date(snapshot.timestamp).toLocaleTimeString()})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main content area: Document preview + Event log */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginTop: "16px",
        }}
      >
        {/* Document Preview */}
        <div>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "13px",
              marginBottom: "8px",
            }}
          >
            Document at current position:
          </div>
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "6px",
              padding: "24px 12px",
              minHeight: "300px",
              background: "#eef1f5",
              overflowX: "auto",
            }}
          >
            {currentContent ? (
              <div
                style={{
                  position: "relative",
                  width: `${PAGE_WIDTH_PX}px`,
                  margin: "0 auto",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    zIndex: 3,
                  }}
                >
                  {Array.from({ length: Math.max(0, pageCount - 1) }).map((_, i) => {
                    const y = PAGE_MARGIN_TOP_PX + (i + 1) * PAGE_CONTENT_HEIGHT_PX;
                    return (
                      <div key={y} style={{ position: "absolute", top: `${y}px`, left: 0, right: 0 }}>
                        <div
                          style={{
                            borderTop: "2px dashed #cbd5e1",
                            margin: "0 22px",
                          }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            top: "-9px",
                            left: "-72px",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#64748b",
                            background: "#eef1f5",
                            padding: "2px 6px",
                            borderRadius: "999px",
                          }}
                        >
                          Page {i + 2}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div
                  className="sf-viewer-page"
                  style={{
                    position: "relative",
                    zIndex: 2,
                    minHeight: `${PAGE_MARGIN_TOP_PX * 2 + PAGE_CONTENT_HEIGHT_PX}px`,
                    background: "white",
                    border: "1px solid #d1d5db",
                    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
                    padding: `${PAGE_MARGIN_TOP_PX}px ${PAGE_MARGIN_SIDE_PX}px`,
                    fontSize: "12pt",
                    lineHeight: "1.5",
                    fontFamily: '"Times New Roman", Times, serif',
                    color: "#000",
                  }}
                  ref={contentRef}
                  dangerouslySetInnerHTML={{ __html: currentContent }}
                />
              </div>
            ) : (
              <div style={{ color: "#999", fontStyle: "italic" }}>
                No content at this position. Move the timeline to a snapshot to
                see document content.
              </div>
            )}
          </div>
        </div>

        {/* Event Log */}
        <div>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "13px",
              marginBottom: "8px",
            }}
          >
            Events near current position:
          </div>
          <EventLog
            events={allEvents}
            currentTime={currentTime}
            startTime={engine.getStartTime()}
          />
        </div>
      </div>
    </div>
  );
}
