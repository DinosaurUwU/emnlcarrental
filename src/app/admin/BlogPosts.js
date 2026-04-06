"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "../lib/UserContext";
import "./BlogPosts.css";

const initialDraft = {
  id: "",
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  seoTitle: "",
  seoDescription: "",
  coverImageId: "",
  published: false,
  contentBlocks: [],
};

const mapPostToDraft = (post = {}) => ({
  id: post.id || "",
  title: post.title || "",
  slug: post.slug || "",
  excerpt: post.excerpt || "",
  content: post.content || "",
  seoTitle: post.seoTitle || "",
  seoDescription: post.seoDescription || "",
  coverImageId: post.coverImageId || "",
  published: Boolean(post.published),
  contentBlocks: Array.isArray(post.contentBlocks) ? post.contentBlocks : [],
});

const formatFirestoreDate = (value) => {
  if (!value) return "Not saved yet";

  try {
    const date =
      typeof value?.toDate === "function"
        ? value.toDate()
        : value instanceof Date
          ? value
          : null;

    if (!date) return "Not saved yet";

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Not saved yet";
  }
};

const BlogPosts = ({ subSection = "overview" }) => {
  const {
    blogPosts,
    saveBlogPostDraft,
    deleteBlogPost,
    uploadBlogPostImage,
    fetchBlogPostImages,
    fetchBlogPostImage,
    showActionOverlay,
  } = useUser();

  const [selectedPostId, setSelectedPostId] = useState("");
  const [draft, setDraft] = useState(initialDraft);
  const [coverImagePreview, setCoverImagePreview] = useState("");
  const [postImages, setPostImages] = useState([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const coverInputRef = useRef(null);

  const selectedPost = useMemo(() => {
    return blogPosts.find((post) => post.id === selectedPostId) || null;
  }, [blogPosts, selectedPostId]);

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
        label: "Body content",
        done: Boolean(draft.content.trim()),
      },
      {
        label: "SEO title",
        done: Boolean(draft.seoTitle.trim()),
      },
      {
        label: "SEO description",
        done: Boolean(draft.seoDescription.trim()),
      },
      {
        label: "Cover image",
        done: Boolean(draft.coverImageId),
      },
    ];
  }, [draft]);

  useEffect(() => {
    if (!selectedPost) return;
    setDraft(mapPostToDraft(selectedPost));
  }, [selectedPost]);

  useEffect(() => {
    let cancelled = false;

    const loadAssets = async () => {
      if (!draft.id) {
        setCoverImagePreview("");
        setPostImages([]);
        return;
      }

      const [images, coverImage] = await Promise.all([
        fetchBlogPostImages(draft.id),
        draft.coverImageId
          ? fetchBlogPostImage(draft.id, draft.coverImageId)
          : Promise.resolve(null),
      ]);

      if (cancelled) return;

      setPostImages(images || []);
      setCoverImagePreview(coverImage?.base64 || "");
    };

    loadAssets();

    return () => {
      cancelled = true;
    };
  }, [draft.id, draft.coverImageId]);

  if (subSection !== "overview") {
    return null;
  }

  const handleStartNewPost = () => {
    setSelectedPostId("");
    setDraft(initialDraft);
    setCoverImagePreview("");
    setPostImages([]);
  };

  const handleSelectPost = (post) => {
    setSelectedPostId(post.id);
    setDraft(mapPostToDraft(post));
  };

  const handleSave = async (publish = false) => {
    setIsSavingDraft(true);

    try {
      const result = await saveBlogPostDraft({
        ...draft,
        published: publish ? true : draft.published,
      });

      if (!result?.success) {
        showActionOverlay({
          message: result?.error || "Failed to save blog post.",
          type: "warning",
        });
        return;
      }

      setSelectedPostId(result.postId);
      setDraft((prev) => ({
        ...prev,
        id: result.postId,
        slug: result.slug,
        published: publish ? true : prev.published,
      }));

      showActionOverlay({
        message: publish ? "Blog post published." : "Draft saved successfully.",
        type: "success",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleDelete = async () => {
    if (!draft.id) return;

    setIsDeletingPost(true);

    try {
      const result = await deleteBlogPost(draft.id);

      if (!result?.success) {
        showActionOverlay({
          message: result?.error || "Failed to delete blog post.",
          type: "warning",
        });
        return;
      }

      handleStartNewPost();

      showActionOverlay({
        message: "Blog post deleted.",
        type: "success",
      });
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);

    try {
      let workingPostId = draft.id;
      let workingSlug = draft.slug;

      if (!workingPostId) {
        const saveResult = await saveBlogPostDraft({
          ...draft,
          published: false,
        });

        if (!saveResult?.success) {
          showActionOverlay({
            message: saveResult?.error || "Save the draft before uploading images.",
            type: "warning",
          });
          return;
        }

        workingPostId = saveResult.postId;
        workingSlug = saveResult.slug;
      }

      const uploadResult = await uploadBlogPostImage(workingPostId, file, "", {
        role: "cover",
        altText: draft.title || "Blog cover image",
      });

      if (!uploadResult?.success) {
        showActionOverlay({
          message: uploadResult?.error || "Failed to upload cover image.",
          type: "warning",
        });
        return;
      }

      const saveResult = await saveBlogPostDraft({
        ...draft,
        id: workingPostId,
        slug: workingSlug,
        coverImageId: uploadResult.imageId,
        published: draft.published,
      });

      if (!saveResult?.success) {
        showActionOverlay({
          message: saveResult?.error || "Cover image uploaded but post update failed.",
          type: "warning",
        });
        return;
      }

      setSelectedPostId(workingPostId);
      setDraft((prev) => ({
        ...prev,
        id: workingPostId,
        slug: workingSlug,
        coverImageId: uploadResult.imageId,
      }));
      setCoverImagePreview(uploadResult.base64 || "");

      showActionOverlay({
        message: "Cover image uploaded.",
        type: "success",
      });
    } finally {
      event.target.value = "";
      setIsUploadingCover(false);
    }
  };

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
                onClick={handleStartNewPost}
              >
                New Post
              </button>
            </div>

            {blogPosts.length === 0 ? (
              <div className="blog-posts-empty-state">
                <p>No blog posts yet.</p>
                <span>Create your first draft from the editor on the right.</span>
              </div>
            ) : (
              <div className="blog-posts-list">
                {blogPosts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    className={`blog-posts-list-item ${
                      selectedPostId === post.id ? "active" : ""
                    }`}
                    onClick={() => handleSelectPost(post)}
                  >
                    <span className="blog-posts-list-title">
                      {post.title || "Untitled Post"}
                    </span>
                    <span className="blog-posts-list-meta">
                      {post.published ? "Published" : "Draft"} |{" "}
                      {formatFirestoreDate(post.updatedAt)}
                    </span>
                  </button>
                ))}
              </div>
            )}
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

          <div className="blog-posts-panel">
            <div className="blog-posts-panel-header">
              <h3>Assets</h3>
            </div>

            <div className="blog-posts-asset-summary">
              <div className="blog-posts-asset-row">
                <span>Saved Images</span>
                <strong>{postImages.length}</strong>
              </div>
              <div className="blog-posts-asset-row">
                <span>Cover Image ID</span>
                <strong>{draft.coverImageId || "None"}</strong>
              </div>
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

              <label className="blog-posts-field blog-posts-field-full">
                <span>Post Content</span>
                <textarea
                  rows="10"
                  value={draft.content}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, content: e.target.value }))
                  }
                  placeholder="Write the article body here. We can split this into structured content blocks in the next slice."
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

            <div className="blog-posts-cover-panel">
              <div className="blog-posts-cover-header">
                <h4>Cover Image</h4>
                <button
                  type="button"
                  className="blog-posts-secondary-btn"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={isUploadingCover}
                >
                  {isUploadingCover ? "Uploading..." : "Upload Cover"}
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  hidden
                />
              </div>

              {coverImagePreview ? (
                <div className="blog-posts-cover-preview">
                  <img src={coverImagePreview} alt="Blog cover preview" />
                </div>
              ) : (
                <div className="blog-posts-cover-placeholder">
                  No cover image uploaded yet.
                </div>
              )}
            </div>

            <div className="blog-posts-actions">
              {draft.id && (
                <button
                  type="button"
                  className="blog-posts-danger-btn"
                  onClick={handleDelete}
                  disabled={isDeletingPost}
                >
                  {isDeletingPost ? "Deleting..." : "Delete Post"}
                </button>
              )}

              <button
                type="button"
                className="blog-posts-secondary-btn"
                onClick={() => handleSave(false)}
                disabled={isSavingDraft}
              >
                {isSavingDraft ? "Saving..." : "Save Draft"}
              </button>
              <button
                type="button"
                className="blog-posts-primary-btn"
                onClick={() => handleSave(true)}
                disabled={isSavingDraft}
              >
                {isSavingDraft
                  ? "Saving..."
                  : draft.published
                    ? "Update Published"
                    : "Publish"}
              </button>
            </div>
          </div>

          <div className="blog-posts-panel">
            <div className="blog-posts-panel-header">
              <h3>Current Post Details</h3>
            </div>

            <div className="blog-posts-roadmap">
              <div className="blog-posts-roadmap-item">
                <strong>Post ID:</strong> {draft.id || "Not created yet"}
              </div>
              <div className="blog-posts-roadmap-item">
                <strong>Slug:</strong> {draft.slug || "Will be generated on save"}
              </div>
              <div className="blog-posts-roadmap-item">
                <strong>Image Storage:</strong> Each post now stores images in
                {" "}
                <code>blogPosts/{"{postId}"}/images/{"{imageId}"}</code>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(BlogPosts);
