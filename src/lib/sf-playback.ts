import { EditorState, type Transaction } from "@tiptap/pm/state";
import { DOMParser as PmDOMParser, DOMSerializer, type Node as PmNode } from "@tiptap/pm/model";
import { sfSchema } from "./sf-schema";
import type {
  SFFile,
  SFEvent,
  SFSnapshot,
  TimelineMarker,
} from "./sf-types";

/**
 * Parse an HTML string into a ProseMirror document using the shared schema.
 * Requires a browser environment (uses the native DOMParser).
 */
function htmlToPmDoc(html: string): PmNode {
  const dom = new window.DOMParser().parseFromString(
    `<body>${html}</body>`,
    "text/html"
  );
  return PmDOMParser.fromSchema(sfSchema).parse(dom.body);
}

/**
 * Serialize a ProseMirror document back to an HTML string.
 */
function pmDocToHtml(doc: PmNode): string {
  const serializer = DOMSerializer.fromSchema(sfSchema);
  const fragment = serializer.serializeFragment(doc.content);
  const wrapper = document.createElement("div");
  wrapper.appendChild(fragment);
  return wrapper.innerHTML;
}

/**
 * Create an EditorState from an HTML string (or empty doc if html is falsy).
 */
function stateFromHtml(html: string): EditorState {
  const doc = html ? htmlToPmDoc(html) : sfSchema.node("doc", null, [sfSchema.node("paragraph")]);
  return EditorState.create({ doc, schema: sfSchema });
}

/**
 * Apply a sequence of SF events to a ProseMirror EditorState.
 * Returns the resulting state with all text and formatting changes applied.
 */
function applyEvents(state: EditorState, events: SFEvent[]): EditorState {
  for (const event of events) {
    try {
      state = applyEvent(state, event);
    } catch {
      // If a single event fails to apply (e.g. position out of range),
      // skip it and continue with the rest. This makes replay robust
      // against minor position mismatches.
    }
  }
  return state;
}

/**
 * Apply a single SF event to a ProseMirror EditorState.
 */
function applyEvent(state: EditorState, event: SFEvent): EditorState {
  let tr: Transaction;

  switch (event.type) {
    case "keystroke": {
      if (event.key === "Enter") {
        // Split the block at the current position (creates a new paragraph)
        const pos = clampPos(event.position, state.doc);
        tr = state.tr.split(pos);
      } else if (event.key.length === 1) {
        // Insert a single character
        const pos = clampPos(event.position, state.doc);
        tr = state.tr.insertText(event.key, pos);
      } else {
        // Non-printable key (e.g. arrow keys) — no document change
        return state;
      }
      return state.apply(tr);
    }

    case "backspace": {
      const pos = clampPos(event.position, state.doc);
      const deleteLen = event.deletedContent.length || 1;
      const from = Math.max(1, pos - deleteLen);
      // Check if we're deleting across a node boundary (e.g. merging paragraphs)
      if (event.deletedContent === "" || event.deletedContent === "\n") {
        // Joining blocks: delete the boundary between pos-1 and pos
        const joinFrom = Math.max(0, pos - 1);
        tr = state.tr.delete(joinFrom, pos);
      } else {
        tr = state.tr.delete(from, pos);
      }
      return state.apply(tr);
    }

    case "delete": {
      const pos = clampPos(event.position, state.doc);
      const deleteLen = event.deletedContent.length || 1;
      const to = Math.min(state.doc.content.size, pos + deleteLen);
      tr = state.tr.delete(pos, to);
      return state.apply(tr);
    }

    case "paste": {
      const pos = clampPos(event.position, state.doc);
      // Parse pasted content as a ProseMirror slice
      // Paste content is plain text in our logger, insert it as text
      tr = state.tr.insertText(event.content, pos);
      return state.apply(tr);
    }

    case "cut": {
      const from = clampPos(event.from, state.doc);
      const to = clampPos(event.to, state.doc);
      if (from < to) {
        tr = state.tr.delete(from, to);
        return state.apply(tr);
      }
      return state;
    }

    case "formatting": {
      const from = clampPos(event.from, state.doc);
      const to = clampPos(event.to, state.doc);
      if (from >= to) return state;

      const markType = sfSchema.marks[event.mark];
      if (!markType) return state; // Unknown mark type, skip

      if (event.action === "add") {
        // For textStyle marks, we may need to pass attributes.
        // The mark name in the event is the top-level mark name (e.g. "textStyle").
        // However, the specific attribute (color, fontFamily, fontSize) is set
        // by TipTap on the mark itself — during replay we just add/remove the mark.
        tr = state.tr.addMark(from, to, markType.create());
      } else {
        tr = state.tr.removeMark(from, to, markType);
      }
      return state.apply(tr);
    }

    case "paragraph_format": {
      // Update a paragraph/heading node's attributes (textAlign, lineHeight, indent)
      const pos = clampPos(event.position, state.doc);
      const node = state.doc.nodeAt(pos);
      if (!node) return state;

      // Only apply to block nodes that support these attributes
      const nodeType = node.type;
      if (nodeType.name !== "paragraph" && nodeType.name !== "heading") {
        return state;
      }

      tr = state.tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        [event.attr]: event.value,
      });
      return state.apply(tr);
    }

    // These event types don't modify the document
    case "selection":
    case "tab_away":
    case "tab_return":
    case "snapshot":
      return state;
  }
}

/**
 * Clamp a ProseMirror position to be within the valid range of the document.
 */
function clampPos(pos: number, doc: EditorState["doc"]): number {
  return Math.max(0, Math.min(pos, doc.content.size));
}

/**
 * SFPlaybackEngine - Reconstructs document state at any point in time
 * using headless ProseMirror. Jumps to the nearest snapshot before the
 * target timestamp and replays events forward as real PM transactions.
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
   * Get the document content (as rich HTML) at a specific timestamp.
   *
   * Strategy:
   * 1. Find the nearest snapshot at or before the target timestamp.
   * 2. Create a headless ProseMirror EditorState from that snapshot's HTML.
   * 3. Replay all document-modifying events between the snapshot and the
   *    target timestamp as real ProseMirror transactions.
   * 4. Serialize the resulting document back to HTML.
   *
   * If no snapshot exists before the target time, starts from an empty doc.
   */
  getStateAtTime(timestamp: number): string {
    // Find the nearest snapshot at or before the target timestamp
    const snapshotsBefore = this.file.snapshots
      .filter((s) => s.timestamp <= timestamp)
      .sort((a, b) => b.timestamp - a.timestamp);

    let baseHtml = "";
    let replayFrom = 0;

    if (snapshotsBefore.length > 0) {
      const nearest = snapshotsBefore[0];

      // If the timestamp is exactly at a snapshot, return its HTML directly
      if (nearest.timestamp === timestamp) {
        return nearest.content;
      }

      baseHtml = nearest.content;
      replayFrom = nearest.timestamp;
    }

    // Collect events between the base snapshot and target timestamp
    const eventsToReplay = this.sortedEvents.filter(
      (e) => e.timestamp > replayFrom && e.timestamp <= timestamp
    );

    // If there are no events to replay, return the snapshot HTML (or empty)
    if (eventsToReplay.length === 0) {
      return baseHtml;
    }

    // Create a headless ProseMirror state from the base HTML and replay events
    const baseState = stateFromHtml(baseHtml);
    const finalState = applyEvents(baseState, eventsToReplay);

    return pmDocToHtml(finalState.doc);
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
