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
  historyMode = "native",
}) {
  const useGroupedHistory = historyMode === "grouped";
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const historyRef = useRef([]);
  const futureRef = useRef([]);
  const currentValueRef = useRef(normalizeEditorHtml(value));
  const lastInputAtRef = useRef(0);
  const isApplyingHistoryRef = useRef(false);

  const editorClassName = useMemo(
    () =>
      `blog-posts-rich-editor ${singleLine ? "single-line" : ""} ${className}`.trim(),
    [className, singleLine],
  );

  // useEffect(() => {
  //   const editor = editorRef.current;
  //   if (!editor) return;

  //   const normalizedIncoming = normalizeEditorHtml(value);
  //   const normalizedCurrent = normalizeEditorHtml(editor.innerHTML);

  //   if (normalizedIncoming !== normalizedCurrent) {
  //     editor.innerHTML = normalizedIncoming;
  //   }

  //   if (useGroupedHistory && normalizedIncoming !== currentValueRef.current) {
  //     currentValueRef.current = normalizedIncoming;
  //     historyRef.current = [normalizedIncoming];
  //     futureRef.current = [];
  //     lastInputAtRef.current = 0;
  //   }
  // }, [useGroupedHistory, value]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const normalizedIncoming = normalizeEditorHtml(value);
    const normalizedCurrent = normalizeEditorHtml(editor.innerHTML);

    // If incoming is empty, explicitly clear the editor to ensure placeholder shows
    if (normalizedIncoming === "") {
      editor.innerHTML = "";
    } else if (normalizedIncoming !== normalizedCurrent) {
      editor.innerHTML = normalizedIncoming;
    }

    if (useGroupedHistory && normalizedIncoming !== currentValueRef.current) {
      currentValueRef.current = normalizedIncoming;
      historyRef.current = [normalizedIncoming];
      futureRef.current = [];
      lastInputAtRef.current = 0;
    }
  }, [useGroupedHistory, value]);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor || typeof onChange !== "function") return;
    const nextValue = normalizeEditorHtml(editor.innerHTML);
    currentValueRef.current = nextValue;
    onChange(nextValue);
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

  const moveCaretToEnd = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);

    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
    savedRangeRef.current = range.cloneRange();
  };

  const pushHistoryCheckpoint = (snapshot) => {
    const normalizedSnapshot = normalizeEditorHtml(snapshot);
    const lastEntry = historyRef.current[historyRef.current.length - 1];

    if (lastEntry === normalizedSnapshot) {
      return;
    }

    historyRef.current.push(normalizedSnapshot);

    if (historyRef.current.length > 100) {
      historyRef.current.shift();
    }
  };

  const applySnapshot = (snapshot) => {
    const editor = editorRef.current;
    if (!editor) return;

    isApplyingHistoryRef.current = true;
    editor.innerHTML = normalizeEditorHtml(snapshot);
    moveCaretToEnd();
    emitChange();
    isApplyingHistoryRef.current = false;
  };

  const handleUndo = () => {
    if (historyRef.current.length === 0) return;

    const currentSnapshot = currentValueRef.current;
    const previousSnapshot = historyRef.current.pop();

    if (typeof previousSnapshot !== "string") {
      return;
    }

    futureRef.current.push(currentSnapshot);
    applySnapshot(previousSnapshot);
  };

  const handleRedo = () => {
    if (futureRef.current.length === 0) return;

    const nextSnapshot = futureRef.current.pop();
    pushHistoryCheckpoint(currentValueRef.current);
    applySnapshot(nextSnapshot);
  };

  const runCommand = (command) => {
    if (command === "undo") {
      if (!useGroupedHistory) {
        document.execCommand("undo", false, null);
        emitChange();
        return;
      }

      handleUndo();
      return;
    }

    if (command === "redo") {
      if (!useGroupedHistory) {
        document.execCommand("redo", false, null);
        emitChange();
        return;
      }

      handleRedo();
      return;
    }

    focusEditor();
    restoreSelection();
    if (useGroupedHistory) {
      pushHistoryCheckpoint(currentValueRef.current);
      futureRef.current = [];
    }

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
    const startTag = getClosestFormatNode(
      range.startContainer,
      tagName,
      editor,
    );
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
    const safeUrl = /^(https?:|mailto:|tel:|\/)/i.test(url)
      ? url
      : `https://${url}`;
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

    if (useGroupedHistory) {
      pushHistoryCheckpoint(currentValueRef.current);
      futureRef.current = [];
    }
    emitChange();
  };

  const handleKeyDown = (event) => {
    const isUndo =
      (event.ctrlKey || event.metaKey) &&
      !event.shiftKey &&
      event.key.toLowerCase() === "z";
    const isRedo =
      (event.ctrlKey || event.metaKey) &&
      (event.key.toLowerCase() === "y" ||
        (event.shiftKey && event.key.toLowerCase() === "z"));

    if (isUndo) {
      if (!useGroupedHistory) {
        return;
      }

      event.preventDefault();
      handleUndo();
      return;
    }

    if (isRedo) {
      if (!useGroupedHistory) {
        return;
      }

      event.preventDefault();
      handleRedo();
      return;
    }

    if (singleLine && event.key === "Enter") {
      event.preventDefault();
    }
  };

  const handleInput = () => {
    if (!useGroupedHistory) {
      emitChange();
      return;
    }

    if (isApplyingHistoryRef.current) return;

    const now = Date.now();
    const editor = editorRef.current;
    if (!editor) return;

    const nextValue = normalizeEditorHtml(editor.innerHTML);

    if (now - lastInputAtRef.current > 900) {
      pushHistoryCheckpoint(currentValueRef.current);
    }

    lastInputAtRef.current = now;
    futureRef.current = [];
    emitChange();
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
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onMouseUp={captureSelection}
        onKeyUp={captureSelection}
        onFocus={captureSelection}
        style={{
          minHeight:
            typeof minHeight === "number" ? `${minHeight}px` : minHeight,
        }}
      />
    </div>
  );
}
