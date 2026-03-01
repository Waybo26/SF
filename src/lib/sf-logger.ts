import { v4 as uuidv4 } from "uuid";
import type {
  SFFile,
  SFEvent,
  SFSnapshot,
  SFMetadata,
  SFStats,
} from "./sf-types";

/**
 * SFLogger - Records all student actions in the editor
 * and produces a serializable .sf file.
 */
export class SFLogger {
  private metadata: SFMetadata;
  private events: SFEvent[] = [];
  private snapshots: SFSnapshot[] = [];
  private tabAwayTimestamp: number | null = null;
  private startTime: number;
  private currentContent: string = "";

  constructor(studentId: string, assignmentId: string) {
    this.startTime = Date.now();
    this.metadata = {
      studentId,
      assignmentId,
      createdAt: new Date().toISOString(),
      submittedAt: null,
    };
  }

  // --- Logging Methods ---

  logKeystroke(key: string, position: number): void {
    this.events.push({
      type: "keystroke",
      key,
      position,
      timestamp: Date.now(),
    });
  }

  logBackspace(position: number, deletedContent: string): void {
    this.events.push({
      type: "backspace",
      position,
      deletedContent,
      timestamp: Date.now(),
    });
  }

  logDelete(position: number, deletedContent: string): void {
    this.events.push({
      type: "delete",
      position,
      deletedContent,
      timestamp: Date.now(),
    });
  }

  logPaste(content: string, position: number): void {
    this.events.push({
      type: "paste",
      content,
      position,
      length: content.length,
      timestamp: Date.now(),
    });
  }

  logCut(content: string, from: number, to: number): void {
    this.events.push({
      type: "cut",
      content,
      from,
      to,
      timestamp: Date.now(),
    });
  }

  logSelection(from: number, to: number): void {
    this.events.push({
      type: "selection",
      from,
      to,
      timestamp: Date.now(),
    });
  }

  logFormatting(mark: string, from: number, to: number, action: "add" | "remove"): void {
    this.events.push({
      type: "formatting",
      action,
      mark,
      from,
      to,
      timestamp: Date.now(),
    });
  }

  logParagraphFormat(attr: string, value: string | number, position: number): void {
    this.events.push({
      type: "paragraph_format",
      attr,
      value,
      position,
      timestamp: Date.now(),
    });
  }

  logTabAway(): void {
    this.tabAwayTimestamp = Date.now();
    this.events.push({
      type: "tab_away",
      timestamp: this.tabAwayTimestamp,
    });
  }

  logTabReturn(): void {
    const now = Date.now();
    const awayDuration = this.tabAwayTimestamp
      ? now - this.tabAwayTimestamp
      : 0;
    this.tabAwayTimestamp = null;
    this.events.push({
      type: "tab_return",
      awayDuration,
      timestamp: now,
    });
  }

  createSnapshot(label: string, htmlContent: string): SFSnapshot {
    const snapshot: SFSnapshot = {
      id: uuidv4(),
      label,
      timestamp: Date.now(),
      content: htmlContent,
    };
    this.snapshots.push(snapshot);
    this.events.push({
      type: "snapshot",
      snapshotId: snapshot.id,
      timestamp: snapshot.timestamp,
    });
    return snapshot;
  }

  // --- Mark as submitted ---

  markSubmitted(): void {
    this.metadata.submittedAt = new Date().toISOString();
  }

  // --- Content Tracking ---

  updateContent(html: string): void {
    this.currentContent = html;
  }

  getCurrentContent(): string {
    return this.currentContent;
  }

  // --- Serialization ---

  serialize(): string {
    // Auto-create a snapshot of the current content for playback engine use
    if (this.currentContent) {
      this.createSnapshot("Auto-save", this.currentContent);
    }

    const file: SFFile = {
      version: "1.0",
      metadata: this.metadata,
      currentContent: this.currentContent,
      snapshots: this.snapshots,
      events: this.events,
    };
    return JSON.stringify(file);
  }

  // --- Stats ---

  getStats(): SFStats {
    const pasteEvents = this.events.filter((e) => e.type === "paste");
    const tabAwayEvents = this.events.filter((e) => e.type === "tab_away");
    const tabReturnEvents = this.events.filter((e) => e.type === "tab_return");

    const totalPastedCharacters = pasteEvents.reduce(
      (sum, e) => sum + (e as { length: number }).length,
      0
    );

    const totalTabAwayDuration = tabReturnEvents.reduce(
      (sum, e) => sum + (e as { awayDuration: number }).awayDuration,
      0
    );

    const lastEvent = this.events[this.events.length - 1];
    const firstEvent = this.events[0];
    const totalTimeSpent =
      firstEvent && lastEvent
        ? Math.round((lastEvent.timestamp - firstEvent.timestamp) / 1000)
        : 0;

    return {
      totalTimeSpent,
      wordCount: 0, // Computed from document content, not events
      eventCount: this.events.length,
      pasteCount: pasteEvents.length,
      tabAwayCount: tabAwayEvents.length,
      snapshotCount: this.snapshots.length,
      totalPastedCharacters,
      totalTabAwayDuration,
    };
  }

  // --- Load from existing .sf content (for resuming) ---

  static fromJSON(json: string): SFLogger {
    const file: SFFile = JSON.parse(json);
    const logger = new SFLogger(
      file.metadata.studentId,
      file.metadata.assignmentId
    );
    logger.metadata = file.metadata;
    logger.events = file.events;
    logger.snapshots = file.snapshots;
    logger.startTime = file.events[0]?.timestamp ?? Date.now();
    // Restore currentContent — backward compat: old files may not have it
    logger.currentContent = file.currentContent ?? "";
    return logger;
  }

  // --- Getters ---

  getEvents(): SFEvent[] {
    return this.events;
  }

  getSnapshots(): SFSnapshot[] {
    return this.snapshots;
  }

  getMetadata(): SFMetadata {
    return this.metadata;
  }

  getEventCount(): number {
    return this.events.length;
  }

  getElapsedTime(): number {
    return Math.round((Date.now() - this.startTime) / 1000);
  }
}
