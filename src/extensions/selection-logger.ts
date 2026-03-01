import { Extension } from "@tiptap/core";
import { isHistoryTransaction } from "@tiptap/pm/history";
import type { SFLogger } from "@/lib/sf-logger";

/** Paragraph-level attributes we track for logging. */
const PARAGRAPH_ATTRS = new Set(["textAlign", "lineHeight", "indent", "textIndent"]);

/** Marks that have meaningful attributes we need to capture. */
const MARKS_WITH_ATTRS = new Set(["textStyle", "highlight"]);

/**
 * Tiptap extension that captures:
 * - Text selections (debounced — only meaningful ranges, not cursor moves)
 * - Formatting (mark) changes with full attribute capture
 * - Paragraph-level attribute changes (alignment, line spacing, indent)
 * - Node type changes (paragraph ↔ heading, list toggles, etc.)
 *
 * Skips undo/redo transactions to avoid double-counting — snapshots
 * provide the ground truth for those state changes.
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

    // Skip undo/redo transactions — these reverse or replay prior changes.
    // Logging them would double-count. Snapshots handle ground truth.
    if (isHistoryTransaction(transaction)) {
      return;
    }

    // Skip transactions that don't change the document
    if (!transaction.docChanged) return;

    for (const step of transaction.steps) {
      const stepJSON = step.toJSON();

      // ── Mark changes (bold, italic, color, fontFamily, fontSize, highlight, etc.) ──
      if (stepJSON.stepType === "addMark" || stepJSON.stepType === "removeMark") {
        const markTypeName: string = stepJSON.mark?.type ?? "unknown";
        const from: number = stepJSON.from ?? 0;
        const to: number = stepJSON.to ?? 0;
        const action = stepJSON.stepType === "addMark" ? "add" as const : "remove" as const;

        // Capture mark attributes for marks that carry data (textStyle, highlight).
        // Simple marks (bold, italic, etc.) have no meaningful attrs.
        let attrs: Record<string, unknown> | undefined;
        if (MARKS_WITH_ATTRS.has(markTypeName) && stepJSON.mark?.attrs) {
          // Filter out null/undefined attrs to keep the log clean
          const rawAttrs = stepJSON.mark.attrs as Record<string, unknown>;
          const filtered: Record<string, unknown> = {};
          let hasValue = false;
          for (const [key, val] of Object.entries(rawAttrs)) {
            if (val !== null && val !== undefined) {
              filtered[key] = val;
              hasValue = true;
            }
          }
          if (hasValue) {
            attrs = filtered;
          }
        }

        logger.logFormatting(markTypeName, from, to, action, attrs);
      }

      // ── AttrStep — used by TextAlign and potentially other paragraph attr changes ──
      if (stepJSON.stepType === "attr" && PARAGRAPH_ATTRS.has(stepJSON.attr)) {
        logger.logParagraphFormat(
          stepJSON.attr,
          stepJSON.value ?? "",
          stepJSON.pos ?? 0
        );
      }

      // ── ReplaceAroundStep / ReplaceStep — detect paragraph attr changes AND node type changes ──
      if (stepJSON.stepType === "replaceAround" || stepJSON.stepType === "replace") {
        const pos: number = stepJSON.from ?? 0;
        const oldDoc = transaction.before;
        const newDoc = transaction.doc;

        try {
          const oldNode = oldDoc.nodeAt(pos);
          const newNode = newDoc.nodeAt(pos);
          if (!oldNode || !newNode) continue;

          // Case 1: Same node type — check for paragraph attr changes
          if (oldNode.type.name === newNode.type.name) {
            for (const attr of PARAGRAPH_ATTRS) {
              const oldVal = oldNode.attrs[attr];
              const newVal = newNode.attrs[attr];
              if (oldVal !== newVal) {
                logger.logParagraphFormat(attr, newVal ?? "", pos);
              }
            }
          }

          // Case 2: Node type changed (e.g. paragraph → heading, heading → paragraph)
          if (oldNode.type.name !== newNode.type.name) {
            // Only log for block-level nodes we care about
            const blockTypes = new Set(["paragraph", "heading", "blockquote", "codeBlock", "bulletList", "orderedList", "listItem"]);
            if (blockTypes.has(oldNode.type.name) || blockTypes.has(newNode.type.name)) {
              // Capture relevant attrs on the new node (e.g. heading level)
              let attrs: Record<string, unknown> | undefined;
              if (newNode.type.name === "heading" && newNode.attrs.level) {
                attrs = { level: newNode.attrs.level };
              }
              logger.logNodeChange(oldNode.type.name, newNode.type.name, pos, attrs);
            }
          }
        } catch {
          // Position may be invalid after transform — skip
        }
      }
    }
  },
});
