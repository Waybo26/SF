import { Extension } from "@tiptap/react";

export type IndentOptions = {
  types: string[];
  minIndent: number;
  maxIndent: number;
};

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    indent: {
      /**
       * Increase the indent level of the current block(s)
       */
      indent: () => ReturnType;
      /**
       * Decrease the indent level of the current block(s)
       */
      outdent: () => ReturnType;
    };
  }
}

/**
 * Custom TipTap extension that adds an `indent` attribute (integer 0-8)
 * to paragraph and heading nodes. Tab increases indent, Shift+Tab decreases.
 * Each indent level corresponds to 0.5in (matching MLA first-line indent).
 */
export const Indent = Extension.create<IndentOptions>({
  name: "indent",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
      minIndent: 0,
      maxIndent: 8,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const indent = element.getAttribute("data-indent");
              return indent ? parseInt(indent, 10) : 0;
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent === 0) return {};
              return {
                "data-indent": attributes.indent,
                style: `margin-left: ${attributes.indent * 0.5}in`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent < this.options.maxIndent) {
                if (dispatch) {
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    indent: currentIndent + 1,
                  });
                }
                changed = true;
              }
            }
          });

          return changed;
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent > this.options.minIndent) {
                if (dispatch) {
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    indent: currentIndent - 1,
                  });
                }
                changed = true;
              }
            }
          });

          return changed;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        // Only indent if cursor is at the start of a block or if it's a list context
        // For now, always indent — the keystroke logger already handles Tab
        return this.editor.commands.indent();
      },
      "Shift-Tab": () => {
        return this.editor.commands.outdent();
      },
    };
  },
});
