"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  const { blogPosts, fetchBlogPostImage } = useUser();
  const [coverImage, setCoverImage] = useState("");

  const slug = decodeURIComponent(params?.slug || "");

  const post = useMemo(() => {
    return (
      (blogPosts || []).find(
        (blogPost) => blogPost.published === true && blogPost.slug === slug,
      ) || null
    );
  }, [blogPosts, slug]);

  useEffect(() => {
    let cancelled = false;

    const loadCover = async () => {
      if (!post?.id || !post?.coverImageId) {
        setCoverImage("");
        return;
      }

      const image = await fetchBlogPostImage(post.id, post.coverImageId);
      if (cancelled) return;
      setCoverImage(image?.base64 || "");
    };

    loadCover();

    return () => {
      cancelled = true;
    };
  }, [post?.id, post?.coverImageId]);

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
            {renderParagraphs(post.content).map((paragraph, index) => (
              <p key={`${post.id}_paragraph_${index}`}>{paragraph}</p>
            ))}
          </article>
        </div>
      </section>

      <Footer />
    </div>
  );
}
