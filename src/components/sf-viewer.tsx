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

export default function SFViewer({ sfContent }: SFViewerProps) {
  const [sfFile, setSfFile] = useState<SFFile | null>(null);
  const [engine, setEngine] = useState<SFPlaybackEngine | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);
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
        const next = prev + 100 * playbackSpeed;
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

  // Format duration
  const formatDuration = (ms: number) => {
    const totalSeconds = Math.round(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  // No file loaded — show upload
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
    <div
      style={{
        maxWidth: "1600px",
        margin: "0 auto",
        padding: "12px 20px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* ── Sticky Header: metadata + controls + timeline ─────── */}
      <div
        style={{
          flexShrink: 0,
          borderBottom: "1px solid #e5e7eb",
          paddingBottom: "8px",
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h2 style={{ margin: 0, fontSize: "16px" }}>SF Viewer</h2>
            <span style={{ fontSize: "12px", color: "#888" }}>
              {sfFile.metadata.studentId} &middot;{" "}
              {sfFile.metadata.assignmentId}
            </span>
            {sfFile.metadata.submittedAt && (
              <span
                style={{
                  fontSize: "11px",
                  color: "#188038",
                  fontWeight: 600,
                  background: "#dcfce7",
                  padding: "1px 6px",
                  borderRadius: "3px",
                }}
              >
                SUBMITTED
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => setStatsOpen(!statsOpen)}
              style={{
                padding: "4px 10px",
                background: statsOpen ? "#e0e7ff" : "#f5f5f5",
                border: `1px solid ${statsOpen ? "#818cf8" : "#ccc"}`,
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                color: statsOpen ? "#4338ca" : "#333",
                fontWeight: statsOpen ? 600 : 400,
              }}
            >
              Stats {statsOpen ? "\u25B2" : "\u25BC"}
            </button>
            <label
              style={{
                padding: "4px 10px",
                background: "#f5f5f5",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Load file
              <input
                type="file"
                accept=".sf,.json"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </label>
          </div>
        </div>

        {/* Collapsible Stats Panel */}
        {statsOpen && stats && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "6px",
              flexWrap: "wrap",
            }}
          >
            {[
              { label: "Duration", value: formatDuration(stats.totalDuration) },
              { label: "Events", value: stats.eventCount },
              { label: "Keys", value: stats.keystrokeCount },
              { label: "Backspaces", value: stats.backspaceCount },
              {
                label: "Pastes",
                value: stats.pasteCount,
                warn: stats.pasteCount > 5,
              },
              {
                label: "Pasted Chars",
                value: stats.totalPastedChars,
                warn: stats.totalPastedChars > 500,
              },
              {
                label: "Tab Switches",
                value: stats.tabAwayCount,
                warn: stats.tabAwayCount > 5,
              },
              {
                label: "Time Away",
                value: formatDuration(stats.totalTabAwayMs),
                warn: stats.totalTabAwayMs > 300000,
              },
              { label: "Snapshots", value: stats.snapshotCount },
              { label: "Cuts", value: stats.cutCount },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: "6px 10px",
                  background: stat.warn ? "#fef2f2" : "#f9fafb",
                  border: `1px solid ${stat.warn ? "#fecaca" : "#e5e7eb"}`,
                  borderRadius: "4px",
                  minWidth: "80px",
                }}
              >
                <div style={{ fontSize: "10px", color: "#9ca3af" }}>
                  {stat.label}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: stat.warn ? "#dc2626" : "#111",
                  }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        )}

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
            gap: "6px",
            alignItems: "center",
            flexWrap: "wrap",
            marginTop: "2px",
          }}
        >
          <button
            onClick={handlePlayPause}
            style={{
              padding: "4px 14px",
              background: isPlaying ? "#f97316" : "#22c55e",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "12px",
            }}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>

          <button
            onClick={() => setCurrentTime(engine.getStartTime())}
            style={{
              padding: "4px 10px",
              background: "#f5f5f5",
              border: "1px solid #ccc",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Reset
          </button>

          <span style={{ fontSize: "12px", color: "#888", marginLeft: "4px" }}>
            Speed:
          </span>
          {[1, 5, 10, 50, 100].map((speed) => (
            <button
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              style={{
                padding: "3px 7px",
                background: playbackSpeed === speed ? "#1d4ed8" : "#f5f5f5",
                color: playbackSpeed === speed ? "white" : "#555",
                border: `1px solid ${playbackSpeed === speed ? "#1d4ed8" : "#ccc"}`,
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: playbackSpeed === speed ? 600 : 400,
              }}
            >
              {speed}x
            </button>
          ))}

          {/* Snapshot jump buttons (inline, compact) */}
          {snapshots.length > 0 && (
            <>
              <div
                style={{
                  width: "1px",
                  height: "18px",
                  background: "#d1d5db",
                  margin: "0 4px",
                }}
              />
              <span style={{ fontSize: "11px", color: "#888" }}>
                Snapshots:
              </span>
              {snapshots.map((snapshot) => (
                <button
                  key={snapshot.id}
                  onClick={() => jumpToSnapshot(snapshot.id)}
                  title={`${snapshot.label} (${new Date(snapshot.timestamp).toLocaleTimeString()})`}
                  style={{
                    padding: "3px 8px",
                    background:
                      selectedSnapshot === snapshot.id ? "#3b82f6" : "#f5f5f5",
                    color:
                      selectedSnapshot === snapshot.id ? "white" : "#555",
                    border: `1px solid ${selectedSnapshot === snapshot.id ? "#3b82f6" : "#ccc"}`,
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "11px",
                    maxWidth: "120px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {snapshot.label}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Main content: 70% document / 30% event log ──────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "7fr 3fr",
          gap: "12px",
          flex: 1,
          minHeight: 0, // Allow children to shrink below content size
          marginTop: "10px",
        }}
      >
        {/* Document Preview */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#6b7280",
              marginBottom: "6px",
              flexShrink: 0,
            }}
          >
            Document Preview
          </div>
          <div
            style={{
              background: "#e8eaed",
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
              flex: 1,
              overflowY: "auto",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              className="sf-viewer-page"
              style={{
                width: "8.5in",
                minHeight: "11in",
                padding: "1in",
                background: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
                fontSize: "12pt",
                lineHeight: "1.5",
                fontFamily: '"Times New Roman", Times, serif',
                color: "#000",
                boxSizing: "border-box",
                position: "relative",
              }}
            >
              {/* Page break overlay */}
              <div className="sf-page-breaks" />
              {currentContent ? (
                <div
                  style={{ position: "relative", zIndex: 3, width: "100%" }}
                  dangerouslySetInnerHTML={{ __html: currentContent }}
                />
              ) : (
                <div style={{ color: "#999", fontStyle: "italic", position: "relative", zIndex: 3 }}>
                  No content at this position. Move the timeline to see the
                  document.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Event Log */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#6b7280",
              marginBottom: "6px",
              flexShrink: 0,
            }}
          >
            Event Log
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <EventLog
              events={allEvents}
              currentTime={currentTime}
              startTime={engine.getStartTime()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
