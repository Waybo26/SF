/**
 * Shared ProseMirror schema that matches exactly what TipTap produces
 * with StarterKit + Underline + TextStyle + Color + FontFamily + FontSize
 * + Highlight + TextAlign + LineSpacing + Indent extensions.
 *
 * Used by both the student editor (via TipTap) and the headless
 * playback engine (for reconstructing document state from events).
 */

import { Schema } from "@tiptap/pm/model";

/**
 * Helper to build paragraph-level attributes shared by paragraph and heading nodes.
 * These correspond to the TextAlign, LineSpacing, and Indent extensions.
 */
function blockAttrs(extra: Record<string, unknown> = {}) {
  return {
    ...extra,
    textAlign: { default: null },
    lineHeight: { default: null },
    indent: { default: 0 },
  };
}

/**
 * Render paragraph-level style attributes (textAlign, lineHeight, indent) as
 * inline styles and data attributes on the DOM element.
 */
function blockStyle(attrs: Record<string, unknown>): Record<string, string> {
  const style: string[] = [];
  const out: Record<string, string> = {};

  if (attrs.textAlign && attrs.textAlign !== "left") {
    style.push(`text-align: ${attrs.textAlign}`);
  }
  if (attrs.lineHeight) {
    style.push(`line-height: ${attrs.lineHeight}`);
  }
  if (attrs.indent && Number(attrs.indent) > 0) {
    style.push(`margin-left: ${Number(attrs.indent) * 0.5}in`);
    out["data-indent"] = String(attrs.indent);
  }

  if (style.length > 0) {
    out.style = style.join("; ");
  }
  return out;
}

/**
 * Parse paragraph-level attributes from a DOM element.
 */
function parseBlockAttrs(dom: HTMLElement) {
  const textAlign = dom.style.textAlign || null;
  const lineHeight = dom.style.lineHeight || null;
  const indentAttr = dom.getAttribute("data-indent");
  const indent = indentAttr ? parseInt(indentAttr, 10) : 0;
  return { textAlign, lineHeight, indent };
}

