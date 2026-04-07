"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatUnderlined,
  MdInsertLink,
  MdRedo,
  MdUndo,
} from "react-icons/md";

const normalizeEditorHtml = (html = "") => {
  const source = String(html || "")
    .replace(/&nbsp;/g, " ")
    .trim();

  if (
    !source ||
    source === "<br>" ||
    source === "<div><br></div>" ||
    source === "<p><br></p>"
  ) {
    return "";
  }

  return source;
};

const toolbarButtons = [
  { command: "undo", icon: <MdUndo />, title: "Undo" },
  { command: "redo", icon: <MdRedo />, title: "Redo" },
  { command: "bold", icon: <MdFormatBold />, title: "Bold" },
  { command: "italic", icon: <MdFormatItalic />, title: "Italic" },
  { command: "underline", icon: <MdFormatUnderlined />, title: "Underline" },
  {
    command: "insertUnorderedList",
    icon: <MdFormatListBulleted />,
    title: "Bullet List",
  },
  { command: "createLink", icon: <MdInsertLink />, title: "Insert Link" },
];

export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Write here",
  minHeight = 120,
  singleLine = false,
  className = "",
}) {
  const editorRef = useRef(null);
  const [activeCommands, setActiveCommands] = useState({
    bold: false,
    italic: false,
    underline: false,
    insertUnorderedList: false,
  });

  const editorClassName = useMemo(
    () =>
      `blog-posts-rich-editor ${singleLine ? "single-line" : ""} ${className}`.trim(),
    [className, singleLine],
  );

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const normalizedIncoming = normalizeEditorHtml(value);
    const normalizedCurrent = normalizeEditorHtml(editor.innerHTML);

    if (normalizedIncoming !== normalizedCurrent) {
      editor.innerHTML = normalizedIncoming;
    }
  }, [value]);

  useEffect(() => {
    const syncActiveCommands = () => {
      const editor = editorRef.current;
      if (!editor) return;

      const selection = window.getSelection();
      const withinEditor =
        selection &&
        selection.rangeCount > 0 &&
        editor.contains(selection.anchorNode);

      if (!withinEditor) {
        setActiveCommands({
          bold: false,
          italic: false,
          underline: false,
          insertUnorderedList: false,
        });
        return;
      }

      setActiveCommands({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      });
    };

    document.addEventListener("selectionchange", syncActiveCommands);
    return () => {
      document.removeEventListener("selectionchange", syncActiveCommands);
    };
  }, []);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor || typeof onChange !== "function") return;
    onChange(normalizeEditorHtml(editor.innerHTML));
  };

  const focusEditor = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
  };

  const runCommand = (command) => {
    focusEditor();

    if (command === "createLink") {
      const url = window.prompt("Enter the link URL");
      if (!url) return;
      document.execCommand("createLink", false, url);
      emitChange();
      return;
    }

    document.execCommand(command, false, null);
    emitChange();
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const plainText = event.clipboardData.getData("text/plain");

    if (!plainText) return;

    focusEditor();

    if (singleLine) {
      document.execCommand("insertText", false, plainText.replace(/\s+/g, " "));
    } else {
      const withLineBreaks = plainText.replace(/\n/g, "<br>");
      document.execCommand("insertHTML", false, withLineBreaks);
    }

    emitChange();
  };

  const handleKeyDown = (event) => {
    if (singleLine && event.key === "Enter") {
      event.preventDefault();
    }
  };

  return (
    <div className={editorClassName}>
      <div className="blog-posts-rich-toolbar">
        {toolbarButtons.map((button) => {
          const isActive =
            button.command in activeCommands
              ? activeCommands[button.command]
              : false;

          return (
            <button
              key={button.command}
              type="button"
              className={`blog-posts-rich-btn ${isActive ? "active" : ""}`}
              title={button.title}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => runCommand(button.command)}
            >
              {button.icon}
            </button>
          );
        })}
      </div>

      <div
        ref={editorRef}
        className="blog-posts-rich-surface"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emitChange}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        style={{ minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight }}
      />
    </div>
  );
}
