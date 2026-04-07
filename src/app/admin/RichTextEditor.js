"use client";

import React, { useEffect, useMemo, useRef } from "react";
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

const getClosestFormatNode = (node, tagName, root) => {
  let current =
    node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement || null;

  while (current && current !== root) {
    if (current.tagName?.toLowerCase() === tagName.toLowerCase()) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
};

const unwrapElement = (element) => {
  const parent = element?.parentNode;
  if (!parent) return;

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }

  parent.removeChild(element);
};

export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Write here",
  minHeight = 120,
  singleLine = false,
  className = "",
}) {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);

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

  const restoreSelection = () => {
    const editor = editorRef.current;
    const savedRange = savedRangeRef.current;
    if (!editor || !savedRange) return;

    const selection = window.getSelection();
    if (!selection) return;

    selection.removeAllRanges();
    selection.addRange(savedRange);
  };

  const captureSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (
      !editor ||
      !selection ||
      selection.rangeCount === 0 ||
      !editor.contains(selection.anchorNode)
    ) {
      return;
    }

    savedRangeRef.current = selection.getRangeAt(0).cloneRange();
  };

  const runCommand = (command) => {
    focusEditor();
    restoreSelection();

    if (command === "bold") {
      toggleInlineTag("strong");
      return;
    }

    if (command === "italic") {
      toggleInlineTag("em");
      return;
    }

    if (command === "underline") {
      toggleInlineTag("u");
      return;
    }

    if (command === "createLink") {
      insertLinkTag();
      return;
    }

    document.execCommand(command, false, null);
    captureSelection();
    emitChange();
  };

  const toggleInlineTag = (tagName) => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (
      !editor ||
      !selection ||
      selection.rangeCount === 0 ||
      selection.isCollapsed
    ) {
      return;
    }

    const range = selection.getRangeAt(0);
    const startTag = getClosestFormatNode(range.startContainer, tagName, editor);
    const endTag = getClosestFormatNode(range.endContainer, tagName, editor);

    if (startTag && endTag && startTag === endTag) {
      const parent = startTag.parentNode;
      const beforeRange = document.createRange();
      beforeRange.setStartBefore(startTag);
      beforeRange.setEndAfter(startTag);

      unwrapElement(startTag);

      if (parent) {
        selection.removeAllRanges();
        selection.addRange(beforeRange);
        savedRangeRef.current = beforeRange.cloneRange();
      }

      emitChange();
      return;
    }

    const wrapper = document.createElement(tagName);
    const extracted = range.extractContents();
    wrapper.appendChild(extracted);
    range.insertNode(wrapper);

    const nextRange = document.createRange();
    nextRange.selectNodeContents(wrapper);
    selection.removeAllRanges();
    selection.addRange(nextRange);
    savedRangeRef.current = nextRange.cloneRange();
    emitChange();
  };

  const insertLinkTag = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (
      !editor ||
      !selection ||
      selection.rangeCount === 0 ||
      selection.isCollapsed
    ) {
      return;
    }

    const url = window.prompt("Enter the link URL");
    if (!url) return;

    const range = selection.getRangeAt(0);
    const safeUrl = /^(https?:|mailto:|tel:|\/)/i.test(url) ? url : `https://${url}`;
    const link = document.createElement("a");
    link.setAttribute("href", safeUrl);
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
    link.appendChild(range.extractContents());
    range.insertNode(link);

    const nextRange = document.createRange();
    nextRange.selectNodeContents(link);
    selection.removeAllRanges();
    selection.addRange(nextRange);
    savedRangeRef.current = nextRange.cloneRange();
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
          return (
            <button
              key={button.command}
              type="button"
              className="blog-posts-rich-btn"
              title={button.title}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                runCommand(button.command);
              }}
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
        onMouseUp={captureSelection}
        onKeyUp={captureSelection}
        onFocus={captureSelection}
        style={{ minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight }}
      />
    </div>
  );
}
