"use client";

import React, { useMemo, useState } from "react";
import "./BlogPosts.css";

const initialDraft = {
  title: "",
  slug: "",
  excerpt: "",
  seoTitle: "",
  seoDescription: "",
  published: false,
};

const BlogPosts = ({ subSection = "overview" }) => {
  const [draft, setDraft] = useState(initialDraft);

  const draftChecklist = useMemo(() => {
    return [
      {
        label: "Post title",
        done: Boolean(draft.title.trim()),
      },
      {
        label: "URL slug",
        done: Boolean(draft.slug.trim()),
      },
      {
        label: "Short excerpt",
        done: Boolean(draft.excerpt.trim()),
      },
      {
        label: "SEO title",
        done: Boolean(draft.seoTitle.trim()),
      },
      {
        label: "SEO description",
        done: Boolean(draft.seoDescription.trim()),
      },
    ];
  }, [draft]);

  if (subSection !== "overview") {
    return null;
  }

  return (
    <section className="blog-posts-section">
      <h2 className="section-title">Blog Posts</h2>

      <div className="blog-posts-layout">
        <div className="blog-posts-sidebar">
          <div className="blog-posts-panel">
            <div className="blog-posts-panel-header">
              <h3>Posts</h3>
              <button
                type="button"
                className="blog-posts-primary-btn"
                onClick={() => setDraft(initialDraft)}
              >
                New Post
              </button>
            </div>

            <div className="blog-posts-empty-state">
              <p>No blog posts yet.</p>
              <span>
                We will add Firestore-backed drafts, publishing, and post
                thumbnails in the next slice.
              </span>
            </div>
          </div>

          <div className="blog-posts-panel">
            <div className="blog-posts-panel-header">
              <h3>Checklist</h3>
            </div>

            <div className="blog-posts-checklist">
              {draftChecklist.map((item) => (
                <div
                  key={item.label}
                  className={`blog-posts-checklist-item ${
                    item.done ? "done" : ""
                  }`}
                >
                  <span className="blog-posts-check-indicator" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="blog-posts-editor">
          <div className="blog-posts-panel">
            <div className="blog-posts-panel-header">
              <h3>Post Editor</h3>
              <div className="blog-posts-status-pill">
                {draft.published ? "Published" : "Draft"}
              </div>
            </div>

            <div className="blog-posts-form-grid">
              <label className="blog-posts-field">
                <span>Post Title</span>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="How to Rent a Car in Dumaguete"
                />
              </label>

              <label className="blog-posts-field">
                <span>Slug</span>
                <input
                  type="text"
                  value={draft.slug}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="how-to-rent-a-car-in-dumaguete"
                />
              </label>

              <label className="blog-posts-field blog-posts-field-full">
                <span>Excerpt</span>
                <textarea
                  rows="4"
                  value={draft.excerpt}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, excerpt: e.target.value }))
                  }
                  placeholder="Short preview text for the landing page and blog list."
                />
              </label>

              <label className="blog-posts-field">
                <span>SEO Title</span>
                <input
                  type="text"
                  value={draft.seoTitle}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, seoTitle: e.target.value }))
                  }
                  placeholder="How to Rent a Car in Dumaguete | EMNL Car Rental"
                />
              </label>

              <label className="blog-posts-field">
                <span>SEO Description</span>
                <textarea
                  rows="4"
                  value={draft.seoDescription}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      seoDescription: e.target.value,
                    }))
                  }
                  placeholder="A concise search result description for this article."
                />
              </label>
            </div>

            <div className="blog-posts-actions">
              <button type="button" className="blog-posts-secondary-btn">
                Save Draft
              </button>
              <button type="button" className="blog-posts-primary-btn">
                Publish
              </button>
            </div>
          </div>

          <div className="blog-posts-panel">
            <div className="blog-posts-panel-header">
              <h3>Planned Next</h3>
            </div>

            <div className="blog-posts-roadmap">
              <div className="blog-posts-roadmap-item">
                Firestore `blogPosts` collection with draft and publish status.
              </div>
              <div className="blog-posts-roadmap-item">
                Per-post `images` subcollection for cover and inline assets.
              </div>
              <div className="blog-posts-roadmap-item">
                Public landing previews and `/blog/[slug]` detail pages.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(BlogPosts);
