import type { SFFile } from "./sf-types";

/**
 * Parse and validate a .sf JSON string into an SFFile object.
 */
export function parseSFFile(json: string): SFFile {
  let parsed: SFFile;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid .sf file: not valid JSON");
  }

  // Validate version
  if (!parsed.version) {
    throw new Error("Invalid .sf file: missing version");
  }

  // Validate metadata
  if (!parsed.metadata) {
    throw new Error("Invalid .sf file: missing metadata");
  }
  if (!parsed.metadata.studentId || !parsed.metadata.assignmentId) {
    throw new Error("Invalid .sf file: missing studentId or assignmentId in metadata");
  }

  // Validate events array
  if (!Array.isArray(parsed.events)) {
    throw new Error("Invalid .sf file: events must be an array");
  }

  // Validate snapshots array
  if (!Array.isArray(parsed.snapshots)) {
    throw new Error("Invalid .sf file: snapshots must be an array");
  }

  // Validate each event has a type and timestamp
  for (let i = 0; i < parsed.events.length; i++) {
    const event = parsed.events[i];
    if (!event.type) {
      throw new Error(`Invalid .sf file: event at index ${i} missing type`);
    }
    if (typeof event.timestamp !== "number") {
      throw new Error(`Invalid .sf file: event at index ${i} missing or invalid timestamp`);
    }
  }

  return parsed;
}

/**
 * Extract plain text content from HTML string (for word counting, AI detection, etc.)
 */
export function htmlToPlainText(html: string): string {
  // Simple HTML tag stripping - works for Tiptap output
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Count words in a string.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}
