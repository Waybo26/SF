/**
 * Shared ProseMirror schema that matches exactly what TipTap produces
 * with StarterKit + Underline extensions.
 *
 * Used by both the student editor (via TipTap) and the headless
 * playback engine (for reconstructing document state from events).
 */

import { Schema } from "@tiptap/pm/model";

export const sfSchema = new Schema({
  topNode: "doc",

  nodes: {
    doc: {
      content: "block+",
    },

    paragraph: {
      content: "inline*",
      group: "block",
      parseDOM: [{ tag: "p" }],
      toDOM() {
        return ["p", 0];
      },
    },

    text: {
      group: "inline",
    },

    heading: {
      content: "inline*",
      group: "block",
      defining: true,
      attrs: {
        level: { default: 1 },
      },
      parseDOM: [
        { tag: "h1", attrs: { level: 1 } },
        { tag: "h2", attrs: { level: 2 } },
        { tag: "h3", attrs: { level: 3 } },
        { tag: "h4", attrs: { level: 4 } },
        { tag: "h5", attrs: { level: 5 } },
        { tag: "h6", attrs: { level: 6 } },
      ],
      toDOM(node) {
        return [`h${node.attrs.level}`, 0];
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
  },
});
