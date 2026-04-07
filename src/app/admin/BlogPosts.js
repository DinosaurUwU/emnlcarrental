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
import { useUser } from "../lib/UserContext";
import BlogArticleRenderer, { RichTextContent } from "../blog/BlogArticleRenderer";
import RichTextEditor from "./RichTextEditor";
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
  hidden: false,
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
  hidden: Boolean(post.hidden),
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

const getAdminPostStatusLabel = (post = {}) => {
  if (post?.published && post?.hidden) return "Hidden";
  if (post?.published) return "Published";
  return "Draft";
};

const buildSlugFromTitle = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "untitled-post";

const stripRichTextToPlainText = (value = "") =>
  String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const rentalGuidesPost = {
  title: "Rental Guide: What To Prepare Before Booking A Car In Leyte",
  excerpt:
    "A practical rental guide covering the key things customers should prepare before booking a car in Leyte, from trip details and valid documents to vehicle choice and timing.",
  contentBlocks: [
    {
      ...createBlock("heading"),
      text: "Start With The Basics Before You Send A Booking Request",
    },
    {
      ...createBlock("paragraph"),
      text:
        "A smoother rental experience usually begins before the message is sent. If you already know your travel date, pickup time, drop-off plan, number of passengers, and how much luggage you are bringing, it becomes much easier to choose the right unit and get a clear response quickly. Many booking delays happen because the trip details are still incomplete, so preparing the essentials early saves time for both the customer and the rental team.",
    },
    {
      ...createBlock("image"),
      caption:
        "Add a booking-related visual here, such as a car key, parked rental unit, or travel-preparation image.",
    },
    {
      ...createBlock("split"),
      title: "Bring The Right Documents And Contact Details",
      text:
        "A booking becomes easier to confirm when the basic requirements are already prepared. A valid driver's license, a working mobile number, and accurate contact details should be ready before finalizing the request. If someone else is driving, that should be clarified early as well. Complete information reduces back-and-forth and helps confirm availability, identity, and trip details without unnecessary delay.",
      caption:
        "Use an image here that suggests identity, preparation, or pre-trip confirmation.",
      imagePosition: "right",
    },
    {
      ...createBlock("split"),
      title: "Choose The Vehicle Based On The Trip, Not Only The Price",
      text:
        "The most affordable option is not always the most practical one. A compact unit may work well for solo trips or short city travel, but families, longer drives, or passengers with extra bags may need more room. Before booking, think about comfort, seating, luggage space, and how long the group will stay on the road. Choosing the right vehicle from the beginning usually prevents avoidable stress once the trip is already underway.",
      caption:
        "Add an image of a vehicle interior, luggage space, or passenger-ready setup here.",
      imagePosition: "left",
    },
    {
      ...createBlock("heading"),
      text: "Confirm Timing, Pickup, And Drop-Off Clearly",
    },
    {
      ...createBlock("paragraph"),
      text:
        "Even when a unit is available, a booking can still become confusing if the pickup and return details are vague. Confirm the date, time, location, and expected duration as early as possible. This matters even more for travelers arriving through terminals, ports, or airport connections where timing can affect the schedule. Clear pickup and return details make the whole booking process easier to organize and easier to honor on the actual day.",
    },
    {
      ...createBlock("image"),
      caption:
        "Use an image of a pickup point, parking area, terminal, or arrival setup here.",
    },
    {
      ...createBlock("heading"),
      text: "Book Earlier If The Date Matters",
    },
    {
      ...createBlock("paragraph"),
      text:
        "If the trip falls on a weekend, holiday, school break, or an important family or business date, booking early gives you a better chance of getting the unit that actually fits your needs. Waiting too long can reduce your options and force you to settle for a vehicle that does not match the trip as well. Early booking is one of the simplest ways to keep the process smoother and more predictable.",
    },
    {
      ...createBlock("image"),
      caption:
        "Close with an image that suggests confirmed travel plans, a ready-to-go rental, or a clean departure scene.",
    },
  ],
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
  const [isCreatingRentalGuidesPost, setIsCreatingRentalGuidesPost] = useState(false);
  const [isTogglingHidden, setIsTogglingHidden] = useState(false);
  const [activeEditorView, setActiveEditorView] = useState("editor");
  const coverInputRef = useRef(null);
  const assetInputRef = useRef(null);
  const blockImageInputRefs = useRef({});

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
    const plainExcerpt = stripRichTextToPlainText(draft.excerpt);

    return (
      plainExcerpt ||
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
      authorName: "EMNL Car Rental Services",
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
        done: Boolean(stripRichTextToPlainText(draft.excerpt)),
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

  const replaceDraftState = (nextDraft) => {
    setDraft(JSON.parse(JSON.stringify(nextDraft)));
  };

  const applyDraftChange = (updater) => {
    setDraft((prev) => {
      const next =
        typeof updater === "function" ? updater(prev) : updater;
      return JSON.parse(JSON.stringify(next));
    });
  };

  useEffect(() => {
    if (!selectedPost) return;
    replaceDraftState(mapPostToDraft(selectedPost));
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
    replaceDraftState(initialDraft);
    setCoverImagePreview("");
    setPostImages([]);
  };

  const handleSelectPost = (post) => {
    setSelectedPostId(post.id);
    replaceDraftState(mapPostToDraft(post));
  };

  const updateBlock = (blockId, patch) => {
    applyDraftChange((prev) => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map((block) =>
        block.id === blockId ? { ...block, ...patch } : block,
      ),
    }));
  };

  const updateDraftField = (fieldKey, value) => {
    applyDraftChange((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const updateBlockField = (blockId, fieldKey, value) => {
    applyDraftChange((prev) => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map((block) =>
        block.id === blockId ? { ...block, [fieldKey]: value } : block,
      ),
    }));
  };

  const addBlock = (type) => {
    applyDraftChange((prev) => ({
      ...prev,
      contentBlocks: [...prev.contentBlocks, createBlock(type)],
    }));
  };

  const removeBlock = (blockId) => {
    applyDraftChange((prev) => {
      const nextBlocks = prev.contentBlocks.filter((block) => block.id !== blockId);
      return {
        ...prev,
        contentBlocks: nextBlocks.length > 0 ? nextBlocks : [createBlock("paragraph")],
      };
    });
  };

  const moveBlock = (blockId, direction) => {
    applyDraftChange((prev) => {
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
    applyDraftChange((prev) => ({
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
      replaceDraftState({
        ...draft,
        id: result.postId,
        slug: result.slug,
        published: publish ? true : draft.published,
      });

      showActionOverlay({
        message: publish ? "Blog post published." : "Draft saved successfully.",
        type: "success",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleToggleHidden = async () => {
    if (!draft.id) return;

    setIsTogglingHidden(true);

    try {
      const nextHidden = !draft.hidden;
      const result = await saveBlogPostDraft({
        ...normalizedDraftForSave,
        hidden: nextHidden,
        published: draft.published,
      });

      if (!result?.success) {
        showActionOverlay({
          message: result?.error || "Failed to update post visibility.",
          type: "warning",
        });
        return;
      }

      replaceDraftState({
        ...draft,
        id: result.postId,
        slug: result.slug,
        hidden: nextHidden,
      });

      showActionOverlay({
        message: nextHidden ? "Post hidden from public view." : "Post is public again.",
        type: "success",
      });
    } finally {
      setIsTogglingHidden(false);
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

    applyDraftChange((prev) => ({
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
      applyDraftChange((prev) => ({
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
      applyDraftChange((prev) => ({
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
      applyDraftChange((prev) => ({
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


  const handleCreateRentalGuidesPost = async () => {
    setIsCreatingRentalGuidesPost(true);

    try {
      const result = await saveBlogPostDraft({
        ...rentalGuidesPost,
        published: false,
        coverImageId: "",
      });

      if (!result?.success) {
        showActionOverlay({
          message: result?.error || "Failed to create Rental Guide draft.",
          type: "warning",
        });
        return;
      }

      setSelectedPostId(result.postId);
      replaceDraftState(mapPostToDraft(result.postData));
      setCoverImagePreview("");
      setPostImages([]);
      setActiveEditorView("editor");

      showActionOverlay({
        message:
          "Rental Guide draft created. Upload your chosen images next and assign them to the prepared blocks.",
        type: "success",
      });
    } finally {
      setIsCreatingRentalGuidesPost(false);
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
                  className="blog-posts-secondary-btn blog-posts-btn-orange"
                  onClick={handleCreateRentalGuidesPost}
                  disabled={isCreatingRentalGuidesPost}
                >
                  <span>
                    {isCreatingRentalGuidesPost
                      ? "Creating..."
                      : "Sample Blog"}
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
                      {getAdminPostStatusLabel(post)} |{" "}
                      Updated {formatFirestoreDate(post.updatedAt)}
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
                  draft.published ? (draft.hidden ? "hidden" : "published") : "draft"
                }`}
              >
                {draft.published ? (draft.hidden ? "Hidden" : "Published") : "Draft"}
              </div>
            </div>

            <div className="blog-posts-form-grid">
              <label className="blog-posts-field">
                <span>Post Title</span>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => updateDraftField("title", e.target.value)}
                  placeholder="How to Rent a Car in Leyte"
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

              <div className="blog-posts-field blog-posts-field-full">
                <span>Excerpt</span>
                <RichTextEditor
                  value={draft.excerpt}
                  onChange={(nextValue) => updateDraftField("excerpt", nextValue)}
                  placeholder="Short preview text for the landing page and blog list."
                  minHeight={150}
                />
              </div>

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
                            <div className="blog-posts-field">
                              <span>Section Title</span>
                              <RichTextEditor
                                value={block.title}
                                onChange={(nextValue) =>
                                  updateBlockField(block.id, "title", nextValue)
                                }
                                placeholder="Write a split-section heading"
                                minHeight={64}
                                singleLine
                              />
                            </div>

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

                            <div className="blog-posts-field">
                              <span>Paragraph</span>
                              <RichTextEditor
                                value={block.text}
                                onChange={(nextValue) =>
                                  updateBlockField(block.id, "text", nextValue)
                                }
                                placeholder="Write the text for this split section"
                                minHeight={180}
                              />
                            </div>
                          </>
                        )}

                        <div className="blog-posts-field">
                          <span>Caption</span>
                          <RichTextEditor
                            value={block.caption}
                            onChange={(nextValue) =>
                              updateBlockField(block.id, "caption", nextValue)
                            }
                            placeholder="Optional image caption"
                            minHeight={64}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="blog-posts-field">
                        <span>{block.type === "heading" ? "Heading" : "Paragraph"}</span>
                        <RichTextEditor
                          value={block.text}
                          onChange={(nextValue) =>
                            updateBlockField(block.id, "text", nextValue)
                          }
                          placeholder={
                            block.type === "heading"
                              ? "Write a section heading"
                              : "Write a paragraph"
                          }
                          minHeight={block.type === "heading" ? 84 : 220}
                          singleLine={block.type === "heading"}
                        />
                      </div>
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
              {draft.published && (
                <button
                  type="button"
                  className="blog-posts-secondary-btn blog-posts-btn-orange"
                  onClick={handleToggleHidden}
                  disabled={isTogglingHidden || isSavingDraft}
                >
                  {isTogglingHidden
                    ? "Updating Visibility..."
                    : draft.hidden
                      ? "Show Publicly"
                      : "Hide For Now"}
                </button>
              )}
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
                    <RichTextContent
                      value={previewPost.excerpt}
                      className="blog-detail-excerpt"
                    />
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
