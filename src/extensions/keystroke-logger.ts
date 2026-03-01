import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { SFLogger } from "@/lib/sf-logger";

/**
 * Tiptap extension that captures keystrokes, backspace, and delete events.
 * Hooks into ProseMirror's keyboard handling to log every key action.
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

            // Enter
            if (event.key === "Enter") {
              if (hasSelection) {
                // Typing Enter over a selection: TipTap deletes the selection
                // then splits the block. Log the deletion first.
                const content = view.state.doc.textBetween(from, to, " ");
                logger.logBackspace(from, content, to);
              }
              logger.logKeystroke("Enter", from);
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
              logger.logKeystroke(event.key, from);
            }

            return false; // Don't prevent default - let Tiptap handle the actual editing
          },
        },
      }),
    ];
  },
});
