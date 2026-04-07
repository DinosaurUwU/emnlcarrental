"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "../../component/Header";
import Footer from "../../component/Footer";
import { useBooking } from "../../component/BookingProvider";
import { useUser } from "../../lib/UserContext";
import BlogArticleRenderer, { RichTextContent } from "../BlogArticleRenderer";
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

export default function BlogPostPage({ params }) {
  const { openBooking } = useBooking();
  const { blogPosts, fetchBlogPostImages, fetchBlogPostImage } = useUser();
  const [postImages, setPostImages] = useState({});
  const [relatedCoverImages, setRelatedCoverImages] = useState({});
  const resolvedParams = use(params);

  const slug = decodeURIComponent(resolvedParams?.slug || "");

  const post = useMemo(() => {
    return (
      (blogPosts || []).find(
        (blogPost) =>
          blogPost.published === true &&
          blogPost.hidden !== true &&
          blogPost.slug === slug,
      ) || null
    );
  }, [blogPosts, slug]);

  const relatedPosts = useMemo(() => {
    return [...(blogPosts || [])]
      .filter(
        (blogPost) =>
          blogPost.published === true &&
          blogPost.hidden !== true &&
          blogPost.slug !== slug,
      )
      .slice(0, 3);
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

  useEffect(() => {
    let cancelled = false;

    const loadRelatedCovers = async () => {
      const entries = await Promise.all(
        relatedPosts.map(async (relatedPost) => {
          if (!relatedPost?.id || !relatedPost?.coverImageId) {
            return [relatedPost.id, ""];
          }

          const image = await fetchBlogPostImage(
            relatedPost.id,
            relatedPost.coverImageId,
          );

          return [relatedPost.id, image?.base64 || ""];
        }),
      );

      if (cancelled) return;

      setRelatedCoverImages(Object.fromEntries(entries));
    };

    loadRelatedCovers();

    return () => {
      cancelled = true;
    };
  }, [fetchBlogPostImage, relatedPosts]);

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
            <div className="blog-detail-meta">
              <span className="blog-detail-date">
                {getPublicDateLabel(post)}
              </span>
              <div className="blog-author-row blog-detail-author-row">
                <img
                  src="/assets/profile.png"
                  alt="EMNL Car Rental Services"
                  className="blog-author-avatar"
                />
                <span className="blog-detail-author">By EMNL Car Rental Services</span>
              </div>
            </div>
            <h1>{post.title}</h1>
            {post.excerpt && (
              <RichTextContent
                value={post.excerpt}
                className="blog-detail-excerpt"
              />
            )}
          </div>

          {coverImage && (
            <div className="blog-detail-cover">
              <img src={coverImage} alt={post.title || "Blog cover"} />
            </div>
          )}

          <BlogArticleRenderer post={post} postImages={postImages} />

          {relatedPosts.length > 0 && (
            <section className="blog-related-section">
              <div className="blog-related-header">
                <span className="blog-related-kicker">Read More</span>
                <h2>More Articles You Might Like</h2>
                <p>
                  Keep exploring travel guides, booking tips, and practical rental
                  advice from EMNL Car Rental.
                </p>
              </div>

              <div className="blog-related-grid">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    href={`/blog/${relatedPost.slug}`}
                    className="blog-list-card blog-related-card"
                  >
                    <div className="blog-list-card-image-wrap">
                      {relatedCoverImages[relatedPost.id] ? (
                        <img
                          src={relatedCoverImages[relatedPost.id]}
                          alt={relatedPost.title || "Blog cover"}
                          className="blog-list-card-image"
                        />
                      ) : (
                        <div className="blog-list-card-placeholder">EMNL</div>
                      )}
                    </div>

                    <div className="blog-list-card-body">
                      <span className="blog-list-card-date">
                        {getPublicDateLabel(relatedPost)}
                      </span>
                      <div className="blog-author-row">
                        <img
                          src="/assets/profile.png"
                          alt="EMNL Car Rental Services"
                          className="blog-author-avatar"
                        />
                        <span className="blog-list-card-date blog-list-card-author">
                          By EMNL Car Rental Services
                        </span>
                      </div>
                      <h2>{relatedPost.title || "Untitled Post"}</h2>
                      <RichTextContent
                        value={
                          relatedPost.excerpt ||
                          "Read the full article for more details."
                        }
                        className="blog-list-card-excerpt"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
