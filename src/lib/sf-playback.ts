import { EditorState, type Transaction } from "@tiptap/pm/state";
import { DOMParser as PmDOMParser, DOMSerializer, type Node as PmNode } from "@tiptap/pm/model";
import { sfSchema } from "./sf-schema";
import type {
  SFFile,
  SFEvent,
  SFSnapshot,
  TimelineMarker,
} from "./sf-types";

// ============================================================
// Helpers
// ============================================================

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
  const doc = html
    ? htmlToPmDoc(html)
    : sfSchema.node("doc", null, [sfSchema.node("paragraph")]);
  return EditorState.create({ doc, schema: sfSchema });
}

/**
 * Clamp a ProseMirror position to be within the valid range of the document.
 */
function clampPos(pos: number, doc: PmNode): number {
  return Math.max(0, Math.min(pos, doc.content.size));
}

// ============================================================
// Event Application
// ============================================================

/**
 * Apply a sequence of SF events to a ProseMirror EditorState.
 * Returns the resulting state with all text and formatting changes applied.
 * Silently skips events that fail (e.g. position out of range).
 */
function applyEvents(state: EditorState, events: SFEvent[]): EditorState {
  for (const event of events) {
    try {
      state = applyEvent(state, event);
    } catch {
      // Skip failed events — position mismatches, etc.
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
        const pos = clampPos(event.position, state.doc);
        tr = state.tr.split(pos);
      } else if (event.key.length === 1) {
        const pos = clampPos(event.position, state.doc);
        tr = state.tr.insertText(event.key, pos);

        // Apply marks to the just-inserted character if the event carries them.
        // This ensures bold, italic, font, color, highlight, etc. are faithfully
        // replayed — not lost between snapshots.
        if (event.marks && event.marks.length > 0) {
          const charFrom = pos;
          const charTo = pos + 1;
          for (const m of event.marks) {
            const markType = sfSchema.marks[m.type];
            if (markType) {
              const mark = m.attrs ? markType.create(m.attrs) : markType.create();
              tr = tr.addMark(charFrom, charTo, mark);
            }
          }
        }
      } else {
        // Non-printable key (arrows, etc.) — no document change
        return state;
      }
      return state.apply(tr);
    }

    case "backspace": {
      const pos = clampPos(event.position, state.doc);

      // Range-based deletion (selection was active when backspace was pressed)
      if (event.toPosition !== undefined) {
        const to = clampPos(event.toPosition, state.doc);
        if (pos < to) {
          tr = state.tr.delete(pos, to);
          return state.apply(tr);
        }
        return state;
      }

      // Single-character deletion
      const deleteLen = event.deletedContent.length || 1;
      if (event.deletedContent === "" || event.deletedContent === "\n") {
        // Joining blocks: delete the boundary
        const joinFrom = Math.max(0, pos - 1);
        tr = state.tr.delete(joinFrom, pos);
      } else {
        const from = Math.max(1, pos - deleteLen);
        tr = state.tr.delete(from, pos);
      }
      return state.apply(tr);
    }

    case "delete": {
      const pos = clampPos(event.position, state.doc);

      // Range-based deletion (selection was active)
      if (event.toPosition !== undefined) {
        const to = clampPos(event.toPosition, state.doc);
        if (pos < to) {
          tr = state.tr.delete(pos, to);
          return state.apply(tr);
        }
        return state;
      }

      // Single-character deletion
      const deleteLen = event.deletedContent.length || 1;
      const to = Math.min(state.doc.content.size, pos + deleteLen);
      tr = state.tr.delete(pos, to);
      return state.apply(tr);
    }

    case "paste": {
      const pos = clampPos(event.position, state.doc);
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
      if (!markType) return state; // Unknown mark type

      if (event.action === "add") {
        // Create mark WITH attributes if they exist (color, fontFamily, fontSize, etc.)
        const mark = event.attrs
          ? markType.create(event.attrs)
          : markType.create();
        tr = state.tr.addMark(from, to, mark);
      } else {
        tr = state.tr.removeMark(from, to, markType);
      }
      return state.apply(tr);
    }

    case "paragraph_format": {
      const pos = clampPos(event.position, state.doc);
      const node = state.doc.nodeAt(pos);
      if (!node) return state;

      if (node.type.name !== "paragraph" && node.type.name !== "heading") {
        return state;
      }

      tr = state.tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        [event.attr]: event.value,
      });
      return state.apply(tr);
    }

    case "node_change": {
      const pos = clampPos(event.position, state.doc);
      const node = state.doc.nodeAt(pos);
      if (!node) return state;

      // Look up the target node type in the schema
      const targetType = sfSchema.nodes[event.toNodeType];
      if (!targetType) return state;

      // Build attrs for the new node type
      const newAttrs: Record<string, unknown> = {};
      if (event.attrs) {
        Object.assign(newAttrs, event.attrs);
      }

      // Carry over compatible attrs (textAlign, lineHeight, indent, textIndent)
      // from the old node if the new type supports them
      const carryAttrs = ["textAlign", "lineHeight", "indent", "textIndent"];
      for (const attr of carryAttrs) {
        if (
          node.attrs[attr] !== undefined &&
          targetType.spec.attrs &&
          attr in targetType.spec.attrs &&
          !(attr in newAttrs)
        ) {
          newAttrs[attr] = node.attrs[attr];
        }
      }

      tr = state.tr.setNodeMarkup(pos, targetType, newAttrs);
      return state.apply(tr);
    }

    // Non-document-modifying events
    case "selection":
    case "tab_away":
    case "tab_return":
    case "snapshot":
      return state;
  }
}

