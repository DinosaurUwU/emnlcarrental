"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowDown,
  FiArrowUp,
  FiCheck,
  FiEdit3,
  FiImage,
  FiEye,
  FiTrash2,
  FiType,
  FiUpload,
} from "react-icons/fi";
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatUnderlined,
  MdInsertLink,
} from "react-icons/md";
import { useUser } from "../lib/UserContext";
import BlogArticleRenderer from "../blog/BlogArticleRenderer";
import "./BlogPosts.css";

const createBlock = (type = "paragraph") => ({
  id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  type,
  text: "",
  title: "",
  imageId: "",
  caption: "",
  imagePosition: "left",
});

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
  contentBlocks: [createBlock("paragraph")],
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
  contentBlocks:
    Array.isArray(post.contentBlocks) && post.contentBlocks.length > 0
      ? post.contentBlocks.map((block) => ({
          id: block.id || createBlock(block.type).id,
          type: block.type || "paragraph",
          text: block.text || "",
          title: block.title || "",
          imageId: block.imageId || "",
          caption: block.caption || "",
          imagePosition: block.imagePosition === "right" ? "right" : "left",
        }))
      : [createBlock("paragraph")],
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

const buildSlugFromTitle = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "untitled-post";

const starterBlogPost = {
  title: "How To Rent A Car In Leyte Without Delays",
  excerpt:
    "A practical guide to booking a rental car in Leyte, preparing the right documents, and choosing the right unit for your trip.",
  contentBlocks: [
    createBlock("heading"),
    createBlock("paragraph"),
    createBlock("heading"),
    createBlock("paragraph"),
    createBlock("heading"),
    createBlock("paragraph"),
    createBlock("heading"),
    createBlock("paragraph"),
  ].map((block, index) => {
    const content = [
      {
        text: "Start With Your Travel Plan",
      },
      {
        text:
          "Before booking a car, decide how you will actually use it. A short city trip, an airport pickup, and a longer drive across Leyte need different kinds of vehicles. If you already know how many passengers you have, how much luggage you are bringing, and whether your trip includes mostly urban roads or longer provincial travel, choosing the right unit becomes much easier from the start.",
      },
      {
        text: "Prepare Your Documents Early",
      },
      {
        text:
          "One of the most common causes of booking delays is incomplete information. Prepare your valid driver's license, a working contact number, and your confirmed travel schedule before sending your request. If you are arriving from outside Leyte or coordinating a pickup from a port, terminal, or airport, it helps to confirm your arrival details early so the rental process stays smooth on the day itself.",
      },
      {
        text: "Choose The Right Vehicle, Not Just The Cheapest One",
      },
      {
        text:
          "A smaller unit may be fine for solo travel or quick errands, but it can quickly become uncomfortable for family trips or longer drives. Think about passenger space, luggage room, road conditions, and comfort. If your trip includes multiple stops, intercity travel, or a full day on the road, choosing the right vehicle from the start usually saves more stress than trying to minimize cost at the expense of convenience.",
      },
      {
        text: "Book Early During Busy Travel Dates",
      },
      {
        text:
          "If your trip falls on a holiday weekend, school break, or peak travel period, do not wait until the last minute. Popular units get reserved quickly, especially those suited for families and group travel. Booking early gives you better availability, a better chance of getting the exact unit you need, and more time to coordinate pickup, payment, and any special requests for your Leyte trip.",
      },
    ][index];

    return { ...block, ...content };
  }),
};

