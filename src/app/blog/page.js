"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "../component/Header";
import Footer from "../component/Footer";
import { useBooking } from "../component/BookingProvider";
import { useUser } from "../lib/UserContext";
import { RichTextContent } from "./BlogArticleRenderer";
import "../component/Footer.css";
import "./blog.css";

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

export default function BlogPage() {
  const { openBooking } = useBooking();
  const { blogPosts, fetchBlogPostImage } = useUser();
  const [coverImages, setCoverImages] = useState({});

  const publishedPosts = useMemo(() => {
    return [...(blogPosts || [])].filter((post) => post.published === true);
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

  return (
    <div className="blog-page">
      <Header openBooking={openBooking} />

      <section className="blog-hero">
        <div className="blog-hero-inner">
          <span className="blog-hero-kicker">EMNL Articles</span>
          <h1>Travel Tips, Rental Guides, and Local Insights</h1>
          <p>
            Browse practical articles designed to help customers plan their trip
            and choose the right rental vehicle.
          </p>
        </div>
      </section>

      <section className="blog-list-section">
        <div className="blog-list-grid">
          {publishedPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="blog-list-card"
            >
              <div className="blog-list-card-image-wrap">
                {coverImages[post.id] ? (
                  <img
                    src={coverImages[post.id]}
                    alt={post.title || "Blog cover"}
                    className="blog-list-card-image"
                  />
                ) : (
                  <div className="blog-list-card-placeholder">EMNL</div>
                )}
              </div>

              <div className="blog-list-card-body">
                <span className="blog-list-card-date">
                  {getPublicDateLabel(post)}
                </span>
                <span className="blog-list-card-date blog-list-card-author">
                  By EMNL Car Rental Services
                </span>
                <h2>{post.title || "Untitled Post"}</h2>
                <RichTextContent
                  value={post.excerpt || "Read the full article for more details."}
                  className="blog-list-card-excerpt"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
