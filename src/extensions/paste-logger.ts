import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { SFLogger } from "@/lib/sf-logger";

/**
 * Tiptap extension that captures paste and cut events.
 * Captures the content being pasted/cut and the cursor position.
 *
 * When pasting over a selection, logs a backspace (deletion) event
 * for the selected range before logging the paste itself, so playback
 * can faithfully reproduce the operation.
 */
export const PasteLogger = Extension.create<{ logger: SFLogger | null }>({
  name: "pasteLogger",

  addOptions() {
    return {
      logger: null,
    };
  },

  addProseMirrorPlugins() {
    const logger = this.options.logger;

    return [
      new Plugin({
        key: new PluginKey("pasteLogger"),
        props: {
          handlePaste(view, event) {
            if (!logger) return false;

            const clipboardData = event.clipboardData;
            if (clipboardData) {
              const text = clipboardData.getData("text/plain");
              if (text) {
                const { from, to } = view.state.selection;

                // If pasting over a selection, TipTap replaces the selection
                // with the pasted content. Log the implicit deletion first.
                if (from !== to) {
                  const selectedContent = view.state.doc.textBetween(from, to, " ");
                  logger.logBackspace(from, selectedContent, to);
                }

                logger.logPaste(text, from);
              }
            }

            return false; // Don't prevent default - let Tiptap handle the paste
          },

          handleDOMEvents: {
            cut(view) {
              if (!logger) return false;

              const { from, to } = view.state.selection;
              if (from !== to) {
                const content = view.state.doc.textBetween(from, to, " ");
                logger.logCut(content, from, to);
              }

              return false; // Don't prevent default
            },
          },
        },
      }),
    ];
  },
});
