import { Extension } from "@tiptap/react";

export type FirstLineIndentOptions = {
  types: string[];
  indentValue: string;
};

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    firstLineIndent: {
      /**
       * Toggle a first-line indent (text-indent: 0.5in) on the current block(s).
       */
      toggleFirstLineIndent: () => ReturnType;
      /**
       * Set a first-line indent on the current block(s).
       */
      setFirstLineIndent: () => ReturnType;
      /**
       * Remove first-line indent from the current block(s).
       */
      unsetFirstLineIndent: () => ReturnType;
    };
  }
}

/**
 * Custom TipTap extension that adds a `textIndent` attribute to paragraph
 * and heading nodes. This is distinct from the block-level `indent` extension
 * (which uses margin-left to shift the whole paragraph). First-line indent
 * only shifts the first line of the paragraph via `text-indent: 0.5in`.
 *
 * Used for MLA-style first-line indentation.
 */
export const FirstLineIndent = Extension.create<FirstLineIndentOptions>({
  name: "firstLineIndent",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
      indentValue: "0.5in",
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textIndent: {
            default: null,
            parseHTML: (element) => {
              return element.style.textIndent || null;
            },
            renderHTML: (attributes) => {
              if (!attributes.textIndent) return {};
              return {
                style: `text-indent: ${attributes.textIndent}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      toggleFirstLineIndent:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const current = node.attrs.textIndent;
              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  textIndent: current ? null : this.options.indentValue,
                });
              }
              changed = true;
            }
          });

          return changed;
        },

      setFirstLineIndent:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              if (!node.attrs.textIndent) {
                if (dispatch) {
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    textIndent: this.options.indentValue,
                  });
                }
                changed = true;
              }
            }
          });

          return changed;
        },

      unsetFirstLineIndent:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              if (node.attrs.textIndent) {
                if (dispatch) {
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    textIndent: null,
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
});
