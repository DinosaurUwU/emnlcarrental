"use client";

import React from "react";
import "./blog.css";

export const renderParagraphs = (content = "") => {
  return String(content || "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
};

const renderInlineFormatting = (text = "", keyBase = "inline") => {
  const source = String(text || "");
  const pattern =
    /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*)/g;

  const nodes = [];
  let lastIndex = 0;
  let match;
  let segmentIndex = 0;

  while ((match = pattern.exec(source)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(source.slice(lastIndex, match.index));
    }

    if (match[2] && match[3]) {
      nodes.push(
        <a
          key={`${keyBase}_link_${segmentIndex}`}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
        >
          {match[2]}
        </a>,
      );
    } else if (match[4]) {
      nodes.push(
        <strong key={`${keyBase}_bold_${segmentIndex}`}>{match[4]}</strong>,
      );
    } else if (match[5]) {
      nodes.push(
        <u key={`${keyBase}_underline_${segmentIndex}`}>{match[5]}</u>,
      );
    } else if (match[6]) {
      nodes.push(<em key={`${keyBase}_italic_${segmentIndex}`}>{match[6]}</em>);
    }

    lastIndex = pattern.lastIndex;
    segmentIndex += 1;
  }

  if (lastIndex < source.length) {
    nodes.push(source.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : source;
};

export const isRichHtmlContent = (value = "") =>
  /<\/?[a-z][\s\S]*>/i.test(String(value || ""));

export const sanitizeRichHtml = (value = "") => {
  const source = String(value || "").trim();
  if (!source) return "";

  if (typeof window === "undefined") {
    return source;
  }

  const parser = new window.DOMParser();
  const doc = parser.parseFromString(source, "text/html");
  const allowedTags = new Set([
    "A",
    "B",
    "BR",
    "DIV",
    "EM",
    "I",
    "LI",
    "OL",
    "P",
    "STRONG",
    "U",
    "UL",
  ]);

  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent || "");
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return document.createTextNode("");
    }

    const tagName = node.tagName.toUpperCase();

    if (!allowedTags.has(tagName)) {
      const fragment = document.createDocumentFragment();
      Array.from(node.childNodes).forEach((child) => {
        fragment.appendChild(walk(child));
      });
      return fragment;
    }

    const cleanNode = document.createElement(tagName.toLowerCase());

    if (tagName === "A") {
      const href = node.getAttribute("href") || "";
      const safeHref = /^(https?:|mailto:|tel:|\/)/i.test(href) ? href : "#";

      cleanNode.setAttribute("href", safeHref);
      cleanNode.setAttribute("target", "_blank");
      cleanNode.setAttribute("rel", "noopener noreferrer");
    }

    Array.from(node.childNodes).forEach((child) => {
      cleanNode.appendChild(walk(child));
    });

    return cleanNode;
  };

  const wrapper = document.createElement("div");
  Array.from(doc.body.childNodes).forEach((child) => {
    wrapper.appendChild(walk(child));
  });

  return wrapper.innerHTML;
};

export const RichTextContent = ({
  value = "",
  inline = false,
  className = "",
}) => {
  const source = String(value || "").trim();
  if (!source) return null;

  if (isRichHtmlContent(source)) {
    const Tag = inline ? "span" : "div";
    return (
      <Tag
        className={className}
        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(source) }}
      />
    );
  }

  if (inline) {
    return <span className={className}>{renderInlineFormatting(source)}</span>;
  }

  return (
    <div className={className}>
      {renderParagraphs(source).map((segment, segmentIndex) => {
        const lines = segment
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        const isBulletList =
          lines.length > 0 && lines.every((line) => /^[-*]\s+/.test(line));

        if (isBulletList) {
          return (
            <ul key={`legacy_list_${segmentIndex}`} className="blog-rich-list">
              {lines.map((line, lineIndex) => (
                <li key={`legacy_item_${segmentIndex}_${lineIndex}`}>
                  {renderInlineFormatting(line.replace(/^[-*]\s+/, ""))}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`legacy_paragraph_${segmentIndex}`}>
            {renderInlineFormatting(segment)}
          </p>
        );
      })}
    </div>
  );
};

const BlogArticleRenderer = ({ post, postImages = {}, className = "" }) => {
  const hasBlocks =
    Array.isArray(post?.contentBlocks) && post.contentBlocks.length > 0;

  return (
    <article className={`blog-detail-content ${className}`.trim()}>
      {hasBlocks ? (
        post.contentBlocks.map((block, index) => {
          if (block.type === "heading") {
            return (
              <h2
                key={block.id || `${post.id || "preview"}_heading_${index}`}
                className="blog-block-heading"
                style={{ textAlign: "left" }}
              >
                <RichTextContent value={block.text} inline />
              </h2>
            );
          }

          if (block.type === "image") {
            const image = postImages[block.imageId];

            if (!image?.base64) {
              return null;
            }

            return (
              <figure
                key={block.id || `${post.id || "preview"}_image_${index}`}
                className="blog-block-image"
              >
                <img
                  src={image.base64}
                  alt={
                    image.altText || block.caption || post.title || "Blog image"
                  }
                />
                {block.caption && (
                  <figcaption>
                    <RichTextContent value={block.caption} inline />
                  </figcaption>
                )}
              </figure>
            );
          }

          if (block.type === "split") {
            const image = postImages[block.imageId];
            const splitPosition =
              block.imagePosition === "right" ? "right" : "left";

            return (
              <section
                key={block.id || `${post.id || "preview"}_split_${index}`}
                className={`blog-block-split ${splitPosition}`}
              >
                <div className="blog-block-split-media">
                  {image?.base64 ? (
                    <figure className="blog-block-split-figure">
                      <img
                        src={image.base64}
                        alt={
                          image.altText ||
                          block.caption ||
                          block.title ||
                          post.title ||
                          "Blog image"
                        }
                      />
                      {block.caption && (
                        <figcaption>
                          <RichTextContent value={block.caption} inline />
                        </figcaption>
                      )}
                    </figure>
                  ) : (
                    <div className="blog-block-split-placeholder">
                      Image not available
                    </div>
                  )}
                </div>

                <div className="blog-block-split-copy">
                  {block.title && (
                    <h2>
                      <RichTextContent value={block.title} inline />
                    </h2>
                  )}
                  <RichTextContent value={block.text} />
                </div>
              </section>
            );
          }

          return (
            <RichTextContent
              key={block.id || `${post.id || "preview"}_paragraph_${index}`}
              value={block.text}
            />
          );
        })
      ) : (
        <RichTextContent value={post?.content} />
      )}
    </article>
  );
};

export default React.memo(BlogArticleRenderer);
