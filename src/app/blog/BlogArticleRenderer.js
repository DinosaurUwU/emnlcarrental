"use client";

import React from "react";
import "./blog.css";

export const renderParagraphs = (content = "") => {
  return String(content || "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
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
                  {block.text}
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
                  {block.caption && <figcaption>{block.caption}</figcaption>}
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
                    {block.title && <h2>{block.title}</h2>}
                    {renderParagraphs(block.text).map((paragraph, paragraphIndex) => (
                      <p
                        key={`${
                          block.id || `${post.id || "preview"}_split_${index}`
                        }_paragraph_${paragraphIndex}`}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              );
            }

            return (
              <p key={block.id || `${post.id || "preview"}_paragraph_${index}`}>
                {block.text}
              </p>
            );
          })
        : renderParagraphs(post?.content).map((paragraph, index) => (
            <p key={`${post.id || "preview"}_paragraph_${index}`}>{paragraph}</p>
          ))}
    </article>
  );
};

export default React.memo(BlogArticleRenderer);
