import { Extension } from "@tiptap/react";

export type LineSpacingOptions = {
  types: string[];
  defaultLineHeight: string;
};

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    lineSpacing: {
      /**
       * Set line height on the current block (e.g. "1", "1.5", "2")
       */
      setLineSpacing: (lineHeight: string) => ReturnType;
      /**
       * Unset line height (revert to default)
       */
      unsetLineSpacing: () => ReturnType;
    };
  }
}

/**
 * Custom TipTap extension that adds a `lineHeight` attribute to
 * paragraph and heading nodes for controlling line spacing.
 */
export const LineSpacing = Extension.create<LineSpacingOptions>({
  name: "lineSpacing",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
      defaultLineHeight: "1.5",
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => element.style.lineHeight || null,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) return {};
              return { style: `line-height: ${attributes.lineHeight}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineSpacing:
        (lineHeight: string) =>
        ({ commands }) => {
          return this.options.types
            .map((type) => commands.updateAttributes(type, { lineHeight }))
            .every((result) => result);
        },
      unsetLineSpacing:
        () =>
        ({ commands }) => {
          return this.options.types
            .map((type) => commands.resetAttributes(type, "lineHeight"))
            .every((result) => result);
        },
    };
  },
});
