"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style"; 
import { FontFamily } from "@tiptap/extension-font-family";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";

import { SFLogger } from "@/lib/sf-logger";
import { KeystrokeLogger } from "@/extensions/keystroke-logger";
import { PasteLogger } from "@/extensions/paste-logger";
import { SelectionLogger } from "@/extensions/selection-logger";
import { countWords, htmlToPlainText } from "@/lib/sf-parser";

// --- Google Docs Style Icons ---
const BoldIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>;
const ItalicIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>;
const UnderlineIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>;
const AlignLeftIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>;
const AlignCenterIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7 15v2h10v-2H7zm-4 4v2h18v-2H3zm4-16v2h10V3H7zm-4 4v2h18V7H3zm0 4v2h18v-2H3z"/></svg>;
const AlignRightIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 15v2h12v-2H9zm-6 4v2h18v-2H3zM9 7v2h12V7H9zm-6 4v2h18v-2H3zM3 3v2h18V3H3z"/></svg>;
const AlignJustifyIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"/></svg>;

export default function SFEditor({
  studentId,
  assignmentId,
  initialContent,
  onSave,
  onSubmit,
}: any) {
  const loggerRef = useRef<SFLogger | null>(null);
  
  // States to drive UI active/inactive styles
  const [currentSize, setCurrentSize] = useState("16px");
  const [currentFont, setCurrentFont] = useState("Times New Roman");
  const [activeMarks, setActiveMarks] = useState({
    bold: false, italic: false, underline: false,
    left: true, center: false, right: false, justify: false
  });

  if (!loggerRef.current) {
    loggerRef.current = initialContent ? SFLogger.fromJSON(initialContent) : new SFLogger(studentId, assignmentId);
  }
  const logger = loggerRef.current;

  const syncToolbar = useCallback((editor: any) => {
    if (!editor) return;
    const attrs = editor.getAttributes("textStyle");
    setCurrentSize(attrs.fontSize || "16px");
    setCurrentFont(attrs.fontFamily || "Times New Roman");
    
    setActiveMarks({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      left: editor.isActive({ textAlign: "left" }),
      center: editor.isActive({ textAlign: "center" }),
      right: editor.isActive({ textAlign: "right" }),
      justify: editor.isActive({ textAlign: "justify" }),
    });
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            fontSize: {
              default: null,
              parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ""),
              renderHTML: attributes => attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {},
            },
          };
        },
      }),
      FontFamily,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Start your research paper..." }),
      KeystrokeLogger.configure({ logger }),
      PasteLogger.configure({ logger }),
      SelectionLogger.configure({ logger }),
    ],
    content: initialContent || "",
    onUpdate: ({ editor }) => syncToolbar(editor),
    onSelectionUpdate: ({ editor }) => syncToolbar(editor),
  });

  const runCommand = (command: () => void) => {
    command();
    if (editor) syncToolbar(editor);
  };

  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh" }}>
      <div style={headerStyles}>
        <div style={toolbarGroupStyles}>
          <select 
            value={currentFont}
            onChange={(e) => runCommand(() => editor?.chain().focus().setFontFamily(e.target.value).run())}
            style={selectStyles}
          >
            <option value="Times New Roman">Times New Roman</option>
            <option value="Arial">Arial</option>
            <option value="Courier New">Courier New</option>
          </select>

          <select 
            value={currentSize}
            onChange={(e) => runCommand(() => editor?.chain().focus().setMark('textStyle', { fontSize: e.target.value }).run())}
            style={{ ...selectStyles, width: "60px" }}
          >
            {["12px", "14px", "16px", "18px", "24px", "32px"].map(size => (
              <option key={size} value={size}>{size.replace('px', '')}</option>
            ))}
          </select>

          <div style={dividerStyles} />
          
          <button onClick={() => runCommand(() => editor?.chain().focus().toggleBold().run())} style={toolBtnStyles(activeMarks.bold)}><BoldIcon /></button>
          <button onClick={() => runCommand(() => editor?.chain().focus().toggleItalic().run())} style={toolBtnStyles(activeMarks.italic)}><ItalicIcon /></button>
          <button onClick={() => runCommand(() => editor?.chain().focus().toggleUnderline().run())} style={toolBtnStyles(activeMarks.underline)}><UnderlineIcon /></button>
          
          <div style={dividerStyles} />

          <button onClick={() => runCommand(() => editor?.chain().focus().setTextAlign("left").run())} style={toolBtnStyles(activeMarks.left)}><AlignLeftIcon /></button>
          <button onClick={() => runCommand(() => editor?.chain().focus().setTextAlign("center").run())} style={toolBtnStyles(activeMarks.center)}><AlignCenterIcon /></button>
          <button onClick={() => runCommand(() => editor?.chain().focus().setTextAlign("right").run())} style={toolBtnStyles(activeMarks.right)}><AlignRightIcon /></button>
          <button onClick={() => runCommand(() => editor?.chain().focus().setTextAlign("justify").run())} style={toolBtnStyles(activeMarks.justify)}><AlignJustifyIcon /></button>
        </div>

        <button onClick={() => onSubmit?.(logger.serialize())} style={submitBtnStyles}>Submit</button>
      </div>

      <div style={pageStyles} onClick={() => editor?.commands.focus()}>
        <style>{`
          .ProseMirror { outline: none; min-height: 800px; line-height: 1.6; font-family: 'Times New Roman', serif; }
          .ProseMirror p { margin-bottom: 1.2em; }
        `}</style>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// Styles
const headerStyles: React.CSSProperties = { position: "sticky", top: 0, zIndex: 100, background: "#fff", padding: "8px 20px", borderBottom: "1px solid #dadce0", display: "flex", alignItems: "center", justifyContent: "space-between" };
const toolbarGroupStyles: React.CSSProperties = { display: "flex", gap: "2px", alignItems: "center" };
const selectStyles: React.CSSProperties = { padding: "4px 6px", borderRadius: "4px", border: "1px solid transparent", fontSize: "14px", outline: "none", cursor: "pointer", background: "transparent" };
const toolBtnStyles = (active?: boolean): React.CSSProperties => ({
  background: active ? "#e8f0fe" : "transparent",
  color: active ? "#1a73e8" : "#444",
  border: "none", padding: "8px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
});
const dividerStyles: React.CSSProperties = { width: "1px", height: "20px", background: "#dadce0", margin: "0 8px" };
const pageStyles: React.CSSProperties = { maxWidth: "816px", margin: "40px auto", background: "#fff", padding: "96px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", minHeight: "1056px" };
const submitBtnStyles: React.CSSProperties = { background: "#1a73e8", color: "#fff", border: "none", padding: "8px 24px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" };