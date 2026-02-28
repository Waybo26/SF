"use client";

import type { TimelineMarker } from "@/lib/sf-types";

interface TimelineProps {
  startTime: number;
  endTime: number;
  currentTime: number;
  markers: TimelineMarker[];
  onSeek: (timestamp: number) => void;
}

export default function Timeline({
  startTime,
  endTime,
  currentTime,
  markers,
  onSeek,
}: TimelineProps) {
  const duration = endTime - startTime;
  if (duration <= 0) return <div>No timeline data</div>;

  const currentPercent = ((currentTime - startTime) / duration) * 100;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const timestamp = startTime + percent * duration;
    onSeek(timestamp);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = Number(e.target.value);
    const timestamp = startTime + (percent / 100) * duration;
    onSeek(timestamp);
  };

  const formatTimestamp = (ts: number) => {
    const seconds = Math.round((ts - startTime) / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ padding: "12px 0" }}>
      {/* Time display */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#666",
          marginBottom: "4px",
        }}
      >
        <span>{formatTimestamp(startTime)}</span>
        <span style={{ fontWeight: "bold", color: "#333" }}>
          {formatTimestamp(currentTime)}
        </span>
        <span>{formatTimestamp(endTime)}</span>
      </div>

      {/* Timeline bar with markers */}
      <div
        onClick={handleClick}
        style={{
          position: "relative",
          height: "32px",
          background: "#f0f0f0",
          borderRadius: "4px",
          cursor: "pointer",
          border: "1px solid #ddd",
        }}
      >
        {/* Progress fill */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: `${currentPercent}%`,
            background: "#dbeafe",
            borderRadius: "4px 0 0 4px",
          }}
        />

        {/* Markers */}
        {markers.map((marker, i) => {
          const percent = ((marker.timestamp - startTime) / duration) * 100;
          return (
            <div
              key={i}
              title={marker.label}
              style={{
                position: "absolute",
                left: `${percent}%`,
                top: "2px",
                bottom: "2px",
                width: "3px",
                background: marker.color,
                borderRadius: "1px",
                zIndex: 2,
              }}
            />
          );
        })}

        {/* Current position indicator */}
        <div
          style={{
            position: "absolute",
            left: `${currentPercent}%`,
            top: "-2px",
            bottom: "-2px",
            width: "2px",
            background: "#1d4ed8",
            zIndex: 3,
          }}
        />
      </div>

      {/* Range slider (for precise scrubbing) */}
      <input
        type="range"
        min={0}
        max={100}
        step={0.1}
        value={currentPercent}
        onChange={handleSliderChange}
        style={{
          width: "100%",
          marginTop: "4px",
          cursor: "pointer",
        }}
      />

      {/* Marker legend */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          fontSize: "11px",
          color: "#888",
          marginTop: "4px",
          flexWrap: "wrap",
        }}
      >
        <span>
          <span style={{ color: "#ef4444" }}>|</span> Paste
        </span>
        <span>
          <span style={{ color: "#f97316" }}>|</span> Tab Away
        </span>
        <span>
          <span style={{ color: "#22c55e" }}>|</span> Tab Return
        </span>
        <span>
          <span style={{ color: "#3b82f6" }}>|</span> Snapshot
        </span>
        <span>
          <span style={{ color: "#a855f7" }}>|</span> Cut
        </span>
      </div>
    </div>
  );
}
