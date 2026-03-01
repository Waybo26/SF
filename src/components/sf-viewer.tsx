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
  const [snapshotsOpen, setSnapshotsOpen] = useState(false);
  const [snapshotSortAsc, setSnapshotSortAsc] = useState(true);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ── Page pagination ──────────────────────────────────────────────
  const PAGE_HEIGHT_PX = 11 * 96; // 1056px — full page including margins
  const PAGE_CONTENT_PX = 9 * 96; // 864px — content area per page (11in - 2in margins)
  const PAGE_GAP_PX = 20; // gap between visual pages
  const [numPages, setNumPages] = useState(1);
  const viewerContentRef = useRef<HTMLDivElement>(null);

  // Watch the hidden measuring div and recalculate page count
  useEffect(() => {
    const el = viewerContentRef.current;
    if (!el) return;

    const PADDING_PX = 2 * 96; // 1in top + 1in bottom padding in measuring div

    const recalc = () => {
      const contentH = Math.max(0, el.scrollHeight - PADDING_PX);
      const pages = Math.max(1, Math.ceil(contentH / PAGE_CONTENT_PX));
      setNumPages(pages);
    };

    recalc();

    const ro = new ResizeObserver(recalc);
    ro.observe(el);

    const mo = new MutationObserver(recalc);
    mo.observe(el, { childList: true, subtree: true, characterData: true });

    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [PAGE_CONTENT_PX]);

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
            {snapshots.length > 0 && (
              <button
                onClick={() => setSnapshotsOpen(!snapshotsOpen)}
                style={{
                  padding: "4px 10px",
                  background: snapshotsOpen ? "#fef3c7" : "#f5f5f5",
                  border: `1px solid ${snapshotsOpen ? "#f59e0b" : "#ccc"}`,
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  color: snapshotsOpen ? "#92400e" : "#333",
                  fontWeight: snapshotsOpen ? 600 : 400,
                }}
              >
                Snapshots ({snapshots.length}) {snapshotsOpen ? "\u25B2" : "\u25BC"}
              </button>
            )}
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

        {/* Collapsible Snapshot Panel */}
        {snapshotsOpen && snapshots.length > 0 && (
          <div
            style={{
              marginBottom: "6px",
              border: "1px solid #e5e7eb",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "4px 8px",
                background: "#fefce8",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#92400e" }}>
                Snapshots
              </span>
              <button
                onClick={() => setSnapshotSortAsc(!snapshotSortAsc)}
                style={{
                  padding: "2px 6px",
                  background: "transparent",
                  border: "1px solid #d1d5db",
                  borderRadius: "3px",
                  cursor: "pointer",
                  fontSize: "10px",
                  color: "#666",
                }}
              >
                Sort: {snapshotSortAsc ? "Oldest first" : "Newest first"}
              </button>
            </div>
            <div style={{ maxHeight: "140px", overflowY: "auto" }}>
              {[...snapshots]
                .sort((a, b) =>
                  snapshotSortAsc
                    ? a.timestamp - b.timestamp
                    : b.timestamp - a.timestamp
                )
                .map((snapshot) => {
                  const isAuto = snapshot.label.toLowerCase().startsWith("auto");
                  const date = new Date(snapshot.timestamp);
                  return (
                    <div
                      key={snapshot.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "4px 8px",
                        borderBottom: "1px solid #f3f4f6",
                        background:
                          selectedSnapshot === snapshot.id
                            ? "#eff6ff"
                            : "white",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "9px",
                          padding: "1px 4px",
                          borderRadius: "2px",
                          background: isAuto ? "#f3f4f6" : "#dbeafe",
                          color: isAuto ? "#6b7280" : "#1e40af",
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        {isAuto ? "AUTO" : "MANUAL"}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "#111",
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {snapshot.label}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#9ca3af",
                          flexShrink: 0,
                        }}
                      >
                        {date.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        {date.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <button
                        onClick={() => jumpToSnapshot(snapshot.id)}
                        style={{
                          padding: "2px 8px",
                          background:
                            selectedSnapshot === snapshot.id
                              ? "#3b82f6"
                              : "#f5f5f5",
                          color:
                            selectedSnapshot === snapshot.id
                              ? "white"
                              : "#555",
                          border: `1px solid ${selectedSnapshot === snapshot.id ? "#3b82f6" : "#ccc"}`,
                          borderRadius: "3px",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        Jump
                      </button>
                    </div>
                  );
                })}
            </div>
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
                gap: `${PAGE_GAP_PX}px`,
              }}
            >
            {/* Hidden measuring div — off-screen, used to calculate content height */}
            <div
              ref={viewerContentRef}
              className="sf-viewer-page"
              style={{
                position: "absolute",
                left: "-9999px",
                top: 0,
                width: "8.5in",
                padding: "1in",
                fontSize: "12pt",
                lineHeight: "1.5",
                fontFamily: '"Times New Roman", Times, serif',
                color: "#000",
                boxSizing: "border-box",
                visibility: "hidden",
              }}
              dangerouslySetInnerHTML={{ __html: currentContent }}
            />

            {/* Discrete clipped pages */}
            {currentContent ? (
              Array.from({ length: numPages }, (_, i) => (
                <div
                  key={`page-${i}`}
                  className="sf-viewer-page"
                  style={{
                    width: "8.5in",
                    height: `${PAGE_HEIGHT_PX}px`,
                    background: "white",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
                    borderRadius: "2px",
                    overflow: "hidden",
                    flexShrink: 0,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      padding: "1in",
                      fontSize: "12pt",
                      lineHeight: "1.5",
                      fontFamily: '"Times New Roman", Times, serif',
                      color: "#000",
                      boxSizing: "border-box",
                      transform: `translateY(-${i * PAGE_CONTENT_PX}px)`,
                    }}
                    dangerouslySetInnerHTML={{ __html: currentContent }}
                  />
                </div>
              ))
            ) : (
              <div
                style={{
                  width: "8.5in",
                  height: `${PAGE_HEIGHT_PX}px`,
                  background: "white",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
                  borderRadius: "2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <div style={{ color: "#999", fontStyle: "italic" }}>
                  No content at this position. Move the timeline to see the
                  document.
                </div>
              </div>
            )}
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
