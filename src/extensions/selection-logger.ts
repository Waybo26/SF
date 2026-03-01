import { Extension } from "@tiptap/core";
import type { SFLogger } from "@/lib/sf-logger";

/**
 * Tiptap extension that captures text selection and formatting changes.
 * Debounces selection events to avoid logging every cursor movement.
 */
export const SelectionLogger = Extension.create<{ logger: SFLogger | null }>({
  name: "selectionLogger",

  addOptions() {
    return {
      logger: null,
    };
  },

  onSelectionUpdate() {
    const logger = this.options.logger;
    if (!logger) return;

    const { from, to } = this.editor.state.selection;

    // Only log meaningful selections (not just cursor movements)
    if (from !== to) {
      logger.logSelection(from, to);
    }
  },

  onTransaction({ transaction }) {
    const logger = this.options.logger;
    if (!logger) return;

    // Check for formatting changes (mark steps)
    for (const step of transaction.steps) {
      const stepJSON = step.toJSON();

      // AddMarkStep or RemoveMarkStep
      if (stepJSON.stepType === "addMark" || stepJSON.stepType === "removeMark") {
        const mark = stepJSON.mark?.type ?? "unknown";
        const from = stepJSON.from ?? 0;
        const to = stepJSON.to ?? 0;
        const action = stepJSON.stepType === "addMark" ? "add" : "remove";
        logger.logFormatting(mark, from, to, action);
      }
    }
  },
});
