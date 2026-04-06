"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "../../component/Header";
import Footer from "../../component/Footer";
import { useBooking } from "../../component/BookingProvider";
import { useUser } from "../../lib/UserContext";
import "../../component/Footer.css";
import "../blog.css";

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
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const renderParagraphs = (content = "") => {
  return String(content || "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
};

export default function BlogPostPage({ params }) {
  const { openBooking } = useBooking();
  const { blogPosts, fetchBlogPostImages } = useUser();
  const [postImages, setPostImages] = useState({});
  const resolvedParams = use(params);

  const slug = decodeURIComponent(resolvedParams?.slug || "");

  const post = useMemo(() => {
    return (
      (blogPosts || []).find(
        (blogPost) => blogPost.published === true && blogPost.slug === slug,
      ) || null
    );
  }, [blogPosts, slug]);

  useEffect(() => {
    let cancelled = false;

    const loadImages = async () => {
      if (!post?.id) {
        setPostImages({});
        return;
      }

      const images = await fetchBlogPostImages(post.id);
      if (cancelled) return;

      setPostImages(
        Object.fromEntries(
          (images || []).map((image) => [image.id, image]),
        ),
      );
    };

    loadImages();

    return () => {
      cancelled = true;
    };
  }, [post?.id]);

  if (!post) {
    return (
      <div className="blog-page">
        <Header openBooking={openBooking} />
        <section className="blog-detail-section">
          <div className="blog-detail-container">
            <Link href="/blog" className="blog-back-link">
              Back to Articles
            </Link>
            <div className="blog-not-found">
              <h1>Article not found</h1>
              <p>The blog post you are trying to open is not available.</p>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const coverImage = post.coverImageId ? postImages[post.coverImageId]?.base64 : "";
  const hasBlocks =
    Array.isArray(post.contentBlocks) && post.contentBlocks.length > 0;

  return (
    <div className="blog-page">
      <Header openBooking={openBooking} />

      <section className="blog-detail-section">
        <div className="blog-detail-container">
          <Link href="/blog" className="blog-back-link">
            Back to Articles
          </Link>

          <div className="blog-detail-header">
            <span className="blog-detail-date">
              {formatBlogDate(post.publishedAt || post.updatedAt)}
            </span>
            <h1>{post.title}</h1>
            {post.excerpt && <p className="blog-detail-excerpt">{post.excerpt}</p>}
          </div>

          {coverImage && (
            <div className="blog-detail-cover">
              <img src={coverImage} alt={post.title || "Blog cover"} />
            </div>
          )}

          <article className="blog-detail-content">
            {hasBlocks
              ? post.contentBlocks.map((block, index) => {
                  if (block.type === "heading") {
                    return (
                      <h2 key={block.id || `${post.id}_heading_${index}`} className="blog-block-heading">
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
                        key={block.id || `${post.id}_image_${index}`}
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

                  return (
                    <p key={block.id || `${post.id}_paragraph_${index}`}>
                      {block.text}
                    </p>
                  );
                })
              : renderParagraphs(post.content).map((paragraph, index) => (
                  <p key={`${post.id}_paragraph_${index}`}>{paragraph}</p>
                ))}
          </article>
        </div>
      </section>

      <Footer />
    </div>
  );
}
