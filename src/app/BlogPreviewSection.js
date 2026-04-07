"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "./lib/UserContext";
import { RichTextContent } from "./blog/BlogArticleRenderer";
import "./BlogPreviewSection.css";

const formatBlogDate = (value) => {
  if (!value) return "";

  try {
    const date =
      typeof value?.toDate === "function"
        ? value.toDate()
        : value instanceof Date
          ? value
          : null;

    if (!date) return "";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const getPublicDateLabel = (post = {}) => {
  const publishedText = formatBlogDate(post?.publishedAt);
  const updatedText = formatBlogDate(post?.updatedAt);

  if (publishedText && updatedText && publishedText !== updatedText) {
    return `Updated ${updatedText}`;
  }

  if (publishedText) {
    return `Published ${publishedText}`;
  }

  if (updatedText) {
    return `Updated ${updatedText}`;
  }

  return "";
};

const BlogPreviewSection = () => {
  const { blogPosts, fetchBlogPostImage } = useUser();
  const [coverImages, setCoverImages] = useState({});

  const publishedPosts = useMemo(() => {
    return [...(blogPosts || [])]
      .filter((post) => post.published === true && post.hidden !== true)
      .slice(0, 3);
  }, [blogPosts]);

  useEffect(() => {
    let cancelled = false;

    const loadCovers = async () => {
      const entries = await Promise.all(
        publishedPosts.map(async (post) => {
          if (!post?.id || !post?.coverImageId) {
            return [post.id, ""];
          }

          const image = await fetchBlogPostImage(post.id, post.coverImageId);
          return [post.id, image?.base64 || ""];
        }),
      );

      if (cancelled) return;

      setCoverImages(Object.fromEntries(entries));
    };

    loadCovers();

    return () => {
      cancelled = true;
    };
  }, [publishedPosts]);

  if (publishedPosts.length === 0) {
    return null;
  }

  return (
    <section className="blog-preview-section">
      <div className="blog-preview-bg">
      <div className="blog-preview-header">
        <div>
          <span className="blog-preview-kicker">Travel Journal</span>
          <h2>Latest Blog Posts</h2>
          <p>
            Helpful guides, rental tips, and local travel content from EMNL Car
            Rental.
          </p>
        </div>

        <Link href="/blog" className="blog-preview-link">
          View All Articles
        </Link>
      </div>

      <div className="blog-preview-grid">
        {publishedPosts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="blog-preview-card"
          >
            <div className="blog-preview-card-image-wrap">
              {coverImages[post.id] ? (
                <img
                  src={coverImages[post.id]}
                  alt={post.title || "Blog cover"}
                  className="blog-preview-card-image"
                />
              ) : (
                <div className="blog-preview-card-placeholder">EMNL</div>
              )}
            </div>

            <div className="blog-preview-card-body">
              <div className="blog-preview-card-meta">
                <span>{getPublicDateLabel(post)}</span>
                <div className="blog-preview-author-row">
                  <img
                    src="/assets/profile.png"
                    alt="EMNL Car Rental Services"
                    className="blog-preview-author-avatar"
                  />
                  <span>By EMNL Car Rental Services</span>
                </div>
              </div>
              <h3>{post.title || "Untitled Post"}</h3>
              <RichTextContent
                value={post.excerpt || "Read the full article for more details."}
                className="blog-preview-card-excerpt"
              />
              <span className="blog-preview-readmore">Read More</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="blog-preview-footer">
        <div className="blog-preview-footer-copy">
          <span className="blog-preview-footer-kicker">More Reads</span>
          <h3>Explore More Travel Guides And Rental Tips</h3>
          <p>
            Browse the rest of our articles for booking advice, destination ideas,
            and practical rental information.
          </p>
        </div>

        <Link href="/blog" className="blog-preview-footer-link">
          View Other Blogs
        </Link>
      </div>
      </div>
    </section>
  );
};

export default BlogPreviewSection;
