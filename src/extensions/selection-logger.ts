import { Extension } from "@tiptap/core";
import type { SFLogger } from "@/lib/sf-logger";

/** Paragraph-level attributes we track for logging. */
const PARAGRAPH_ATTRS = new Set(["textAlign", "lineHeight", "indent"]);

/**
 * Tiptap extension that captures text selection, formatting (mark) changes,
 * and paragraph-level attribute changes (alignment, line spacing, indent).
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

    for (const step of transaction.steps) {
      const stepJSON = step.toJSON();

      // AddMarkStep or RemoveMarkStep (bold, italic, color, fontFamily, etc.)
      if (stepJSON.stepType === "addMark" || stepJSON.stepType === "removeMark") {
        const mark = stepJSON.mark?.type ?? "unknown";
        const from = stepJSON.from ?? 0;
        const to = stepJSON.to ?? 0;
        const action = stepJSON.stepType === "addMark" ? "add" : "remove";
        logger.logFormatting(mark, from, to, action);
      }

      // AttrStep — used by TextAlign and potentially other paragraph attr changes.
      // JSON shape: { stepType: "attr", pos: number, attr: string, value: any }
      if (stepJSON.stepType === "attr" && PARAGRAPH_ATTRS.has(stepJSON.attr)) {
        logger.logParagraphFormat(
          stepJSON.attr,
          stepJSON.value ?? "",
          stepJSON.pos ?? 0
        );
      }

      // ReplaceAroundStep with node markup change — used by setNodeMarkup()
      // (Indent and LineSpacing extensions use commands.updateAttributes which
      // may produce setNodeMarkup steps). We detect these by checking if a
      // "replaceAround" step changes paragraph/heading attrs.
      if (stepJSON.stepType === "replaceAround" || stepJSON.stepType === "replace") {
        // setNodeMarkup produces a replaceAround step. We inspect the
        // transaction's docChanged state and compare node attrs before/after
        // for the affected range. This is handled by diffing the steps.
        // For simplicity, we rely on AttrStep detection above — the
        // Indent extension uses tr.setNodeMarkup which in ProseMirror
        // generates a ReplaceAroundStep. We need to detect attr changes
        // within it.
        const pos = stepJSON.from ?? 0;
        const oldDoc = transaction.before;
        const newDoc = transaction.doc;

        try {
          const oldNode = oldDoc.nodeAt(pos);
          const newNode = newDoc.nodeAt(pos);
          if (oldNode && newNode && oldNode.type.name === newNode.type.name) {
            for (const attr of PARAGRAPH_ATTRS) {
              const oldVal = oldNode.attrs[attr];
              const newVal = newNode.attrs[attr];
              if (oldVal !== newVal) {
                logger.logParagraphFormat(attr, newVal ?? "", pos);
              }
            }
          }
        } catch {
          // Position may be invalid after transform — skip
        }
      }
    }
  },
});
