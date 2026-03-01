import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { Mark } from "@tiptap/pm/model";
import type { SFLogger } from "@/lib/sf-logger";

/** Marks that carry meaningful attributes worth logging. */
const MARKS_WITH_ATTRS = new Set(["textStyle", "highlight"]);

/**
 * Serialize an array of ProseMirror Marks into the compact format we store
 * in keystroke events: `{ type: string; attrs?: Record<string, unknown> }[]`.
 *
 * - Simple marks (bold, italic, etc.) are stored as `{ type: "bold" }`.
 * - Marks with meaningful attrs (textStyle, highlight) include filtered attrs,
 *   omitting null/undefined values to keep the log clean.
 * - Returns undefined if there are no active marks (avoids bloating the log).
 */
function serializeMarks(
  marks: readonly Mark[],
): Array<{ type: string; attrs?: Record<string, unknown> }> | undefined {
  if (marks.length === 0) return undefined;

  const result: Array<{ type: string; attrs?: Record<string, unknown> }> = [];

  for (const mark of marks) {
    const entry: { type: string; attrs?: Record<string, unknown> } = {
      type: mark.type.name,
    };

    if (MARKS_WITH_ATTRS.has(mark.type.name) && mark.attrs) {
      const filtered: Record<string, unknown> = {};
      let hasValue = false;
      for (const [key, val] of Object.entries(mark.attrs)) {
        if (val !== null && val !== undefined) {
          filtered[key] = val;
          hasValue = true;
        }
      }
      if (hasValue) {
        entry.attrs = filtered;
      }
    }

    result.push(entry);
  }

  return result;
}

/**
 * Tiptap extension that captures keystrokes, backspace, and delete events.
 * Hooks into ProseMirror's keyboard handling to log every key action.
 *
 * For printable characters and Enter, also captures the **active marks**
 * at the cursor (storedMarks or $from.marks()). This ensures that during
 * playback, characters are inserted with the correct inline formatting
 * (bold, italic, font, color, highlight, etc.) — not as plain text.
 *
 * Handles selection-based deletions: when the user has a text selection
 * and presses Backspace/Delete, the full range is logged (not just 1 char).
 * When the user types a character over a selection, the selection deletion
 * is logged before the character insertion.
 */
export const KeystrokeLogger = Extension.create<{ logger: SFLogger | null }>({
  name: "keystrokeLogger",

  addOptions() {
    return {
      logger: null,
    };
  },

  addProseMirrorPlugins() {
    const logger = this.options.logger;

    return [
      new Plugin({
        key: new PluginKey("keystrokeLogger"),
        props: {
          handleKeyDown(view, event) {
            if (!logger) return false;

            const { from, to } = view.state.selection;
            const hasSelection = from !== to;

            // Skip modifier-only keys
            if (
              event.key === "Shift" ||
              event.key === "Control" ||
              event.key === "Alt" ||
              event.key === "Meta"
            ) {
              return false;
            }

            // Skip keyboard shortcuts (Ctrl+C, Ctrl+V, Ctrl+Z, etc.)
            // These are handled by other extensions or TipTap commands
            if (event.ctrlKey || event.metaKey) {
              return false;
            }

            // Backspace
            if (event.key === "Backspace") {
              if (hasSelection) {
                // Selection-based deletion: delete the entire selected range
                const content = view.state.doc.textBetween(from, to, " ");
                logger.logBackspace(from, content, to);
              } else if (from > 0) {
                // Single character deletion
                const deletedContent = view.state.doc.textBetween(
                  Math.max(0, from - 1),
                  from,
                  ""
                );
                logger.logBackspace(from, deletedContent);
              }
              return false;
            }

            // Delete key
            if (event.key === "Delete") {
              if (hasSelection) {
                // Selection-based deletion
                const content = view.state.doc.textBetween(from, to, " ");
                logger.logDelete(from, content, to);
              } else {
                const docSize = view.state.doc.content.size;
                if (from < docSize) {
                  const deletedContent = view.state.doc.textBetween(
                    from,
                    Math.min(docSize, from + 1),
                    ""
                  );
                  logger.logDelete(from, deletedContent);
                }
              }
              return false;
            }

            // Get active marks for the next typed character.
            // storedMarks are set when the user toggles a mark without a selection
            // (e.g. press Ctrl+B then type). $from.marks() returns the marks
            // at the current cursor position inherited from surrounding content.
            const activeMarks =
              view.state.storedMarks ?? view.state.selection.$from.marks();
            const marks = serializeMarks(activeMarks);

            // Enter
            if (event.key === "Enter") {
              if (hasSelection) {
                // Typing Enter over a selection: TipTap deletes the selection
                // then splits the block. Log the deletion first.
                const content = view.state.doc.textBetween(from, to, " ");
                logger.logBackspace(from, content, to);
              }
              logger.logKeystroke("Enter", from, marks);
              return false;
            }

            // Tab — skip logging here. The Indent extension handles Tab
            // and the SelectionLogger will capture the resulting paragraph_format event.
            if (event.key === "Tab") {
              return false;
            }

            // Regular printable character
            if (event.key.length === 1) {
              if (hasSelection) {
                // Typing over a selection: TipTap deletes the selection first,
                // then inserts the character. Log the deletion.
                const content = view.state.doc.textBetween(from, to, " ");
                logger.logBackspace(from, content, to);
              }
              logger.logKeystroke(event.key, from, marks);
            }

            return false; // Don't prevent default - let Tiptap handle the actual editing
          },
        },
      }),
    ];
  },
});
