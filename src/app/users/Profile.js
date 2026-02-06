'use client';
import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from 'next/navigation';

import { useUser } from "../lib/UserContext";
import { auth } from "../lib/firebase";

import "./Profile.css";


const Profile = ({ openBooking }) => {
    const pathname = usePathname();
  const router = useRouter();


  const {
    user,
    updateUser,
    revertUserData,
    deleteUserAccount,
    userMessages,
    sentMessages,
    markMessageAsRead,
    deleteMessage,
    sendMessage,
    cancelUserBookingRequest,

    userBookingRequests,
    fetchUserBookingRequests,
    userActiveRentals,
    fetchUserActiveRentals,
    userRentalHistory,
    compressAndConvertFileToBase64,

    markUserRentalAsCompleted,

    linkAccount,
    unlinkAccount,

    showActionOverlay,
    sendVerificationEmail,
    showVerifyOverlay,
    setShowVerifyOverlay,
    reloadAndSyncUser,
    unitData,
    fetchImageFromFirestore,
    imageUpdateTrigger,
  } = useUser();

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [replyMode, setReplyMode] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteIsHovered, setDeleteIsHovered] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [showDeleteOverlay, setShowDeleteOverlay] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  const [showEditProfileOverlay, setShowEditProfileOverlay] = useState(false);
  const [tempProfilePic, setTempProfilePic] = useState(user?.profilePic || "/assets/dark-logo.png");
  const [editedProfile, setEditedProfile] = useState({
    surname: user?.surname || "",
    firstName: user?.firstName || "",
    middleName: user?.middleName || "",
    occupation: user?.occupation || "",
    email: user?.email || "",
    contact: user?.phone || "",
    address: user?.address || "",
  });

  const fileInputRef = useRef(null);

  const dropdownRef = useRef(null);
  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedMessageSource, setSelectedMessageSource] = useState("inbox");
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [selectedOption, setSelectedOption] = useState("none");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsOverlay, setShowDetailsOverlay] = useState(false);
  const [showHistoryDetailsOverlay, setShowHistoryDetailsOverlay] =
    useState(false);
  const [selectedHistoryRental, setSelectedHistoryRental] = useState(null);
  const [now, setNow] = useState(new Date());
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [showCancelBookingConfirm, setShowCancelBookingConfirm] =
    useState(false);
  const [showEditBookingConfirm, setShowEditBookingConfirm] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState(null);
  const [bookingToCancel, setBookingToCancel] = useState(null);

  const [showCancelBookingRequest, setShowCancelBookingRequest] =
    useState(false);
  const [hideCancelAnimation, setHideCancelAnimation] = useState(false);

  const [showReSubmitBooking, setShowReSubmitBooking] = useState(false);
  const [showDeleteBooking, setShowDeleteBooking] = useState(false);
  const [showDeletedBookingRequest, setShowDeletedBookingRequest] =
    useState(false);
  const [showSaveProfileChanges, setShowSaveProfileChanges] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [showUnlinkBlockedOverlay, setShowUnlinkBlockedOverlay] =
    useState(false);
  const [showLinkAccountOverlay, setShowLinkAccountOverlay] = useState(false);

  const [showEmailPasswordOverlay, setShowEmailPasswordOverlay] =
    useState(false);
  const [emailPasswordInput, setEmailPasswordInput] = useState("");

  // const providerIds = (user?.providerData || []).map((p) => p.providerId);
  // const hasGoogle = providerIds.includes("google.com");
  // const hasEmail = providerIds.includes("password");

  const providerIds = (auth.currentUser?.providerData || []).map(
    (p) => p.providerId
  );
  const hasGoogle = providerIds.includes("google.com");
  const hasEmail = providerIds.includes("password");

  const hideTimerRef = useRef(null);
  const removeTimerRef = useRef(null);

  const [fetchedImages, setFetchedImages] = useState({});


