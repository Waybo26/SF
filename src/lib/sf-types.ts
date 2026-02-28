// ============================================================
// .sf File Format Type Definitions
// ============================================================

// --- Event Types ---

export interface KeystrokeEvent {
  type: "keystroke";
  key: string;
  position: number;
  timestamp: number;
}

export interface BackspaceEvent {
  type: "backspace";
  position: number;
  deletedContent: string;
  timestamp: number;
}

export interface DeleteEvent {
  type: "delete";
  position: number;
  deletedContent: string;
  timestamp: number;
}

export interface PasteEvent {
  type: "paste";
  content: string;
  position: number;
  length: number;
  timestamp: number;
}

export interface CutEvent {
  type: "cut";
  content: string;
  from: number;
  to: number;
  timestamp: number;
}

export interface SelectionEvent {
  type: "selection";
  from: number;
  to: number;
  timestamp: number;
}

export interface FormattingEvent {
  type: "formatting";
  mark: string; // "bold", "italic", "underline", "heading", etc.
  from: number;
  to: number;
  timestamp: number;
}

export interface TabAwayEvent {
  type: "tab_away";
  timestamp: number;
}

export interface TabReturnEvent {
  type: "tab_return";
  awayDuration: number; // milliseconds
  timestamp: number;
}

export interface SnapshotEvent {
  type: "snapshot";
  snapshotId: string;
  timestamp: number;
}

// Discriminated union of all event types
export type SFEvent =
  | KeystrokeEvent
  | BackspaceEvent
  | DeleteEvent
  | PasteEvent
  | CutEvent
  | SelectionEvent
  | FormattingEvent
  | TabAwayEvent
  | TabReturnEvent
  | SnapshotEvent;

// --- Snapshot ---

export interface SFSnapshot {
  id: string;
  label: string;
  timestamp: number;
  content: string; // HTML content at this point
}

// --- File Metadata ---

export interface SFMetadata {
  studentId: string;
  assignmentId: string;
  createdAt: string; // ISO timestamp
  submittedAt: string | null;
}

// --- Top-level .sf File ---

export interface SFFile {
  version: string;
  metadata: SFMetadata;
  snapshots: SFSnapshot[];
  events: SFEvent[];
}

// --- Stats (computed from events) ---

export interface SFStats {
  totalTimeSpent: number; // seconds
  wordCount: number;
  eventCount: number;
  pasteCount: number;
  tabAwayCount: number;
  snapshotCount: number;
  totalPastedCharacters: number;
  totalTabAwayDuration: number; // milliseconds
}

// --- Timeline Marker (for viewer) ---

export type TimelineMarkerType = "paste" | "tab_away" | "tab_return" | "snapshot" | "cut";

export interface TimelineMarker {
  type: TimelineMarkerType;
  timestamp: number;
  label: string;
  color: string;
}
