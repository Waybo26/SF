import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { SFLogger } from "@/lib/sf-logger";

/**
 * Tiptap extension that captures paste and cut events.
 * Captures the content being pasted/cut and the cursor position.
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
                const { from } = view.state.selection;
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
