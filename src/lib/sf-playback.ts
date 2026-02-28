import type {
  SFFile,
  SFEvent,
  SFSnapshot,
  TimelineMarker,
} from "./sf-types";

/**
 * SFPlaybackEngine - Reconstructs document state at any point in time
 * by replaying events from the nearest snapshot.
 */
export class SFPlaybackEngine {
  private file: SFFile;
  private sortedEvents: SFEvent[];

  constructor(file: SFFile) {
    this.file = file;
    // Ensure events are sorted chronologically
    this.sortedEvents = [...file.events].sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }

  /**
   * Get the total duration of the writing session in milliseconds.
   */
  getTotalDuration(): number {
    if (this.sortedEvents.length === 0) return 0;
    const first = this.sortedEvents[0].timestamp;
    const last = this.sortedEvents[this.sortedEvents.length - 1].timestamp;
    return last - first;
  }

  /**
   * Get the start timestamp (first event).
   */
  getStartTime(): number {
    return this.sortedEvents[0]?.timestamp ?? 0;
  }

  /**
   * Get the end timestamp (last event).
   */
  getEndTime(): number {
    return (
      this.sortedEvents[this.sortedEvents.length - 1]?.timestamp ?? 0
    );
  }

  /**
   * Get the document HTML content at a specific timestamp.
   * Uses the nearest snapshot before the timestamp as a base,
   * or returns the snapshot content directly if available.
   */
  getStateAtTime(timestamp: number): string {
    // Find the nearest snapshot at or before this timestamp
    const snapshotsBefore = this.file.snapshots
      .filter((s) => s.timestamp <= timestamp)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (snapshotsBefore.length > 0) {
      // Return the most recent snapshot content at or before this time.
      // For a more accurate reconstruction, we would replay events after
      // this snapshot, but for the MVP, snapshot content is sufficient.
      return snapshotsBefore[0].content;
    }

    // No snapshot before this time - return empty or first snapshot
    if (this.file.snapshots.length > 0) {
      return "";
    }

    return "";
  }

  /**
   * Get all events within a time range.
   */
  getEventsInRange(start: number, end: number): SFEvent[] {
    return this.sortedEvents.filter(
      (e) => e.timestamp >= start && e.timestamp <= end
    );
  }

  /**
   * Get events at or before a specific timestamp.
   */
  getEventsUpTo(timestamp: number): SFEvent[] {
    return this.sortedEvents.filter((e) => e.timestamp <= timestamp);
  }

  /**
   * Get all events.
   */
  getAllEvents(): SFEvent[] {
    return this.sortedEvents;
  }

  /**
   * Get all snapshots.
   */
  getSnapshots(): SFSnapshot[] {
    return this.file.snapshots;
  }

  /**
   * Get timeline markers for significant events (pastes, tab switches, snapshots, cuts).
   * These are rendered as markers on the timeline scrubber.
   */
  getTimelineMarkers(): TimelineMarker[] {
    const markers: TimelineMarker[] = [];

    for (const event of this.sortedEvents) {
      switch (event.type) {
        case "paste":
          markers.push({
            type: "paste",
            timestamp: event.timestamp,
            label: `Paste: "${event.content.substring(0, 50)}${event.content.length > 50 ? "..." : ""}"`,
            color: "#ef4444", // red
          });
          break;
        case "tab_away":
          markers.push({
            type: "tab_away",
            timestamp: event.timestamp,
            label: "Left tab",
            color: "#f97316", // orange
          });
          break;
        case "tab_return":
          markers.push({
            type: "tab_return",
            timestamp: event.timestamp,
            label: `Returned (away ${Math.round(event.awayDuration / 1000)}s)`,
            color: "#22c55e", // green
          });
          break;
        case "snapshot":
          markers.push({
            type: "snapshot",
            timestamp: event.timestamp,
            label: `Snapshot: ${this.file.snapshots.find((s) => s.id === event.snapshotId)?.label ?? "Unknown"}`,
            color: "#3b82f6", // blue
          });
          break;
        case "cut":
          markers.push({
            type: "cut",
            timestamp: event.timestamp,
            label: `Cut: "${event.content.substring(0, 50)}${event.content.length > 50 ? "..." : ""}"`,
            color: "#a855f7", // purple
          });
          break;
      }
    }

    return markers;
  }

  /**
   * Get content at regular intervals (for AI detection in Phase 2).
   * Returns snapshots of content at each interval.
   */
  getContentAtIntervals(intervalMs: number = 10 * 60 * 1000): { timestamp: number; content: string }[] {
    const results: { timestamp: number; content: string }[] = [];
    const start = this.getStartTime();
    const end = this.getEndTime();

    for (let t = start; t <= end; t += intervalMs) {
      const content = this.getStateAtTime(t);
      if (content) {
        results.push({ timestamp: t, content });
      }
    }

    // Always include the final state
    const finalContent = this.getStateAtTime(end);
    if (finalContent && (results.length === 0 || results[results.length - 1].timestamp !== end)) {
      results.push({ timestamp: end, content: finalContent });
    }

    return results;
  }

  /**
   * Get metadata from the .sf file.
   */
  getMetadata() {
    return this.file.metadata;
  }

  /**
   * Compute summary stats from events.
   */
  getStats() {
    const pasteEvents = this.sortedEvents.filter((e) => e.type === "paste");
    const tabAwayEvents = this.sortedEvents.filter((e) => e.type === "tab_away");
    const tabReturnEvents = this.sortedEvents.filter((e) => e.type === "tab_return");

    const totalPastedChars = pasteEvents.reduce(
      (sum, e) => sum + (e.type === "paste" ? e.length : 0),
      0
    );

    const totalTabAwayMs = tabReturnEvents.reduce(
      (sum, e) => sum + (e.type === "tab_return" ? e.awayDuration : 0),
      0
    );

    return {
      totalDuration: this.getTotalDuration(),
      eventCount: this.sortedEvents.length,
      keystrokeCount: this.sortedEvents.filter((e) => e.type === "keystroke").length,
      backspaceCount: this.sortedEvents.filter((e) => e.type === "backspace").length,
      pasteCount: pasteEvents.length,
      cutCount: this.sortedEvents.filter((e) => e.type === "cut").length,
      tabAwayCount: tabAwayEvents.length,
      snapshotCount: this.file.snapshots.length,
      totalPastedChars,
      totalTabAwayMs,
    };
  }
}
