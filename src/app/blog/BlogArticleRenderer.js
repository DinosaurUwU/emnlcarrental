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
      nodes.push(<strong key={`${keyBase}_bold_${segmentIndex}`}>{match[4]}</strong>);
    } else if (match[5]) {
      nodes.push(<u key={`${keyBase}_underline_${segmentIndex}`}>{match[5]}</u>);
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

const renderRichTextBlocks = (content = "", keyBase = "block") => {
  return renderParagraphs(content).map((segment, segmentIndex) => {
    const lines = segment
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const isBulletList =
      lines.length > 0 && lines.every((line) => /^[-*]\s+/.test(line));

    if (isBulletList) {
      return (
        <ul key={`${keyBase}_list_${segmentIndex}`} className="blog-rich-list">
          {lines.map((line, lineIndex) => (
            <li key={`${keyBase}_item_${segmentIndex}_${lineIndex}`}>
              {renderInlineFormatting(
                line.replace(/^[-*]\s+/, ""),
                `${keyBase}_item_${segmentIndex}_${lineIndex}`,
              )}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p key={`${keyBase}_paragraph_${segmentIndex}`}>
        {renderInlineFormatting(segment, `${keyBase}_paragraph_${segmentIndex}`)}
      </p>
    );
  });
};

const BlogArticleRenderer = ({ post, postImages = {}, className = "" }) => {
  const hasBlocks =
    Array.isArray(post?.contentBlocks) && post.contentBlocks.length > 0;

  return (
    <article className={`blog-detail-content ${className}`.trim()}>
      {hasBlocks
        ? post.contentBlocks.map((block, index) => {
            if (block.type === "heading") {
              return (
                <h2
                  key={block.id || `${post.id || "preview"}_heading_${index}`}
                  className="blog-block-heading"
                >
                  {renderInlineFormatting(
                    block.text,
                    `${block.id || `${post.id || "preview"}_heading_${index}`}_heading`,
                  )}
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
                    alt={image.altText || block.caption || post.title || "Blog image"}
                  />
                  {block.caption && (
                    <figcaption>
                      {renderInlineFormatting(
                        block.caption,
                        `${block.id || `${post.id || "preview"}_image_${index}`}_caption`,
                      )}
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
                        {block.caption && <figcaption>{block.caption}</figcaption>}
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
                        {renderInlineFormatting(
                          block.title,
                          `${block.id || `${post.id || "preview"}_split_${index}`}_title`,
                        )}
                      </h2>
                    )}
                    {renderRichTextBlocks(
                      block.text,
                      `${block.id || `${post.id || "preview"}_split_${index}`}_copy`,
                    )}
                  </div>
                </section>
              );
            }

            return renderRichTextBlocks(
              block.text,
              block.id || `${post.id || "preview"}_paragraph_${index}`,
            );
          })
        : renderRichTextBlocks(post?.content, `${post.id || "preview"}_content`)}
    </article>
  );
};

export default React.memo(BlogArticleRenderer);
