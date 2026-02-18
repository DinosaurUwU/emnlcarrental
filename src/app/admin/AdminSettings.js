"use client";
//AdminSettings.js
import React, { useState, useRef, useEffect, useMemo } from "react";
import "./AdminSettings.css";
import { useUser } from "../lib/UserContext";
import { MdClose } from "react-icons/md";

const AdminSettings = ({ subSection = "overview" }) => {
  const {
    unitData,
    allUnitData,
    completedBookingsAnalytics,
    updateUnitData,
    mopTypes,
    setMopTypes,
    popTypesRevenue,
    popTypesExpense,
    setPopTypesRevenue,
    setPopTypesExpense,
    referralSources,
    setReferralSources,
    revenueGrid,
    expenseGrid,
    userAccounts,
    activeBookings,
    updateUnitImage,
    imageUpdateTrigger,
    updateUnitGalleryImages,
    deleteImageFromFirestore,
    fetchImageFromFirestore,
    uploadImageToFirestore,
    compressAndConvertToBase64,
    deleteUnit,
    createReview,
    deleteReview,
    updateReview,
    fetchReviews,
    clearImageCache,
    updateImageCache,
  } = useUser();

  const [showAdminError, setShowAdminError] = useState(false);
  const [adminErrorMessage, setAdminErrorMessage] = useState("");

  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [showSaveUnitConfirmDialog, setShowSaveUnitConfirmDialog] =
    useState(false);
  const [pendingUnitSaveAction, setPendingUnitSaveAction] = useState(null); // "add" or "edit"
  const [showDeleteUnitConfirmDialog, setShowDeleteUnitConfirmDialog] =
    useState(false);

  const [isDeletingUnit, setIsDeletingUnit] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [hideDeleteSuccess, setHideDeleteSuccess] = useState(false);

  const [showUnitDetailsOverlay, setShowUnitDetailsOverlay] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");

  const [unitTypeFilter, setUnitTypeFilter] = useState("All");
  const [showUnitTypeDropdown, setShowUnitTypeDropdown] = useState(false);

  const unitTypeDropdownRef = useRef(null);

  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUnit, setEditedUnit] = useState(null);
  const [isSavingUnit, setIsSavingUnit] = useState(false);
  const [showSavedSuccess, setShowSavedSuccess] = useState(false);
  const [hideSavedAnimation, setHideSavedAnimation] = useState(false);
  const [showEditConfirmDialog, setShowEditConfirmDialog] = useState(false);

  const [confirmInput, setConfirmInput] = useState("");
  const [selectedMopPop, setSelectedMopPop] = useState("MOP");

  const [selectedMopType, setSelectedMopType] = useState("");
  const [oldMopType, setOldMopType] = useState("");
  const [showEditMOPConfirmDialog, setShowEditMOPConfirmDialog] =
    useState(false);
  const [isAddingMOP, setIsAddingMOP] = useState(false);
  const [showMOPFinalConfirm, setShowMOPFinalConfirm] = useState(false);
  const [pendingMOPAction, setPendingMOPAction] = useState(null); // "save" | "delete"
  const [isSavingMOP, setIsSavingMOP] = useState(false);
  const [showMOPSuccess, setShowMOPSuccess] = useState(false);
  const [mopSuccessAction, setMOPSuccessAction] = useState(null); // "save" | "delete"
  const [hideMOPSuccessAnimation, setHideMOPSuccessAnimation] = useState(false);

  const [selectedPOPType, setSelectedPOPType] = useState("");
  const [oldPOPType, setOldPOPType] = useState("");
  const [isAddingPOP, setIsAddingPOP] = useState(false);
  const [showEditPOPConfirmDialog, setShowEditPOPConfirmDialog] =
    useState(false);

  const [showPOPFinalConfirm, setShowPOPFinalConfirm] = useState(false);
  const [pendingPOPAction, setPendingPOPAction] = useState(null); // "save" | "delete"
  const [isSavingPOP, setIsSavingPOP] = useState(false);
  const [showPOPSuccess, setShowPOPSuccess] = useState(false);
  const [popSuccessAction, setPOPSuccessAction] = useState(null); // "save" | "delete"
  const [hidePOPSuccessAnimation, setHidePOPSuccessAnimation] = useState(false);

  const [selectedReferral, setSelectedReferral] = useState("");
  const [oldReferral, setOldReferral] = useState("");
  const [isAddingReferral, setIsAddingReferral] = useState(false);
  const [pendingReferralAction, setPendingReferralAction] = useState(null); // "save" | "delete"
  const [showEditReferralConfirmDialog, setShowEditReferralConfirmDialog] =
    useState(false);

  const [showReferralFinalConfirm, setShowReferralFinalConfirm] =
    useState(false);

  const [isSavingReferral, setIsSavingReferral] = useState(false);

  const [showReferralSuccess, setShowReferralSuccess] = useState(false);
  const [referralSuccessAction, setReferralSuccessAction] = useState(null); // "save" | "delete"
  const [hideReferralSuccessAnimation, setHideReferralSuccessAnimation] =
    useState(false);

  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDetailsOverlay, setShowClientDetailsOverlay] =
    useState(false);

  const [clientsSearchTerm, setClientsSearchTerm] = useState("");

  const [showDetailsOverlay, setShowDetailsOverlay] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  const [mainImage, setMainImage] = useState(null);
  const [mainImageLoading, setMainImageLoading] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryImagesLoading, setGalleryImagesLoading] = useState(false);

  const [currentImageType, setCurrentImageType] = useState("main");
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(null);

  const [editedMainImage, setEditedMainImage] = useState(null);
  const [editedGalleryImages, setEditedGalleryImages] = useState([]);

  const [editedMainImageFile, setEditedMainImageFile] = useState(null);
  const [editedGalleryImageFiles, setEditedGalleryImageFiles] = useState([]);

  const [showEditContentConfirmDialog, setShowEditContentConfirmDialog] =
    useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [contentImages, setContentImages] = useState({
    landing: [
      "/assets/images/default.png",
      "/assets/images/default.png",
      "/assets/images/default.png",
      "/assets/images/default.png",
      "/assets/images/default.png",
    ],
    fleet: [
      "/assets/images/default.png",
      "/assets/images/default.png",
      "/assets/images/default.png",
      "/assets/images/default.png",
      "/assets/images/default.png",
    ],
    about: ["/assets/images/default.png"],
    contact: ["/assets/images/default.png"],
  });

  const [contentImageFiles, setContentImageFiles] = useState({
    landing: [null, null, null, null, null],
    fleet: [null, null, null, null, null],
    about: [null],
    contact: [null],
  });

  const [currentContentPage, setCurrentContentPage] = useState("landing");
  const [currentContentIndex, setCurrentContentIndex] = useState(null);

  const contentFileInputRef = useRef(null);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [showContentSavedSuccess, setShowContentSavedSuccess] = useState(false);
  const [hideContentSavedAnimation, setHideContentSavedAnimation] =
    useState(false);
  const [showSaveContentConfirmDialog, setShowSaveContentConfirmDialog] =
    useState(false);

  const [originalContentImages, setOriginalContentImages] = useState({
    landing: [
      "/assets/images/default.png",
      "/assets/images/default.png",
      "/assets/images/default.png",
      "/assets/images/default.png",
      "/assets/images/default.png",
    ],
    fleet: [
      "/assets/images/default.png",
      "/assets/images/default.png",
      "/assets/images/default.png",
      "/assets/images/default.png",
      "/assets/images/default.png",
    ],
    about: ["/assets/images/default.png"],
    contact: ["/assets/images/default.png"],
  });

  const [reviews, setReviews] = useState([]);

  const [showSettings, setShowSettings] = useState(false);
  //SCROLL RELATED
  const scrollYRef = useRef(0);

  /* ReviewBox component */
  function ReviewBox({ text }) {
    const ref = useRef(null);
    const [canScrollUp, setCanScrollUp] = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;

      const update = () => {
        const isScrollable = el.scrollHeight > el.clientHeight;
        setCanScrollUp(isScrollable && el.scrollTop > 0);
        setCanScrollDown(
          isScrollable && el.scrollTop + el.clientHeight < el.scrollHeight,
        );
      };

      requestAnimationFrame(update);

      el.addEventListener("scroll", update);
      window.addEventListener("resize", update);
      return () => {
        el.removeEventListener("scroll", update);
        window.removeEventListener("resize", update);
      };
    }, [text]);

    return (
      <div className="review-wrapper">
        <span className="quote-icon">“</span>
        <p className="review" ref={ref}>
          {text}
        </p>
        <div className={`scroll-indicator top ${canScrollUp ? "" : "hidden"}`}>
          ▲
        </div>
        <div
          className={`scroll-indicator bottom ${canScrollDown ? "" : "hidden"}`}
        >
          ▼
        </div>
      </div>
    );
  }

  const [originalTestimonials, setOriginalTestimonials] = useState([
    {
      id: null,
      img: "/assets/images/default.png",
      name: "Bruce Hardy",
      date: "Jan 15, 2025",
      review: "Great experience!",
      rating: 5,
    },
    {
      id: null,
      img: "/assets/images/default.png",
      name: "Mark Smith",
      date: "Feb 18, 2025",
      review: "Loved the experience!",
      rating: 5,
    },
    {
      id: null,
      img: "/assets/images/default.png",
      name: "Vera Duncan",
      date: "Mar 24, 2025",
      review: "Highly recommended!",
      rating: 5,
    },
    {
      id: null,
      img: "/assets/images/default.png",
      name: "Sophia Lopez",
      date: "Apr 27, 2025",
      review: "Exceptional service!",
      rating: 5,
    },
    {
      id: null,
      img: "/assets/images/default.png",
      name: "Daniel Carter",
      date: "May 31, 2025",
      review: "Great rental options!",
      rating: 4,
    },
  ]);

  const [testimonials, setTestimonials] = useState([...originalTestimonials]);

  const testimonialFileInputRef = useRef(null);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(null);

  const [testimonialImageFiles, setTestimonialImageFiles] = useState(
    new Array(originalTestimonials.length).fill(null),
  );

  const updateTestimonial = (index, field, value) => {
    setTestimonials((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    );
  };

  const addTestimonial = () => {
    const newTestimonial = {
      img: "/assets/images/default.png",
      name: "New Customer",
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      review: "Great experience!",
      rating: 5,
    };
    setTestimonials((prev) => [...prev, newTestimonial]);
    setTestimonialImageFiles((prev) => [...prev, null]);
  };

  const deleteTestimonial = (index) => {
    if (testimonials.length > 5) {
      setTestimonials((prev) => prev.filter((_, i) => i !== index));
      setTestimonialImageFiles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleTestimonialImageChange = (event) => {
    const file = event.target.files[0];
    if (!file || currentTestimonialIndex === null) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      updateTestimonial(currentTestimonialIndex, "img", base64);
      // Store the file for compression on save
      setTestimonialImageFiles((prev) => {
        const newFiles = [...prev];
        newFiles[currentTestimonialIndex] = file;
        return newFiles;
      });
    };
    reader.readAsDataURL(file);

    event.target.value = "";
  };

  const handleSaveReviews = async () => {
    setIsSavingContent(true);
    try {
      for (let i = 0; i < testimonials.length; i++) {
        const testimonial = testimonials[i];
        let imgToSave = testimonial.img;

        // Compress if there's a new file
        if (testimonialImageFiles[i]) {
          const compressed = await compressAndConvertToBase64(
            testimonialImageFiles[i],
          );
          imgToSave = compressed.base64;
        }

        const testimonialToSave = { ...testimonial, img: imgToSave };

        if (testimonial.id) {
          await updateReview(testimonial.id, testimonialToSave);
        } else {
          const result = await createReview(testimonialToSave);
          if (result.success) {
            setTestimonials((prev) =>
              prev.map((t, idx) => (idx === i ? { ...t, id: result.id } : t)),
            );
          } else {
            setAdminErrorMessage(
              `Failed to create review for ${testimonial.name}: ${result.error}`,
            );
            setShowAdminError(true);
          }
        }
      }
      setOriginalTestimonials([...testimonials]);
      setShowContentSavedSuccess(true);
      setIsEditingContent(false);

      // Reset files after save
      setTestimonialImageFiles(new Array(testimonials.length).fill(null));
    } catch (error) {
      setAdminErrorMessage("Save failed: " + error.message);
      setShowAdminError(true);
    } finally {
      setIsSavingContent(false);
    }
  };

  // Load reviews from Firestore on mount
  useEffect(() => {
    const loadReviews = async () => {
      const result = await fetchReviews();
      if (result.success && result.reviews.length > 0) {
        setTestimonials(
          result.reviews.map((review) => ({
            id: review.id,
            img: review.img || "/assets/images/default.png",
            name: review.name,
            date: review.date,
            review: review.review,
            rating: review.rating,
          })),
        );
        setOriginalTestimonials(
          result.reviews.map((review) => ({
            id: review.id,
            img: review.img || "/assets/images/default.png",
            name: review.name,
            date: review.date,
            review: review.review,
            rating: review.rating,
          })),
        );
      } else {
        // Keep the default testimonials as fallback
        setTestimonials([...originalTestimonials]);
      }
    };
    loadReviews();
  }, []);

  //OVERLAY STOP BACKGROUND CLICK AND SCROLL
  useEffect(() => {
    const handleClickOrScroll = (e) => {
      if (
        !showUnitDetailsOverlay &&
        !showEditMOPConfirmDialog &&
        !showEditPOPConfirmDialog &&
        !showEditReferralConfirmDialog &&
        !showClientDetailsOverlay
      ) {
        setShowSettings(false);
      }
    };

    const preventTouch = (e) => {
      if (
        showUnitDetailsOverlay ||
        showEditMOPConfirmDialog ||
        showEditPOPConfirmDialog ||
        showEditReferralConfirmDialog ||
        showClientDetailsOverlay
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("mousedown", handleClickOrScroll);
    document.addEventListener("scroll", handleClickOrScroll);
    document.addEventListener("touchmove", preventTouch, { passive: false });

    if (
      showUnitDetailsOverlay ||
      showEditMOPConfirmDialog ||
      showEditPOPConfirmDialog ||
      showEditReferralConfirmDialog ||
      showClientDetailsOverlay
    ) {
      scrollYRef.current = window.scrollY;
      document.body.classList.add("modal-open");
      document.body.style.top = `-${scrollYRef.current}px`;
    } else {
      document.body.classList.remove("modal-open");
      document.body.style.top = "";
      window.scrollTo(0, scrollYRef.current);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOrScroll);
      document.removeEventListener("scroll", handleClickOrScroll);
      document.removeEventListener("touchmove", preventTouch);
      document.body.classList.remove("modal-open");
      document.body.style.top = "";
    };
  }, [
    showUnitDetailsOverlay,
    showEditMOPConfirmDialog,
    showEditPOPConfirmDialog,
    showEditReferralConfirmDialog,
    showClientDetailsOverlay,
  ]);

  // Close unit type dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        unitTypeDropdownRef.current &&
        !unitTypeDropdownRef.current.contains(e.target)
      ) {
        setShowUnitTypeDropdown(false);
      }
    };

    if (showUnitTypeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUnitTypeDropdown]);

  useEffect(() => {
    if (showSavedSuccess) {
      const timer = setTimeout(() => {
        setHideSavedAnimation(true);
        setTimeout(() => {
          setShowSavedSuccess(false);
          setHideSavedAnimation(false);
        }, 400);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showSavedSuccess]);

  useEffect(() => {
    if (showMOPSuccess) {
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setHideMOPSuccessAnimation(true);
        setTimeout(() => {
          setShowMOPSuccess(false);
          setHideMOPSuccessAnimation(false);
        }, 400);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showMOPSuccess]);

  useEffect(() => {
    if (showPOPSuccess) {
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setHidePOPSuccessAnimation(true);
        setTimeout(() => {
          setShowPOPSuccess(false);
          setHidePOPSuccessAnimation(false);
        }, 400);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showPOPSuccess]);

  useEffect(() => {
    if (showReferralSuccess) {
      const timer = setTimeout(() => {
        setHideReferralSuccessAnimation(true);
        setTimeout(() => {
          setShowReferralSuccess(false);
          setHideReferralSuccessAnimation(false);
        }, 400);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showReferralSuccess]);

  useEffect(() => {
    if (showContentSavedSuccess) {
      const timer = setTimeout(() => {
        setHideContentSavedAnimation(true);
        setTimeout(() => {
          setShowContentSavedSuccess(false);
          setHideContentSavedAnimation(false);
        }, 400);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showContentSavedSuccess]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  // Filter units by search term AND unit type
  const filteredUnitData =
    allUnitData?.filter((car) => {
      // Filter by unit type first
      if (
        unitTypeFilter !== "All" &&
        car.carType?.toUpperCase() !== unitTypeFilter
      ) {
        return false;
      }

      // Then filter by search term
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      const analytics = completedBookingsAnalytics[car.plateNo];
      const bookingsCount = analytics?.bookings?.length || 0;
      return (
        car.name.toLowerCase().includes(search) ||
        car.plateNo.toLowerCase().includes(search) ||
        String(car.owner || "")
          .toLowerCase()
          .includes(search) ||
        car.carType.toLowerCase().includes(search) ||
        String(car.details?.specifications?.Transmission || "")
          .toLowerCase()
          .includes(search) ||
        String(car.details?.specifications?.Fuel || "")
          .toLowerCase()
          .includes(search) ||
        String(car.details?.specifications?.Capacity || "")
          .toLowerCase()
          .includes(search) ||
        String(car.details?.specifications?.Color || "")
          .toLowerCase()
          .includes(search) ||
        bookingsCount.toString().includes(search)
      );
    }) || [];

  // Sorting logic
  const sortedUnitData = [...filteredUnitData].sort((a, b) => {
    let valA, valB;
    switch (sortKey) {
      case "carName":
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
        break;
      case "owner":
        valA = (a.owner || "N/A").toLowerCase();
        valB = (b.owner || "N/A").toLowerCase();
        break;
      case "details":
        valA = a.carType.toLowerCase();
        valB = b.carType.toLowerCase();
        break;
      case "bookingsCount":
        const analyticsA = completedBookingsAnalytics[a.plateNo];
        const countA = analyticsA?.bookings?.length || 0;
        const analyticsB = completedBookingsAnalytics[b.plateNo];
        const countB = analyticsB?.bookings?.length || 0;
        valA = countA;
        valB = countB;
        break;
      default:
        return 0;
    }
    if (sortDirection === "asc") {
      return valA > valB ? 1 : valA < valB ? -1 : 0;
    } else {
      return valA < valB ? 1 : valA > valB ? -1 : 0;
    }
  });

  const handleRowClick = (plateNo) => {
    setSelectedUnitId(plateNo);
    setShowUnitDetailsOverlay(true);
    setIsEditing(false);
    setEditedUnit(null);
    setIsAddingUnit(false);
  };

  const selectedUnit = allUnitData?.find(
    (unit) => unit.plateNo === selectedUnitId,
  );

  const toUpper = (v) => (v || "").toUpperCase();

  const toSentenceCase = (v) => {
    if (!v) return "";
    const s = v.toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const handleAddUnit = async () => {
    setIsSavingUnit(true);

    const normalizedUnit = {
      ...editedUnit,

      id: toUpper(editedUnit.plateNo),
      plateNo: toUpper(editedUnit.plateNo),
      brand: toUpper(editedUnit.brand),
      owner: toUpper(editedUnit.owner),
      carType: toUpper(editedUnit.carType),
      name: toUpper(editedUnit.name),

      // Parse numeric fields
      price: parseFloat(editedUnit.price) || 0,
      driverRate: parseFloat(editedUnit.driverRate) || 0,
      extension: parseFloat(editedUnit.extension) || 0,
      ownerShare: parseFloat(editedUnit.ownerShare) || 0,
      deliveryFee: parseFloat(editedUnit.deliveryFee) || 0,
      reservation: parseFloat(editedUnit.reservation) || 0,

      details: {
        ...editedUnit.details,
        specifications: {
          ...editedUnit.details?.specifications,

          // synced from carType
          Type: toUpper(editedUnit.carType),

          // Parse Capacity to number
          Capacity:
            parseFloat(editedUnit.details?.specifications?.Capacity) || 0,

          Color: toUpper(editedUnit.details?.specifications?.Color),
          Fuel: toSentenceCase(editedUnit.details?.specifications?.Fuel),
          Transmission: toSentenceCase(
            editedUnit.details?.specifications?.Transmission,
          ),
        },
      },
    };

    const result = await updateUnitData(normalizedUnit.plateNo, normalizedUnit);

    const unitId = normalizedUnit.plateNo; // UPPERCASED

    if (result.success) {
      // Upload main image if provided
      if (editedMainImageFile) {
        const uploadResult = await updateUnitImage(
          unitId,
          "main",
          editedMainImageFile,
        );
        if (uploadResult.success) {
          // Image Preview
          setMainImage({ base64: uploadResult.base64, updatedAt: Date.now() });
        } else {
          setAdminErrorMessage(
            "Failed to upload main image: " + uploadResult.error,
          );
          setShowAdminError(true);
        }
      }

      // Upload gallery images if provided
      if (editedGalleryImageFiles.some((file) => file !== null)) {
        const galleryResult = await updateUnitGalleryImages(
          unitId,
          editedGalleryImages,
          editedGalleryImageFiles,
          [], // No existing gallery for new unit
          [], // No existing galleryIds for new unit
        );
        if (galleryResult.success) {
          setGalleryImages(galleryResult.newGalleryImages);
        } else {
          setAdminErrorMessage(
            "Failed to upload gallery images: " + galleryResult.error,
          );
          setShowAdminError(true);
        }
      }

      setShowSavedSuccess(true);
      setIsEditing(false);
      setEditedUnit(null);
      setEditedMainImage(null);
      setEditedGalleryImages([]);
      setEditedMainImageFile(null);
      setEditedGalleryImageFiles([]);
      setIsAddingUnit(false);
      setShowUnitDetailsOverlay(false);
    } else {
      setAdminErrorMessage("Failed to add unit: " + result.error);
      setShowAdminError(true);
    }
    setIsSavingUnit(false);
  };

  const handleDeleteUnit = async () => {
    if (!currentUnit?.plateNo) return;

    setShowDeleteUnitConfirmDialog(false);

    setIsDeletingUnit(true);

    // prevent crash if the deleted unit is currently selected
    if (selectedUnitId === currentUnit.id) {
      setSelectedUnitId("");
    }

    const result = await deleteUnit(currentUnit.plateNo);

    setIsDeletingUnit(false);

    if (result.success) {
      setShowUnitDetailsOverlay(false);
      setSelectedUnitId(null);

      setHideDeleteSuccess(false);
      setShowDeleteSuccess(true);

      // optional auto-hide after 3s
      setTimeout(() => {
        setHideDeleteSuccess(true);
        setTimeout(() => setShowDeleteSuccess(false), 400);
      }, 3000);
    } else {
      setAdminErrorMessage("Delete failed: " + result.error);
      setShowAdminError(true);
    }
  };

  const handleEdit = () => {
    setShowEditConfirmDialog(true);
  };

  const handleConfirmEdit = () => {
    setShowEditConfirmDialog(false);
    setIsEditing(true);
    setEditedUnit(JSON.parse(JSON.stringify(selectedUnit)));
    setEditedMainImage(mainImage); // Changed: set to the full object, not just base64
    setEditedGalleryImages([...galleryImages]);
    setEditedMainImageFile(null);
    setEditedGalleryImageFiles(new Array(galleryImages.length).fill(null));
  };

  const handleCancelEdit = () => {
    setShowEditConfirmDialog(false);
  };

  const handleSave = async () => {
    setIsSavingUnit(true);

    const normalizedUnit = {
      ...editedUnit,

      id: toUpper(editedUnit.plateNo),
      plateNo: toUpper(editedUnit.plateNo),
      brand: toUpper(editedUnit.brand),
      owner: toUpper(editedUnit.owner),
      carType: toUpper(editedUnit.carType),
      name: toUpper(editedUnit.name),

      // Parse numeric fields
      price: parseFloat(editedUnit.price) || 0,
      driverRate: parseFloat(editedUnit.driverRate) || 0,
      extension: parseFloat(editedUnit.extension) || 0,
      ownerShare: parseFloat(editedUnit.ownerShare) || 0,
      deliveryFee: parseFloat(editedUnit.deliveryFee) || 0,
      reservation: parseFloat(editedUnit.reservation) || 0,

      details: {
        ...editedUnit.details,
        specifications: {
          ...editedUnit.details?.specifications,

          // synced from carType
          Type: toUpper(editedUnit.carType),

          // Parse Capacity to number
          Capacity:
            parseFloat(editedUnit.details?.specifications?.Capacity) || 0,

          Color: toUpper(editedUnit.details?.specifications?.Color),
          Fuel: toSentenceCase(editedUnit.details?.specifications?.Fuel),
          Transmission: toSentenceCase(
            editedUnit.details?.specifications?.Transmission,
          ),
        },
      },
    };

    const result = await updateUnitData(selectedUnitId, normalizedUnit);

    if (result.success) {
      // Upload main image if changed
      if (editedMainImageFile) {
        const uploadResult = await updateUnitImage(
          selectedUnitId,
          "main",
          editedMainImageFile,
        );
        if (uploadResult.success) {
          setMainImage({ base64: uploadResult.base64, updatedAt: Date.now() }); // Object
        } else {
          setAdminErrorMessage(
            "Failed to upload main image: " + uploadResult.error,
          );
          setShowAdminError(true);
        }
      } else {
        setMainImage(editedMainImage || mainImage); // Already object
      }

      // Update gallery images
      const galleryResult = await updateUnitGalleryImages(
        selectedUnitId,
        editedGalleryImages,
        editedGalleryImageFiles,
        galleryImages,
        currentUnit.galleryIds,
      );
      if (galleryResult.success) {
        setGalleryImages(galleryResult.newGalleryImages); // Now objects
      } else {
        setAdminErrorMessage(
          "Failed to update gallery: " + galleryResult.error,
        );
        setShowAdminError(true);
      }

      setShowSavedSuccess(true);
      setIsEditing(false);
      setEditedUnit(null);
      setEditedMainImage(null);
      setEditedGalleryImages([]);
      setEditedMainImageFile(null);
      setEditedGalleryImageFiles([]);
    }
    setIsSavingUnit(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUnit(null);
    setEditedMainImage(null);
    setEditedGalleryImages([]);
    setEditedMainImageFile(null);
    setEditedGalleryImageFiles([]);
    setIsAddingUnit(false);
    setShowUnitDetailsOverlay(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (isEditing) {
      // For preview, convert to base64 without compression
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;

        if (currentImageType === "main") {
          setEditedMainImage({ base64, updatedAt: Date.now() }); // Object
          setEditedMainImageFile(file);
        } else if (
          currentImageType === "gallery" &&
          currentGalleryIndex !== null
        ) {
          const updatedGallery = [...editedGalleryImages];
          updatedGallery[currentGalleryIndex] = {
            base64,
            updatedAt: Date.now(),
          };
          setEditedGalleryImages(updatedGallery);

          const updatedFiles = [...editedGalleryImageFiles];
          updatedFiles[currentGalleryIndex] = file;
          setEditedGalleryImageFiles(updatedFiles);
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Not editing, upload immediately
      const result = await updateUnitImage(
        selectedUnitId,
        currentImageType,
        file,
        currentGalleryIndex,
      );



            // if (result.success) {
      //   const base64 = result.base64;

      //   if (currentImageType === "main") {
      //     setMainImage({ base64, updatedAt: Date.now() }); // Object
      //   } else if (
      //     currentImageType === "gallery" &&
      //     currentGalleryIndex !== null
      //   ) {
      //     const updatedGallery = [...galleryImages];
      //     updatedGallery[currentGalleryIndex] = {
      //       base64,
      //       updatedAt: Date.now(),
      //     }; // Object
      //     setGalleryImages(updatedGallery);
      //   }
      // }

            if (result.success) {
        const base64 = result.base64;

        if (currentImageType === "main") {
          setMainImage({ base64, updatedAt: Date.now() });
          // Clear cache for this image
          await clearImageCache(`${selectedUnitId}_main`);
        } else if (
          currentImageType === "gallery" &&
          currentGalleryIndex !== null
        ) {
          const updatedGallery = [...galleryImages];
          updatedGallery[currentGalleryIndex] = {
            base64,
            updatedAt: Date.now(),
          };
          setGalleryImages(updatedGallery);
          // Clear cache for this image
          await clearImageCache(`${selectedUnitId}_gallery_${currentGalleryIndex}`);
        }
      }
    }

    
    // Reset file input to allow re-uploading the same file
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveContent = async () => {
    setIsSavingContent(true);
    try {
      // Handle deletions for fleet page
      const currentFleetSet = new Set(contentImages.fleet);
      const originalFleet = originalContentImages.fleet;
      for (let i = 0; i < originalFleet.length; i++) {
        if (!currentFleetSet.has(originalFleet[i])) {
          await deleteImageFromFirestore(`FleetPage_${i}`);
        }
      }

      // Existing upload logic
      for (const page of Object.keys(contentImages)) {
        const images = contentImages[page];
        const files = contentImageFiles[page];

        for (let i = 0; i < images.length; i++) {
          if (images[i] !== originalContentImages[page][i] && files[i]) {
            const compressed = await compressAndConvertToBase64(files[i]);

            const imageId = `${
              page.charAt(0).toUpperCase() + page.slice(1)
            }Page_${i}`;
            const uploadResult = await uploadImageToFirestore(
              imageId,
              compressed.base64,
            );

            // Clear cache for this image
            await clearImageCache(imageId);

            if (!uploadResult.success) {
              setAdminErrorMessage(
                `Failed to upload ${page} image ${i}: ${uploadResult.error}`,
              );
              setShowAdminError(true);
              return;
            }
          }
        }
      }

      // Save reviews with compression
      for (let i = 0; i < testimonials.length; i++) {
        const testimonial = testimonials[i];
        const testimonialToSave = { ...testimonial };

        // Only compress and save img if there's a new file
        if (testimonialImageFiles[i]) {
          const compressed = await compressAndConvertToBase64(
            testimonialImageFiles[i],
          );
          testimonialToSave.img = compressed.base64;
        }
        // If no new file, omit img from the update to avoid size issues

        if (testimonial.id) {
          await updateReview(testimonial.id, testimonialToSave);
        } else {
          const result = await createReview(testimonialToSave);
          if (result.success) {
            setTestimonials((prev) =>
              prev.map((t, idx) => (idx === i ? { ...t, id: result.id } : t)),
            );
          } else {
            setAdminErrorMessage(
              `Failed to create review for ${testimonial.name}: ${result.error}`,
            );
            setShowAdminError(true);
          }
        }
      }

      setOriginalTestimonials([...testimonials]);

      // Existing success logic
      setOriginalContentImages({ ...contentImages });
      setContentImageFiles({
        landing: [null, null, null, null, null],
        fleet: new Array(contentImages.fleet.length).fill(null),
        about: [null],
        contact: [null],
      });
      setTestimonialImageFiles(new Array(testimonials.length).fill(null)); // Reset testimonial files
      setShowContentSavedSuccess(true);
      setIsEditingContent(false);
    } catch (error) {
      setAdminErrorMessage("Save failed: " + error.message);
      setShowAdminError(true);
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleContentImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setContentImages((prev) => ({
        ...prev,
        [currentContentPage]: prev[currentContentPage].map((img, idx) =>
          idx === currentContentIndex ? base64 : img,
        ),
      }));
      // Store the file for compression/uploading
      setContentImageFiles((prev) => ({
        ...prev,
        [currentContentPage]: prev[currentContentPage].map((f, idx) =>
          idx === currentContentIndex ? file : f,
        ),
      }));
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (contentFileInputRef.current) contentFileInputRef.current.value = "";
  };

  useEffect(() => {
    const fetchContentImages = async () => {
      const fetched = { landing: [], fleet: [], about: [], contact: [] };
      // Landing
      for (let i = 0; i < 5; i++) {
        const imageId = `LandingPage_${i}`;
        const image = await fetchImageFromFirestore(imageId);
        fetched.landing[i] = image
          ? image.base64
          : "/assets/images/default.png";
      }
      // Fleet
      fetched.fleet = [];
      let i = 0;
      while (true) {
        const imageId = `FleetPage_${i}`;
        const image = await fetchImageFromFirestore(imageId);
        if (image) {
          fetched.fleet.push(image.base64);
          i++;
        } else {
          break;
        }
      }
      // Fill with samples if less than 5
      while (fetched.fleet.length < 5) {
        fetched.fleet.push("/assets/images/default.png");
      }

      // About
      const aboutImage = await fetchImageFromFirestore("AboutPage_0");
      fetched.about[0] = aboutImage
        ? aboutImage.base64
        : "/assets/images/about.png";
      // Contact
      const contactImage = await fetchImageFromFirestore("ContactPage_0");
      fetched.contact[0] = contactImage
        ? contactImage.base64
        : "/assets/images/contact.png";
      setContentImages(fetched);
      setOriginalContentImages(fetched);

      setContentImageFiles((prev) => ({
        ...prev,
        fleet: new Array(fetched.fleet.length).fill(null),
      }));
    };
    fetchContentImages();
  }, []);

  const currentUnit = isEditing ? editedUnit : selectedUnit;

  const [fetchedImages, setFetchedImages] = useState({});

  useEffect(() => {
    const fetchTableImages = async () => {
      if (!unitData || unitData.length === 0) return;

      const imageIds = new Set();

      // Add unit images
      unitData.forEach((unit) => {
        if (unit.imageId) imageIds.add(unit.imageId);
        else if (unit.plateNo) imageIds.add(`${unit.plateNo}_main`);
      });

      // Add active bookings images
      activeBookings?.forEach((booking) => {
        if (booking.imageId) imageIds.add(booking.imageId);
        else if (booking.plateNo) imageIds.add(`${booking.plateNo}_main`);
      });

      const promises = [...imageIds].map(async (id) => {
        try {
          const image = await fetchImageFromFirestore(id);
          if (image) return { [id]: image };
          return {
            [id]: {
              base64: "/assets/images/default.png",
              updatedAt: Date.now(),
            },
          };
        } catch {
          return {
            [id]: {
              base64: "/assets/images/default.png",
              updatedAt: Date.now(),
            },
          };
        }
      });

      const results = await Promise.all(promises);
      const merged = results
        .filter(Boolean)
        .reduce((acc, cur) => ({ ...acc, ...cur }), {});

      setFetchedImages((prev) => ({ ...prev, ...merged }));
    };

    fetchTableImages();
  }, [unitData, activeBookings, imageUpdateTrigger]);

  // Fetch main image when unit is selected
  useEffect(() => {
    if (selectedUnitId && currentUnit?.imageId && !isEditing) {
      setMainImageLoading(true);
      fetchImageFromFirestore(currentUnit.imageId)
        .then(({ base64, updatedAt }) => {
          setMainImage({ base64, updatedAt });
          setMainImageLoading(false);
        })
        .catch((error) => {
          setMainImageLoading(false);
        });
    } else if (!isEditing) {
      setMainImage(null);
      setMainImageLoading(false);
    }
  }, [selectedUnitId, currentUnit?.imageId, isEditing, imageUpdateTrigger]);

  // Fetch gallery images when unit is selected
  useEffect(() => {
    if (selectedUnitId && currentUnit?.galleryIds?.length > 0 && !isEditing) {
      setGalleryImagesLoading(true);
      const fetchPromises = currentUnit.galleryIds.map((id) =>
        fetchImageFromFirestore(id).catch(() => null),
      );
      Promise.all(fetchPromises)
        .then((results) => {
          // Filter out nulls (broken images) so they're not shown as placeholders
          const filteredResults = results.filter((r) => r !== null);
          setGalleryImages(filteredResults);
          setGalleryImagesLoading(false);
        })
        .catch((error) => {
          setGalleryImagesLoading(false);
        });
    } else if (!isEditing) {
      setGalleryImages([]);
      setGalleryImagesLoading(false);
    }
  }, [selectedUnitId, currentUnit?.galleryIds, isEditing, imageUpdateTrigger]);

  const handleAddMOP = () => {
    setIsAddingMOP(true);
    setOldMopType("");
    setSelectedMopType("");
    setShowEditMOPConfirmDialog(true);
  };

  const handleDeleteMOP = () => {
    if (!oldMopType) return;

    setMopTypes(mopTypes.filter((t) => t !== oldMopType));

    setIsAddingMOP(false);
    setShowEditMOPConfirmDialog(false);
  };

  const handleMopRowClick = (type) => {
    setSelectedMopType(type);
    setOldMopType(type);
    setShowEditMOPConfirmDialog(true);
  };

  const handleMOPConfirmEdit = () => {
    const newValue = selectedMopType.trim();
    if (!newValue) return;

    // Prevent duplicate MOP names
    const exists = mopTypes.some(
      (t) => t.toLowerCase() === newValue.toLowerCase(),
    );

    // Allow no-op edit (same name)
    if (!isAddingMOP && newValue === oldMopType) {
      setIsAddingMOP(false);
      setShowEditMOPConfirmDialog(false);
      return;
    }

    if (exists) {
      setAdminErrorMessage("This MOP already exists.");
      setShowAdminError(true);
      return;
    }

    if (isAddingMOP) {
      // ADD NEW MOP
      setMopTypes([...mopTypes, newValue]);
    } else {
      // EDIT (RENAME) MOP
      setMopTypes(mopTypes.map((t) => (t === oldMopType ? newValue : t)));
    }

    setIsAddingMOP(false);
    setShowEditMOPConfirmDialog(false);
  };

  const handleCancelMOPEdit = () => {
    setIsAddingMOP(false);
    setShowEditMOPConfirmDialog(false);
  };

  const handleAddPOP = () => {
    setIsAddingPOP(true);
    setSelectedPOPType("");
    setOldPOPType("");
    setShowEditPOPConfirmDialog(true);
  };

  const handlePopRowClick = (type) => {
    setSelectedPOPType(type);
    setOldPOPType(type);
    setIsAddingPOP(false);
    setShowEditPOPConfirmDialog(true);
  };

  const handlePOPConfirmEdit = () => {
    const newValue = selectedPOPType.trim();
    if (!newValue) return;

    const exists = [...popTypesRevenue, ...popTypesExpense].some(
      (t) => t.toLowerCase() === newValue.toLowerCase(),
    );

    if (!isAddingPOP && newValue === oldPOPType) {
      setIsAddingPOP(false);
      setShowEditPOPConfirmDialog(false);
      return;
    }

    if (exists) {
      setAdminErrorMessage("This POP type already exists.");
      setShowAdminError(true);
      return;
    }

    setPendingPOPAction("save");
    setShowPOPFinalConfirm(true);
  };

  const handleDeletePOP = (type) => {
    if (!type) return;
    setPendingPOPAction("delete");
    setShowPOPFinalConfirm(true);
  };

  const handleAddReferral = () => {
    setIsAddingReferral(true);
    setSelectedReferral("");
    setOldReferral("");
    setShowEditReferralConfirmDialog(true);
  };

  const handleReferralRowClick = (type) => {
    setSelectedReferral(type);
    setOldReferral(type);
    setIsAddingReferral(false);
    setShowEditReferralConfirmDialog(true);
  };

  const handleReferralConfirmEdit = () => {
    const newValue = selectedReferral.trim();
    if (!newValue) return;

    const exists = referralSources.some(
      (r) => r.toLowerCase() === newValue.toLowerCase(),
    );

    if (!isAddingReferral && newValue === oldReferral) {
      setIsAddingReferral(false);
      setShowEditReferralConfirmDialog(false);
      return;
    }

    if (exists) {
      setAdminErrorMessage("This referral source already exists.");
      setShowAdminError(true);
      return;
    }

    setPendingReferralAction("save");
    setShowReferralFinalConfirm(true);
  };

  const handleDeleteReferral = (type) => {
    if (!type) return;
    setPendingReferralAction("delete");
    setShowReferralFinalConfirm(true);
  };

  // Compute unit type counts for filter dropdown
  const unitTypeCounts = useMemo(() => {
    const counts = { All: allUnitData?.length || 0 };
    allUnitData?.forEach((unit) => {
      const type = unit.carType?.toUpperCase() || "OTHER";
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [allUnitData]);

  const mopData = useMemo(() => {
    const counts = {};
    const balances = {};
    const recents = {};

    // revenueGrid structure: { [year]: { [monthIndex]: { Row_0: [...], Row_1: [...], ... } } }
    Object.values(revenueGrid || {}).forEach((yearData) => {
      if (typeof yearData !== "object" || Array.isArray(yearData)) return;

      Object.values(yearData).forEach((monthData) => {
        if (typeof monthData !== "object" || Array.isArray(monthData)) return;

        Object.values(monthData).forEach((row) => {
          if (!Array.isArray(row)) return;
          const mop = row[2];
          const amountStr = row[1];
          const dateStr = row[4];
          if (mop && amountStr) {
            counts[mop] = (counts[mop] || 0) + 1;
            const amount =
              parseFloat(String(amountStr).replace(/[^\d.-]/g, "")) || 0;
            balances[mop] = (balances[mop] || 0) + amount;
            const date = new Date(dateStr);
            if (
              date &&
              !isNaN(date.getTime()) &&
              (!recents[mop] || date > recents[mop])
            ) {
              recents[mop] = date;
            }
          }
        });
      });
    });
    return { counts, balances, recents };
  }, [revenueGrid]);

  const popData = useMemo(() => {
    const counts = {};
    const balances = {};
    const recents = {};

    Object.values(revenueGrid || {}).forEach((yearData) => {
      if (typeof yearData !== "object" || Array.isArray(yearData)) return;

      Object.values(yearData).forEach((monthData) => {
        if (typeof monthData !== "object" || Array.isArray(monthData)) return;

        Object.values(monthData).forEach((row) => {
          if (!Array.isArray(row)) return;
          const pop = row[3];
          const amountStr = row[1];
          const dateStr = row[4];
          if (pop && amountStr) {
            counts[pop] = (counts[pop] || 0) + 1;
            const amount =
              parseFloat(String(amountStr).replace(/[^\d.-]/g, "")) || 0;
            balances[pop] = (balances[pop] || 0) + amount;
            const date = new Date(dateStr);
            if (
              date &&
              !isNaN(date.getTime()) &&
              (!recents[pop] || date > recents[pop])
            ) {
              recents[pop] = date;
            }
          }
        });
      });
    });
    return { counts, balances, recents };
  }, [revenueGrid]);

  const poeData = useMemo(() => {
    const counts = {};
    const balances = {};
    const recents = {};

    Object.values(expenseGrid || {}).forEach((yearData) => {
      if (typeof yearData !== "object" || Array.isArray(yearData)) return;

      Object.values(yearData).forEach((monthData) => {
        if (typeof monthData !== "object" || Array.isArray(monthData)) return;

        Object.values(monthData).forEach((row) => {
          if (!Array.isArray(row)) return;
          const poe = row[3];
          const amountStr = row[1];
          const dateStr = row[4];
          if (poe && amountStr) {
            counts[poe] = (counts[poe] || 0) + 1;
            const amount =
              parseFloat(String(amountStr).replace(/[^\d.-]/g, "")) || 0;
            balances[poe] = (balances[poe] || 0) + amount;
            const date = new Date(dateStr);
            if (
              date &&
              !isNaN(date.getTime()) &&
              (!recents[poe] || date > recents[poe])
            ) {
              recents[poe] = date;
            }
          }
        });
      });
    });
    return { counts, balances, recents };
  }, [expenseGrid]);

  const referralData = useMemo(() => {
    const allBookings = Object.values(completedBookingsAnalytics).flatMap(
      (analytics) => analytics.bookings || [],
    );
    const counts = {};
    const recents = {};
    allBookings.forEach((booking) => {
      const ref = booking.referralSource;
      if (ref) {
        counts[ref] = (counts[ref] || 0) + 1;
        let date;
        if (booking.endTimestamp?.seconds) {
          date = new Date(booking.endTimestamp.seconds * 1000);
        } else if (booking.endDate && booking.endTime) {
          const [year, month, day] = booking.endDate.split("-");
          const [hour, minute] = booking.endTime.split(":");
          date = new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hour),
            Number(minute),
          );
        }
        if (date && (!recents[ref] || date > recents[ref])) {
          recents[ref] = date;
        }
      }
    });
    return { counts, recents };
  }, [completedBookingsAnalytics]);

  const formatDate = (date) => {
    const options = { month: "short", day: "numeric", year: "numeric" };
    const dateStr = date.toLocaleDateString("en-US", options);
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateStr} | ${timeStr}`;
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";
    const options = {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };
    return date.toLocaleString("en-US", options);
  };

  const formatPaymentDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return formatDate(date);
  };

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split(" ");
    if (parts.length < 3) return "";
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames.indexOf(parts[0]);
    if (month === -1) return "";
    const day = parseInt(parts[1].replace(",", ""));
    const year = parseInt(parts[2]);
    if (isNaN(day) || isNaN(year)) return "";
    const date = new Date(Date.UTC(year, month, day)); // Use UTC to avoid timezone shift
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  const formatDateForDisplay = (isoStr) => {
    if (!isoStr) return "";
    const date = new Date(isoStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const clientsList = useMemo(() => {
    const allBookings = Object.values(completedBookingsAnalytics).flatMap(
      (car) => car.bookings || [],
    );

    const emailMap = {};

    // Process all completed bookings
    allBookings.forEach((booking) => {
      const email = booking.email;
      if (email) {
        if (!emailMap[email]) {
          emailMap[email] = {
            name:
              `${booking.firstName || ""} ${booking.middleName || ""} ${
                booking.surname || ""
              }`.trim() || "Walk-in Client",
            contact: booking.contact || "",
            email,
            address: "",
            occupation: "",
            createdAt: null,
            bookingsCount: 0,
            totalDue: 0,
            isRegistered: false,
          };
        }
        emailMap[email].bookingsCount += 1;
        emailMap[email].totalDue += booking.balanceDue || 0;

        const bookingDate = booking.endTimestamp
          ? new Date(booking.endTimestamp.seconds * 1000)
          : new Date();
        if (
          !emailMap[email].createdAt ||
          bookingDate < emailMap[email].createdAt
        ) {
          emailMap[email].createdAt = bookingDate;
        }
      }
    });

    // Merge with registered user accounts (exclude admin role)
    userAccounts.forEach((user) => {
      if (user.role === "admin") return;
      const email = user.email;
      if (email) {
        if (emailMap[email]) {
          emailMap[email].isRegistered = true;
          emailMap[email].createdAt = user.createdAt
            ? new Date(user.createdAt.seconds * 1000)
            : emailMap[email].createdAt;
          emailMap[email].name =
            user.firstName && user.middleName && user.surname
              ? `${user.firstName} ${user.middleName} ${user.surname}`.trim()
              : user.name || emailMap[email].name;
          emailMap[email].contact = user.phone || emailMap[email].contact;
          emailMap[email].address = user.address || "";
          emailMap[email].occupation = user.occupation || "";
          emailMap[email].firstName =
            user.firstName || emailMap[email].firstName || "";
          emailMap[email].middleName =
            user.middleName || emailMap[email].middleName || "";
          emailMap[email].surname =
            user.surname || emailMap[email].surname || "";
        } else {
          emailMap[email] = {
            name:
              user.firstName && user.middleName && user.surname
                ? `${user.firstName} ${user.middleName} ${user.surname}`.trim()
                : user.name ||
                  `${user.firstName || ""} ${user.middleName || ""} ${
                    user.surname || ""
                  }`.trim(),
            contact: user.phone || "",
            address: user.address || "",
            occupation: user.occupation || "",
            email,
            createdAt: user.createdAt
              ? new Date(user.createdAt.seconds * 1000)
              : null,
            bookingsCount: 0,
            totalDue: 0,
            isRegistered: true,
            firstName: user.firstName || "",
            middleName: user.middleName || "",
            surname: user.surname || "",
          };
        }
      }
    });

    return Object.values(emailMap);
  }, [completedBookingsAnalytics, userAccounts]);

  const filteredClientsList = useMemo(() => {
    if (!clientsSearchTerm) return clientsList;
    const search = clientsSearchTerm.toLowerCase();
    return clientsList.filter((client) => {
      const formattedCreatedAt = client.createdAt
        ? formatDate(client.createdAt)
        : "N/A";
      return (
        client.name.toLowerCase().includes(search) ||
        (client.contact || "").toLowerCase().includes(search) ||
        client.email.toLowerCase().includes(search) ||
        formattedCreatedAt.toLowerCase().includes(search) ||
        client.bookingsCount.toString().includes(search)
      );
    });
  }, [clientsList, clientsSearchTerm]);

  const closeAdminError = () => {
    setShowAdminError(false);
    setAdminErrorMessage("");
  };

  return (
    <div className="admin-settings">
      <h2 className="admin-settings-title">Admin Settings</h2>

      {/* Cars Section */}
      {(subSection === "overview" || subSection === "units") && (
        <div className="cars-section">
          <h2 className="section-title">
            <span
              className="unit-type-selector"
              ref={unitTypeDropdownRef}
              onClick={() => setShowUnitTypeDropdown(!showUnitTypeDropdown)}
            >
              {unitTypeFilter === "All" ? "Units" : unitTypeFilter} (
              {unitTypeCounts[unitTypeFilter] || 0})
              <span className="dropdown-arrow">▼</span>
              {showUnitTypeDropdown && (
                <div
                  className="unit-type-dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  {Object.entries(unitTypeCounts).map(([type, count]) => (
                    <div
                      key={type}
                      className={`unit-type-option ${unitTypeFilter === type ? "active" : ""}`}
                      onClick={() => {
                        setUnitTypeFilter(type);
                        setShowUnitTypeDropdown(false);
                      }}
                    >
                      {type === "All" ? "All" : type} ({count})
                    </div>
                  ))}
                </div>
              )}
            </span>

            <div className="search-and-add">
              <input
                type="text"
                placeholder="Search units..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-settings-search-input"
              />
              <button
                className="add-unit-btn"
                onClick={() => {
                  setIsAddingUnit(true);
                  setShowUnitDetailsOverlay(true);
                  setIsEditing(true);
                  setEditedUnit({
                    name: "",
                    plateNo: "",
                    owner: "",
                    carType: "",
                    price: "",
                    driverRate: "",
                    extension: "",
                    deliveryFee: "",
                    ownerShare: "",
                    details: {
                      introduction: "",
                      specifications: {
                        Transmission: "",
                        Fuel: "",
                        Capacity: "",
                        Color: "",
                        Features: "",
                        Trunk: "",
                        Type: "",
                      },
                    },
                    hidden: false, // Add hidden default false
                    id: "", // Will be set to plateNo
                    imageId: "", // Will be set to `${plateNo}_main`
                    reservation: 0, // Add reservation default 0
                    status: "Vacant", // Add status default 'Vacant'
                  });
                  setEditedMainImage(null);
                  setEditedGalleryImages([]);
                  setEditedMainImageFile(null);
                  setEditedGalleryImageFiles([]);
                }}
              >
                Add
              </button>
            </div>
          </h2>

          <div className="table-container">
            <table
              className={`cars-table ${sortKey ? `sorted-${sortKey}` : ""}`}
            >
              <thead>
                <tr>
                  <th>Car Image</th>
                  <th
                    onClick={() => handleSort("carName")}
                    className={`${
                      sortKey === "carName"
                        ? `active-sort carName ${sortDirection}`
                        : ""
                    }`}
                  >
                    Car Name <span className="arrow"></span>
                  </th>
                  <th
                    onClick={() => handleSort("owner")}
                    className={`${
                      sortKey === "owner"
                        ? `active-sort owner ${sortDirection}`
                        : ""
                    }`}
                  >
                    Owner <span className="arrow"></span>
                  </th>
                  <th
                    onClick={() => handleSort("details")}
                    className={`${
                      sortKey === "details"
                        ? `active-sort details ${sortDirection}`
                        : ""
                    }`}
                  >
                    Details <span className="arrow"></span>
                  </th>
                  <th
                    onClick={() => handleSort("bookingsCount")}
                    className={`${
                      sortKey === "bookingsCount"
                        ? `active-sort bookingsCount ${sortDirection}`
                        : ""
                    }`}
                  >
                    Bookings Count <span className="arrow"></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedUnitData && sortedUnitData.length > 0 ? (
                  sortedUnitData.map((car, index) => {
                    const analytics = completedBookingsAnalytics[car.plateNo];
                    const bookingsCount = analytics?.bookings?.length || 0;

                    // Setup imageId and image
                    const imageId = car.imageId || `${car.plateNo}_main`;
                    const image = fetchedImages[imageId];

                    return (
                      <tr
                        key={index}
                        onClick={() => handleRowClick(car.plateNo)}
                        style={{ cursor: "pointer" }}
                        className="table-row"
                      >
                        <td>
                          <img
                            src={image?.base64 || "/assets/images/default.png"}
                            alt={car.name}
                            className="car-image"
                            key={image?.updatedAt}
                          />
                        </td>
                        <td>
                          {car.name}
                          <br />({car.plateNo})
                        </td>
                        <td>{car.owner || "N/A"}</td>
                        <td>
                          {car.carType} |{" "}
                          {car.details?.specifications?.Transmission} |{" "}
                          {car.details?.specifications?.Fuel} |{" "}
                          {car.details?.specifications?.Capacity} |{" "}
                          {car.details?.specifications?.Color}
                        </td>
                        <td>{bookingsCount}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="no-data">
                      {searchTerm
                        ? `No units found matching "${searchTerm}"`
                        : "No units available"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MOP POP Section */}
      {(subSection === "overview" || subSection === "entries") && (
        <div
          className={`mop-pop-section ${subSection === "entries" ? "single-entries" : ""}`}
        >
          <div className="mop-column">
            {/* Combo box to switch between MOP, POP, POE */}
            <div className="mop-header">
              <select
                className="mop-pop-select"
                value={selectedMopPop}
                onChange={(e) => setSelectedMopPop(e.target.value)}
              >
                <option value="MOP">MOP</option>
                <option value="POP">POP</option>
                <option value="POE">POE</option>
                <option value="Referral">Referral</option>
              </select>

              <button
                className="add-mop-btn"
                onClick={() => {
                  if (selectedMopPop === "MOP") handleAddMOP();
                  else if (selectedMopPop === "POP" || selectedMopPop === "POE")
                    handleAddPOP();
                  else handleAddReferral();
                }}
              >
                ADD
              </button>
            </div>

            <div className="mop-table-container">
              {selectedMopPop === "MOP" && (
                <table className="mop-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Balance</th>
                      <th>Recent Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mopTypes.length > 0 ? (
                      mopTypes.map((type) => (
                        <tr
                          key={type}
                          onClick={() => handleMopRowClick(type)}
                          className="table-row"
                        >
                          <td>{type}</td>
                          <td>
                            ₱
                            {mopData.balances[type]?.toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"}
                          </td>
                          <td>
                            {mopData.recents[type]
                              ? formatDate(mopData.recents[type])
                              : "No transactions"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="no-data">
                          No MOP available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {selectedMopPop === "POP" && (
                <table className="mop-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Balance</th>
                      <th>Recent Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {popTypesRevenue.length > 0 ? (
                      popTypesRevenue.map((type) => (
                        <tr
                          key={type}
                          onClick={() => handlePopRowClick(type)}
                          className="table-row"
                        >
                          <td>{type}</td>
                          <td>
                            ₱
                            {popData.balances[type]?.toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"}
                          </td>
                          <td>
                            {popData.recents[type]
                              ? formatDate(popData.recents[type])
                              : "No transactions"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="no-data">
                          No POP available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {selectedMopPop === "POE" && (
                <table className="mop-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Balance</th>
                      <th>Recent Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {popTypesExpense.length > 0 ? (
                      popTypesExpense.map((type) => (
                        <tr
                          key={type}
                          onClick={() => handlePopRowClick(type)}
                          className="table-row"
                        >
                          <td>{type}</td>
                          <td>
                            ₱
                            {poeData.balances[type]?.toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"}
                          </td>
                          <td>
                            {poeData.recents[type]
                              ? formatDate(poeData.recents[type])
                              : "No transactions"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="no-data">
                          No POE available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {selectedMopPop === "Referral" && (
                <table className="mop-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Bookings</th>
                      <th>Recent Bookings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralSources.length > 0 ? (
                      referralSources.map((type) => {
                        const count = referralData.counts[type] || 0;
                        const recentDate = referralData.recents[type];
                        const formattedDate = recentDate
                          ? formatDate(recentDate)
                          : "No bookings";
                        return (
                          <tr
                            key={type}
                            onClick={() => handleReferralRowClick(type)}
                            className="table-row"
                          >
                            <td>{type}</td>
                            <td>{count}</td>
                            <td>{formattedDate}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="3" className="no-data">
                          No Referral Sources available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clients Section */}
      {(subSection === "overview" || subSection === "clients") && (
        <div
          className={`clients-section ${subSection === "clients" ? "single-clients" : ""}`}
        >
          <div className="section-title">
            <h2 className="section-title">
              Clients ({filteredClientsList.length})
            </h2>
            <input
              type="text"
              placeholder="Search clients..."
              value={clientsSearchTerm}
              onChange={(e) => setClientsSearchTerm(e.target.value)}
              className="admin-settings-search-input"
            />
          </div>
          <div className="table-container">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact No.</th>
                  <th>Email</th>
                  <th>Created At</th>
                  <th>Bookings</th>
                  <th>Due Balance</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientsList.length > 0 ? (
                  filteredClientsList.map((client) => {
                    const formattedCreatedAt = client.createdAt
                      ? formatDate(client.createdAt)
                      : "N/A";
                    return (
                      <tr
                        key={client.email}
                        className="table-row"
                        onClick={() => {
                          setSelectedClient(client);
                          setShowClientDetailsOverlay(true);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          {client.isRegistered ? "👤" : "🚶"} {client.name}
                        </td>
                        <td>{client.contact || "N/A"}</td>
                        <td>{client.email}</td>
                        <td>{formattedCreatedAt}</td>
                        <td>{client.bookingsCount}</td>
                        <td>
                          ₱
                          {client.totalDue.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="clients-no-data">
                      {clientsSearchTerm
                        ? `No clients found matching "${clientsSearchTerm}"`
                        : "No clients available"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content Section */}
      {(subSection === "overview" || subSection === "content") && (
        <div
          className={`admin-settings-content-section ${subSection === "content" ? "single-content" : ""}`}
        >
          <div className="section-title-container">
            <h2 className="section-title">Content Management</h2>
          </div>

          <div className="content-subsections">
            <div className="content-page">
              <div className="content-page-header">
                <div className="content-title-wrapper">
                <h3>Reviews</h3>
                <span className="dimension-notice">Recommended Dimensions: 2873 x 1690</span>
                </div>
                {isEditingContent ? (
                  <div className="edit-buttons">
                    <button
                      className="save-content-btn"
                      onClick={() => setShowSaveContentConfirmDialog(true)}
                    >
                      Save
                    </button>
                    <button
                      className="cancel-content-btn"
                      onClick={() => {
                        setIsEditingContent(false);
                        setContentImages(originalContentImages);
                        setContentImageFiles({
                          landing: [null, null, null, null, null],
                          fleet: [null, null, null, null, null],
                          about: [null],
                          contact: [null],
                        });
                        setTestimonials([...originalTestimonials]);
                        setTestimonialImageFiles(
                          new Array(originalTestimonials.length).fill(null),
                        );
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="edit-content-btn"
                    onClick={() => setShowEditContentConfirmDialog(true)}
                  >
                    Edit
                  </button>
                )}
              </div>
              <div
                className="testimonials-container"
                style={{
                  overflowX: "auto",
                  display: "flex",
                  gap: "10px",
                  padding: "10px",
                }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="testimonial-card">
                    <div className="testimonial-image">
                      <img src={testimonial.img} alt={testimonial.name} />
                      {isEditingContent && (
                        <button
                          className="testimonial-replace-btn"
                          onClick={() => {
                            setCurrentTestimonialIndex(index);
                            testimonialFileInputRef.current.click();
                          }}
                        ></button>
                      )}
                      {isEditingContent && testimonials.length > 5 && (
                        <button
                          className="testimonial-delete-btn"
                          onClick={() => deleteTestimonial(index)}
                        >
                          <img src="/assets/delete.png" alt="Delete" />
                        </button>
                      )}
                    </div>
                    {isEditingContent ? (
                      <input
                        type="text"
                        value={testimonial.name}
                        onChange={(e) =>
                          updateTestimonial(index, "name", e.target.value)
                        }
                        className="testimonial-input"
                      />
                    ) : (
                      <h3>{testimonial.name}</h3>
                    )}
                    {isEditingContent ? (
                      <input
                        type="date"
                        value={formatDateForInput(testimonial.date)}
                        onChange={(e) =>
                          updateTestimonial(
                            index,
                            "date",
                            formatDateForDisplay(e.target.value),
                          )
                        }
                        className="testimonial-input"
                      />
                    ) : (
                      <p className="date">{testimonial.date}</p>
                    )}
                    {isEditingContent ? (
                      <textarea
                        value={testimonial.review}
                        onChange={(e) =>
                          updateTestimonial(index, "review", e.target.value)
                        }
                        className="testimonial-textarea"
                        rows="5"
                      />
                    ) : (
                      <ReviewBox text={testimonial.review} />
                    )}
                    {isEditingContent ? (
                      <div className="star-rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`star ${
                              star <= testimonial.rating ? "filled" : ""
                            }`}
                            onClick={() =>
                              updateTestimonial(index, "rating", star)
                            }
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="rating">
                        {"★".repeat(testimonial.rating)}
                      </div>
                    )}
                  </div>
                ))}
                {isEditingContent && (
                  <div
                    className="testimonial-card add-new-card"
                    onClick={addTestimonial}
                  >
                    <div className="add-new-content">+ Add New Review</div>
                  </div>
                )}
                <input
                  type="file"
                  ref={testimonialFileInputRef}
                  onChange={handleTestimonialImageChange}
                  accept="image/*"
                  style={{ display: "none" }}
                />
              </div>
            </div>

            <div className="content-page">
              <div className="content-page-header">
                <div className="content-title-wrapper">
                <h3>Landing Page</h3>
                <span className="dimension-notice">Recommended Dimensions: 2873 x 1690</span>
                </div>
                {isEditingContent ? (
                  <div className="edit-buttons">
                    <button
                      className="save-content-btn"
                      onClick={() => setShowSaveContentConfirmDialog(true)}
                    >
                      Save
                    </button>
                    <button
                      className="cancel-content-btn"
                      onClick={() => {
                        setIsEditingContent(false);
                        setContentImages(originalContentImages);
                        setContentImageFiles({
                          landing: [null, null, null, null, null],
                          fleet: [null, null, null, null, null],
                          about: [null],
                          contact: [null],
                        });
                        setTestimonials([...originalTestimonials]);
                        setTestimonialImageFiles(
                          new Array(originalTestimonials.length).fill(null),
                        );
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="edit-content-btn"
                    onClick={() => setShowEditContentConfirmDialog(true)}
                  >
                    Edit
                  </button>
                )}
              </div>

              <div className="image-container">
                <input
                  type="file"
                  ref={contentFileInputRef}
                  onChange={handleContentImageChange}
                  accept="image/*"
                  style={{ display: "none" }}
                />

                <div className="image-item">
                  <img src={contentImages.landing[0]} alt="Landing Image 1" />
                  {isEditingContent && (
                    <button
                      className="content-replace-btn"
                      onClick={() => {
                        setCurrentContentPage("landing");
                        setCurrentContentIndex(0);
                        contentFileInputRef.current.click();
                      }}
                    >
                      <img src="/assets/replace.png" alt="Replace" />
                    </button>
                  )}
                </div>
                <div className="image-item">
                  <img src={contentImages.landing[1]} alt="Landing Image 2" />
                  {isEditingContent && (
                    <button
                      className="content-replace-btn"
                      onClick={() => {
                        setCurrentContentPage("landing");
                        setCurrentContentIndex(1);
                        contentFileInputRef.current.click();
                      }}
                    >
                      <img src="/assets/replace.png" alt="Replace" />
                    </button>
                  )}
                </div>
                <div className="image-item">
                  <img src={contentImages.landing[2]} alt="Landing Image 3" />
                  {isEditingContent && (
                    <button
                      className="content-replace-btn"
                      onClick={() => {
                        setCurrentContentPage("landing");
                        setCurrentContentIndex(2);
                        contentFileInputRef.current.click();
                      }}
                    >
                      <img src="/assets/replace.png" alt="Replace" />
                    </button>
                  )}
                </div>
                <div className="image-item">
                  <img src={contentImages.landing[3]} alt="Landing Image 4" />
                  {isEditingContent && (
                    <button
                      className="content-replace-btn"
                      onClick={() => {
                        setCurrentContentPage("landing");
                        setCurrentContentIndex(3);
                        contentFileInputRef.current.click();
                      }}
                    >
                      <img src="/assets/replace.png" alt="Replace" />
                    </button>
                  )}
                </div>
                <div className="image-item">
                  <img src={contentImages.landing[4]} alt="Landing Image 5" />
                  {isEditingContent && (
                    <button
                      className="content-replace-btn"
                      onClick={() => {
                        setCurrentContentPage("landing");
                        setCurrentContentIndex(4);
                        contentFileInputRef.current.click();
                      }}
                    >
                      <img src="/assets/replace.png" alt="Replace" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="content-page">
              <div className="content-page-header">
                <div className="content-title-wrapper">
                <h3>Fleet Page</h3>
                <span className="dimension-notice">Recommended Dimensions: 2873 x 1690</span>
                </div>
                {isEditingContent ? (
                  <div className="edit-buttons">
                    <button
                      className="save-content-btn"
                      onClick={() => setShowSaveContentConfirmDialog(true)}
                    >
                      Save
                    </button>
                    <button
                      className="cancel-content-btn"
                      onClick={() => {
                        setIsEditingContent(false);
                        setContentImages(originalContentImages);
                        setContentImageFiles({
                          landing: [null, null, null, null, null],
                          fleet: [null, null, null, null, null],
                          about: [null],
                          contact: [null],
                        });
                        setTestimonials([...originalTestimonials]);
                        setTestimonialImageFiles(
                          new Array(originalTestimonials.length).fill(null),
                        );
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="edit-content-btn"
                    onClick={() => setShowEditContentConfirmDialog(true)}
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="image-container">
                {contentImages.fleet.map((img, index) => (
                  <div className="image-item" key={index}>
                    <img src={img} alt={`Fleet Image ${index + 1}`} />
                    {isEditingContent && (
                      <button
                        className="content-replace-btn"
                        onClick={() => {
                          setCurrentContentPage("fleet");
                          setCurrentContentIndex(index);
                          contentFileInputRef.current.click();
                        }}
                      >
                        <img src="/assets/replace.png" alt="Replace" />
                      </button>
                    )}
                    {isEditingContent && index >= 5 && (
                      <button
                        className="content-delete-btn"
                        onClick={() => {
                          setContentImages((prev) => ({
                            ...prev,
                            fleet: prev.fleet.filter((_, i) => i !== index),
                          }));
                          setContentImageFiles((prev) => ({
                            ...prev,
                            fleet: prev.fleet.filter((_, i) => i !== index),
                          }));
                        }}
                      >
                        <img src="/assets/delete.png" alt="Delete" />
                      </button>
                    )}
                  </div>
                ))}
                {isEditingContent && (
                  <div className="image-item">
                    <div
                      className="unit-main-image-placeholder"
                      onClick={() => {
                        setContentImages((prev) => ({
                          ...prev,
                          fleet: [...prev.fleet, "/assets/images/default.png"],
                        }));
                        setContentImageFiles((prev) => ({
                          ...prev,
                          fleet: [...prev.fleet, null],
                        }));
                      }}
                    >
                      <span className="plus-sign">+</span>
                      <span className="recommended-dimensions">
                        Recommended Dimensions: <strong>2873 x 1690</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="content-page">
              <div className="content-page-header">
                <div className="content-title-wrapper">
                <h3>About & Contact Pages</h3>
                <span className="dimension-notice">Recommended Dimensions: 2873 x 1690</span>
                </div>
                {isEditingContent ? (
                  <div className="edit-buttons">
                    <button
                      className="save-content-btn"
                      onClick={() => setShowSaveContentConfirmDialog(true)}
                    >
                      Save
                    </button>
                    <button
                      className="cancel-content-btn"
                      onClick={() => {
                        setIsEditingContent(false);
                        setContentImages(originalContentImages);
                        setContentImageFiles({
                          landing: [null, null, null, null, null],
                          fleet: [null, null, null, null, null],
                          about: [null],
                          contact: [null],
                        });
                        setTestimonials([...originalTestimonials]);
                        setTestimonialImageFiles(
                          new Array(originalTestimonials.length).fill(null),
                        );
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="edit-content-btn"
                    onClick={() => setShowEditContentConfirmDialog(true)}
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="two-column-container">
                <div className="column">
                  <div
                    className="image-container"
                    style={{ justifyContent: "center" }}
                  >
                    <div className="image-item">
                      <img src={contentImages.about[0]} alt="About Image" />
                      {isEditingContent && (
                        <button
                          className="content-replace-btn"
                          onClick={() => {
                            setCurrentContentPage("about");
                            setCurrentContentIndex(0);
                            contentFileInputRef.current.click();
                          }}
                        >
                          <img src="/assets/replace.png" alt="Replace" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="column">
                  <div
                    className="image-container"
                    style={{ justifyContent: "center" }}
                  >
                    <div className="image-item">
                      <img src={contentImages.contact[0]} alt="Contact Image" />
                      {isEditingContent && (
                        <button
                          className="content-replace-btn"
                          onClick={() => {
                            setCurrentContentPage("contact");
                            setCurrentContentIndex(0);
                            contentFileInputRef.current.click();
                          }}
                        >
                          <img src="/assets/replace.png" alt="Replace" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUnitDetailsOverlay &&
        (selectedUnitId !== null || isAddingUnit) &&
        (selectedUnit || isAddingUnit) && (
          <div className="unit-details-overlay">
            <div className="unit-details-content">
              <button
                className="close-btn"
                type="button"
                onClick={() => {
                  setShowUnitDetailsOverlay(false);
                  setIsAddingUnit(false);
                }}
              >
                <img
                  src="/assets/close_0.png"
                  alt="Close"
                  className="close-icon close-icon-0"
                />
                <img
                  src="/assets/close_1.png"
                  alt="Close"
                  className="close-icon close-icon-1"
                />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: "none" }}
              />

              <div className="unit-details-scrollable">
                <h3
                  className="confirm-header"
                  style={{ margin: 0, textAlign: "left" }}
                >
                  {isAddingUnit
                    ? "ADD NEW UNIT"
                    : isEditing
                      ? "EDIT UNIT DETAILS"
                      : "UNIT DETAILS"}
                </h3>

                <div className="unit-details-layout">
                  <div className="unit-image-column">
                    {mainImageLoading ? (
                      <div className="unit-main-image-placeholder">
                        <span>Loading...</span>
                      </div>
                    ) : (
                        isEditing ? editedMainImage?.base64 : mainImage?.base64
                      ) ? (
                      <>
                        <img
                          src={
                            isEditing
                              ? editedMainImage.base64
                              : mainImage.base64
                          }
                          className="unit-main-image"
                          key={
                            isEditing
                              ? editedMainImage.updatedAt
                              : mainImage.updatedAt
                          }
                        />
                        {isEditing && (
                          <div className="image-edit-buttons">
                            <button
                              className="change-image-btn"
                              onClick={() => {
                                setCurrentImageType("main");
                                setCurrentGalleryIndex(null);
                                fileInputRef.current.click();
                              }}
                            >
                              <img src={"/assets/replace.png"} alt="Replace" />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div
                        className="unit-main-image-placeholder"
                        onClick={() => {
                          if (!isEditing) {
                            setShowEditConfirmDialog(true);
                          } else {
                            setCurrentImageType("main");
                            setCurrentGalleryIndex(null);
                            fileInputRef.current.click();
                          }
                        }}
                      >
                        <span className="plus-sign">+</span>
                        <span className="recommended-dimensions">
                          Recommended Dimensions: <strong>2873 x 1690</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="unit-info-column">
                    <div className="unit-gallery-row">
                                           {galleryImagesLoading ? (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: "100%",
                            height: "130px",
                          }}
                        >
                          <div
                            className="spinner"
                            style={{
                              width: "40px",
                              height: "40px",
                              border: "4px solid #ccc",
                              borderTop: "4px solid #28a745",
                              borderRadius: "50%",
                              animation: "spin 1s linear infinite",
                            }}
                          />
                          <style>{`
                            @keyframes spin {
                              to { transform: rotate(360deg); }
                            }
                          `}</style>
                        </div>
                      ) : (
                        (() => {
                        const currentGallery = isEditing
                          ? editedGalleryImages
                          : galleryImages;
                        const displayGallery = [...currentGallery];

                        // Always add one placeholder at the end for new uploads
                        displayGallery.push(null);

                        return displayGallery.map((img, index) => {
                          if (img) {
                            // Existing image: Show with replace/delete buttons (only in edit mode) and overlay for broken images
                            return (
                              <div key={index} className="gallery-item">
                                <img
                                  src={img.base64}
                                  alt={`Gallery ${index}`}
                                  className="unit-gallery-image"
                                  key={img.updatedAt}
                                  onError={(e) => {
                                    // Hide the broken image and show the overlay with plus sign
                                    e.target.style.display = "none";
                                    const overlay = e.target.nextElementSibling;
                                    if (overlay) overlay.style.display = "flex";
                                  }}
                                />
                                {/* Always-present overlay for broken images */}
                                <div
                                  className="broken-image-overlay"
                                  style={{
                                    display: "none",
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    background: "rgba(0,0,0,0.5)",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    zIndex: 1,
                                  }}
                                >
                                  <span
                                    className="plus-sign"
                                    style={{ color: "white", fontSize: "2rem" }}
                                  >
                                    +
                                  </span>
                                  <span className="recommended-dimensions">
                                    Recommended Dimensions:{" "}
                                    <strong>2873 x 1690</strong>
                                  </span>
                                </div>
                                {isEditing && (
                                  <div className="gallery-buttons">
                                    <button
                                      className="replace-btn"
                                      onClick={() => {
                                        setCurrentImageType("gallery");
                                        setCurrentGalleryIndex(index);
                                        fileInputRef.current.click();
                                      }}
                                    >
                                      <img
                                        style={{ padding: "15px" }}
                                        src={"/assets/replace.png"}
                                        alt="Replace"
                                      />
                                    </button>
                                    <button
                                      className="delete-btn"
                                      onClick={() => {
                                        const updatedGallery = [
                                          ...editedGalleryImages,
                                        ];
                                        updatedGallery.splice(index, 1);
                                        setEditedGalleryImages(updatedGallery);
                                        const updatedFiles = [
                                          ...editedGalleryImageFiles,
                                        ];
                                        updatedFiles.splice(index, 1);
                                        setEditedGalleryImageFiles(
                                          updatedFiles,
                                        );
                                      }}
                                    >
                                      <img
                                        src={"/assets/delete.png"}
                                        alt="Delete"
                                      />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          } else {
                            // Placeholder for uploading new images
                            return (
                              <div key={index} className="image-item">
                                <div
                                  className="unit-gallery-placeholder"
                                  onClick={() => {
                                    if (!isEditing) {
                                      setShowEditConfirmDialog(true);
                                    } else {
                                      setCurrentImageType("gallery");
                                      setCurrentGalleryIndex(index); // Index for adding new (will be >= current length)
                                      fileInputRef.current.click();
                                    }
                                  }}
                                >
                                  <span className="plus-sign">+</span>

                                  <span className="recommended-dimensions">
                                    Recommended Dimensions:{" "}
                                    <strong>2873 x 1690</strong>
                                  </span>
                                </div>
                              </div>
                            );
                          }
                        });
                        })()
                      )}
                    </div>

                    <div className="unit-name-plate-row">
                      <div className="unit-name-column">
                        <label>Car Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={currentUnit.name}
                            onChange={(e) =>
                              setEditedUnit({
                                ...editedUnit,
                                name: e.target.value,
                              })
                            }
                            className="unit-name-input"
                          />
                        ) : (
                          <span className="unit-name">{currentUnit.name}</span>
                        )}
                      </div>
                      <div className="unit-plate-column">
                        <label>Plate No.</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={currentUnit.plateNo}
                            onChange={(e) =>
                              setEditedUnit({
                                ...editedUnit,
                                plateNo: e.target.value,
                              })
                            }
                            className="unit-plate-input"
                          />
                        ) : (
                          <span className="unit-plate">
                            {currentUnit.plateNo}
                          </span>
                        )}
                      </div>
                      <div className="unit-plate-column">
                        <label>Owner</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={currentUnit.owner}
                            onChange={(e) =>
                              setEditedUnit({
                                ...editedUnit,
                                owner: e.target.value,
                              })
                            }
                            className="unit-owner-input"
                          />
                        ) : (
                          <span className="unit-plate">
                            {currentUnit.owner}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="unit-additional-container">
                  <div className="description-row">
                    <label>Description</label>
                    {isEditing ? (
                      <textarea
                        value={currentUnit.details?.introduction || ""}
                        onChange={(e) =>
                          setEditedUnit({
                            ...editedUnit,
                            details: {
                              ...editedUnit.details,
                              introduction: e.target.value,
                            },
                          })
                        }
                        className="description-input"
                      />
                    ) : (
                      <div className="description-text">
                        {currentUnit.details?.introduction}
                      </div>
                    )}
                  </div>
                  <div className="specs-grid">
                    <div className="spec-item">
                      <label>Transmission</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={
                            currentUnit.details?.specifications?.Transmission ||
                            ""
                          }
                          onChange={(e) =>
                            setEditedUnit({
                              ...editedUnit,
                              details: {
                                ...editedUnit.details,
                                specifications: {
                                  ...editedUnit.details.specifications,
                                  Transmission: e.target.value,
                                },
                              },
                            })
                          }
                          className="spec-input"
                        />
                      ) : (
                        <span>
                          {currentUnit.details?.specifications?.Transmission}
                        </span>
                      )}
                    </div>

                    <div className="spec-item">
                      <label>Fuel</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={
                            currentUnit.details?.specifications?.Fuel || ""
                          }
                          onChange={(e) =>
                            setEditedUnit({
                              ...editedUnit,
                              details: {
                                ...editedUnit.details,
                                specifications: {
                                  ...editedUnit.details.specifications,
                                  Fuel: e.target.value,
                                },
                              },
                            })
                          }
                          className="spec-input"
                        />
                      ) : (
                        <span>{currentUnit.details?.specifications?.Fuel}</span>
                      )}
                    </div>

                    <div className="spec-item">
                      <label>Brand</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={currentUnit.brand || ""}
                          onChange={(e) =>
                            setEditedUnit({
                              ...editedUnit,
                              brand: e.target.value,
                            })
                          }
                          className="spec-input"
                        />
                      ) : (
                        <span>{currentUnit.brand}</span>
                      )}
                    </div>

                    <div className="spec-item">
                      <label>Car Type</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={currentUnit.carType || ""}
                          onChange={(e) => {
                            const value = e.target.value;

                            setEditedUnit({
                              ...editedUnit,
                              carType: value,
                              details: {
                                ...editedUnit.details,
                                specifications: {
                                  ...editedUnit.details?.specifications,
                                  Type: value, // Sync to details.specifications.Type
                                },
                              },
                            });
                          }}
                          className="spec-input"
                        />
                      ) : (
                        <span>{currentUnit.carType}</span>
                      )}
                    </div>

                    <div className="spec-item">
                      <label>Color</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={
                            currentUnit.details?.specifications?.Color || ""
                          }
                          onChange={(e) =>
                            setEditedUnit({
                              ...editedUnit,
                              details: {
                                ...editedUnit.details,
                                specifications: {
                                  ...editedUnit.details.specifications,
                                  Color: e.target.value,
                                },
                              },
                            })
                          }
                          className="spec-input"
                        />
                      ) : (
                        <span>
                          {currentUnit.details?.specifications?.Color}
                        </span>
                      )}
                    </div>

                    <div className="spec-item">
                      <label>Capacity</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={
                            currentUnit.details?.specifications?.Capacity || ""
                          }
                          onChange={(e) =>
                            setEditedUnit({
                              ...editedUnit,
                              details: {
                                ...editedUnit.details,
                                specifications: {
                                  ...editedUnit.details.specifications,
                                  Capacity: e.target.value,
                                },
                              },
                            })
                          }
                          className="spec-input"
                        />
                      ) : (
                        <span>
                          {currentUnit.details?.specifications?.Capacity}
                        </span>
                      )}
                    </div>

                    <div className="spec-item">
                      <label>Owner Share</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={currentUnit.ownerShare || ""}
                          onChange={(e) =>
                            setEditedUnit({
                              ...editedUnit,
                              ownerShare: e.target.value,
                            })
                          }
                          className="spec-input"
                        />
                      ) : (
                        <span>{currentUnit.ownerShare}</span>
                      )}
                    </div>

                    <div className="spec-item">
                      <label>Price</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={currentUnit.price || ""}
                          onChange={(e) =>
                            setEditedUnit({
                              ...editedUnit,
                              price: e.target.value,
                            })
                          }
                          className="spec-input"
                        />
                      ) : (
                        <span>{currentUnit.price}</span>
                      )}
                    </div>

                    <div className="spec-item">
                      <label>Driver Rate</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={currentUnit.driverRate || ""}
                          onChange={(e) =>
                            setEditedUnit({
                              ...editedUnit,
                              driverRate: e.target.value,
                            })
                          }
                          className="spec-input"
                        />
                      ) : (
                        <span>{currentUnit.driverRate}</span>
                      )}
                    </div>

                    <div className="spec-item">
                      <label>Extension Rate</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={currentUnit.extension || ""}
                          onChange={(e) =>
                            setEditedUnit({
                              ...editedUnit,
                              extension: e.target.value,
                            })
                          }
                          className="spec-input"
                        />
                      ) : (
                        <span>{currentUnit.extension}</span>
                      )}
                    </div>

                    <div className="spec-item">
                      <label>Delivery Fee</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={currentUnit.deliveryFee || ""}
                          onChange={(e) =>
                            setEditedUnit({
                              ...editedUnit,
                              deliveryFee: e.target.value,
                            })
                          }
                          className="spec-input"
                        />
                      ) : (
                        <span>{currentUnit.deliveryFee}</span>
                      )}
                    </div>

                    <div className="spec-item">
                      <label>Reservation</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={currentUnit.reservation || ""}
                          onChange={(e) =>
                            setEditedUnit({
                              ...editedUnit,
                              reservation: e.target.value,
                            })
                          }
                          className="spec-input"
                        />
                      ) : (
                        <span>{currentUnit.reservation}</span>
                      )}
                    </div>
                  </div>

                  <div className="features-row">
                    <div className="description-row">
                      <label>Features</label>
                      {isEditing ? (
                        <textarea
                          value={
                            currentUnit.details?.specifications?.Features || ""
                          }
                          onChange={(e) =>
                            setEditedUnit({
                              ...editedUnit,
                              details: {
                                ...editedUnit.details,
                                specifications: {
                                  ...editedUnit.details.specifications,
                                  Features: e.target.value,
                                },
                              },
                            })
                          }
                          className="features-input"
                        />
                      ) : (
                        <div className="description-text">
                          {currentUnit.details?.specifications?.Features}
                        </div>
                      )}
                    </div>

                    <div className="description-row">
                      <label>Trunk</label>
                      {isEditing ? (
                        <textarea
                          value={
                            currentUnit.details?.specifications?.Trunk || ""
                          }
                          onChange={(e) =>
                            setEditedUnit({
                              ...editedUnit,
                              details: {
                                ...editedUnit.details,
                                specifications: {
                                  ...editedUnit.details.specifications,
                                  Trunk: e.target.value,
                                },
                              },
                            })
                          }
                          className="features-input"
                        />
                      ) : (
                        <div className="description-text">
                          {currentUnit.details?.specifications?.Trunk}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {!isEditing && !isAddingUnit ? (
                <div className="edit-buttons">
                  <button className="edit-btn" onClick={handleEdit}>
                    Edit
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => setShowDeleteUnitConfirmDialog(true)}
                  >
                    Delete Unit
                  </button>
                </div>
              ) : isEditing ? (
                <div className="edit-buttons">
                  <button
                    className="save-btn"
                    onClick={() => {
                      setPendingUnitSaveAction(isAddingUnit ? "add" : "edit");
                      setShowSaveUnitConfirmDialog(true);
                    }}
                  >
                    Save
                  </button>
                  <button className="cancel-btn" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}

      {showSaveUnitConfirmDialog && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Save Unit Changes?</h3>
            <p>Are you sure you want to save the changes to the unit?</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  setIsSavingUnit(true);
                  if (pendingUnitSaveAction === "add") {
                    handleAddUnit();
                  } else {
                    handleSave();
                  }
                  setShowSaveUnitConfirmDialog(false);
                }}
              >
                Yes, Save
              </button>
              <button
                className="confirm-btn cancel"
                onClick={() => setShowSaveUnitConfirmDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteUnitConfirmDialog && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Delete Unit?</h3>
            <p>
              Are you sure you want to permanently delete <br />
              <strong>
                {" "}
                {currentUnit?.plateNo} ({currentUnit?.name}){" "}
              </strong>
              ? <br />
              This action cannot be undone.
            </p>

            <div className="confirm-buttons">
              <button className="confirm-btn delete" onClick={handleDeleteUnit}>
                Yes, Delete
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowDeleteUnitConfirmDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeletingUnit && (
        <div className="submitting-overlay">
          <div className="loading-container">
            <div className="loading-bar-road">
              <img
                src="/assets/images/submitting.gif"
                alt="Deleting Unit"
                className="car-gif"
              />
            </div>
            <p className="submitting-text-red">Deleting Unit...</p>
          </div>
        </div>
      )}

      {showDeleteSuccess && (
        <div
          className={`date-warning-overlay ${hideDeleteSuccess ? "hide" : ""}`}
        >
          <button
            className="close-warning"
            onClick={() => {
              setHideDeleteSuccess(true);
              setTimeout(() => setShowDeleteSuccess(false), 400);
            }}
          >
            ✖
          </button>

          <span className="warning-text">Unit deleted successfully.</span>

          <div className="progress-bar"></div>
        </div>
      )}

      {showEditConfirmDialog && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Edit Unit Details?</h3>
            <p>Are you sure you want to edit this unit's information?</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={handleConfirmEdit}
              >
                Yes, Edit
              </button>
              <button className="confirm-btn cancel" onClick={handleCancelEdit}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 Loading Overlay (Saving Unit) */}
      {isSavingUnit && (
        <div className="submitting-overlay">
          <div className="loading-container">
            <div className="loading-bar-road">
              <img
                src="/assets/images/submitting.gif"
                alt="Saving unit..."
                className="car-gif"
              />
            </div>
            <p className="submitting-text">Saving unit...</p>
          </div>
        </div>
      )}

      {/* 🟢 Success Overlay (Unit Saved) */}
      {showSavedSuccess && (
        <div
          className={`sent-ongoing-overlay ${hideSavedAnimation ? "hide" : ""}`}
        >
          <button
            className="close-sent-ongoing"
            onClick={() => {
              setHideSavedAnimation(true);
              setTimeout(() => setShowSavedSuccess(false), 400);
            }}
          >
            ✖
          </button>
          <span className="warning-text" style={{ color: "#28a745" }}>
            Unit updated successfully!
          </span>
          <div className="sent-ongoing-progress-bar"></div>
        </div>
      )}

      {showEditMOPConfirmDialog && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>{isAddingMOP ? "Add New MOP" : `Edit "${oldMopType}" MOP`}</h3>

            <p>Are you sure you want to edit this payment method?</p>
            <input
              type="text"
              value={selectedMopType}
              onChange={(e) => setSelectedMopType(e.target.value)}
              placeholder="Enter new name"
              className="confirm-input"
            />
            <div className="confirm-buttons">
              {!isAddingMOP && (
                <button
                  className="confirm-btn cancel"
                  onClick={() => {
                    setPendingMOPAction("delete");
                    setShowMOPFinalConfirm(true);
                  }}
                >
                  Delete
                </button>
              )}

              <button
                className="confirm-btn delete"
                onClick={() => {
                  setPendingMOPAction("save");
                  setShowMOPFinalConfirm(true);
                }}
              >
                Save
              </button>

              <button
                className="confirm-btn cancel"
                onClick={handleCancelMOPEdit}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showMOPFinalConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>
              {pendingMOPAction === "delete"
                ? `Delete "${oldMopType}" Payment Method?`
                : `Save "${selectedMopType}" Payment Method?`}
            </h3>

            <p>
              {pendingMOPAction === "delete"
                ? `Are you sure you want to delete this payment method?`
                : `Are you sure you want to save this payment method?`}
            </p>

            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  setIsSavingMOP(true);

                  if (pendingMOPAction === "delete") {
                    handleDeleteMOP();
                    setMOPSuccessAction("delete");
                  } else {
                    handleMOPConfirmEdit();
                    setMOPSuccessAction("save");
                  }

                  setIsSavingMOP(false);
                  setShowMOPFinalConfirm(false);
                  setShowEditMOPConfirmDialog(false);
                  setShowMOPSuccess(true);
                }}
              >
                Yes
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowMOPFinalConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 Loading Overlay (Saving MOP) */}
      {isSavingMOP && (
        <div className="submitting-overlay">
          <div className="loading-container">
            <div className="loading-bar-road">
              <img
                src="/assets/images/submitting.gif"
                alt="Saving payment method..."
                className="car-gif"
              />
            </div>
            <p className="submitting-text">
              {pendingMOPAction === "delete"
                ? "Deleting payment method..."
                : "Saving payment method..."}
            </p>
          </div>
        </div>
      )}

      {showMOPSuccess &&
        (mopSuccessAction === "delete" ? (
          <div
            className={`date-warning-overlay ${
              hideMOPSuccessAnimation ? "hide" : ""
            }`}
          >
            <button
              className="close-warning"
              onClick={() => {
                setHideMOPSuccessAnimation(true);
                setTimeout(() => {
                  setShowMOPSuccess(false);
                  setHideMOPSuccessAnimation(false);
                }, 400);
              }}
            >
              ✖
            </button>

            <span className="warning-text" style={{ color: "#dc3545" }}>
              Payment method deleted successfully!
            </span>

            <div className="progress-bar"></div>
          </div>
        ) : (
          <div
            className={`sent-ongoing-overlay ${
              hideMOPSuccessAnimation ? "hide" : ""
            }`}
          >
            <button
              className="close-sent-ongoing"
              onClick={() => {
                setHideMOPSuccessAnimation(true);
                setTimeout(() => {
                  setShowMOPSuccess(false);
                  setHideMOPSuccessAnimation(false);
                }, 400);
              }}
            >
              ✖
            </button>

            <span className="warning-text" style={{ color: "#28a745" }}>
              Payment method saved successfully!
            </span>

            <div className="sent-ongoing-progress-bar"></div>
          </div>
        ))}

      {showEditPOPConfirmDialog && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>
              {isAddingPOP
                ? `Add New ${selectedMopPop}`
                : `Edit "${oldPOPType}" ${selectedMopPop}`}
            </h3>
            <p>Are you sure you want to edit this {selectedMopPop} type?</p>
            <input
              type="text"
              value={selectedPOPType}
              onChange={(e) => setSelectedPOPType(e.target.value)}
              placeholder="Enter new POP type"
              className="confirm-input"
            />
            <div className="confirm-buttons">
              {!isAddingPOP && (
                <button
                  className="confirm-btn cancel"
                  onClick={() => handleDeletePOP(oldPOPType)}
                >
                  Delete
                </button>
              )}
              <button
                className="confirm-btn delete"
                onClick={handlePOPConfirmEdit}
              >
                Save
              </button>
              <button
                className="confirm-btn cancel"
                onClick={() => setShowEditPOPConfirmDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showPOPFinalConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>
              {pendingPOPAction === "delete"
                ? `Delete "${oldPOPType}" ${selectedMopPop}?`
                : `Save "${selectedPOPType}" ${selectedMopPop}?`}
            </h3>
            <p>
              {pendingPOPAction === "delete"
                ? `Are you sure you want to delete this ${selectedMopPop}?`
                : `Are you sure you want to save this ${selectedMopPop}?`}
            </p>

            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  setIsSavingPOP(true);

                  if (pendingPOPAction === "delete") {
                    if (selectedMopPop === "POP") {
                      setPopTypesRevenue(
                        popTypesRevenue.filter((t) => t !== oldPOPType),
                      );
                    } else {
                      setPopTypesExpense(
                        popTypesExpense.filter((t) => t !== oldPOPType),
                      );
                    }
                    setPOPSuccessAction("delete");
                  } else {
                    if (isAddingPOP) {
                      if (selectedMopPop === "POP")
                        setPopTypesRevenue([
                          ...popTypesRevenue,
                          selectedPOPType,
                        ]);
                      else
                        setPopTypesExpense([
                          ...popTypesExpense,
                          selectedPOPType,
                        ]);
                    } else {
                      if (popTypesRevenue.includes(oldPOPType)) {
                        setPopTypesRevenue(
                          popTypesRevenue.map((t) =>
                            t === oldPOPType ? selectedPOPType : t,
                          ),
                        );
                      } else if (popTypesExpense.includes(oldPOPType)) {
                        setPopTypesExpense(
                          popTypesExpense.map((t) =>
                            t === oldPOPType ? selectedPOPType : t,
                          ),
                        );
                      }
                    }
                    setPOPSuccessAction("save");
                  }

                  setIsSavingPOP(false);
                  setShowPOPFinalConfirm(false);
                  setShowEditPOPConfirmDialog(false);
                  setShowPOPSuccess(true);
                }}
              >
                Yes
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowPOPFinalConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isSavingPOP && (
        <div className="submitting-overlay">
          <div className="loading-container">
            <div className="loading-bar-road">
              <img
                src="/assets/images/submitting.gif"
                alt="Saving..."
                className="car-gif"
              />
            </div>
            <p className="submitting-text">
              {pendingPOPAction === "delete"
                ? `Deleting ${selectedMopPop}...`
                : `Saving ${selectedMopPop}...`}
            </p>
          </div>
        </div>
      )}

      {showPOPSuccess &&
        (popSuccessAction === "delete" ? (
          <div
            className={`date-warning-overlay ${
              hidePOPSuccessAnimation ? "hide" : ""
            }`}
          >
            <button
              className="close-warning"
              onClick={() => {
                setHidePOPSuccessAnimation(true);
                setTimeout(() => {
                  setShowPOPSuccess(false);
                  setHidePOPSuccessAnimation(false);
                }, 400);
              }}
            >
              ✖
            </button>
            <span className="warning-text" style={{ color: "#dc3545" }}>
              {selectedMopPop} deleted successfully!
            </span>
            <div className="progress-bar"></div>
          </div>
        ) : (
          <div
            className={`sent-ongoing-overlay ${
              hidePOPSuccessAnimation ? "hide" : ""
            }`}
          >
            <button
              className="close-sent-ongoing"
              onClick={() => {
                setHidePOPSuccessAnimation(true);
                setTimeout(() => {
                  setShowPOPSuccess(false);
                  setHidePOPSuccessAnimation(false);
                }, 400);
              }}
            >
              ✖
            </button>
            <span className="warning-text" style={{ color: "#28a745" }}>
              {selectedMopPop} saved successfully!
            </span>
            <div className="sent-ongoing-progress-bar"></div>
          </div>
        ))}

      {showEditReferralConfirmDialog && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>
              {isAddingReferral
                ? "Add New Referral Source"
                : `Edit "${oldReferral}" Referral Source`}
            </h3>

            <p>
              Are you sure you want to {isAddingReferral ? "add" : "edit"} this
              referral source?
            </p>

            <input
              type="text"
              value={selectedReferral}
              onChange={(e) => setSelectedReferral(e.target.value)}
              placeholder="Enter referral source"
              className="confirm-input"
            />

            <div className="confirm-buttons">
              {!isAddingReferral && (
                <button
                  className="confirm-btn cancel"
                  onClick={() => handleDeleteReferral(oldReferral)}
                >
                  Delete
                </button>
              )}

              <button
                className="confirm-btn delete"
                onClick={handleReferralConfirmEdit}
              >
                Save
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowEditReferralConfirmDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showReferralFinalConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>
              {pendingReferralAction === "delete"
                ? `Delete "${oldReferral}" Referral Source?`
                : `Save "${selectedReferral}" Referral Source?`}
            </h3>

            <p>
              {pendingReferralAction === "delete"
                ? "Are you sure you want to delete this referral source?"
                : "Are you sure you want to save this referral source?"}
            </p>

            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  setIsSavingReferral(true);

                  let updatedSources;

                  if (pendingReferralAction === "delete") {
                    updatedSources = referralSources.filter(
                      (r) => r !== oldReferral,
                    );
                    setReferralSuccessAction("delete");
                  } else {
                    updatedSources = isAddingReferral
                      ? [...referralSources, selectedReferral.trim()]
                      : referralSources.map((r) =>
                          r === oldReferral ? selectedReferral.trim() : r,
                        );
                    setReferralSuccessAction("save");
                  }

                  setReferralSources(updatedSources);

                  setIsSavingReferral(false);
                  setShowReferralFinalConfirm(false);
                  setShowEditReferralConfirmDialog(false);
                  setShowReferralSuccess(true);
                }}
              >
                Yes
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowReferralFinalConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isSavingReferral && (
        <div className="submitting-overlay">
          <div className="loading-container">
            <div className="loading-bar-road">
              <img
                src="/assets/images/submitting.gif"
                alt="Saving..."
                className="car-gif"
              />
            </div>
            <p className="submitting-text">
              {pendingReferralAction === "delete"
                ? "Deleting referral source..."
                : "Saving referral source..."}
            </p>
          </div>
        </div>
      )}

      {showReferralSuccess &&
        (referralSuccessAction === "delete" ? (
          <div
            className={`date-warning-overlay ${
              hideReferralSuccessAnimation ? "hide" : ""
            }`}
          >
            <button
              className="close-warning"
              onClick={() => {
                setHideReferralSuccessAnimation(true);
                setTimeout(() => {
                  setShowReferralSuccess(false);
                  setHideReferralSuccessAnimation(false);
                }, 400);
              }}
            >
              ✖
            </button>

            <span className="warning-text" style={{ color: "#dc3545" }}>
              Referral source deleted successfully!
            </span>

            <div className="progress-bar"></div>
          </div>
        ) : (
          <div
            className={`sent-ongoing-overlay ${
              hideReferralSuccessAnimation ? "hide" : ""
            }`}
          >
            <button
              className="close-sent-ongoing"
              onClick={() => {
                setHideReferralSuccessAnimation(true);
                setTimeout(() => {
                  setShowReferralSuccess(false);
                  setHideReferralSuccessAnimation(false);
                }, 400);
              }}
            >
              ✖
            </button>

            <span className="warning-text" style={{ color: "#28a745" }}>
              Referral source saved successfully!
            </span>

            <div className="sent-ongoing-progress-bar"></div>
          </div>
        ))}

      {showClientDetailsOverlay && selectedClient && (
        <div className="unit-details-overlay">
          <div className="unit-details-content">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowClientDetailsOverlay(false)}
            >
              <img
                src="/assets/close_0.png"
                alt="Close"
                className="close-icon close-icon-0"
              />
              <img
                src="/assets/close_1.png"
                alt="Close"
                className="close-icon close-icon-1"
              />
            </button>

            <h3 className="client-details-title">Client Details</h3>

            <div
              className="unit-details-scrollable"
              style={{ overflow: "auto" }}
            >
              <div className="client-details-layout">
                {/* Top Row: 2 Columns */}

                <div className="client-top-row">
                  <div className="client-profile-column">
                    {/* LEFT: Profile Picture */}
                    <div className="client-profile-left">
                      <img
                        src={
                          selectedClient.isRegistered
                            ? userAccounts.find(
                                (u) => u.email === selectedClient.email,
                              )?.profilePic || "/assets/profile.png"
                            : "/assets/profile.png"
                        }
                        alt={selectedClient.name}
                        className="client-profile-pic"
                      />
                    </div>

                    {/* RIGHT: Client Information */}
                    <div className="client-profile-right">
                      <h3>{selectedClient.name}</h3>

                      <p>
                        <strong style={{ color: "var(--accent-color)" }}>
                          Email:
                        </strong>{" "}
                        {selectedClient.email}
                      </p>

                      <p>
                        <strong style={{ color: "var(--accent-color)" }}>
                          Contact:
                        </strong>{" "}
                        {selectedClient.contact || "N/A"}
                      </p>

                      <p>
                        <strong style={{ color: "var(--accent-color)" }}>
                          Address:
                        </strong>{" "}
                        {selectedClient.address || "N/A"}
                      </p>

                      <p>
                        <strong style={{ color: "var(--accent-color)" }}>
                          Occupation:
                        </strong>{" "}
                        {selectedClient.occupation || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="client-info-column">
                    <div className="client-stats-admin">
                      <div className="client-stats-row">
                        <div className="client-summary-box bookings">
                          <div className="client-box-content">
                            <p className="client-analytics-label">Bookings:</p>
                            <p className="client-analytics-value">
                              {selectedClient.bookingsCount}
                            </p>
                          </div>
                          <div className="box-icon">
                            <img src="/assets/bookings.png" alt="Bookings" />
                          </div>
                        </div>
                        <div className="client-summary-box due">
                          <div className="client-box-content">
                            <p className="client-analytics-label">
                              Balance Due:
                            </p>
                            <p className="client-analytics-value">
                              ₱
                              {selectedClient.totalDue.toLocaleString("en-PH", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                          <div className="box-icon">
                            <img
                              src="/assets/dueBalance.png"
                              alt="Balance Due"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="client-summary-box profit">
                        <div className="client-box-content">
                          <p className="client-analytics-label">
                            Favorite Car:
                          </p>
                          <p className="client-analytics-value">
                            {(() => {
                              const clientBookings = [
                                ...activeBookings,
                                ...Object.values(
                                  completedBookingsAnalytics,
                                ).flatMap((car) => car.bookings || []),
                              ].filter((b) => b.email === selectedClient.email);
                              const carCounts = {};
                              clientBookings.forEach((b) => {
                                carCounts[b.carName] =
                                  (carCounts[b.carName] || 0) + 1;
                              });
                              const favoriteCar = (() => {
                                const clientBookings = Object.values(
                                  completedBookingsAnalytics,
                                )
                                  .flatMap((car) => car.bookings || [])
                                  .filter(
                                    (b) => b.email === selectedClient.email,
                                  );

                                const carCounts = {};
                                clientBookings.forEach((b) => {
                                  carCounts[b.carName] =
                                    (carCounts[b.carName] || 0) + 1;
                                });

                                return Object.keys(carCounts).reduce(
                                  (a, b) =>
                                    carCounts[a] > carCounts[b] ? a : b,
                                  "N/A",
                                );
                              })();

                              return favoriteCar;
                            })()}
                          </p>
                        </div>
                        <div className="box-icon">
                          <img
                            src="/assets/unpaidBookings.png"
                            alt="Favorite Car"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Bookings Table */}
                <div className="client-bookings-row">
                  <h3>Booking History</h3>
                  <div className="client-bookings-table-container">
                    <table className="client-bookings-table">
                      <thead>
                        <tr>
                          <th>Car Image</th>
                          <th>Car Name</th>
                          <th>Start - End</th>
                          <th>Days Rented</th>
                          <th>Location</th>
                          <th>Total Price</th>
                          <th>Total Paid</th>
                          <th>Due Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const clientBookings = Object.values(
                            completedBookingsAnalytics,
                          )
                            .flatMap((car) => car.bookings || [])
                            .filter((b) => b.email === selectedClient.email);

                          return clientBookings.map((booking, index) => {
                            const startDate = booking.startTimestamp
                              ? new Date(booking.startTimestamp.seconds * 1000)
                              : null;
                            const endDate = booking.endTimestamp
                              ? new Date(booking.endTimestamp.seconds * 1000)
                              : null;
                            const startStr = startDate
                              ? formatDate(startDate)
                              : "N/A";
                            const endStr = endDate
                              ? formatDate(endDate)
                              : "N/A";
                            const daysRented = booking.rentalDuration
                              ? `${booking.rentalDuration.days}d${
                                  booking.rentalDuration.extraHours > 0
                                    ? ` + ${booking.rentalDuration.extraHours}hr`
                                    : ""
                                }`
                              : "N/A";

                            const unit = unitData.find(
                              (u) => u.plateNo === booking.plateNo,
                            );
                            const imageId =
                              booking.imageId ||
                              unit?.imageId ||
                              `${booking.plateNo}_main`;
                            const image = fetchedImages[imageId];

                            return (
                              <tr
                                key={index}
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setShowDetailsOverlay(true);
                                }}
                                style={{ cursor: "pointer" }}
                                className="table-row"
                              >
                                <td>
                                  <img
                                    src={
                                      image?.base64 ||
                                      "/assets/images/default.png"
                                    }
                                    alt={booking.carName || "Car Image"}
                                    className="booking-car-image"
                                  />
                                </td>
                                <td>{booking.carName}</td>
                                <td>
                                  {startStr} <br /> to <br /> {endStr}
                                </td>
                                <td>{daysRented}</td>
                                <td>{booking.location || "N/A"}</td>
                                <td>
                                  ₱
                                  {booking.totalPrice?.toLocaleString("en-PH", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }) || "0.00"}
                                </td>
                                <td>
                                  ₱
                                  {booking.totalPaid?.toLocaleString("en-PH", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }) || "0.00"}
                                </td>
                                <td>
                                  ₱
                                  {booking.balanceDue?.toLocaleString("en-PH", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }) || "0.00"}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isImageModalOpen && modalImage && (
        <div
          className="admin-image-modal-overlay"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="image-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={modalImage}
              alt="Driver's License"
              className="admin-full-image-view"
              style={{ width: "90vw", height: "90vh", objectFit: "contain" }}
            />
          </div>
        </div>
      )}

      {showDetailsOverlay && selectedBooking && (
        <div className="admin-booking-confirm-overlay">
          <div className="admin-booking-confirm-container">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowDetailsOverlay(false)}
            >
              <img
                src="/assets/close_0.png"
                alt="Close"
                className="close-icon close-icon-0"
              />
              <img
                src="/assets/close_1.png"
                alt="Close"
                className="close-icon close-icon-1"
              />
            </button>

            <h3 className="confirm-header">RENTAL DETAILS</h3>
            <p className="confirm-text">
              Detailed information about this rental.
            </p>

            <div className="admin-confirm-details">
              <div className="admin-confirm-scroll-container">
                <div className="admin-confirm-details">
                  <div className="confirm-row">
                    <strong className="confirm-label">Car Selected:</strong>
                    <span className="confirm-value">
                      {selectedBooking.carName}
                    </span>
                  </div>

                  <div className="confirm-row">
                    <strong className="confirm-label">Drive Type:</strong>
                    <span className="confirm-value">
                      {selectedBooking.drivingOption}
                    </span>
                  </div>

                  {selectedBooking.drivingOption === "With Driver" &&
                    selectedBooking.assignedDriver && (
                      <div className="confirm-row">
                        <strong className="confirm-label">
                          Assigned Driver:
                        </strong>
                        <span className="confirm-value">
                          {selectedBooking.assignedDriver}
                        </span>
                      </div>
                    )}

                  <div className="confirm-row">
                    <strong className="confirm-label">Drop-off Type:</strong>
                    <span className="confirm-value">
                      {selectedBooking.pickupOption}
                    </span>
                  </div>

                  {selectedBooking.pickupOption === "Drop-off" &&
                    selectedBooking.dropoffLocation && (
                      <div className="confirm-row">
                        <strong className="confirm-label">
                          Drop-off Location:
                        </strong>
                        <span className="confirm-value">
                          {selectedBooking.dropoffLocation}
                        </span>
                      </div>
                    )}

                  <div className="confirm-row">
                    <strong className="confirm-label">Rental Period:</strong>
                    <span className="confirm-value">
                      {formatDateTime(
                        selectedBooking.startTimestamp?.toDate?.() ||
                          new Date(
                            `${selectedBooking.startDate}T${selectedBooking.startTime}`,
                          ),
                      )}
                      <br />
                      to <br />
                      {formatDateTime(
                        selectedBooking.endTimestamp?.toDate?.() ||
                          new Date(
                            `${selectedBooking.endDate}T${selectedBooking.endTime}`,
                          ),
                      )}
                    </span>
                  </div>

                  <div className="confirm-row">
                    <strong className="confirm-label">Travel Location:</strong>
                    <span className="confirm-value">
                      {selectedBooking.location}
                    </span>
                  </div>

                  <div className="confirm-row">
                    <strong className="confirm-label">Purpose:</strong>
                    <span className="confirm-value">
                      {selectedBooking.purpose}
                    </span>
                  </div>

                  <div className="confirm-row">
                    <strong className="confirm-label">Referral Source:</strong>
                    <span className="confirm-value">
                      {selectedBooking.referralSource || "Not specified"}
                    </span>
                  </div>

                  <div className="confirm-row">
                    <strong className="confirm-label">
                      Additional Message:
                    </strong>
                    <span className="confirm-value">
                      {selectedBooking.additionalMessage}
                    </span>
                  </div>

                  {selectedBooking?.paymentEntries?.length > 0 && (
                    <div className="confirm-row">
                      <strong className="confirm-label">Payments:</strong>
                      <span className="confirm-value">
                        {selectedBooking.paymentEntries.map((entry, index) => (
                          <div key={index} style={{ marginBottom: "0.5rem" }}>
                            <br />₱{Number(entry.amount).toLocaleString()}{" "}
                            <br />
                            {entry.mop} |{" "}
                            {entry.pop
                              .toLowerCase()
                              .split(" ")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1),
                              )
                              .join(" ")}{" "}
                            <br />
                            {formatPaymentDate(entry.date)}
                          </div>
                        ))}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-confirm-details">
                <h4 className="confirm-subtitle">PERSONAL INFORMATION</h4>
                <div className="confirm-row">
                  <strong className="confirm-label">Name:</strong>
                  <span className="confirm-value">
                    {selectedBooking.firstName} {selectedBooking.middleName}{" "}
                    {selectedBooking.surname}
                  </span>
                </div>

                <div className="confirm-row">
                  <strong className="confirm-label">Contact:</strong>
                  <span className="confirm-value">
                    {selectedBooking.contact}
                  </span>
                </div>

                <div className="confirm-row">
                  <strong className="confirm-label">Email:</strong>
                  <span className="confirm-value">{selectedBooking.email}</span>
                </div>

                <div className="confirm-row">
                  <strong className="confirm-label">Occupation:</strong>
                  <span className="confirm-value">
                    {selectedBooking.occupation}
                  </span>
                </div>

                <div className="confirm-row">
                  <strong className="confirm-label">Current Address:</strong>
                  <span className="confirm-value">
                    {selectedBooking.address}
                  </span>
                </div>

                <h4 className="confirm-subtitle">DRIVER'S LICENSE</h4>
                <div className="admin-confirm-image-container">
                  {selectedBooking.driverLicense ? (
                    <img
                      src={selectedBooking.driverLicense}
                      alt="Driver's License"
                      className="admin-confirm-id-preview"
                      onClick={() => {
                        setModalImage(selectedBooking.driverLicense);
                        setIsImageModalOpen(true);
                      }}
                    />
                  ) : (
                    <p className="confirm-no-id">No file uploaded</p>
                  )}
                </div>

                <h4 className="confirm-subtitle">QUOTATION SUMMARY</h4>
                <ul className="admin-confirm-summary-list">
                  <div className="admin-confirm-scroll-container">
                    <li>
                      <strong className="summary-label">
                        (
                        <span style={{ color: "#28a745" }}>
                          {selectedBooking.carName}
                        </span>
                        ):
                      </strong>

                      <span className="summary-value">
                        (₱{selectedBooking.discountedRate.toLocaleString()} x{" "}
                        {selectedBooking.billedDays} Day
                        {selectedBooking.billedDays > 1 ? "s" : ""}) ₱
                        {(
                          selectedBooking.discountedRate *
                          selectedBooking.billedDays
                        ).toLocaleString()}
                      </span>
                    </li>
                    <li>
                      <strong className="summary-label">
                        (
                        <span style={{ color: "#28a745" }}>
                          {selectedBooking.drivingOption}
                        </span>
                        ):
                      </strong>

                      <span className="summary-value">
                        {selectedBooking.drivingPrice > 0 ? (
                          <>
                            (₱{selectedBooking.drivingPrice.toLocaleString()} x{" "}
                            {selectedBooking.billedDays} Day
                            {selectedBooking.billedDays > 1 ? "s" : ""}) ₱
                            {(
                              selectedBooking.drivingPrice *
                              selectedBooking.billedDays
                            ).toLocaleString()}
                          </>
                        ) : (
                          <>₱0</>
                        )}
                      </span>
                    </li>
                    <li>
                      <strong className="summary-label">
                        (
                        <span style={{ color: "#28a745" }}>
                          {selectedBooking.pickupOption}
                        </span>
                        ):
                      </strong>
                      <span className="summary-value">
                        ₱{selectedBooking.pickupPrice.toLocaleString()}
                      </span>
                    </li>
                    <li>
                      <strong className="summary-label">
                        Rental Duration:
                      </strong>
                      <span className="summary-value">
                        ({selectedBooking.billedDays} Day /{" "}
                        {selectedBooking.rentalDuration.isFlatRateSameDay ? (
                          <>
                            for{" "}
                            <span style={{ color: "#dc3545" }}>
                              {Math.floor(
                                selectedBooking.rentalDuration.actualSeconds /
                                  3600,
                              )}
                              {Math.floor(
                                selectedBooking.rentalDuration.actualSeconds /
                                  3600,
                              ) === 1
                                ? "hr"
                                : "hrs"}
                            </span>{" "}
                            only
                          </>
                        ) : (
                          `${24 * selectedBooking.billedDays} hrs`
                        )}
                        )
                        <br />
                        {selectedBooking.rentalDuration.extraHours > 0 && (
                          <>
                            (
                            <span style={{ color: "#dc3545" }}>
                              +{selectedBooking.rentalDuration.extraHours}{" "}
                              {selectedBooking.rentalDuration.extraHours === 1
                                ? "hr"
                                : "hrs"}{" "}
                              | ₱
                              {(
                                selectedBooking.extraHourCharge || 0
                              ).toLocaleString()}
                            </span>
                            )
                          </>
                        )}
                      </span>
                    </li>

                    {(() => {
                      const discountValue = Number(
                        selectedBooking.discountValue || 0,
                      );
                      const discountType =
                        selectedBooking.discountType || "peso";

                      if (discountValue > 0) {
                        return (
                          <li>
                            <strong className="summary-label">Discount:</strong>
                            <span
                              className="summary-value"
                              style={{ color: "#dc3545" }}
                            >
                              {discountType === "peso"
                                ? `- ₱${discountValue.toLocaleString()}`
                                : `- ${discountValue}%`}
                            </span>
                          </li>
                        );
                      }

                      return null;
                    })()}

                    {(() => {
                      if (
                        selectedBooking.paymentEntries &&
                        selectedBooking.paymentEntries.length > 0
                      ) {
                        return selectedBooking.paymentEntries.map(
                          (entry, index) => {
                            // Convert pop to Title Case (capitalize each word)
                            const titleCasePop = entry.pop
                              ? entry.pop
                                  .toLowerCase()
                                  .split(" ")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1),
                                  )
                                  .join(" ")
                              : "";

                            return (
                              <li key={index}>
                                <strong className="summary-label">
                                  {formatPaymentDate(entry.date)} <br />
                                  {entry.mop} | {titleCasePop}
                                </strong>
                                <span
                                  className="summary-value"
                                  style={{ color: "#dc3545" }}
                                >
                                  - ₱{Number(entry.amount).toLocaleString()}
                                </span>
                              </li>
                            );
                          },
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {(() => {
                    const discountValue = Number(
                      selectedBooking.discountValue || 0,
                    );
                    const discountType = selectedBooking.discountType || "peso";
                    const rawTotal =
                      selectedBooking.billedDays *
                        selectedBooking.discountedRate +
                      selectedBooking.billedDays *
                        selectedBooking.drivingPrice +
                      selectedBooking.extraHourCharge +
                      selectedBooking.pickupPrice;
                    let discountAmount = 0;
                    if (discountType === "peso") {
                      discountAmount = Math.min(discountValue, rawTotal);
                    } else if (discountType === "percent") {
                      discountAmount = Math.min(
                        (discountValue / 100) * rawTotal,
                        rawTotal,
                      );
                    }
                    const discountedTotal = Math.max(
                      0,
                      rawTotal - discountAmount,
                    );
                    return (
                      <li className="confirm-total-price">
                        <strong className="summary-label">Total Price:</strong>
                        <span className="summary-value">
                          ₱{discountedTotal.toLocaleString()}
                        </span>
                      </li>
                    );
                  })()}

                  {(() => {
                    const discountValue = Number(
                      selectedBooking.discountValue || 0,
                    );
                    const discountType = selectedBooking.discountType || "peso";
                    const rawTotal =
                      selectedBooking.billedDays *
                        selectedBooking.discountedRate +
                      selectedBooking.billedDays *
                        selectedBooking.drivingPrice +
                      selectedBooking.extraHourCharge +
                      selectedBooking.pickupPrice;
                    let discountAmount = 0;
                    if (discountType === "peso") {
                      discountAmount = Math.min(discountValue, rawTotal);
                    } else if (discountType === "percent") {
                      discountAmount = Math.min(
                        (discountValue / 100) * rawTotal,
                        rawTotal,
                      );
                    }
                    const discountedTotal = Math.max(
                      0,
                      rawTotal - discountAmount,
                    );
                    const totalPaid = (
                      selectedBooking.paymentEntries || []
                    ).reduce(
                      (sum, entry) => sum + Number(entry.amount || 0),
                      0,
                    );
                    const balanceDue = Math.max(0, discountedTotal - totalPaid);
                    return (
                      <>
                        <li>
                          <strong className="summary-label">Total Paid:</strong>
                          <span
                            className="summary-value"
                            style={{ color: "#dc3545" }}
                          >
                            - ₱{totalPaid.toLocaleString()}
                          </span>
                        </li>
                        <li className="confirm-total-price">
                          <strong
                            className="summary-label"
                            style={{
                              color:
                                selectedBooking.balanceDue === 0
                                  ? "#28a745"
                                  : "#ffb347",
                            }}
                          >
                            Balance Due:
                          </strong>
                          <span
                            className="summary-value"
                            style={{
                              fontSize: "1.5rem",
                              color:
                                Number(selectedBooking.balanceDue) === 0
                                  ? "#28a745"
                                  : "#dc3545",
                            }}
                          >
                            ₱{balanceDue.toLocaleString()}
                          </span>
                        </li>
                      </>
                    );
                  })()}
                </ul>
              </div>

              <div className="confirm-details-button-group">
                <button
                  className="confirm-details-btn"
                  onClick={() => setShowDetailsOverlay(false)}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditContentConfirmDialog && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Edit Content?</h3>
            <p>Are you sure you want to edit the content?</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  setIsEditingContent(true);
                  setOriginalContentImages(
                    JSON.parse(JSON.stringify(contentImages)),
                  );
                  setOriginalTestimonials([...testimonials]);
                  setShowEditContentConfirmDialog(false);
                }}
              >
                Yes, Edit
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowEditContentConfirmDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveContentConfirmDialog && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Save Content Changes?</h3>
            <p>Are you sure you want to save the changes to the content?</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  setIsSavingContent(true);
                  handleSaveContent(); // Call the new handler
                  setShowSaveContentConfirmDialog(false);
                }}
              >
                Yes, Save
              </button>
              <button
                className="confirm-btn cancel"
                onClick={() => setShowSaveContentConfirmDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 Loading Overlay (Saving Content) */}
      {isSavingContent && (
        <div className="submitting-overlay">
          <div className="loading-container">
            <div className="loading-bar-road">
              <img
                src="/assets/images/submitting.gif"
                alt="Saving content..."
                className="car-gif"
              />
            </div>
            <p className="submitting-text">Saving content...</p>
          </div>
        </div>
      )}

      {/* 🟢 Success Overlay (Content Saved) */}
      {showContentSavedSuccess && (
        <div
          className={`sent-ongoing-overlay ${
            hideContentSavedAnimation ? "hide" : ""
          }`}
        >
          <button
            className="close-sent-ongoing"
            onClick={() => {
              setHideContentSavedAnimation(true);
              setTimeout(() => setShowContentSavedSuccess(false), 400);
            }}
          >
            ✖
          </button>
          <span className="warning-text" style={{ color: "#28a745" }}>
            Content updated successfully!
          </span>
          <div className="sent-ongoing-progress-bar"></div>
        </div>
      )}

      {/* ================= Admin Error Overlay ================= */}
      {showAdminError && (
        <div className="error-overlay" onClick={closeAdminError}>
          <div className="error-container" onClick={(e) => e.stopPropagation()}>
            <div className="error-icon">
              <MdClose size={32} />
            </div>
            <h3>Error!</h3>
            <p>{adminErrorMessage}</p>
            <button className="error-btn" onClick={closeAdminError}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// export default AdminSettings;

export default React.memo(AdminSettings);

///////////////////////////////////////////////////////////////////////////////////////////////////

// const mopData = useMemo(() => {
//   const counts = {};
//   const balances = {};
//   const recents = {};
//   Object.values(revenueGrid).forEach((monthRows) => {
//     monthRows.forEach((row) => {
//       const mop = row[2];
//       const amountStr = row[1];
//       const dateStr = row[4];
//       if (mop && amountStr) {
//         counts[mop] = (counts[mop] || 0) + 1;
//         const amount = parseFloat(amountStr.replace(/[^\d.-]/g, ""));
//         balances[mop] = (balances[mop] || 0) + amount;
//         const date = new Date(dateStr);
//         if (date && (!recents[mop] || date > recents[mop])) {
//           recents[mop] = date;
//         }
//       }
//     });
//   });
//   return { counts, balances, recents };
// }, [revenueGrid]);

// const popData = useMemo(() => {
//   const counts = {};
//   const balances = {};
//   const recents = {};
//   Object.values(revenueGrid).forEach((monthRows) => {
//     monthRows.forEach((row) => {
//       const pop = row[3];
//       const amountStr = row[1];
//       const dateStr = row[4];
//       if (pop && amountStr) {
//         counts[pop] = (counts[pop] || 0) + 1;
//         const amount = parseFloat(amountStr.replace(/[^\d.-]/g, ""));
//         balances[pop] = (balances[pop] || 0) + amount;
//         const date = new Date(dateStr);
//         if (date && (!recents[pop] || date > recents[pop])) {
//           recents[pop] = date;
//         }
//       }
//     });
//   });
//   return { counts, balances, recents };
// }, [revenueGrid]);

// const poeData = useMemo(() => {
//   const counts = {};
//   const balances = {};
//   const recents = {};
//   Object.values(expenseGrid).forEach((monthRows) => {
//     monthRows.forEach((row) => {
//       const poe = row[3];
//       const amountStr = row[1];
//       const dateStr = row[4];
//       if (poe && amountStr) {
//         counts[poe] = (counts[poe] || 0) + 1;
//         const amount = parseFloat(amountStr.replace(/[^\d.-]/g, ""));
//         balances[poe] = (balances[poe] || 0) + amount;
//         const date = new Date(dateStr);
//         if (date && (!recents[poe] || date > recents[poe])) {
//           recents[poe] = date;
//         }
//       }
//     });
//   });
//   return { counts, balances, recents };
// }, [expenseGrid]);

//   // Filter units by search term ONLY, ignore hidden
// const filteredUnitData =
//   allUnitData?.filter((car) => {
//     if (!searchTerm) return true;
//     const search = searchTerm.toLowerCase();
//     const analytics = completedBookingsAnalytics[car.plateNo];
//     const bookingsCount = analytics?.bookings?.length || 0;
//     return (
//       car.name.toLowerCase().includes(search) ||
//       car.plateNo.toLowerCase().includes(search) ||
//       String(car.owner || "")
//         .toLowerCase()
//         .includes(search) ||
//       car.carType.toLowerCase().includes(search) ||
//       String(car.details?.specifications?.Transmission || "")
//         .toLowerCase()
//         .includes(search) ||
//       String(car.details?.specifications?.Fuel || "")
//         .toLowerCase()
//         .includes(search) ||
//       String(car.details?.specifications?.Capacity || "")
//         .toLowerCase()
//         .includes(search) ||
//       String(car.details?.specifications?.Color || "")
//         .toLowerCase()
//         .includes(search) ||
//       bookingsCount.toString().includes(search)
//     );
//   }) || [];
