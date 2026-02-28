import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { SFLogger } from "@/lib/sf-logger";

/**
 * Tiptap extension that captures keystrokes, backspace, and delete events.
 * Hooks into ProseMirror's keyboard handling to log every key action.
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

            const { from } = view.state.selection;

            // Skip modifier-only keys
            if (
              event.key === "Shift" ||
              event.key === "Control" ||
              event.key === "Alt" ||
              event.key === "Meta"
            ) {
              return false;
            }

            // Backspace
            if (event.key === "Backspace") {
              // Get the character that will be deleted
              const pos = from;
              if (pos > 0) {
                const deletedContent = view.state.doc.textBetween(
                  Math.max(0, pos - 1),
                  pos,
                  ""
                );
                logger.logBackspace(pos, deletedContent);
              }
              return false;
            }

            // Delete key
            if (event.key === "Delete") {
              const pos = from;
              const docSize = view.state.doc.content.size;
              if (pos < docSize) {
                const deletedContent = view.state.doc.textBetween(
                  pos,
                  Math.min(docSize, pos + 1),
                  ""
                );
                logger.logDelete(pos, deletedContent);
              }
              return false;
            }

            // Skip non-printable keys (except Enter, Tab)
            if (event.key === "Enter") {
              logger.logKeystroke("Enter", from);
              return false;
            }

            if (event.key === "Tab") {
              logger.logKeystroke("Tab", from);
              return false;
            }

            // Skip keyboard shortcuts (Ctrl+C, Ctrl+V, etc.)
            if (event.ctrlKey || event.metaKey) {
              return false;
            }

            // Regular printable character
            if (event.key.length === 1) {
              logger.logKeystroke(event.key, from);
            }

            return false; // Don't prevent default - let Tiptap handle the actual editing
          },
        },
      }),
    ];
  },
});
