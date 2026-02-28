import type {
  SFFile,
  SFEvent,
  SFSnapshot,
  TimelineMarker,
} from "./sf-types";

/**
 * Strips HTML tags and returns plain text.
 * Converts <br> and block-level closing tags to newlines.
 */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/blockquote>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n+$/, "");
}

/**
 * Convert a ProseMirror position to a plain text offset.
 *
 * ProseMirror positions count node boundary tokens (each block node
 * opening adds +1). In a simple paragraph-based document the first
 * paragraph opens at PM pos 1, so the first character is at PM pos 1.
 * Subsequent paragraphs add +2 per boundary (close + open).
 *
 * Given a plain-text string where paragraphs are separated by "\n",
 * we approximate the mapping by subtracting the accumulated structural
 * offsets.
 */
function pmPosToTextOffset(pmPos: number, text: string): number {
  // In ProseMirror: doc opens at 0, first <p> opens at 1.
  // Characters inside first paragraph are at PM positions 1..len.
  // Then </p> at len+1, next <p> at len+2, next chars start at len+2.
  // In our plain text, paragraphs are separated by "\n".

  // Walk through the text and map PM positions to text offsets.
  let pmCursor = 1; // PM position of first char (inside first <p>)
  let textOffset = 0;

  // If there's no text, any position maps to 0
  if (text.length === 0) return 0;

  for (let i = 0; i < text.length; i++) {
    if (pmCursor >= pmPos) {
      return textOffset;
    }
    if (text[i] === "\n") {
      // A newline in our text represents a paragraph break.
      // In PM: current </p> = +1, next <p> = +1, so +2 total.
      pmCursor += 2;
      textOffset++;
    } else {
      pmCursor++;
      textOffset++;
    }
  }

  return textOffset;
}

/**
 * Replay text-modifying events onto a plain text buffer.
 * Returns the resulting plain text.
 */
function replayEvents(baseText: string, events: SFEvent[]): string {
  let text = baseText;

  for (const event of events) {
    switch (event.type) {
      case "keystroke": {
        const offset = pmPosToTextOffset(event.position, text);
        const char = event.key === "Enter" ? "\n" : event.key;
        // Only insert printable characters and Enter
        if (event.key.length === 1 || event.key === "Enter") {
          text = text.slice(0, offset) + char + text.slice(offset);
        }
        break;
      }
      case "backspace": {
        const offset = pmPosToTextOffset(event.position, text);
        if (offset > 0) {
          text = text.slice(0, offset - 1) + text.slice(offset);
        }
        break;
      }
      case "delete": {
        const offset = pmPosToTextOffset(event.position, text);
        if (offset < text.length) {
          text = text.slice(0, offset) + text.slice(offset + 1);
        }
        break;
      }
      case "paste": {
        const offset = pmPosToTextOffset(event.position, text);
        text = text.slice(0, offset) + event.content + text.slice(offset);
        break;
      }
      case "cut": {
        const from = pmPosToTextOffset(event.from, text);
        const to = pmPosToTextOffset(event.to, text);
        if (from < to) {
          text = text.slice(0, from) + text.slice(to);
        }
        break;
      }
      // selection, formatting, tab_away, tab_return, snapshot
      // don't modify document text — skip them.
    }
  }

  return text;
}

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
   * Get the document content at a specific timestamp.
   *
   * Strategy:
   * 1. If there is a snapshot at exactly this timestamp, return its HTML.
   * 2. Find the nearest snapshot before this timestamp (if any) and use its
   *    plain-text as the base, then replay all text-modifying events between
   *    the snapshot and the target timestamp.
   * 3. If no snapshot exists before this time, start from an empty string
   *    and replay all events from the beginning up to the target timestamp.
   *
   * Returns plain text (paragraphs separated by newlines) between snapshots,
   * or the snapshot HTML when the timestamp lands exactly on one.
   */
  getStateAtTime(timestamp: number): string {
    // Sort snapshots by timestamp descending to find nearest before target
    const snapshotsBefore = this.file.snapshots
      .filter((s) => s.timestamp <= timestamp)
      .sort((a, b) => b.timestamp - a.timestamp);

    // Determine base text and the start time for event replay
    let baseText = "";
    let replayFrom = 0; // replay events with timestamp > replayFrom

    if (snapshotsBefore.length > 0) {
      const nearest = snapshotsBefore[0];

      // If the timestamp is exactly at a snapshot, return its HTML directly
      if (nearest.timestamp === timestamp) {
        return nearest.content;
      }

      baseText = htmlToPlainText(nearest.content);
      replayFrom = nearest.timestamp;
    }

    // Collect text-modifying events between the base and the target timestamp
    const eventsToReplay = this.sortedEvents.filter(
      (e) => e.timestamp > replayFrom && e.timestamp <= timestamp
    );

    // If there are no events to replay, return what we have
    if (eventsToReplay.length === 0) {
      // Return the snapshot HTML if we had one, otherwise empty
      if (snapshotsBefore.length > 0) {
        return snapshotsBefore[0].content;
      }
      return "";
    }

    // Replay events onto the base text
    const reconstructed = replayEvents(baseText, eventsToReplay);

    // Convert plain text back to simple HTML paragraphs for rendering
    if (!reconstructed) return "";
    const paragraphs = reconstructed.split("\n");
    return paragraphs.map((p) => `<p>${p || "<br>"}</p>`).join("");
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