export const sfSchema = new Schema({
  topNode: "doc",

  nodes: {
    doc: {
      content: "block+",
    },

    paragraph: {
      content: "inline*",
      group: "block",
      attrs: blockAttrs(),
      parseDOM: [
        {
          tag: "p",
          getAttrs(dom: HTMLElement) {
            return parseBlockAttrs(dom);
          },
        },
      ],
      toDOM(node) {
        const domAttrs = blockStyle(node.attrs);
        return Object.keys(domAttrs).length > 0
          ? ["p", domAttrs, 0]
          : ["p", 0];
      },
    },

    text: {
      group: "inline",
    },

    heading: {
      content: "inline*",
      group: "block",
      defining: true,
      attrs: blockAttrs({ level: { default: 1 } }),
      parseDOM: [
        {
          tag: "h1",
          getAttrs(dom: HTMLElement) {
            return { level: 1, ...parseBlockAttrs(dom) };
          },
        },
        {
          tag: "h2",
          getAttrs(dom: HTMLElement) {
            return { level: 2, ...parseBlockAttrs(dom) };
          },
        },
        {
          tag: "h3",
          getAttrs(dom: HTMLElement) {
            return { level: 3, ...parseBlockAttrs(dom) };
          },
        },
        {
          tag: "h4",
          getAttrs(dom: HTMLElement) {
            return { level: 4, ...parseBlockAttrs(dom) };
          },
        },
        {
          tag: "h5",
          getAttrs(dom: HTMLElement) {
            return { level: 5, ...parseBlockAttrs(dom) };
          },
        },
        {
          tag: "h6",
          getAttrs(dom: HTMLElement) {
            return { level: 6, ...parseBlockAttrs(dom) };
          },
        },
      ],
      toDOM(node) {
        const domAttrs = blockStyle(node.attrs);
        return Object.keys(domAttrs).length > 0
          ? [`h${node.attrs.level}`, domAttrs, 0]
          : [`h${node.attrs.level}`, 0];
      },
    },

    blockquote: {
      content: "block+",
      group: "block",
      defining: true,
      parseDOM: [{ tag: "blockquote" }],
      toDOM() {
        return ["blockquote", 0];
      },
    },

    bulletList: {
      content: "listItem+",
      group: "block list",
      parseDOM: [{ tag: "ul" }],
      toDOM() {
        return ["ul", 0];
      },
    },

    orderedList: {
      content: "listItem+",
      group: "block list",
      attrs: {
        start: { default: 1 },
      },
      parseDOM: [
        {
          tag: "ol",
          getAttrs(dom: HTMLElement) {
            return {
              start: dom.hasAttribute("start")
                ? parseInt(dom.getAttribute("start") || "", 10)
                : 1,
            };
          },
        },
      ],
      toDOM(node) {
        return node.attrs.start === 1
          ? ["ol", 0]
          : ["ol", { start: node.attrs.start }, 0];
      },
    },

    listItem: {
      content: "paragraph block*",
      defining: true,
      parseDOM: [{ tag: "li" }],
      toDOM() {
        return ["li", 0];
      },
    },

    codeBlock: {
      content: "text*",
      marks: "",
      group: "block",
      code: true,
      defining: true,
      attrs: {
        language: { default: null },
      },
      parseDOM: [
        {
          tag: "pre",
          preserveWhitespace: "full" as const,
          getAttrs(dom: HTMLElement) {
            const classNames = [
              ...(dom.firstElementChild?.classList || []),
            ];
            const language =
              classNames
                .filter((cn) => cn.startsWith("language-"))
                .map((cn) => cn.replace("language-", ""))[0] || null;
            return { language };
          },
        },
      ],
      toDOM(node) {
        return [
          "pre",
          [
            "code",
            {
              class: node.attrs.language
                ? `language-${node.attrs.language}`
                : null,
            },
            0,
          ],
        ];
      },
    },

    hardBreak: {
      inline: true,
      group: "inline",
      selectable: false,
      linebreakReplacement: true,
      parseDOM: [{ tag: "br" }],
      toDOM() {
        return ["br"];
      },
    },

    horizontalRule: {
      group: "block",
      parseDOM: [{ tag: "hr" }],
      toDOM() {
        return ["hr"];
      },
    },
  },

  marks: {
    bold: {
      parseDOM: [
        { tag: "strong" },
        {
          tag: "b",
          getAttrs: (node: HTMLElement) =>
            node.style.fontWeight !== "normal" && null,
        },
        {
          style: "font-weight=400",
          clearMark: (mark) => mark.type.name === "bold",
        },
        {
          style: "font-weight",
          getAttrs: (value: string) =>
            /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null,
        },
      ],
      toDOM() {
        return ["strong", 0];
      },
    },

    italic: {
      parseDOM: [
        { tag: "em" },
        {
          tag: "i",
          getAttrs: (node: HTMLElement) =>
            node.style.fontStyle !== "normal" && null,
        },
        {
          style: "font-style=normal",
          clearMark: (mark) => mark.type.name === "italic",
        },
        { style: "font-style=italic" },
      ],
      toDOM() {
        return ["em", 0];
      },
    },

    strike: {
      parseDOM: [
        { tag: "s" },
        { tag: "del" },
        { tag: "strike" },
        {
          style: "text-decoration",
          consuming: false,
          getAttrs: (value: string) =>
            value.includes("line-through") ? {} : false,
        },
      ],
      toDOM() {
        return ["s", 0];
      },
    },

    code: {
      excludes: "_",
      code: true,
      parseDOM: [{ tag: "code" }],
      toDOM() {
        return ["code", 0];
      },
    },

    underline: {
      parseDOM: [
        { tag: "u" },
        {
          style: "text-decoration",
          consuming: false,
          getAttrs: (value: string) =>
            value.includes("underline") ? {} : false,
        },
      ],
      toDOM() {
        return ["u", 0];
      },
    },

    // TextStyle mark — container for color, fontFamily, fontSize attributes.
    // TipTap's @tiptap/extension-text-style creates this mark; Color,
    // FontFamily, and FontSize each add an attribute to it.
    textStyle: {
      parseDOM: [
        {
          tag: "span",
          getAttrs: (dom: HTMLElement) => {
            const hasStyle = dom.hasAttribute("style");
            if (!hasStyle) return false;
            return {
              color: dom.style.color || null,
              fontFamily: dom.style.fontFamily?.replace(/['"]+/g, "") || null,
              fontSize: dom.style.fontSize || null,
            };
          },
        },
      ],
      attrs: {
        color: { default: null },
        fontFamily: { default: null },
        fontSize: { default: null },
      },
      toDOM(mark) {
        const styles: string[] = [];
        if (mark.attrs.color) styles.push(`color: ${mark.attrs.color}`);
        if (mark.attrs.fontFamily)
          styles.push(`font-family: ${mark.attrs.fontFamily}`);
        if (mark.attrs.fontSize)
          styles.push(`font-size: ${mark.attrs.fontSize}`);
        return styles.length > 0
          ? ["span", { style: styles.join("; ") }, 0]
          : ["span", 0];
      },
    },

    // Highlight mark — background color for text.
    // Matches @tiptap/extension-highlight with multicolor: true.
    highlight: {
      attrs: {
        color: { default: null },
      },
      parseDOM: [
        {
          tag: "mark",
          getAttrs: (dom: HTMLElement) => ({
            color:
              dom.getAttribute("data-color") ||
              dom.style.backgroundColor ||
              null,
          }),
        },
      ],
      toDOM(mark) {
        const attrs: Record<string, string> = {};
        if (mark.attrs.color) {
          attrs["data-color"] = mark.attrs.color;
          attrs.style = `background-color: ${mark.attrs.color}`;
        }
        return ["mark", attrs, 0];
      },
    },
  },
});
