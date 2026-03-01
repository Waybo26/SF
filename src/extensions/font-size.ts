import { Extension } from "@tiptap/react";
import "@tiptap/extension-text-style";

export type FontSizeOptions = {
  types: string[];
};

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    fontSize: {
      /**
       * Set the font size (e.g. "12pt", "16px")
       */
      setFontSize: (fontSize: string) => ReturnType;
      /**
       * Unset the font size (revert to default)
       */
      unsetFontSize: () => ReturnType;
    };
  }
}

/**
 * Custom TipTap extension that adds a `fontSize` attribute to the
 * `textStyle` mark. Requires @tiptap/extension-text-style to be loaded.
 */
export const FontSize = Extension.create<FontSizeOptions>({
  name: "fontSize",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, "") || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain()
            .setMark("textStyle", { fontSize: null })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});
