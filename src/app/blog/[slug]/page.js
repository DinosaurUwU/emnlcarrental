"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "../../component/Header";
import Footer from "../../component/Footer";
import { useBooking } from "../../component/BookingProvider";
import { useUser } from "../../lib/UserContext";
import BlogArticleRenderer from "../BlogArticleRenderer";
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

          <BlogArticleRenderer post={post} postImages={postImages} />
        </div>
      </section>

      <Footer />
    </div>
  );
}