// ============================================================
// Playback Cache
// ============================================================

interface PlaybackCache {
  /** The timestamp this cached state corresponds to */
  timestamp: number;
  /** The cached ProseMirror state */
  state: EditorState;
  /** The snapshot this cache was built from (for invalidation) */
  snapshotId: string | null;
  /** Index into sortedEvents — the next event to apply */
  nextEventIndex: number;
}

// ============================================================
// SFPlaybackEngine
// ============================================================

/**
 * SFPlaybackEngine - Reconstructs document state at any point in time
 * using headless ProseMirror.
 *
 * Features:
 * - Forward caching: continuous playback reuses the last computed state
 *   and only applies incremental events, avoiding expensive snapshot→replay
 *   on every tick.
 * - Snapshot-based jumping: seeking to any point finds the nearest snapshot
 *   and replays forward from there.
 * - Full mark attribute support: formatting events with attrs (color, font, etc.)
 *   are faithfully replayed.
 */
export class SFPlaybackEngine {
  private file: SFFile;
  private sortedEvents: SFEvent[];
  private cache: PlaybackCache | null = null;

  constructor(file: SFFile) {
    this.file = file;
    this.sortedEvents = [...file.events].sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }

  /**
   * Get the total duration of the writing session in milliseconds.
   */
  getTotalDuration(): number {
    if (this.sortedEvents.length === 0) return 0;
    return this.getEndTime() - this.getStartTime();
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
    return this.sortedEvents[this.sortedEvents.length - 1]?.timestamp ?? 0;
  }

  /**
   * Find the nearest snapshot at or before a given timestamp.
   */
  private findNearestSnapshot(timestamp: number): SFSnapshot | null {
    let best: SFSnapshot | null = null;
    for (const s of this.file.snapshots) {
      if (s.timestamp <= timestamp) {
        if (!best || s.timestamp > best.timestamp) {
          best = s;
        }
      }
    }
    return best;
  }