useEffect(() => {
  if (!unitData || unitData.length === 0) return;

  const fetchProfileImages = async () => {
    const promises = unitData.map(async (unit) => {
      if (!unit.imageId) return null;

      try {
        const { base64, updatedAt } =
          await fetchImageFromFirestore(unit.imageId);

        return { [unit.imageId]: { base64, updatedAt } };
      } catch {
        return {
          [unit.imageId]: {
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

    setFetchedImages((prev) => ({
      ...prev,
      ...merged,
    }));
  };

  fetchProfileImages();
}, [unitData, imageUpdateTrigger]);






  useEffect(() => {
    if (user) {
      const providerIds = (auth.currentUser?.providerData || []).map(
        (p) => p.providerId
      );
      console.log("Full providerIds array:", providerIds); // Add this for debugging

      const hasGoogle = providerIds.includes("google.com");
      const hasPassword = providerIds.includes("password");

      console.log("User linked providers:");
      if (hasGoogle) {
        console.log("🔗 Google");
      }
      if (hasPassword) {
        console.log("🔗 Email/Password");
      }
    }
  }, [user]);

  const [processingBooking, setProcessingBooking] = useState({
    isProcessing: false,
    message: "",
    type: "success",
  });

  const showProcessingOverlay = (message, type = "success") => {
    setProcessingBooking({
      isProcessing: true,
      message,
      type,
    });
  };

  const hideProcessingOverlay = () => {
    setProcessingBooking((s) => ({
      ...s,
      isProcessing: false,
      message: "",
    }));
  };

  // New state for messages deleted overlay
  const [showMessagesDeletedOverlay, setShowMessagesDeletedOverlay] =
    useState(false);
  const [hideMessagesDeletedAnimation, setHideMessagesDeletedAnimation] =
    useState(false);
  const [deletedMessageCount, setDeletedMessageCount] = useState(0);

  // Trigger this when messages are deleted
  const handleMessagesDeleted = (count) => {
    setDeletedMessageCount(count);
    setHideMessagesDeletedAnimation(false);
    setShowMessagesDeletedOverlay(true);

    setTimeout(() => {
      setHideMessagesDeletedAnimation(true);
      setTimeout(() => setShowMessagesDeletedOverlay(false), 400);
    }, 5000);
  };

  const handleToggleGoogle = async () => {
    try {
      if (hasGoogle) {
        // Unlink
        showProcessingOverlay("Unlinking Account...", "warning");
        const res = await unlinkAccount("google.com");
        hideProcessingOverlay();

        if (res.success) {
          showActionOverlay({ message: "Account Unlinked", type: "warning" });
          // Reload user data to update providerData
          // await auth.currentUser.reload();
          await reloadAndSyncUser();
        } else {
          showActionOverlay({
            message: `Unlink failed: ${res.error?.message || "Unknown"}`,
            type: "warning",
          });
        }
      } else {
        // Link
        showProcessingOverlay("Linking Account...", "success");
        const res = await linkAccount("google.com");
        hideProcessingOverlay();

        if (res.success) {
          showActionOverlay({ message: "Account Linked", type: "success" });
          // Reload user data to update providerData
          // await auth.currentUser.reload();
          await reloadAndSyncUser();
        } else {
          showActionOverlay({
            message: `Link failed: ${res.error?.message || "Unknown"}`,
            type: "warning",
          });
        }
      }
    } catch (err) {
      // setProcessingBooking({ isProcessing: false, message: "" });
      hideProcessingOverlay();
      showActionOverlay({
        message: `Operation failed: ${err?.message || "Unknown"}`,
        type: "warning",
      });
    }
  };

  // Handler to toggle Email/Password provider (example; pass email/password as needed)
  const handleToggleEmail = async (email = null, password = null) => {
    try {
      if (hasEmail) {
        // setProcessingBooking({ isProcessing: true, message: "Unlinking Email..." });
        // const res = await unlinkAccount("password");
        // setProcessingBooking({ isProcessing: false, message: "" });

        showProcessingOverlay("Unlinking Email...", "warning");
        const res = await unlinkAccount("password");
        hideProcessingOverlay();

        if (res.success) {
          showActionOverlay({ message: "Email Unlinked", type: "warning" });
          // Reload user data to update providerData
          // await auth.currentUser.reload();
          await reloadAndSyncUser();
        } else {
          showActionOverlay({
            message: `Unlink failed: ${res.error?.message || "Unknown"}`,
            type: "warning",
          });
        }
      } else {
        // setProcessingBooking({ isProcessing: true, message: "Linking Email..." });
        // const res = await linkAccount("password", email, password);
        // setProcessingBooking({ isProcessing: false, message: "" });

        showProcessingOverlay("Linking Email...", "success");
        const res = await linkAccount("password", email, password);
        hideProcessingOverlay();

        if (res.success) {
          showActionOverlay({ message: "Email Linked", type: "success" });
          // Reload user data to update providerData
          // await auth.currentUser.reload();
          await reloadAndSyncUser();
        } else {
          showActionOverlay({
            message: `Link failed: ${res.error?.message || "Unknown"}`,
            type: "warning",
          });
        }
      }
    } catch (err) {
      // setProcessingBooking({ isProcessing: false, message: "" });
      hideProcessingOverlay();
      showActionOverlay({
        message: `Operation failed: ${err?.message || "Unknown"}`,
        type: "warning",
      });
    }
  };

  useEffect(() => {
    console.log("User emailVerified:", auth.currentUser?.emailVerified);
  }, [auth.currentUser?.emailVerified]);

  useEffect(() => {
    if (!location?.state) return;
    const { openLinkAccount /*, focusProvider */ } = location.state || {};
    if (openLinkAccount) {
      const openWhenReady = async () => {
        if (!user) {
          // wait briefly for auth to settle after redirect/popup
          for (let i = 0; i < 12 && !user; i++) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise((r) => setTimeout(r, 150));
          }
        }

        // only open the Link Account overlay — do NOT auto-open the Email/Password input
        setShowLinkAccountOverlay(true);

        // clear navigation state so overlay doesn't reopen on refresh/back
        try {
          router.push(pathname, { replace: true, state: null });
        } catch (e) {
          // ignore
        }
      };
      openWhenReady();
    }
  }, [location, user, router]);

  //SCROLL RELATED
  const scrollYRef = useRef(0);

  //OVERLAY STOP BACKGROUND CLICK AND SCROLL
  useEffect(() => {
    const handleClickOrScroll = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !showRevertConfirm &&
        !showDeleteConfirm &&
        !showDeleteOverlay &&
        !selectedMessage &&
        !showDetailsOverlay &&
        !showEditProfileOverlay &&
        !showCancelBookingConfirm &&
        !showEditBookingConfirm &&
        !showHistoryDetailsOverlay &&
        !showLinkAccountOverlay
      ) {
        setShowSettings(false);
      }
    };

    const preventTouch = (e) => {
      if (
        showRevertConfirm ||
        showDeleteConfirm ||
        showDeleteOverlay ||
        selectedMessage ||
        showDetailsOverlay ||
        showEditProfileOverlay ||
        showCancelBookingConfirm ||
        showEditBookingConfirm ||
        showHistoryDetailsOverlay ||
        showLinkAccountOverlay
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("mousedown", handleClickOrScroll);
    document.addEventListener("scroll", handleClickOrScroll);
    document.addEventListener("touchmove", preventTouch, { passive: false });

    if (
      showRevertConfirm ||
      showDeleteConfirm ||
      showDeleteOverlay ||
      selectedMessage ||
      showDetailsOverlay ||
      showEditProfileOverlay ||
      showCancelBookingConfirm ||
      showEditBookingConfirm ||
      showHistoryDetailsOverlay ||
      showLinkAccountOverlay
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
    showRevertConfirm,
    showDeleteConfirm,
    showDeleteOverlay,
    selectedMessage,
    showDetailsOverlay,
    showEditProfileOverlay,
    showCancelBookingConfirm,
    showEditBookingConfirm,
    showHistoryDetailsOverlay,
    showLinkAccountOverlay,
  ]);

  // TIME INTERVAL
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());

      userActiveRentals.forEach(async (rental) => {
        const start = rental.startTimestamp?.seconds
          ? new Date(rental.startTimestamp.seconds * 1000)
          : new Date();

        const end = new Date(
          start.getTime() + rental.totalDurationInSeconds * 1000
        );

        const isActive = rental.status === "Active";
        const isExpired = isActive && new Date() >= end;

        if (isExpired) {
          try {
            const rentalCopy = { ...rental };

            // 🔁 Compress and convert if driverLicense is still a File
            if (rentalCopy.driverLicense instanceof File) {
              rentalCopy.driverLicense = await compressAndConvertFileToBase64(
                rentalCopy.driverLicense
              );
            }

            await markUserRentalAsCompleted(rentalCopy);

            await fetchUserActiveRentals();
          } catch (err) {
            console.error("Failed to mark rental as completed:", err);
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [userActiveRentals]);

  useEffect(() => {
    if (user) {
      const unsubBooking = fetchUserBookingRequests();
      const unsubActive = fetchUserActiveRentals();
      return () => {
        unsubBooking && unsubBooking();
        unsubActive && unsubActive();
      };
    }
  }, [user]);

  const formatDate = (date) => {
    if (!date) return "";
    const jsDate = date.toDate ? date.toDate() : new Date(date);
    return jsDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const closeModal = () => {
    setIsImageModalOpen(false);
    setModalImage(null);
  };

  const formatTime = (totalSeconds) => {
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const parts = [];

    if (d > 0) parts.push(`${d}d`);
    if (d > 0 || h > 0) parts.push(`${h}h`);
    if (d > 0 || h > 0 || m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);

    return parts.join(" ");
  };

  const isToday = (time) => {
    const date = new Date(time);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatHourMinute = (time) => {
    const date = new Date(time);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (date) => {
    return date
      .toLocaleString("en-PH", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace(",", " |");
  };

  const formatPaymentDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // Fallback if invalid
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${month}-${day}-${year} | ${hour12}:${minutes} ${ampm}`;
  };

  const formatDualTime = (timeInput) => {
    const date =
      typeof timeInput === "number"
        ? new Date(timeInput)
        : new Date(`1970-01-01T${timeInput}`);

    if (isNaN(date.getTime())) return "Invalid Time";

    const time24 = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const time12 = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return `${time24} | ${time12}`;
  };

  const handleOpenEditProfile = () => {
    setEditedProfile({
      surname: user?.surname || "",
      firstName: user?.firstName || "",
      middleName: user?.middleName || "",
      occupation: user?.occupation || "",
      email: user?.email || "",
      contact: user?.phone || "",
      address: user?.address || "",
    });
    setTempProfilePic(user?.profilePic || "");
    setShowEditProfileOverlay(true);
  };

  const handleCancelChanges = () => {
    // Reset form back to saved user info
    setEditedProfile({
      surname: user?.surname || "",
      firstName: user?.firstName || "",
      middleName: user?.middleName || "",
      occupation: user?.occupation || "",
      email: user?.email || "",
      contact: user?.phone || "",
      address: user?.address || "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setTempProfilePic(user?.profilePic || "");
    setShowEditProfileOverlay(false);
  };

  const handleProfileChange = async (e) => {
    const file = e.target.files[0];

    if (file && file.type.startsWith("image/")) {
      try {
        const compressedBase64 = await compressAndConvertFileToBase64(file);

        // ✅ Only update temporary preview — do NOT update Firestore yet
        setTempProfilePic(compressedBase64);
      } catch (error) {
        console.error("❌ Error compressing image:", error);
        alert("Failed to process image. Please try a different file.");
      }
    } else {
      alert("Please select a valid image file.");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveProfileChanges = () => {
    updateUser({
      profilePic: tempProfilePic,
      surname: editedProfile.surname,
      firstName: editedProfile.firstName,
      middleName: editedProfile.middleName,
      occupation: editedProfile.occupation,
      // email: editedProfile.email,
      phone: editedProfile.contact,
      address: editedProfile.address,
    });

    setShowEditProfileOverlay(false);

    // 🔹 Clear existing timers
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (removeTimerRef.current) clearTimeout(removeTimerRef.current);

    // 🔹 Reset animation state right away
    setHideCancelAnimation(false);
    setShowSaveProfileChanges(false); // force re-render
    void setShowSaveProfileChanges(true); // reopen fresh

    // 🔹 Start timers
    hideTimerRef.current = setTimeout(() => {
      setHideCancelAnimation(true);
      removeTimerRef.current = setTimeout(
        () => setShowSaveProfileChanges(false),
        400
      );
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (removeTimerRef.current) clearTimeout(removeTimerRef.current);
    };
  }, []);

  const openMessageOverlay = (message, source) => {
    setSelectedMessage(message);
    setSelectedMessageSource(source);
    setIsClosing(false);
    setShowDeleteOverlay(false);

    console.log(
      "Opening message overlay with:",
      message,
      "from source:",
      source
    );
  };

  // Close message overlay
  const closeMessageOverlay = () => {
    setIsClosing(true);
    setReplyMode(false);
    setTimeout(() => {
      setSelectedMessage(null);
      setIsClosing(false); // Reset for next time
    }, 500); // Matches fade-out duration (0.5s)
  };

  // Toggle reply mode when Reply button is clicked
  const toggleReply = () => {
    setReplyMode(!replyMode);
  };

  const sendReply = () => {
    if (replyText.trim() === "") return;

    if (!user || !user.uid || !selectedMessage?.senderUid) {
      console.error("❌ Missing user or recipientUid in sendReply");
      return;
    }

    const contactInfo = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      message: replyText,
      recipientUid: selectedMessage.senderUid,
      senderUid: user.uid,
      isAdminSender: false,
      recipientName: selectedMessage.name,
      recipientEmail: selectedMessage.email,
      recipientPhone: selectedMessage.contact,
    };

    sendMessage(contactInfo);

    alert("Your reply has been sent!");
    setReplyText("");
  };

  return (
    <div className="profile-main">
      {/* BOOKING REQUEST DETAILS */}
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
                            `${selectedBooking.startDate}T${selectedBooking.startTime}`
                          )
                      )}
                      <br />
                      to <br />
                      {formatDateTime(
                        selectedBooking.endTimestamp?.toDate?.() ||
                          new Date(
                            `${selectedBooking.endDate}T${selectedBooking.endTime}`
                          )
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
                    <strong className="confirm-label">
                      Referral Source:
                    </strong>
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
                                  word.charAt(0).toUpperCase() + word.slice(1)
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
                      src={
                        typeof selectedBooking.driverLicense === "string"
                          ? selectedBooking.driverLicense
                          : URL.createObjectURL(selectedBooking.driverLicense)
                      }
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
                      (₱{(selectedBooking.discountedRate ?? 0).toLocaleString()}{" "}
                      x {selectedBooking.billedDays} Day
                      {selectedBooking.billedDays > 1 ? "s" : ""}) ₱
                      {(
                        selectedBooking.discountedRate *
                          selectedBooking.billedDays ?? 0
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
                          (₱
                          {(
                            selectedBooking.drivingPrice ?? 0
                          ).toLocaleString()}{" "}
                          x {selectedBooking.billedDays} Day
                          {selectedBooking.billedDays > 1 ? "s" : ""}) ₱
                          {(
                            selectedBooking.drivingPrice *
                              selectedBooking.billedDays ?? 0
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
                    <strong className="summary-label">Rental Duration:</strong>
                    <span className="summary-value">
                      ({selectedBooking.billedDays} Day /{" "}
                      {selectedBooking.rentalDuration.isFlatRateSameDay ? (
                        <>
                          for{" "}
                          <span style={{ color: "#dc3545" }}>
                            {Math.floor(
                              selectedBooking.rentalDuration.actualSeconds /
                                3600
                            )}
                            {Math.floor(
                              selectedBooking.rentalDuration.actualSeconds /
                                3600
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
                        selectedBooking.discountValue || 0
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
                                      word.slice(1)
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
                          }
                        );
                      }
                      return null;
                    })()}

                  </div>

                  {(() => {
                    const discountValue = Number(
                      selectedBooking.discountValue || 0
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
                        rawTotal
                      );
                    }
                    const discountedTotal = Math.max(
                      0,
                      rawTotal - discountAmount
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
                      selectedBooking.discountValue || 0
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
                        rawTotal
                      );
                    }
                    const discountedTotal = Math.max(
                      0,
                      rawTotal - discountAmount
                    );
                    const totalPaid = (
                      selectedBooking.paymentEntries || []
                    ).reduce(
                      (sum, entry) => sum + Number(entry.amount || 0),
                      0
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
                            style={{ color: balanceDue === 0 ? "#28a745" : "#ffb347" }}
                          >
                            Balance Due:
                          </strong>
                          <span
                            className="summary-value"
                            style={{ color: balanceDue === 0 ? "#28a745" : "#dc3545" }}
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

      {isImageModalOpen && modalImage && (
        <div className="admin-image-modal-overlay" onClick={closeModal}>
          <img
            src={
              typeof modalImage === "string"
                ? modalImage
                : URL.createObjectURL(modalImage)
            }
            alt="Full License"
            className="admin-full-image-view"
          />
        </div>
      )}

      {showRevertConfirm && (
        <div className="overlay-revert">
          <div className="confirm-modal">
            <h3>Revert to Original Info?</h3>
            <p>
              This will restore your name, phone, and profile picture to their
              original state.
            </p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn revert"
                onClick={() => {
                  revertUserData();
                  setShowRevertConfirm(false);
                  setShowSettings(false);
                }}
              >
                Yes, Revert
              </button>

              <button
                onClick={() => setShowRevertConfirm(false)}
                className="confirm-btn cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Are you sure you want to delete your account?</h3>
            <p>
              This action cannot be undone. All your data will be permanently
              removed.
            </p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  deleteUserAccount();
                  setShowDeleteConfirm(false);
                  setShowSettings(false);
                }}
              >
                Yes, Delete
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteOverlay && !Array.isArray(messageToDelete) && (
        <div className="overlay-revert">
          <div className="confirm-modal">
            <h3>Delete Message</h3>
            <p>This message will be permanently deleted. Are you sure?</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn revert"
                onClick={() => {
                  deleteMessage(messageToDelete.id, activeTab);
                  handleMessagesDeleted(1);
                  setShowDeleteOverlay(false);
                  setMessageToDelete(null);
                  openMessageOverlay(false);
                }}
              >
                Delete
              </button>
              <button
                className="confirm-btn cancel"
                onClick={() => {
                  setShowDeleteOverlay(false);
                  setMessageToDelete(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteOverlay &&
        Array.isArray(messageToDelete) &&
        messageToDelete.length >= 1 && (
          <div className="overlay-revert">
            <div className="confirm-modal">
              <h3>
                Delete {messageToDelete.length === 1 ? "Message" : "Messages"}
              </h3>
              <p>
                {messageToDelete.length === 1
                  ? "This message will be permanently deleted. Are you sure?"
                  : `These ${messageToDelete.length} messages will be permanently deleted. Are you sure?`}
              </p>
              <div className="confirm-buttons">
                <button
                  className="confirm-btn revert"
                  onClick={() => {
                    deleteMessage(messageToDelete, activeTab);
                    handleMessagesDeleted(messageToDelete.length);
                    setShowDeleteOverlay(false);
                    setMessageToDelete(null);
                    openMessageOverlay(false);
                    setSelectedMessageIds([]);
                  }}
                >
                  Delete
                </button>

                <button
                  className="confirm-btn cancel"
                  onClick={() => {
                    setShowDeleteOverlay(false);
                    setMessageToDelete(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}



<div className="profile-columns">
      <div className="profile-container">
        {showEditProfileOverlay && (
          <div className="admin-booking-confirm-overlay">
            <div className="admin-booking-confirm-container">
              <button
                className="close-btn"
                type="button"
                onClick={() => setShowEditProfileOverlay(false)}
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

              <h3 className="confirm-header">EDIT PROFILE</h3>
              <p className="confirm-text">
                Make changes to your profile information.
              </p>

              <div className="admin-confirm-details">
                <label className="profile-section-label">Profile Picture</label>

                <div className="profile-picture-wrapper">
                  <img
                    src={tempProfilePic || "/assets/dark-logo.png"}
                    alt="Profile"
                    className="profile-picture"
                  />
                  <button
                    className="change-profile-btn"
                    onClick={() =>
                      document.getElementById("profile-upload").click()
                    }
                  >
                    Change Profile Picture
                  </button>
                </div>

                <label className="profile-section-label">
                  Personal Information
                </label>
                <input
                  className="profile-section-label-input"
                  type="text"
                  placeholder="Surname"
                  value={editedProfile.surname}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      surname: e.target.value,
                    })
                  }
                />
                <input
                  className="profile-section-label-input"
                  type="text"
                  placeholder="First Name"
                  value={editedProfile.firstName}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      firstName: e.target.value,
                    })
                  }
                />
                <input
                  className="profile-section-label-input"
                  type="text"
                  placeholder="Middle Name (N/A if none)"
                  value={editedProfile.middleName}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      middleName: e.target.value,
                    })
                  }
                />
                <input
                  className="profile-section-label-input"
                  type="text"
                  placeholder="Occupation"
                  value={editedProfile.occupation}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      occupation: e.target.value,
                    })
                  }
                />

                <label className="profile-section-label">Contacts</label>
                <input
                  className="profile-section-label-input"
                  type="email"
                  placeholder="Email Address"
                  value={editedProfile.email}
                  readOnly // ✅ Prevent user from editing
                  style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }} // Optional: visual cue
                />
                <input
                  className="profile-section-label-input"
                  type="text"
                  placeholder="Contact No."
                  value={editedProfile.contact}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      contact: e.target.value,
                    })
                  }
                />
                <input
                  className="profile-section-label-input"
                  type="text"
                  placeholder="Current Address"
                  value={editedProfile.address}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      address: e.target.value,
                    })
                  }
                />

                <div className="confirm-button-group">
                  <button
                    className="confirm-proceed-btn"
                    onClick={handleSaveProfileChanges}
                  >
                    Save
                  </button>
                  <button
                    className="confirm-cancel-btn"
                    onClick={handleCancelChanges}
                  >
                    Cancel Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <h2 className="welcome-message">
          Welcome back, {user?.name || "User"}!
        </h2>

        <div className="profile-settings-container" ref={dropdownRef}>
          <div
            className="settings-icon"
            onClick={() => setShowSettings((prev) => !prev)}
          >
            &#8942; {/* This is ⋮ Unicode for vertical dots */}
          </div>

          {showSettings && (
            <div className="settings-dropdown">
              <p
                className="settings-item"
                style={{
                  color: user?.emailVerified ? "#28a745" : "#ffb300", // green if verified, amber if not
                  fontWeight: "bold",
                  cursor: user?.emailVerified ? "default" : "pointer",
                }}
                onClick={() => {
                  if (!user?.emailVerified) {
                    setShowVerifyOverlay(true); // open overlay only if not verified
                  }
                }}
              >
                {user?.emailVerified ? "Account Verified" : "Verify Account"}
              </p>

              <p
                className="settings-item"
                onClick={() => setShowLinkAccountOverlay(true)}
              >
                Link Account
              </p>
              <p
                className="settings-item"
                onClick={() => setShowRevertConfirm(true)}
              >
                Revert Info Changes to Original
              </p>
              <p
                className="settings-item delete"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Account
              </p>
            </div>
          )}
        </div>

        <div className="profile-content">
          <div className="profile-picture-section">
            <img
              src={user?.profilePic || "/assets/dark-logo.png"}
              alt="Profile"
              className="profile-picture"
            />

            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              id="profile-upload"
              ref={fileInputRef}
              onChange={handleProfileChange}
            />
          </div>
          <div className="profile-info-section">
            <div className="profile-row">
              <strong>Full Name: </strong>
              <br />
              <span
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {user?.firstName && user?.surname
                  ? `${user.surname}, ${user.firstName}${
                      user.middleName && user.middleName !== "N/A"
                        ? " " + user.middleName
                        : ""
                    }`
                  : user?.name || "N/A"}

                {/* ✅ Verification Icon */}
                <img
                  src={
                    auth.currentUser?.emailVerified
                      // ? require("../assets/verified.png")
                      // : require("../assets/unverified.png")
                      ? "../assets/verified.png"
                      : "../assets/unverified.png"
                  }
                  alt={
                    auth.currentUser?.emailVerified ? "Verified" : "Unverified"
                  }
                  style={{
                    width: "20px",
                    height: "20px",
                    cursor: auth.currentUser?.emailVerified
                      ? "default"
                      : "pointer",
                  }}
                  onClick={() => {
                    if (!user?.emailVerified) {
                      setShowVerifyOverlay(true);
                    }
                  }}
                />
              </span>
            </div>

            <div className="profile-row">
              <strong>Phone Number: </strong>
              <br />
              <span>{user?.phone || "N/A"}</span>
            </div>

            <div className="profile-row">
              <strong>Email Address: </strong>
              <br /> <span>{user?.email || "N/A"} </span>
            </div>
          </div>
        </div>

        <div className="profile-buttons">
          <button className="edit-picture-btn" onClick={handleOpenEditProfile}>
            Edit Profile
          </button>
        </div>
      </div>

      {/* Separator */}
      <div className="divider"></div>

      {/* Messages Section */}
      <div className="user-messages-container">
        <h3>Messages & Notifications</h3>

        <div className="message-tabs-controls">
          <div className="message-tabs">
            <button
              className={activeTab === "inbox" ? "active-tab" : ""}
              onClick={() => {
                setActiveTab("inbox");
                setSelectedMessageIds([]);
              }}
            >
              Inbox
            </button>
            <button
              className={activeTab === "sentbox" ? "active-tab" : ""}
              onClick={() => {
                setActiveTab("sentbox");
                setSelectedMessageIds([]);
              }}
            >
              Sentbox
            </button>
          </div>

          <div className="checkbox-dropdown-wrapper">
            <div className="message-action-icons">
              {activeTab === "inbox" && selectedMessageIds.length > 0 && (
                <>
                  {userMessages
                    .filter((message) =>
                      selectedMessageIds.includes(message.id)
                    )
                    .some((message) => !message.readStatus) && (
                    <img
                      src="/assets/open-envelope.png"
                      alt="Mark as Read"
                      className="message-action-icon"
                      title="Mark as Read"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectedMessageIds.forEach((id) => {
                          const msg = userMessages.find((msg) => msg.id === id);
                          if (msg && !msg.readStatus) {
                            markMessageAsRead(id);
                          }
                        });
                      }}
                    />
                  )}

                  {userMessages
                    .filter((msg) => selectedMessageIds.includes(msg.id))
                    .some((msg) => msg.readStatus) && (
                    <img
                      src="/assets/close-envelope.png"
                      alt="Mark as Unread"
                      className="message-action-icon"
                      title="Mark as Unread"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectedMessageIds.forEach((id) => {
                          const msg = userMessages.find((msg) => msg.id === id);
                          if (msg && msg.readStatus) {
                            markMessageAsRead(id);
                          }
                        });
                      }}
                    />
                  )}

                  <img
                    src="/assets/delete.png"
                    alt="Delete"
                    className="message-action-icon"
                    title="Delete Selected"
                    onClick={(e) => {
                      e.stopPropagation();
                      const messagesToDelete =
                        activeTab === "inbox"
                          ? userMessages.filter((msg) =>
                              selectedMessageIds.includes(msg.id)
                            )
                          : sentMessages.filter((msg) =>
                              selectedMessageIds.includes(msg.id)
                            );

                      if (messagesToDelete.length > 0) {
                        setMessageToDelete(messagesToDelete);
                        setShowDeleteOverlay(true);
                      }
                    }}
                  />
                </>
              )}
              {activeTab === "sentbox" && selectedMessageIds.length > 0 && (
                <img
                  src="/assets/delete.png"
                  alt="Delete"
                  className="message-action-icon"
                  title="Delete Selected"
                  onClick={(e) => {
                    e.stopPropagation();
                    const messagesToDelete = sentMessages.filter((msg) =>
                      selectedMessageIds.includes(msg.id)
                    );

                    if (messagesToDelete.length > 0) {
                      setMessageToDelete(messagesToDelete);
                      setShowDeleteOverlay(true);
                    }
                  }}
                />
              )}
            </div>

            <input
              type="checkbox"
              ref={(el) => {
                if (el) {
                  el.indeterminate =
                    selectedMessageIds.length > 0 &&
                    selectedMessageIds.length <
                      (activeTab === "inbox"
                        ? userMessages.length
                        : sentMessages.length);
                }
              }}
              className="message-tabs-checkbox"
              checked={
                (activeTab === "inbox" &&
                  userMessages.length > 0 &&
                  selectedMessageIds.length === userMessages.length) ||
                (activeTab === "sentbox" &&
                  sentMessages.length > 0 &&
                  selectedMessageIds.length === sentMessages.length)
              }
              onChange={(e) => {
                const currentMessages =
                  activeTab === "inbox" ? userMessages : sentMessages;
                if (e.target.checked) {
                  setSelectedMessageIds(currentMessages.map((msg) => msg.id));
                } else {
                  setSelectedMessageIds([]);
                }
              }}
              title="Select All"
            />

            <select
              className="message-tabs-select hide-text"
              onChange={(e) => {
                const option = e.target.value;
                setSelectedOption(option);

                let selected = [];
                const currentMessages =
                  activeTab === "inbox" ? userMessages : sentMessages;

                if (option === "all") {
                  selected = currentMessages.map((msg) => msg.id);
                } else if (option === "unread") {
                  selected = currentMessages
                    .filter((msg) => !msg.readStatus)
                    .map((msg) => msg.id);
                } else if (option === "read") {
                  selected = currentMessages
                    .filter((msg) => msg.readStatus)
                    .map((msg) => msg.id);
                } else if (option === "none") {
                  selected = [];
                }

                setSelectedMessageIds(selected);
                e.target.selectedIndex = 0;
              }}
              title="More select options"
            >
              <option value="none">
                &nbsp;&nbsp;&nbsp;None&nbsp;&nbsp;&nbsp;
              </option>
              <option value="all">
                &nbsp;&nbsp;&nbsp;All&nbsp;&nbsp;&nbsp;
              </option>
              {activeTab === "inbox" && (
                <>
                  <option value="unread">
                    &nbsp;&nbsp;&nbsp;Unread&nbsp;&nbsp;&nbsp;
                  </option>
                  <option value="read">
                    &nbsp;&nbsp;&nbsp;Read&nbsp;&nbsp;&nbsp;
                  </option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="messages-list">
          {activeTab === "inbox" && (
            <>
              {userMessages && userMessages.length > 0 ? (
                [...userMessages]
                  .sort(
                    (a, b) =>
                      (b.startTimestamp?.toDate?.().getTime() || 0) -
                      (a.startTimestamp?.toDate?.().getTime() || 0)
                  )

                  .map((message) => (
                    <div
                      key={message.id}
                      className="user-message-item"
                      style={{
                        opacity: selectedMessageIds.includes(message.id)
                          ? 1
                          : message.readStatus
                          ? 0.5
                          : 1,
                        fontWeight: message.readStatus ? "lighter" : "bolder",
                        backgroundColor: selectedMessageIds.includes(message.id)
                          ? "#c8e6c9"
                          : "transparent",
                      }}
                      onClick={() => {
                        if (!message.readStatus) {
                          markMessageAsRead(message.id);
                        }
                        openMessageOverlay(message, "inbox");
                      }}
                    >
                      <div className="message-read-toggle">
                        <img
                          src={
                            message.readStatus ? "/assets/open-envelope.png" : "/assets/close-envelope.png"
                          }
                          alt={
                            message.readStatus
                              ? "Mark as Unread"
                              : "Mark as Read"
                          }
                          className="mark-read-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            markMessageAsRead(message.id);
                          }}
                        />

                        <img
                          src={
                            hoveredMessageId === message.id
                              ? "/assets/delete-hover.png"
                              : "/assets/delete.png"
                          }
                          alt="Delete"
                          className="delete-icon"
                          onMouseEnter={() => setHoveredMessageId(message.id)}
                          onMouseLeave={() => setHoveredMessageId(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMessageToDelete(message);
                            setShowDeleteOverlay(true);
                          }}
                        />
                        <input
                          type="checkbox"
                          className="message-checkbox"
                          checked={selectedMessageIds.includes(message.id)}
                          onChange={(e) => {
                            setSelectedMessageIds((prev) =>
                              e.target.checked
                                ? [...prev, message.id]
                                : prev.filter((id) => id !== message.id)
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div className="message-header">
                        <img
                          src={message.profilePic}
                          alt="Profile"
                          className="message-profile-pic"
                        />
                        <div className="message-info">
                          <div className="message-name">{message.name}</div>
                          <div className="message-contact">
                            <span className="message-email">
                              {message.email}
                            </span>
                            <span className="message-phone">
                              {" "}
                              <a
                                href={`tel:${
                                  message.contact
                                    ? message.contact.replace(/\s/g, "")
                                    : ""
                                }`}
                              >
                                {message.contact || "No contact"}
                              </a>
                            </span>
                          </div>
                          <div className="message-date">
                            {message.formattedDateTime || "No timestamp"}
                          </div>
                        </div>
                      </div>

                      <div className="message-text">
                        {message.content
                          ? message.content
                              .replace(/<[^>]+>/g, "")
                              .substring(0, 90) +
                            (message.content.length > 90 ? "..." : "")
                          : ""}
                      </div>
                    </div>
                  ))
              ) : (
                <p className="empty-message">No received messages yet.</p>
              )}
            </>
          )}

          {activeTab === "sentbox" && (
            <>
              {sentMessages && sentMessages.length > 0 ? (
                [...sentMessages]

                  .sort(
                    (a, b) =>
                      (b.startTimestamp?.toDate?.().getTime() || 0) -
                      (a.startTimestamp?.toDate?.().getTime() || 0)
                  )

                  .map((message) => (
                    <div
                      key={message.id}
                      className="user-message-item"
                      style={{
                        backgroundColor: selectedMessageIds.includes(message.id)
                          ? "#c8e6c9"
                          : "transparent",
                      }}
                      onClick={() => openMessageOverlay(message, "sentbox")}
                    >
                      <div className="message-read-toggle">
                        <img
                          src={
                            hoveredMessageId === message.id
                              ? "/assets/delete-hover.png"
                              : "/assets/delete.png"
                          }
                          alt="Delete"
                          className="delete-icon"
                          onMouseEnter={() => setHoveredMessageId(message.id)}
                          onMouseLeave={() => setHoveredMessageId(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMessageToDelete(message);
                            setShowDeleteOverlay(true);
                          }}
                        />

                        <input
                          type="checkbox"
                          className="message-checkbox"
                          checked={selectedMessageIds.includes(message.id)}
                          onChange={(e) => {
                            setSelectedMessageIds((prev) =>
                              e.target.checked
                                ? [...prev, message.id]
                                : prev.filter((id) => id !== message.id)
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="message-header">
                        <img
                          src={message.profilePic}
                          alt="Profile"
                          className="message-profile-pic"
                        />
                        <div className="message-info">
                          <div className="message-name">From: You</div>
                          <div className="message-contact">
                            <span className="message-email">
                              To: {message.recipientEmail}
                            </span>
                            <span className="message-phone">
                              {" "}
                              <a
                                href={`tel:${message.recipientContact.replace(
                                  /\s/g,
                                  ""
                                )}`}
                              >
                                {message.recipientContact}
                              </a>
                            </span>
                          </div>
                          <div className="message-date">
                            {message.formattedDateTime || "No timestamp"}
                          </div>
                        </div>
                      </div>

                      <div className="message-text">
                        {message.content
                          ? message.content
                              .replace(/<[^>]+>/g, "")
                              .substring(0, 90) +
                            (message.content.length > 90 ? "..." : "")
                          : ""}
                      </div>
                    </div>
                  ))
              ) : (
                <p className="empty-message">No sent messages yet.</p>
              )}
            </>
          )}
        </div>
      </div>
</div>




      {/* Separator Above History Section */}
      <div className="divider-horizontal"></div>

      <div className="booking-history-wrapper">
        <div className="booking-requests-container">
          <div className="rental-panels-container">
            <div className="active-rentals-container">
              <h3>Active Rentals</h3>
              <div className="active-rentals-scroll">
                {userActiveRentals.length > 0 ? (
                  userActiveRentals.map((rental) => {
                    const startTimestamp = rental.startTimestamp?.seconds
                      ? new Date(rental.startTimestamp.seconds * 1000)
                      : new Date(); // fallback

                    const endTimestamp = new Date(
                      startTimestamp.getTime() +
                        rental.totalDurationInSeconds * 1000
                    );

                    const isActive = rental.status === "Active";
                    // const hasStarted = isActive && now >= startTimestamp;
                    // const currentTimeLeftInSeconds = isActive
                    //   ? Math.floor((endTimestamp - now) / 1000)
                    //   : rental.totalDurationInSeconds;

                    const hasStarted = now >= startTimestamp;
                    const currentTimeLeftInSeconds = hasStarted
                      ? Math.max(Math.floor((endTimestamp - now) / 1000), 0)
                      : rental.totalDurationInSeconds;

                    return (
                      <div key={rental.id} className="ongoing-unit-card">
                        <div className="ongoing-unit-gradient-overlay">
                          <h3 style={{ color: "#28a745", margin: "0px" }}>
                            {rental.carName}
                          </h3>
                          <div className="ongoing-unit-info">
                            <div className="info-block">
                              <span className="label">Renter:</span>
                              <span className="value">{rental.renterName}</span>
                            </div>
                            <div className="info-block">
                              <span className="label">Travel Location:</span>
                              <span className="value">{rental.location}</span>
                            </div>
                            <div className="info-block">
                              <span className="label">Time Left:</span>
                              {/* <span className="value">
                                {isActive
                                  ? hasStarted
                                    ? formatTime(currentTimeLeftInSeconds)
                                    : `Starts on ${
                                        isToday(startTimestamp)
                                          ? `Today at ${formatHourMinute(
                                              startTimestamp
                                            )}`
                                          : formatDateTime(startTimestamp)
                                      }`
                                  : "Pending Approval"}
                              </span> */}
                              <span className="value">
                                {hasStarted
                                  ? formatTime(currentTimeLeftInSeconds)
                                  : `Starts on ${
                                      isToday(startTimestamp)
                                        ? `Today at ${formatHourMinute(
                                            startTimestamp
                                          )}`
                                        : formatDateTime(startTimestamp)
                                    }`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="ongoing-unit-image-wrapper">
                          {(() => {
  const unit = unitData.find(u => u.plateNo === rental.plateNo);
  const imageId =
    rental.imageId || unit?.imageId || `${rental.plateNo}_main`;

  const image = fetchedImages[imageId];

  return (
    <img
      src={image?.base64 || "/assets/images/default.png"}
      alt={`Booking request: ${rental.carName}`}
      className="ongoing-unit-image"
      key={image?.updatedAt}
    />
  );
})()}

                        </div>

                        <span
                          className={`ongoing-unit-status-badge ${rental.status?.toLowerCase()}`}
                        >
                          {rental.status}
                        </span>

                        <button
                          className="ongoing-unit-details-button"
                          onClick={() => {
                            setSelectedBooking(rental);
                            setShowDetailsOverlay(true);
                          }}
                        >
                          Details
                        </button>

                        <div className="ongoing-unit-progress-container">
                          <div className="ongoing-unit-progress-bar-outer">
                            <div
                              className="ongoing-unit-progress-bar-inner"
                              style={{
                                width: isActive
                                  ? `${Math.min(
                                      Math.max(
                                        ((rental.totalDurationInSeconds -
                                          currentTimeLeftInSeconds) /
                                          rental.totalDurationInSeconds) *
                                          100,
                                        0
                                      ),
                                      100
                                    ).toFixed(2)}%`
                                  : "0%",
                              }}
                            ></div>
                          </div>

                          <span className="ongoing-unit-time-left">
                            {formatTime(currentTimeLeftInSeconds)}
                          </span>

                          {!isActive && (
                            <div className="ongoing-unit-action-buttons">
                              <button
                                className="action-button finish"
                                onClick={() => {
                                  setBookingToEdit(rental);
                                  setShowEditBookingConfirm(true);
                                  console.log("Edit request:", rental);
                                }}
                              >
                                Edit
                              </button>

                              <button
                                className="action-button reserve"
                                onClick={() => {
                                  setBookingToCancel(rental);
                                  setShowCancelBookingConfirm(true);
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="empty-bookings">No active rentals yet.</p>
                )}
              </div>
            </div>

            <div className="booking-requests-container">
              <h3>Booking Requests</h3>
              <div className="booking-requests-scroll">
                {showCancelBookingConfirm && bookingToCancel && (
                  <div className="overlay-delete">
                    <div className="confirm-modal">
                      <h3>Are you sure you want to cancel this rental?</h3>
                      <p>This action cannot be undone once confirmed.</p>
                      <div className="confirm-buttons">
                        <button
                          className="confirm-btn delete"
                          onClick={async () => {
                            showProcessingOverlay(
                              "Cancelling Your Booking Request..."
                            );
                            try {
                              await cancelUserBookingRequest(
                                bookingToCancel.id
                              );
                              await fetchUserActiveRentals?.();
                              await fetchUserBookingRequests?.();

                              setShowCancelBookingConfirm(false);
                              hideProcessingOverlay();

                              // ✅ Show cancel success overlay
                              setHideCancelAnimation(false);
                              setShowCancelBookingRequest(true);
                              setTimeout(() => {
                                setHideCancelAnimation(true);
                                setTimeout(
                                  () => setShowCancelBookingRequest(false),
                                  400
                                );
                              }, 5000);
                            } catch (err) {
                              console.error(err);
                              hideProcessingOverlay();
                            }
                          }}
                        >
                          Yes, Cancel
                        </button>

                        <button
                          className="confirm-btn cancel"
                          onClick={() => setShowCancelBookingConfirm(false)}
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {showEditBookingConfirm && bookingToEdit && (
                  <div className="overlay-delete">
                    <div className="confirm-modal">
                      <h3>Edit this rental request?</h3>
                      <p>
                        You’ll be redirected to the booking form with your
                        details pre-filled.
                      </p>
                      <div className="confirm-buttons">
                        <button
                          className="confirm-btn delete"
                          onClick={(e) => {
                            setShowEditBookingConfirm(false);
                            openBooking(e, bookingToEdit);
                          }}
                        >
                          Yes, Edit
                        </button>
                        <button
                          className="confirm-btn cancel"
                          onClick={() => setShowEditBookingConfirm(false)}
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {showReSubmitBooking && bookingToEdit && (
                  <div className="overlay-delete">
                    <div className="confirm-modal">
                      <h3>Re-submit this booking request?</h3>
                      <p>
                        You’ll be redirected to the booking form with your
                        previously submitted details.
                      </p>
                      <div className="confirm-buttons">
                        <button
                          className="confirm-btn delete"
                          onClick={(e) => {
                            setShowReSubmitBooking(false);
                            openBooking(e, bookingToEdit);
                          }}
                        >
                          Yes, Re-submit
                        </button>
                        <button
                          className="confirm-btn cancel"
                          onClick={() => setShowReSubmitBooking(false)}
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {showDeleteBooking && bookingToCancel && (
                  <div className="overlay-delete">
                    <div className="confirm-modal">
                      <h3>Delete this booking request?</h3>
                      <p>
                        This action cannot be undone. Are you sure you want to
                        delete this booking?
                      </p>
                      <div className="confirm-buttons">
                        <button
                          className="confirm-btn delete"
                          onClick={async () => {
                            showProcessingOverlay(
                              "Deleting Your Booking Request..."
                            );
                            try {
                              await cancelUserBookingRequest(
                                bookingToCancel.id
                              );
                              await fetchUserActiveRentals?.();
                              await fetchUserBookingRequests?.();

                              setShowDeleteBooking(false);
                              hideProcessingOverlay();

                              // ✅ Show deleted success overlay
                              setHideCancelAnimation(false);
                              setShowDeletedBookingRequest(true);
                              setTimeout(() => {
                                setHideCancelAnimation(true);
                                setTimeout(
                                  () => setShowDeletedBookingRequest(false),
                                  400
                                );
                              }, 5000);
                            } catch (err) {
                              console.error(err);
                              hideProcessingOverlay();
                            }
                          }}
                        >
                          Yes, Delete
                        </button>

                        <button
                          className="confirm-btn cancel"
                          onClick={() => setShowDeleteBooking(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {processingBooking.isProcessing && (
                  <div className="submitting-overlay">
                    <div className="loading-container">
                      <div className="loading-bar-road">
                        <img
                          src="/assets/images/submitting.gif"
                          alt={processingBooking.message}
                          className="car-gif"
                        />
                      </div>
                      <p
                        className={
                          processingBooking.type === "warning"
                            ? "submitting-text-red"
                            : "submitting-text"
                        }
                      >
                        {processingBooking.message}
                      </p>
                    </div>
                  </div>
                )}

                {userBookingRequests.length > 0 ? (
                  userBookingRequests.map((rental) => {
                    const startTimestamp = new Date(
                      `${rental.startDate}T${rental.startTime}`
                    );
                    const endTimestamp = new Date(
                      startTimestamp.getTime() +
                        rental.totalDurationInSeconds * 1000
                    );

                    const isActive = rental.status === "Active";
                    const hasStarted = isActive && now >= startTimestamp;
                    const currentTimeLeftInSeconds = isActive
                      ? Math.floor((endTimestamp - now) / 1000)
                      : rental.totalDurationInSeconds;

                    return (
                      <div key={rental.id} className="ongoing-unit-card">
                        <div className="ongoing-unit-gradient-overlay">
                          <h3 style={{ color: "#28a745", margin: "0px" }}>
                            {rental.carName}
                          </h3>
                          <div className="ongoing-unit-info">
                            <div className="info-block">
                              <span className="label">Renter:</span>
                              <span className="value">{rental.renterName}</span>
                            </div>
                            <div className="info-block">
                              <span className="label">Travel Location:</span>
                              <span className="value">{rental.location}</span>
                            </div>

                            <div className="info-block">
                              <span className="label">
                                {rental.status === "Rejected"
                                  ? "Rejection Reason:"
                                  : "Status:"}
                              </span>
                              <span
                                className="value"
                                 style={{
    overflowY: "scroll",
    maxHeight: "40px",
    whiteSpace: "normal",
    display: "block",
    color: rental.status === "Rejected" ? "#dc3545" : "",
    // backgroundColor: rental.status === "Rejected" ? "#f8d7da" : "",
    // borderRadius: "5px",
    // padding: "5px",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  }}
                              >
                                {rental.status === "Rejected"
                                  ? `${
                                      rental.rejectionReason ||
                                      "No reason provided"
                                    }`
                                  : isActive
                                  ? hasStarted
                                    ? formatTime(currentTimeLeftInSeconds)
                                    : `Starts on ${
                                        isToday(startTimestamp)
                                          ? `Today at ${formatHourMinute(
                                              startTimestamp
                                            )}`
                                          : formatDateTime(startTimestamp)
                                      }`
                                  : "Pending for Approval"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="ongoing-unit-image-wrapper">
                          {(() => {
  const unit = unitData.find(u => u.plateNo === rental.plateNo);
  const imageId =
    rental.imageId || unit?.imageId || `${rental.plateNo}_main`;

  const image = fetchedImages[imageId];

  return (
    <img
      src={image?.base64 || "/assets/images/default.png"}
      alt={`Booking request: ${rental.carName}`}
      className="ongoing-unit-image"
      key={image?.updatedAt}
    />
  );
})()}

                        </div>

                        <span
                          className={`ongoing-unit-status-badge ${rental.status?.toLowerCase()}`}
                        >
                          {rental.status}
                        </span>

                        <button
                          className="ongoing-unit-details-button"
                          onClick={() => {
                            setSelectedBooking(rental);
                            setShowDetailsOverlay(true);
                          }}
                        >
                          Details
                        </button>

                        <div className="ongoing-unit-progress-container">
                          <div className="ongoing-unit-progress-bar-outer">
                            <div
                              className="ongoing-unit-progress-bar-inner"
                              style={{
                                width: isActive
                                  ? `${Math.min(
                                      Math.max(
                                        ((rental.totalDurationInSeconds -
                                          currentTimeLeftInSeconds) /
                                          rental.totalDurationInSeconds) *
                                          100,
                                        0
                                      ),
                                      100
                                    ).toFixed(2)}%`
                                  : "0%",
                              }}
                            ></div>
                          </div>

                          <span className="ongoing-unit-time-left">
                            {formatTime(currentTimeLeftInSeconds)}
                          </span>

                          {!isActive && (
                            <div className="ongoing-unit-action-buttons">
                              {rental.status === "Rejected" ? (
                                <>
                                  <button
                                    className="action-button finish"
                                    onClick={() => {
                                      // setBookingToEdit(rental);
                                      setBookingToEdit({...rental, isResubmitting: true});
                                      setShowReSubmitBooking(true);
                                      console.log("Re-submit request:", rental);
                                    }}
                                  >
                                    Re-submit Booking
                                  </button>

                                  <button
                                    className="action-button cancel"
                                    onClick={() => {
                                      setBookingToCancel(rental);
                                      setShowDeleteBooking(true);
                                    }}
                                  >
                                    Delete Booking
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="action-button finish"
                                    onClick={() => {
                                      // setBookingToEdit(rental);
                                      setBookingToEdit({...rental, isResubmitting: false});
                                      setShowEditBookingConfirm(true);
                                      console.log("Edit request:", rental);
                                    }}
                                  >
                                    Edit
                                  </button>

                                  <button
                                    className="action-button cancel"
                                    onClick={() => {
                                      setBookingToCancel(rental);
                                      setShowCancelBookingConfirm(true);
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="empty-bookings">No booking requests yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="history-container">
            <h3>Rental History</h3>
            <div className="history-list">
              {userRentalHistory.length > 0 ? (
                userRentalHistory.map((history, index) => (
                  <div key={index} className="history-item">
                    <button
                      className="history-details-btn"
                      onClick={() => {
                        setSelectedHistoryRental(history);
                        setShowHistoryDetailsOverlay(true);
                      }}
                    >
                      Details
                    </button>
                    {(() => {
  const unit = unitData.find(u => u.plateNo === history.plateNo);
  const imageId =
    history.imageId || unit?.imageId || `${history.plateNo}_main`;

  const image = fetchedImages[imageId];

  return (
    <img
      src={image?.base64 || "/assets/images/default.png"}
      alt="Rented Car"
      className="history-car-image"
      key={image?.updatedAt}
    />
  );
})()}

                    <div className="history-details">
                      <p className="car-name">{history.carName}</p>
                      <p>
                        <strong>Rental Duration:</strong>
                        <span>
                          {" "}
                          {formatDate(history.startDate)} -{" "}
                          {formatDate(history.endDate)}
                        </span>
                      </p>
                      <p>
                        <strong>Start Time:</strong>{" "}
                        <span>{formatDualTime(history.startTime)}</span>
                      </p>
                      <p>
                        <strong>End Time:</strong>{" "}
                        <span>{formatDualTime(history.endTime)}</span>
                      </p>

                      <p>
                        <strong>Location:</strong>{" "}
                        <span> {history.location}</span>
                      </p>
                      <p>
                        <strong>Purpose:</strong>{" "}
                        <span> {history.purpose}</span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-history">No rentals made yet.</p>
              )}
            </div>
          </div>

          {showHistoryDetailsOverlay && selectedHistoryRental && (
            <div className="admin-booking-confirm-overlay">
              <div className="admin-booking-confirm-container">
                <button
                  className="close-btn"
                  type="button"
                  onClick={() => setShowHistoryDetailsOverlay(false)}
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
                          {selectedHistoryRental.carName}
                        </span>
                      </div>

                      <div className="confirm-row">
                        <strong className="confirm-label">Drive Type:</strong>
                        <span className="confirm-value">
                          {selectedHistoryRental.drivingOption}
                        </span>
                      </div>

                      {selectedHistoryRental.drivingOption === "With Driver" &&
                    selectedHistoryRental.assignedDriver && (
                      <div className="confirm-row">
                        <strong className="confirm-label">
                          Assigned Driver:
                        </strong>
                        <span className="confirm-value">
                          {selectedHistoryRental.assignedDriver}
                        </span>
                      </div>
                    )}

                      <div className="confirm-row">
                        <strong className="confirm-label">
                          Drop-off Type:
                        </strong>
                        <span className="confirm-value">
                          {selectedHistoryRental.pickupOption}
                        </span>
                      </div>

                      {selectedHistoryRental.pickupOption === "Drop-off" &&
                        selectedHistoryRental.dropoffLocation && (
                          <div className="confirm-row">
                            <strong className="confirm-label">
                              Drop-off Location:
                            </strong>
                            <span className="confirm-value">
                              {selectedHistoryRental.dropoffLocation}
                            </span>
                          </div>
                        )}

                      <div className="confirm-row">
                        <strong className="confirm-label">
                          Rental Period:
                        </strong>
                        <span className="confirm-value">
                          {formatDateTime(
                            selectedHistoryRental.startTimestamp?.toDate?.() ||
                              new Date(
                                `${selectedHistoryRental.startDate}T${selectedHistoryRental.startTime}`
                              )
                          )}
                          <br />
                          to <br />
                          {formatDateTime(
                            selectedHistoryRental.endTimestamp?.toDate?.() ||
                              new Date(
                                `${selectedHistoryRental.endDate}T${selectedHistoryRental.endTime}`
                              )
                          )}
                        </span>
                      </div>

                      <div className="confirm-row">
                        <strong className="confirm-label">
                          Travel Location:
                        </strong>
                        <span className="confirm-value">
                          {selectedHistoryRental.location}
                        </span>
                      </div>

                      <div className="confirm-row">
                        <strong className="confirm-label">Purpose:</strong>
                        <span className="confirm-value">
                          {selectedHistoryRental.purpose}
                        </span>
                      </div>

                                        <div className="confirm-row">
                    <strong className="confirm-label">Referral Source:</strong>
                    <span className="confirm-value">
                      {selectedHistoryRental.referralSource || "Not specified"}
                    </span>
                  </div>

                      <div className="confirm-row">
                        <strong className="confirm-label">
                          Additional Message:
                        </strong>
                        <span className="confirm-value">
                          {selectedHistoryRental.additionalMessage}
                        </span>
                      </div>

                      {selectedHistoryRental?.paymentEntries?.length > 0 && (
                    <div className="confirm-row">
                      <strong className="confirm-label">Payments:</strong>
                      <span className="confirm-value">
                        {selectedHistoryRental.paymentEntries.map((entry, index) => (
                          <div key={index} style={{ marginBottom: "0.5rem" }}>
                            <br />₱{Number(entry.amount).toLocaleString()}{" "}
                            <br />
                            {entry.mop} |{" "}
                            {entry.pop
                              .toLowerCase()
                              .split(" ")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
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
                        {selectedHistoryRental.firstName}{" "}
                        {selectedHistoryRental.middleName}{" "}
                        {selectedHistoryRental.surname}
                      </span>
                    </div>

                    <div className="confirm-row">
                      <strong className="confirm-label">Contact:</strong>
                      <span className="confirm-value">
                        {selectedHistoryRental.contact}
                      </span>
                    </div>

                    <div className="confirm-row">
                      <strong className="confirm-label">Email:</strong>
                      <span className="confirm-value">
                        {selectedHistoryRental.email}
                      </span>
                    </div>

                    <div className="confirm-row">
                      <strong className="confirm-label">Occupation:</strong>
                      <span className="confirm-value">
                        {selectedHistoryRental.occupation}
                      </span>
                    </div>

                    <div className="confirm-row">
                      <strong className="confirm-label">
                        Current Address:
                      </strong>
                      <span className="confirm-value">
                        {selectedHistoryRental.address}
                      </span>
                    </div>

                    <h4 className="confirm-subtitle">DRIVER'S LICENSE</h4>
                    <div className="admin-confirm-image-container">
                      {selectedHistoryRental.driverLicense ? (
                        <img
                          src={
                            typeof selectedHistoryRental.driverLicense ===
                            "string"
                              ? selectedHistoryRental.driverLicense
                              : URL.createObjectURL(
                                  selectedHistoryRental.driverLicense
                                )
                          }
                          alt="Driver's License"
                          className="admin-confirm-id-preview"
                          onClick={() => {
                            setModalImage(selectedHistoryRental.driverLicense);
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
                            {selectedHistoryRental.carName}
                          </span>
                          ):
                        </strong>

                        <span className="summary-value">
                          (₱
                          {(
                            selectedHistoryRental.discountedRate ?? 0
                          ).toLocaleString()}{" "}
                          x {selectedHistoryRental.billedDays} Day
                          {selectedHistoryRental.billedDays > 1 ? "s" : ""}) ₱
                          {(
                            selectedHistoryRental.discountedRate *
                              selectedHistoryRental.billedDays ?? 0
                          ).toLocaleString()}
                        </span>
                      </li>
                      <li>
                        <strong className="summary-label">
                          (
                          <span style={{ color: "#28a745" }}>
                            {selectedHistoryRental.drivingOption}
                          </span>
                          ):
                        </strong>

                        <span className="summary-value">
                          {selectedHistoryRental.drivingPrice > 0 ? (
                            <>
                              (₱
                              {(
                                selectedHistoryRental.drivingPrice ?? 0
                              ).toLocaleString()}{" "}
                              x {selectedHistoryRental.billedDays} Day
                              {selectedHistoryRental.billedDays > 1 ? "s" : ""})
                              ₱
                              {(
                                selectedHistoryRental.drivingPrice *
                                  selectedHistoryRental.billedDays ?? 0
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
                            {selectedHistoryRental.pickupOption}
                          </span>
                          ):
                        </strong>
                        <span className="summary-value">
                          ₱{selectedHistoryRental.pickupPrice.toLocaleString()}
                        </span>
                      </li>
                      <li>
                        <strong className="summary-label">
                          Rental Duration:
                        </strong>
                        <span className="summary-value">
                          ({selectedHistoryRental.billedDays} Day /{" "}
                          {selectedHistoryRental.rentalDuration
                            .isFlatRateSameDay ? (
                            <>
                              for{" "}
                              <span style={{ color: "#dc3545" }}>
                                {Math.floor(
                                  selectedHistoryRental.rentalDuration
                                    .actualSeconds / 3600
                                )}
                                {Math.floor(
                                  selectedHistoryRental.rentalDuration
                                    .actualSeconds / 3600
                                ) === 1
                                  ? "hr"
                                  : "hrs"}
                              </span>{" "}
                              only
                            </>
                          ) : (
                            `${24 * selectedHistoryRental.billedDays} hrs`
                          )}
                          )
                          <br />
                          {selectedHistoryRental.rentalDuration.extraHours >
                            0 && (
                            <>
                              (
                              <span style={{ color: "#dc3545" }}>
                                +
                                {
                                  selectedHistoryRental.rentalDuration
                                    .extraHours
                                }{" "}
                                {selectedHistoryRental.rentalDuration
                                  .extraHours === 1
                                  ? "hr"
                                  : "hrs"}{" "}
                                | ₱
                                {(
                                  selectedHistoryRental.extraHourCharge || 0
                                ).toLocaleString()}
                              </span>
                              )
                            </>
                          )}
                        </span>
                      </li>

                    {(() => {
                      const discountValue = Number(
                        selectedHistoryRental.discountValue || 0
                      );
                      const discountType =
                        selectedHistoryRental.discountType || "peso";

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
                        selectedHistoryRental.paymentEntries &&
                        selectedHistoryRental.paymentEntries.length > 0
                      ) {
                        return selectedHistoryRental.paymentEntries.map(
                          (entry, index) => {
                            // Convert pop to Title Case (capitalize each word)
                            const titleCasePop = entry.pop
                              ? entry.pop
                                  .toLowerCase()
                                  .split(" ")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1)
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
                          }
                        );
                      }
                      return null;
                    })()}

                      </div>

                      {(() => {
                    const discountValue = Number(
                      selectedHistoryRental.discountValue || 0
                    );
                    const discountType = selectedHistoryRental.discountType || "peso";
                    const rawTotal =
                      selectedHistoryRental.billedDays *
                        selectedHistoryRental.discountedRate +
                      selectedHistoryRental.billedDays *
                        selectedHistoryRental.drivingPrice +
                      selectedHistoryRental.extraHourCharge +
                      selectedHistoryRental.pickupPrice;
                    let discountAmount = 0;
                    if (discountType === "peso") {
                      discountAmount = Math.min(discountValue, rawTotal);
                    } else if (discountType === "percent") {
                      discountAmount = Math.min(
                        (discountValue / 100) * rawTotal,
                        rawTotal
                      );
                    }
                    const discountedTotal = Math.max(
                      0,
                      rawTotal - discountAmount
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
                      selectedHistoryRental.discountValue || 0
                    );
                    const discountType = selectedHistoryRental.discountType || "peso";
                    const rawTotal =
                      selectedHistoryRental.billedDays *
                        selectedHistoryRental.discountedRate +
                      selectedHistoryRental.billedDays *
                        selectedHistoryRental.drivingPrice +
                      selectedHistoryRental.extraHourCharge +
                      selectedHistoryRental.pickupPrice;
                    let discountAmount = 0;
                    if (discountType === "peso") {
                      discountAmount = Math.min(discountValue, rawTotal);
                    } else if (discountType === "percent") {
                      discountAmount = Math.min(
                        (discountValue / 100) * rawTotal,
                        rawTotal
                      );
                    }
                    const discountedTotal = Math.max(
                      0,
                      rawTotal - discountAmount
                    );
                    const totalPaid = (
                      selectedHistoryRental.paymentEntries || []
                    ).reduce(
                      (sum, entry) => sum + Number(entry.amount || 0),
                      0
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
                            style={{ color: balanceDue === 0 ? "#28a745" : "#ffb347" }}
                          >
                            Balance Due:
                          </strong>
                          <span
                            className="summary-value"
                            style={{ color: balanceDue === 0 ? "#28a745" : "#dc3545" }}
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
                      
                      onClick={() => setShowHistoryDetailsOverlay(false)}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Overlay */}
      {selectedMessage && (
        <div
          className={`user-message-overlay ${isClosing ? "hidden" : "active"}`}
        >
          <div className="message-overlay-content">
            <button className="close-btn" onClick={closeMessageOverlay}>
              ✖
            </button>

            <div className="overlay-header">
              {/* Inbox Section */}
              {selectedMessageSource === "inbox" ? (
                <>
                  <img
                    src={selectedMessage.profilePic}
                    alt="Profile"
                    className="overlay-profile-pic"
                  />

                  <div>
                    <h3>{selectedMessage.name}</h3>

                    <p className="message-contact">
                      <span className="message-email">
                        {selectedMessage.email}
                      </span>
                      <span className="message-phone">
                        <a
                          href={`tel:${
                            selectedMessage.contact
                              ? selectedMessage.contact.replace(/\s/g, "")
                              : ""
                          }`}
                        >
                          {selectedMessage.contact || "No contact"}
                        </a>
                      </span>
                    </p>

                    <p className="message-date">
                      {selectedMessage.formattedDateTime || "No timestamp"}
                    </p>
                  </div>
                </>
              ) : (
                /* Sent Section */
                <>
                  <img
                    src={selectedMessage.profilePic}
                    alt="Profile"
                    className="overlay-profile-pic"
                  />
                  <div>
                    <h3>From: You</h3>
                    <p className="message-contact">
                      <span className="message-email">
                        To: {selectedMessage.recipientEmail}
                      </span>
                      <span className="message-phone">
                        <a
                          href={`tel:${
                            selectedMessage.recipientContact
                              ? selectedMessage.recipientContact.replace(
                                  /\s/g,
                                  ""
                                )
                              : ""
                          }`}
                        >
                          {selectedMessage.recipientContact || "No contact"}
                        </a>
                      </span>
                    </p>
                    <p className="message-date">
                      {selectedMessage.formattedDateTime || "No timestamp"}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Display full message */}
            {/* <p className="full-message">{selectedMessage.content}</p> */}

            {/* Display full message */}
            <div
              className="full-message"
              dangerouslySetInnerHTML={{ __html: selectedMessage.content }}
            ></div>

            {/* Reply Textarea (Only for Inbox) */}
            {selectedMessageSource === "inbox" && replyMode && (
              <textarea
                className="reply-textarea"
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
            )}

            <div className="overlay-actions">
              <img
                src={deleteIsHovered ? "/assets/delete-hover.png" : "/assets/delete.png"}
                alt="Delete"
                className="delete-icon"
                onMouseEnter={() => setDeleteIsHovered(true)}
                onMouseLeave={() => setDeleteIsHovered(false)}
                onClick={() => {
                  setMessageToDelete(selectedMessage);
                  setShowDeleteOverlay(true);
                }}
              />

              <div className="button-group">
                <button className="forward-btn">Forward</button>
                {selectedMessageSource === "inbox" &&
                  !selectedMessage.isNotification && (
                    <button
                      className="reply-btn"
                      onClick={replyMode ? sendReply : toggleReply}
                    >
                      {replyMode ? "Send" : "Reply"}
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCancelBookingRequest && (
        <div
          className={`date-warning-overlay ${
            hideCancelAnimation ? "hide" : ""
          }`}
        >
          <button
            className="close-warning"
            onClick={() => {
              setHideCancelAnimation(true);
              setTimeout(() => setShowCancelBookingRequest(false), 400);
            }}
          >
            ✖
          </button>
          <span className="warning-text">Booking Request Cancelled!</span>
          <div className="progress-bar"></div>
        </div>
      )}

      {showDeletedBookingRequest && (
        <div
          className={`date-warning-overlay ${
            hideCancelAnimation ? "hide" : ""
          }`}
        >
          <button
            className="close-warning"
            onClick={() => {
              setHideCancelAnimation(true);
              setTimeout(() => setShowDeletedBookingRequest(false), 400);
            }}
          >
            ✖
          </button>
          <span className="warning-text">Booking Request Deleted!</span>
          <div className="progress-bar"></div>
        </div>
      )}

      {showSaveProfileChanges && (
        <div
          className={`sent-ongoing-overlay ${
            hideCancelAnimation ? "hide" : ""
          }`}
        >
          <button
            className="close-sent-ongoing"
            onClick={() => {
              setHideCancelAnimation(true);
              setTimeout(() => setShowSaveProfileChanges(false), 400);
            }}
          >
            ✖
          </button>
          <span className="warning-text">Profile Changes Saved!</span>
          <div className="sent-ongoing-progress-bar"></div>
        </div>
      )}

      {showMessagesDeletedOverlay && (
        <div
          className={`date-warning-overlay ${
            hideMessagesDeletedAnimation ? "hide" : ""
          }`}
        >
          <button
            className="close-warning"
            onClick={() => {
              setHideMessagesDeletedAnimation(true);
              setTimeout(() => setShowMessagesDeletedOverlay(false), 400);
            }}
          >
            ✖
          </button>
          <span className="warning-text">
            {deletedMessageCount === 1
              ? "1 Message Deleted!"
              : `${deletedMessageCount} Messages Deleted!`}
          </span>
          <div className="progress-bar"></div>
        </div>
      )}

      {showLinkAccountOverlay && (
        <div className="admin-booking-confirm-overlay">
          <div className="admin-booking-confirm-container">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowLinkAccountOverlay(false)}
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

            <h3 className="confirm-header">LINK ACCOUNT</h3>
            <p className="confirm-text">
              Manage linked accounts for easier sign-in.
            </p>

            <div className="admin-confirm-details">
              {/* Google Account */}

              {/* Google Account */}
              <div className="provider-container">
                <div className="provider-info">
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    className="provider-logo"
                  />
                  <span className="provider-label">Google</span>
                </div>

                <span
                  className={`provider-status ${hasGoogle ? "unlink" : "link"}`}
                  onClick={handleToggleGoogle}
                >
                  {hasGoogle ? "Unlink" : "Link"}
                </span>
              </div>

              {/* Email/Password Account */}
              <div className="provider-container">
                <div className="provider-info">
                  <img
                    src="/assets/close-envelope.png"
                    alt="Email"
                    className="provider-logo"
                  />
                  <span className="provider-label">Email &amp; Password</span>
                </div>

                <span
                  className={`provider-status ${hasEmail ? "unlink" : "link"}`}
                  onClick={() => {
                    // If already linked -> unlink immediately
                    if (hasEmail) {
                      handleToggleEmail();
                    } else {
                      // Open overlay to collect current password for linking
                      setShowEmailPasswordOverlay(true);
                    }
                  }}
                >
                  {hasEmail ? "Unlink" : "Link"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEmailPasswordOverlay && (
        <div className="admin-booking-confirm-overlay">
          <div className="admin-booking-confirm-container">
            <button
              className="close-btn"
              type="button"
              onClick={() => {
                setShowEmailPasswordOverlay(false);
                setEmailPasswordInput("");
                setShowPassword(false); // reset on close
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

            <h3 className="confirm-header">LINK EMAIL &amp; PASSWORD</h3>
            <p className="confirm-text">
              To link Email &amp; Password, enter the password for <br />
              <br />
              <strong
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "#28a745",
                }}
              >
                {user?.email}
              </strong>
              .
            </p>

            <div className="admin-confirm-details">
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="profile-section-label-input"
                  placeholder="Enter current email password"
                  value={emailPasswordInput}
                  onChange={(e) => setEmailPasswordInput(e.target.value)}
                  style={{ width: "100%", paddingRight: 40 }}
                />

                <span
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-hidden="true"
                >
                  {/* {showPassword ? (
                    <HideIcon width={20} height={20} />
                  ) : (
                    <UnhideIcon width={20} height={20} />
                  )} */}

                  {showPassword ? (
                    <img src="/assets/hide.svg" alt="Hide" width={20} height={20} />
                  ) : (
                    <img src="/assets/unhide.svg" alt="Unhide" width={20} height={20} />
                  )}

                </span>
              </div>

              <div
                className="confirm-details-button-group"
                style={{ marginTop: 16 }}
              >
                <button
                  className="confirm-details-btn"
                  style={{
                    backgroundColor: "#28a745",
                    justifyContent: "space-around",
                  }}
                  onClick={async () => {
                    await handleToggleEmail(user?.email, emailPasswordInput);
                    setEmailPasswordInput("");
                    setShowEmailPasswordOverlay(false);
                    setShowPassword(false);
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUnlinkBlockedOverlay && (
        <div className="admin-booking-confirm-overlay">
          <div className="admin-booking-confirm-container">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowUnlinkBlockedOverlay(false)}
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
            <h3 className="confirm-header">CANNOT UNLINK</h3>
            <p
              className="confirm-text"
              style={{ fontSize: "1.2rem", lineHeight: "1.6" }}
            >
              You must have at least{" "}
              <span style={{ color: "#dc3545", fontWeight: "bold" }}>ONE</span>{" "}
              linked account to keep your profile accessible. Please link
              another provider before unlinking this one.
            </p>
            <div className="admin-confirm-details"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;


