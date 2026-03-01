"use client";

import type { SFEvent } from "@/lib/sf-types";

interface EventLogProps {
  events: SFEvent[];
  currentTime: number;
  startTime: number;
}

const EVENT_COLORS: Record<string, string> = {
  keystroke: "#666",
  backspace: "#9ca3af",
  delete: "#9ca3af",
  paste: "#ef4444",
  cut: "#a855f7",
  selection: "#6b7280",
  formatting: "#2563eb",
  paragraph_format: "#0891b2",
  node_change: "#7c3aed",
  tab_away: "#f97316",
  tab_return: "#22c55e",
  snapshot: "#3b82f6",
};

function formatEventTime(timestamp: number, startTime: number): string {
  const seconds = Math.round((timestamp - startTime) / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatEvent(event: SFEvent): string {
  switch (event.type) {
    case "keystroke":
      return `Key: "${event.key}"`;
    case "backspace":
      return `Backspace: deleted "${event.deletedContent}"`;
    case "delete":
      return `Delete: deleted "${event.deletedContent}"`;
    case "paste":
      return `Paste (${event.length} chars): "${event.content.substring(0, 80)}${event.content.length > 80 ? "..." : ""}"`;
    case "cut":
      return `Cut: "${event.content.substring(0, 80)}${event.content.length > 80 ? "..." : ""}"`;
    case "selection":
      return `Selected: pos ${event.from}-${event.to}`;
    case "formatting": {
      const attrStr = event.attrs
        ? ` [${Object.entries(event.attrs).map(([k, v]) => `${k}: ${v}`).join(", ")}]`
        : "";
      return `Format: ${event.action} ${event.mark}${attrStr} (${event.from}-${event.to})`;
    }
    case "paragraph_format":
      return `Block: ${event.attr} → ${event.value || "default"} (pos ${event.position})`;
    case "node_change": {
      const nodeAttrStr = event.attrs
        ? ` [${Object.entries(event.attrs).map(([k, v]) => `${k}: ${v}`).join(", ")}]`
        : "";
      return `Node: ${event.fromNodeType} → ${event.toNodeType}${nodeAttrStr} (pos ${event.position})`;
    }
    case "tab_away":
      return "Left tab";
    case "tab_return":
      return `Returned to tab (away ${Math.round(event.awayDuration / 1000)}s)`;
    case "snapshot":
      return `Snapshot saved: ${event.snapshotId}`;
    default:
      return "Unknown event";
  }
}

export default function EventLog({
  events,
  currentTime,
  startTime,
}: EventLogProps) {
  // Show events near the current time (within 30 seconds window)
  const windowMs = 30000;
  const nearbyEvents = events.filter(
    (e) =>
      e.timestamp >= currentTime - windowMs &&
      e.timestamp <= currentTime + windowMs
  );

  // Also filter to show only the most recent 50 events if there are too many
  const displayEvents = nearbyEvents.slice(-50);

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid #e5e7eb",
          background: "#f9fafb",
          fontWeight: 600,
          fontSize: "12px",
          position: "sticky",
          top: 0,
          zIndex: 1,
          flexShrink: 0,
        }}
      >
        Event Log ({events.length} total, showing {displayEvents.length} nearby)
      </div>

      {displayEvents.length === 0 ? (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            color: "#999",
            fontSize: "13px",
          }}
        >
          No events near current position
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto" }}>
          {displayEvents.map((event, i) => {
            const isPast = event.timestamp <= currentTime;
            const isCurrent =
              Math.abs(event.timestamp - currentTime) < 1000;

            return (
              <div
                key={i}
                style={{
                  padding: "4px 12px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  borderBottom: "1px solid #f0f0f0",
                  opacity: isPast ? 1 : 0.4,
                  background: isCurrent ? "#fffbeb" : "transparent",
                  display: "flex",
                  gap: "8px",
                }}
              >
                <span style={{ color: "#999", minWidth: "45px" }}>
                  {formatEventTime(event.timestamp, startTime)}
                </span>
                <span
                  style={{
                    color: EVENT_COLORS[event.type] ?? "#666",
                    fontWeight:
                      event.type === "paste" ||
                      event.type === "cut" ||
                      event.type === "tab_away" ||
                      event.type === "tab_return" ||
                      event.type === "node_change"
                        ? "bold"
                        : "normal",
                  }}
                >
                  {formatEvent(event)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