const BlogPosts = ({ subSection = "overview" }) => {
  const {
    blogPosts,
    saveBlogPostDraft,
    deleteBlogPost,
    uploadBlogPostImage,
    fetchBlogPostImages,
    fetchBlogPostImage,
    deleteBlogPostImage,
    showActionOverlay,
  } = useUser();

  const [selectedPostId, setSelectedPostId] = useState("");
  const [draft, setDraft] = useState(initialDraft);
  const [coverImagePreview, setCoverImagePreview] = useState("");
  const [postImages, setPostImages] = useState([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAssets, setIsUploadingAssets] = useState(false);
  const [isUploadingBlockImageId, setIsUploadingBlockImageId] = useState("");
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [isDeletingImageId, setIsDeletingImageId] = useState("");
  const [isCreatingStarterPost, setIsCreatingStarterPost] = useState(false);
  const [activeEditorView, setActiveEditorView] = useState("editor");
  const coverInputRef = useRef(null);
  const assetInputRef = useRef(null);
  const blockImageInputRefs = useRef({});
  const richTextInputRefs = useRef({});

  const selectedPost = useMemo(() => {
    return blogPosts.find((post) => post.id === selectedPostId) || null;
  }, [blogPosts, selectedPostId]);

  const autoSlug = useMemo(() => buildSlugFromTitle(draft.title), [draft.title]);
  const autoSeoTitle = useMemo(() => {
    const safeTitle = String(draft.title || "").trim() || "Untitled Post";
    return `${safeTitle} | EMNL Car Rental`;
  }, [draft.title]);
  const autoSeoDescription = useMemo(() => {
    const safeTitle = String(draft.title || "").trim() || "Untitled Post";
    return (
      String(draft.excerpt || "").trim() ||
      `Read ${safeTitle} from EMNL Car Rental.`
    );
  }, [draft.excerpt, draft.title]);

  const normalizedDraftForSave = useMemo(
    () => ({
      ...draft,
      slug: autoSlug,
      seoTitle: autoSeoTitle,
      seoDescription: autoSeoDescription,
    }),
    [draft, autoSeoDescription, autoSeoTitle, autoSlug],
  );

  const postImagesById = useMemo(
    () => Object.fromEntries(postImages.map((image) => [image.id, image])),
    [postImages],
  );

  const postImageLabelMap = useMemo(
    () =>
      new Map(postImages.map((image, index) => [image.id, `Image ${index + 1}`])),
    [postImages],
  );

  const previewPost = useMemo(
    () => ({
      ...normalizedDraftForSave,
      id: draft.id || "preview",
      title: String(draft.title || "").trim() || "Untitled Post",
      excerpt: String(draft.excerpt || "").trim(),
      publishedAt: selectedPost?.publishedAt || selectedPost?.updatedAt || null,
      updatedAt: selectedPost?.updatedAt || null,
    }),
    [draft.excerpt, draft.id, draft.title, normalizedDraftForSave, selectedPost],
  );

  const draftChecklist = useMemo(() => {
    const hasBodyContent =
      Boolean(draft.content.trim()) ||
      draft.contentBlocks.some((block) =>
        block.type === "image"
          ? Boolean(block.imageId)
          : block.type === "split"
            ? Boolean(block.imageId) ||
              Boolean(String(block.title || "").trim()) ||
              Boolean(String(block.text || "").trim())
            : Boolean(String(block.text || "").trim()),
      );

    return [
      {
        label: "Post title",
        done: Boolean(draft.title.trim()),
      },
      {
        label: "URL slug",
        done: Boolean(autoSlug),
      },
      {
        label: "Short excerpt",
        done: Boolean(draft.excerpt.trim()),
      },
      {
        label: "Body content",
        done: hasBodyContent,
      },
      {
        label: "SEO title",
        done: Boolean(autoSeoTitle.trim()),
      },
      {
        label: "SEO description",
        done: Boolean(autoSeoDescription.trim()),
      },
      {
        label: "Cover image",
        done: Boolean(draft.coverImageId),
      },
    ];
  }, [autoSeoDescription, autoSeoTitle, autoSlug, draft]);

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

  const updateBlock = (blockId, patch) => {
    setDraft((prev) => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map((block) =>
        block.id === blockId ? { ...block, ...patch } : block,
      ),
    }));
  };

  const addBlock = (type) => {
    setDraft((prev) => ({
      ...prev,
      contentBlocks: [...prev.contentBlocks, createBlock(type)],
    }));
  };

  const removeBlock = (blockId) => {
    setDraft((prev) => {
      const nextBlocks = prev.contentBlocks.filter((block) => block.id !== blockId);
      return {
        ...prev,
        contentBlocks: nextBlocks.length > 0 ? nextBlocks : [createBlock("paragraph")],
      };
    });
  };

  const moveBlock = (blockId, direction) => {
    setDraft((prev) => {
      const index = prev.contentBlocks.findIndex((block) => block.id === blockId);
      if (index < 0) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.contentBlocks.length) {
        return prev;
      }

      const nextBlocks = [...prev.contentBlocks];
      const [movedBlock] = nextBlocks.splice(index, 1);
      nextBlocks.splice(targetIndex, 0, movedBlock);

      return {
        ...prev,
        contentBlocks: nextBlocks,
      };
    });
  };

  const savePostIdIfNeeded = async () => {
    if (draft.id) {
      return { success: true, postId: draft.id, slug: autoSlug };
    }

    const result = await saveBlogPostDraft({
      ...normalizedDraftForSave,
      published: false,
    });

    if (!result?.success) {
      return result;
    }

    setSelectedPostId(result.postId);
    setDraft((prev) => ({
      ...prev,
      id: result.postId,
      slug: result.slug,
    }));

    return result;
  };

  const handleSave = async (publish = false) => {
    setIsSavingDraft(true);

    try {
      const result = await saveBlogPostDraft({
        ...normalizedDraftForSave,
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

  const handleSetCoverImage = async (imageId) => {
    const result = await saveBlogPostDraft({
      ...normalizedDraftForSave,
      coverImageId: imageId,
    });

    if (!result?.success) {
      showActionOverlay({
        message: result?.error || "Failed to update cover image.",
        type: "warning",
      });
      return;
    }

    setDraft((prev) => ({
      ...prev,
      id: result.postId,
      slug: result.slug,
      coverImageId: imageId,
    }));

    showActionOverlay({
      message: "Cover image updated.",
      type: "success",
    });
  };

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);

    try {
      const postResult = await savePostIdIfNeeded();

      if (!postResult?.success) {
        showActionOverlay({
          message: postResult?.error || "Save the draft before uploading images.",
          type: "warning",
        });
        return;
      }

      const uploadResult = await uploadBlogPostImage(postResult.postId, file, "", {
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
        ...normalizedDraftForSave,
        id: postResult.postId,
        slug: postResult.slug,
        coverImageId: uploadResult.imageId,
      });

      if (!saveResult?.success) {
        showActionOverlay({
          message: saveResult?.error || "Cover image uploaded but post update failed.",
          type: "warning",
        });
        return;
      }

      if (
        draft.coverImageId &&
        draft.coverImageId !== uploadResult.imageId
      ) {
        await deleteBlogPostImage(postResult.postId, draft.coverImageId);
      }

      setSelectedPostId(postResult.postId);
      setDraft((prev) => ({
        ...prev,
        id: postResult.postId,
        slug: postResult.slug,
        coverImageId: uploadResult.imageId,
      }));
      setCoverImagePreview(uploadResult.base64 || "");
      const refreshedImages = await fetchBlogPostImages(postResult.postId);
      setPostImages(refreshedImages || []);

      showActionOverlay({
        message: "Cover image uploaded.",
        type: "success",
      });
    } finally {
      event.target.value = "";
      setIsUploadingCover(false);
    }
  };

  const handleAssetUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsUploadingAssets(true);

    try {
      const postResult = await savePostIdIfNeeded();

      if (!postResult?.success) {
        showActionOverlay({
          message: postResult?.error || "Save the draft before uploading images.",
          type: "warning",
        });
        return;
      }

      const results = await Promise.all(
        files.map((file) =>
          uploadBlogPostImage(postResult.postId, file, "", {
            role: "inline",
            altText: draft.title || "Blog image",
          }),
        ),
      );

      const failedUpload = results.find((result) => !result?.success);
      if (failedUpload) {
        showActionOverlay({
          message: failedUpload?.error || "One or more images failed to upload.",
          type: "warning",
        });
      }

      const refreshedImages = await fetchBlogPostImages(postResult.postId);
      setPostImages(refreshedImages || []);

      showActionOverlay({
        message: `${results.filter((result) => result?.success).length} image(s) uploaded.`,
        type: "success",
      });
    } finally {
      event.target.value = "";
      setIsUploadingAssets(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!draft.id || !imageId) return;

    setIsDeletingImageId(imageId);

    try {
      const result = await deleteBlogPostImage(draft.id, imageId);

      if (!result?.success) {
        showActionOverlay({
          message: result?.error || "Failed to delete image.",
          type: "warning",
        });
        return;
      }

      setPostImages((prev) => prev.filter((image) => image.id !== imageId));
      setDraft((prev) => ({
        ...prev,
        coverImageId: prev.coverImageId === imageId ? "" : prev.coverImageId,
        contentBlocks: prev.contentBlocks.map((block) =>
          block.imageId === imageId ? { ...block, imageId: "" } : block,
        ),
      }));

      if (draft.coverImageId === imageId) {
        setCoverImagePreview("");
      }

      showActionOverlay({
        message: "Image deleted.",
        type: "success",
      });
    } finally {
      setIsDeletingImageId("");
    }
  };

  const handleBlockImageUpload = async (blockId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingBlockImageId(blockId);

    try {
      const postResult = await savePostIdIfNeeded();

      if (!postResult?.success) {
        showActionOverlay({
          message: postResult?.error || "Save the draft before uploading images.",
          type: "warning",
        });
        return;
      }

      const uploadResult = await uploadBlogPostImage(postResult.postId, file, "", {
        role: "inline",
        altText: draft.title || "Blog image",
      });

      if (!uploadResult?.success) {
        showActionOverlay({
          message: uploadResult?.error || "Failed to upload block image.",
          type: "warning",
        });
        return;
      }

      const refreshedImages = await fetchBlogPostImages(postResult.postId);
      setPostImages(refreshedImages || []);
      setSelectedPostId(postResult.postId);
      setDraft((prev) => ({
        ...prev,
        id: postResult.postId,
        slug: postResult.slug,
        contentBlocks: prev.contentBlocks.map((block) =>
          block.id === blockId
            ? { ...block, imageId: uploadResult.imageId }
            : block,
        ),
      }));

      showActionOverlay({
        message: "Image uploaded to block.",
        type: "success",
      });
    } finally {
      event.target.value = "";
      setIsUploadingBlockImageId("");
    }
  };

  const setRichTextInputRef = (fieldKey) => (node) => {
    if (node) {
      richTextInputRefs.current[fieldKey] = node;
    } else {
      delete richTextInputRefs.current[fieldKey];
    }
  };

  const applyRichTextFormat = (fieldKey, currentValue, onChangeValue, formatType) => {
    const input = richTextInputRefs.current[fieldKey];
    const safeValue = String(currentValue || "");
    const selectionStart = input?.selectionStart ?? safeValue.length;
    const selectionEnd = input?.selectionEnd ?? safeValue.length;
    const selectedText = safeValue.slice(selectionStart, selectionEnd);

    let replacement = "";

    if (formatType === "bold") {
      replacement = `**${selectedText || "bold text"}**`;
    } else if (formatType === "italic") {
      replacement = `*${selectedText || "italic text"}*`;
    } else if (formatType === "underline") {
      replacement = `__${selectedText || "underlined text"}__`;
    } else if (formatType === "list") {
      const baseText = selectedText || "List item";
      replacement = baseText
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return "";
          return `- ${trimmed.replace(/^[-*]\s+/, "")}`;
        })
        .join("\n");
    } else if (formatType === "link") {
      const url =
        window.prompt("Enter the full URL for this link:", "https://") || "";
      const safeUrl = url.trim();
      if (!safeUrl) return;
      replacement = `[${selectedText || "link text"}](${safeUrl})`;
    }

    const nextValue =
      safeValue.slice(0, selectionStart) +
      replacement +
      safeValue.slice(selectionEnd);

    onChangeValue(nextValue);

    window.setTimeout(() => {
      const nextInput = richTextInputRefs.current[fieldKey];
      if (!nextInput) return;

      const cursorPosition = selectionStart + replacement.length;
      nextInput.focus();
      nextInput.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  };

  const renderFormatToolbar = (fieldKey, currentValue, onChangeValue) => (
    <div className="blog-posts-format-toolbar">
      <button
        type="button"
        className="blog-posts-format-btn"
        title="Bold"
        onClick={() =>
          applyRichTextFormat(fieldKey, currentValue, onChangeValue, "bold")
        }
      >
        <MdFormatBold />
      </button>
      <button
        type="button"
        className="blog-posts-format-btn"
        title="Italic"
        onClick={() =>
          applyRichTextFormat(fieldKey, currentValue, onChangeValue, "italic")
        }
      >
        <MdFormatItalic />
      </button>
      <button
        type="button"
        className="blog-posts-format-btn"
        title="Underline"
        onClick={() =>
          applyRichTextFormat(fieldKey, currentValue, onChangeValue, "underline")
        }
      >
        <MdFormatUnderlined />
      </button>
      <button
        type="button"
        className="blog-posts-format-btn"
        title="Bullet List"
        onClick={() =>
          applyRichTextFormat(fieldKey, currentValue, onChangeValue, "list")
        }
      >
        <MdFormatListBulleted />
      </button>
      <button
        type="button"
        className="blog-posts-format-btn"
        title="Insert Link"
        onClick={() =>
          applyRichTextFormat(fieldKey, currentValue, onChangeValue, "link")
        }
      >
        <MdInsertLink />
      </button>
    </div>
  );

  const handleCreateStarterPost = async () => {
    setIsCreatingStarterPost(true);

    try {
      const result = await saveBlogPostDraft({
        ...starterBlogPost,
        published: true,
        coverImageId: "",
      });

      if (!result?.success) {
        showActionOverlay({
          message: result?.error || "Failed to create starter blog post.",
          type: "warning",
        });
        return;
      }

      setSelectedPostId(result.postId);
      setDraft(mapPostToDraft(result.postData));
      setCoverImagePreview("");
      setPostImages([]);
      setActiveEditorView("editor");

      showActionOverlay({
        message: "Starter blog post created and published.",
        type: "success",
      });
    } finally {
      setIsCreatingStarterPost(false);
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
              <div className="blog-posts-panel-header-actions">
                <button
                  type="button"
                  className="blog-posts-secondary-btn blog-posts-btn-blue"
                  onClick={handleCreateStarterPost}
                  disabled={isCreatingStarterPost}
                >
                  <span>
                    {isCreatingStarterPost
                      ? "Creating..."
                      : "Create Starter Post"}
                  </span>
                </button>
                <button
                  type="button"
                  className="blog-posts-primary-btn"
                  onClick={handleStartNewPost}
                >
                  New Post
                </button>
              </div>
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
              <div className="blog-posts-cover-header-actions">
                <button
                  type="button"
                  className="blog-posts-secondary-btn"
                  onClick={() => assetInputRef.current?.click()}
                  disabled={isUploadingAssets}
                >
                  <FiUpload />
                  <span>
                    {isUploadingAssets ? "Uploading..." : "Upload Images"}
                  </span>
                </button>
              </div>
              <input
                ref={assetInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleAssetUpload}
                hidden
              />
            </div>

            <div className="blog-posts-asset-summary">
              <div className="blog-posts-asset-row">
                <span>Saved Images</span>
                <strong>{postImages.length}</strong>
              </div>
              <div className="blog-posts-asset-row">
                <span>Cover Image ID</span>
                <strong>
                  {draft.coverImageId
                    ? postImageLabelMap.get(draft.coverImageId) || "Cover image"
                    : "None"}
                </strong>
              </div>
            </div>

            {postImages.length > 0 && (
              <div className="blog-posts-asset-grid">
                {postImages.map((image) => (
                  <div key={image.id} className="blog-posts-asset-card">
                    <div className="blog-posts-asset-card-image-wrap">
                      <img
                        src={image.base64}
                        alt={image.fileName || image.id}
                        className="blog-posts-asset-card-image"
                      />
                    </div>

                    <div className="blog-posts-asset-card-body">
                      <div className="blog-posts-asset-card-id">
                        {postImageLabelMap.get(image.id) || image.id}
                      </div>
                      <div className="blog-posts-asset-card-meta">
                        {image.fileName || image.id}
                      </div>
                      <div className="blog-posts-asset-card-actions">
                        <button
                          type="button"
                          className={`blog-posts-icon-btn ${
                            draft.coverImageId === image.id ? "active" : ""
                          }`}
                          onClick={() => handleSetCoverImage(image.id)}
                          title={
                            draft.coverImageId === image.id
                              ? "Current cover image"
                              : "Set as cover image"
                          }
                        >
                          <FiCheck />
                        </button>
                        <button
                          type="button"
                          className="blog-posts-icon-btn delete"
                          onClick={() => handleDeleteImage(image.id)}
                          disabled={isDeletingImageId === image.id}
                          title="Delete image"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="blog-posts-editor">
          <div className="blog-posts-view-toggle">
            <button
              type="button"
              className={`blog-posts-view-toggle-btn ${
                activeEditorView === "editor" ? "active" : ""
              }`}
              onClick={() => setActiveEditorView("editor")}
            >
              <FiEdit3 />
              <span>Editor</span>
            </button>
            <button
              type="button"
              className={`blog-posts-view-toggle-btn ${
                activeEditorView === "preview" ? "active" : ""
              }`}
              onClick={() => setActiveEditorView("preview")}
            >
              <FiEye />
              <span>Preview</span>
            </button>
          </div>

          {activeEditorView === "editor" ? (
          <div className="blog-posts-panel">
            <div className="blog-posts-panel-header">
              <h3>Post Editor</h3>
              <div
                className={`blog-posts-status-pill ${
                  draft.published ? "published" : "draft"
                }`}
              >
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
                  value={autoSlug}
                  readOnly
                  placeholder="Generated from the title"
                />
                <small className="blog-posts-field-note">
                  Generated automatically from the post title.
                </small>
              </label>

              <label className="blog-posts-field blog-posts-field-full">
                <span>Excerpt</span>
                {renderFormatToolbar("draft-excerpt", draft.excerpt, (nextValue) =>
                  setDraft((prev) => ({ ...prev, excerpt: nextValue }))
                )}
                <textarea
                  ref={setRichTextInputRef("draft-excerpt")}
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
                  value={autoSeoTitle}
                  readOnly
                  placeholder="Generated automatically"
                />
                <small className="blog-posts-field-note">
                  Generated automatically from the title.
                </small>
              </label>

              <label className="blog-posts-field">
                <span>SEO Description</span>
                <textarea
                  rows="4"
                  value={autoSeoDescription}
                  readOnly
                  placeholder="Generated automatically"
                />
                <small className="blog-posts-field-note">
                  Generated automatically from the excerpt.
                </small>
              </label>
            </div>

            <div className="blog-posts-cover-panel">
              <div className="blog-posts-cover-header">
                <h4>Cover Image</h4>
                <div className="blog-posts-cover-header-actions">
                  <button
                    type="button"
                    className="blog-posts-secondary-btn blog-posts-btn-violet"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isUploadingCover}
                  >
                    <FiUpload />
                    <span>
                      {isUploadingCover ? "Uploading..." : "Upload Cover"}
                    </span>
                  </button>
                </div>
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

            <div className="blog-posts-blocks-panel">
              <div className="blog-posts-cover-header">
                <h4>Content Blocks</h4>
                <div className="blog-posts-block-actions">
                  <button
                    type="button"
                    className="blog-posts-secondary-btn blog-posts-btn-orange"
                    onClick={() => addBlock("heading")}
                  >
                    <FiType />
                    <span>Add Heading</span>
                  </button>
                  <button
                    type="button"
                    className="blog-posts-secondary-btn blog-posts-btn-blue"
                    onClick={() => addBlock("paragraph")}
                  >
                    <FiType />
                    <span>Add Paragraph</span>
                  </button>
                  <button
                    type="button"
                    className="blog-posts-secondary-btn blog-posts-btn-neon"
                    onClick={() => addBlock("image")}
                  >
                    <FiImage />
                    <span>Add Image</span>
                  </button>
                  <button
                    type="button"
                    className="blog-posts-secondary-btn blog-posts-btn-violet"
                    onClick={() => addBlock("split")}
                  >
                    <FiType />
                    <span>Add Split Section</span>
                  </button>
                </div>
              </div>

              <div className="blog-posts-block-list">
                {draft.contentBlocks.map((block, index) => (
                  <div
                    key={block.id}
                    className={`blog-posts-block-card blog-posts-block-card-${block.type}`}
                  >
                    <div className="blog-posts-block-toolbar">
                      <span className="blog-posts-block-label">
                        {block.type.toUpperCase()} #{index + 1}
                      </span>

                      <div className="blog-posts-block-toolbar-actions">
                        <button
                          type="button"
                          className="blog-posts-icon-btn"
                          onClick={() => moveBlock(block.id, "up")}
                          disabled={index === 0}
                          title="Move block up"
                        >
                          <FiArrowUp />
                        </button>
                        <button
                          type="button"
                          className="blog-posts-icon-btn"
                          onClick={() => moveBlock(block.id, "down")}
                          disabled={index === draft.contentBlocks.length - 1}
                          title="Move block down"
                        >
                          <FiArrowDown />
                        </button>
                        <button
                          type="button"
                          className="blog-posts-icon-btn delete"
                          onClick={() => removeBlock(block.id)}
                          title="Remove block"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>

                    {block.type === "image" || block.type === "split" ? (
                      <>
                        <div className="blog-posts-block-image-shell">
                          <input
                            ref={(node) => {
                              if (node) {
                                blockImageInputRefs.current[block.id] = node;
                              } else {
                                delete blockImageInputRefs.current[block.id];
                              }
                            }}
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(event) =>
                              handleBlockImageUpload(block.id, event)
                            }
                          />

                          <div className="blog-posts-block-image-preview">
                            {postImagesById[block.imageId]?.base64 ? (
                              <img
                                src={postImagesById[block.imageId].base64}
                                alt={
                                  postImagesById[block.imageId].altText ||
                                  postImageLabelMap.get(block.imageId) ||
                                  "Blog image"
                                }
                              />
                            ) : (
                              <div className="blog-posts-block-image-placeholder">
                                <FiImage />
                                <span>Upload an image for this block</span>
                              </div>
                            )}
                          </div>

                          <div className="blog-posts-block-image-meta">
                            <span className="blog-posts-block-image-name">
                              {block.imageId
                                ? postImageLabelMap.get(block.imageId) ||
                                  "Saved image"
                                : block.type === "split"
                                  ? "No split image selected"
                                  : "No image selected"}
                            </span>
                            <button
                              type="button"
                              className="blog-posts-secondary-btn blog-posts-btn-violet blog-posts-inline-btn"
                              onClick={() =>
                                blockImageInputRefs.current[block.id]?.click()
                              }
                              disabled={isUploadingBlockImageId === block.id}
                            >
                              <FiUpload />
                              <span>
                                {isUploadingBlockImageId === block.id
                                  ? "Uploading..."
                                  : block.imageId
                                    ? "Replace Image"
                                    : "Upload Image"}
                              </span>
                            </button>
                          </div>
                        </div>

                        <label className="blog-posts-field">
                          <span>
                            {block.type === "split"
                              ? "Split Image"
                              : "Reuse Saved Image"}
                          </span>
                          <select
                            value={block.imageId}
                            onChange={(e) =>
                              updateBlock(block.id, { imageId: e.target.value })
                            }
                          >
                            <option value="">Select an uploaded image</option>
                            {postImages.map((image) => (
                              <option key={image.id} value={image.id}>
                                {postImageLabelMap.get(image.id) || image.id}
                              </option>
                            ))}
                          </select>
                        </label>

                        {block.type === "split" && (
                          <>
                            <label className="blog-posts-field">
                              <span>Section Title</span>
                              {renderFormatToolbar(
                                `block-${block.id}-title`,
                                block.title,
                                (nextValue) =>
                                  updateBlock(block.id, {
                                    title: nextValue,
                                  }),
                              )}
                              <input
                                ref={setRichTextInputRef(`block-${block.id}-title`)}
                                type="text"
                                value={block.title}
                                onChange={(e) =>
                                  updateBlock(block.id, {
                                    title: e.target.value,
                                  })
                                }
                                placeholder="Write a split-section heading"
                              />
                            </label>

                            <label className="blog-posts-field">
                              <span>Layout</span>
                              <div className="blog-posts-split-toggle">
                                <button
                                  type="button"
                                  className={`blog-posts-split-toggle-btn ${
                                    block.imagePosition !== "right"
                                      ? "active"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    updateBlock(block.id, {
                                      imagePosition: "left",
                                    })
                                  }
                                >
                                  Image Left
                                </button>
                                <button
                                  type="button"
                                  className={`blog-posts-split-toggle-btn ${
                                    block.imagePosition === "right"
                                      ? "active"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    updateBlock(block.id, {
                                      imagePosition: "right",
                                    })
                                  }
                                >
                                  Image Right
                                </button>
                              </div>
                            </label>

                            <label className="blog-posts-field">
                              <span>Paragraph</span>
                              {renderFormatToolbar(
                                `block-${block.id}-text`,
                                block.text,
                                (nextValue) =>
                                  updateBlock(block.id, { text: nextValue }),
                              )}
                              <textarea
                                ref={setRichTextInputRef(`block-${block.id}-text`)}
                                rows="5"
                                value={block.text}
                                onChange={(e) =>
                                  updateBlock(block.id, { text: e.target.value })
                                }
                                placeholder="Write the text for this split section"
                              />
                            </label>
                          </>
                        )}

                        <label className="blog-posts-field">
                          <span>Caption</span>
                          {renderFormatToolbar(
                            `block-${block.id}-caption`,
                            block.caption,
                            (nextValue) =>
                              updateBlock(block.id, { caption: nextValue }),
                          )}
                          <input
                            ref={setRichTextInputRef(`block-${block.id}-caption`)}
                            type="text"
                            value={block.caption}
                            onChange={(e) =>
                              updateBlock(block.id, { caption: e.target.value })
                            }
                            placeholder="Optional image caption"
                          />
                        </label>
                      </>
                    ) : (
                      <label className="blog-posts-field">
                        <span>{block.type === "heading" ? "Heading" : "Paragraph"}</span>
                        {renderFormatToolbar(
                          `block-${block.id}-text`,
                          block.text,
                          (nextValue) =>
                            updateBlock(block.id, { text: nextValue }),
                        )}
                        <textarea
                          ref={setRichTextInputRef(`block-${block.id}-text`)}
                          rows={block.type === "heading" ? 3 : 6}
                          value={block.text}
                          onChange={(e) =>
                            updateBlock(block.id, { text: e.target.value })
                          }
                          placeholder={
                            block.type === "heading"
                              ? "Write a section heading"
                              : "Write a paragraph"
                          }
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
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
          ) : (
            <div className="blog-posts-panel blog-posts-preview-panel">
              <div className="blog-posts-panel-header">
                <h3>Live Preview</h3>
                <div className="blog-posts-status-pill draft">
                  Unsaved Changes Included
                </div>
              </div>

              <div className="blog-posts-preview-shell">
                <div className="blog-detail-header blog-posts-preview-header">
                  <span className="blog-detail-date">
                    Preview Mode
                  </span>
                  <h1>{previewPost.title}</h1>
                  {previewPost.excerpt && (
                    <p className="blog-detail-excerpt">{previewPost.excerpt}</p>
                  )}
                </div>

                {coverImagePreview ? (
                  <div className="blog-detail-cover blog-posts-preview-cover">
                    <img
                      src={coverImagePreview}
                      alt={previewPost.title || "Blog cover preview"}
                    />
                  </div>
                ) : (
                  <div className="blog-posts-preview-cover-placeholder">
                    Cover image preview will appear here.
                  </div>
                )}

                <BlogArticleRenderer
                  post={previewPost}
                  postImages={postImagesById}
                  className="blog-posts-preview-content"
                />
              </div>
            </div>
          )}

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
                <strong>Blocks:</strong> {draft.contentBlocks.length}
              </div>
              <div className="blog-posts-roadmap-item">
                <strong>Image Storage:</strong> Each post now stores images in{" "}
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