  /**
   * Find the index of the first event with timestamp > the given value.
   * Uses binary search for efficiency.
   */
  private findEventIndexAfter(timestamp: number): number {
    let lo = 0;
    let hi = this.sortedEvents.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.sortedEvents[mid].timestamp <= timestamp) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  }

  /**
   * Get the document content (as rich HTML) at a specific timestamp.
   *
   * Strategy (with forward caching):
   * 1. If the cache is valid and the target is ahead of the cached time
   *    (within the same snapshot window), replay only the incremental events.
   * 2. Otherwise, find the nearest snapshot, build state from it, and replay.
   * 3. Update the cache for the next call.
   */
  getStateAtTime(timestamp: number): string {
    const snapshot = this.findNearestSnapshot(timestamp);
    const snapshotId = snapshot?.id ?? null;
    const snapshotTimestamp = snapshot?.timestamp ?? 0;

    // ── Try to use the forward cache ──
    if (
      this.cache &&
      this.cache.snapshotId === snapshotId &&
      timestamp >= this.cache.timestamp
    ) {
      // We can continue forward from the cached state
      const eventsToApply: SFEvent[] = [];
      let idx = this.cache.nextEventIndex;
      while (idx < this.sortedEvents.length && this.sortedEvents[idx].timestamp <= timestamp) {
        eventsToApply.push(this.sortedEvents[idx]);
        idx++;
      }

      if (eventsToApply.length === 0 && this.cache.timestamp === timestamp) {
        // Exact cache hit — return cached HTML
        return pmDocToHtml(this.cache.state.doc);
      }

      const newState = applyEvents(this.cache.state, eventsToApply);

      // Update cache
      this.cache = {
        timestamp,
        state: newState,
        snapshotId,
        nextEventIndex: idx,
      };

      return pmDocToHtml(newState.doc);
    }

    // ── Cache miss or backward seek — rebuild from snapshot ──

    // If the target is exactly at the snapshot, return its HTML directly
    if (snapshot && snapshot.timestamp === timestamp) {
      const state = stateFromHtml(snapshot.content);
      const idx = this.findEventIndexAfter(timestamp);
      this.cache = {
        timestamp,
        state,
        snapshotId,
        nextEventIndex: idx,
      };
      return snapshot.content;
    }

    // Build state from snapshot (or empty doc) and replay events
    const baseHtml = snapshot?.content ?? "";
    const baseState = stateFromHtml(baseHtml);

    // Collect events between the snapshot and target timestamp
    const startIdx = this.findEventIndexAfter(snapshotTimestamp);
    const eventsToReplay: SFEvent[] = [];
    let endIdx = startIdx;
    while (endIdx < this.sortedEvents.length && this.sortedEvents[endIdx].timestamp <= timestamp) {
      eventsToReplay.push(this.sortedEvents[endIdx]);
      endIdx++;
    }

    if (eventsToReplay.length === 0) {
      // No events to replay — cache the base state
      this.cache = {
        timestamp,
        state: baseState,
        snapshotId,
        nextEventIndex: endIdx,
      };
      return baseHtml;
    }

    const finalState = applyEvents(baseState, eventsToReplay);

    // Update cache
    this.cache = {
      timestamp,
      state: finalState,
      snapshotId,
      nextEventIndex: endIdx,
    };

    return pmDocToHtml(finalState.doc);
  }

  /**
   * Invalidate the forward cache. Call this when the file changes
   * or when you want to force a full rebuild.
   */
  invalidateCache(): void {
    this.cache = null;
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
   * Get timeline markers for significant events.
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
            color: "#ef4444",
          });
          break;
        case "tab_away":
          markers.push({
            type: "tab_away",
            timestamp: event.timestamp,
            label: "Left tab",
            color: "#f97316",
          });
          break;
        case "tab_return":
          markers.push({
            type: "tab_return",
            timestamp: event.timestamp,
            label: `Returned (away ${Math.round(event.awayDuration / 1000)}s)`,
            color: "#22c55e",
          });
          break;
        case "snapshot":
          markers.push({
            type: "snapshot",
            timestamp: event.timestamp,
            label: `Snapshot: ${this.file.snapshots.find((s) => s.id === event.snapshotId)?.label ?? "Unknown"}`,
            color: "#3b82f6",
          });
          break;
        case "cut":
          markers.push({
            type: "cut",
            timestamp: event.timestamp,
            label: `Cut: "${event.content.substring(0, 50)}${event.content.length > 50 ? "..." : ""}"`,
            color: "#a855f7",
          });
          break;
      }
    }

    return markers;
  }

  /**
   * Get content at regular intervals (for AI detection).
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
