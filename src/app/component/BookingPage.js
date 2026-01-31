'use client';
import React, { useState, useEffect, useRef, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
import { useRouter } from 'next/navigation';
import { Timestamp } from "firebase/firestore";


import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";

import "./BookingPage.css";
import { useUser } from "../lib/UserContext";
// import pickacar from "../assets/images/image1.png";
// import showBtn from "../assets/prv-btn.png";
// import hideBtn from "../assets/nxt-btn.png";
// import close_0Btn from "../assets/close_0.png";
// import close_1Btn from "../assets/close_1.png";

const BookingPage = ({
  isOpen,
  closeOverlay,
  buttonRect,
  triggerSuccessOverlay,
  prefillData,
  editingBookingData,
}) => {
  const { unitData, user, setShowVerifyOverlay, referralSources, fetchImageFromFirestore } = useUser();
const [skipImageUpdate, setSkipImageUpdate] = useState(false);

  const [isDurationInvalid, setIsDurationInvalid] = useState(false);

  const endTimeRef = useRef(null);

  const DEFAULT_DRIVER_RATE = 700;
  const DEFAULT_DELIVERY_FEE = 350;

  // const navigate = useNavigate();
  const router = useRouter();

  const {
    isAdmin,
    submitUserBookingRequest,
    editingBooking,
    resubmitUserBookingRequest,

    saveBookingFormData,
    loadSavedBookingFormData,
    clearSavedBookingFormData,
  } = useUser();

  const [overlayStyle, setOverlayStyle] = useState({ opacity: 0 });
  const [containerStyle, setContainerStyle] = useState({});
  // const [selectedCar, setSelectedCar] = useState("");
  const [selectedCarId, setSelectedCarId] = useState("");

  const [driveType, setDriveType] = useState("Self-Drive");
  const [dropOffType, setDropOffType] = useState("Pickup");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedID, setUploadedID] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("/assets/images/image1.png");
  const [imageAnimation, setImageAnimation] = useState("");
  const [fileError, setFileError] = useState(false);

  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmOverlay, setShowConfirmOverlay] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const [bookingPreviewData, setBookingPreviewData] = useState(null);

  const [selectedCarType, setSelectedCarType] = useState("ALL");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
const [isDiscarding, setIsDiscarding] = useState(false);

const [loadSavedData, setLoadSavedData] = useState(false);
const [showLoadSavedData, setShowLoadSavedData] = useState(false);
const [discardSavedData, setDiscardSavedData] = useState(false);
const [showDiscardSavedData, setShowDiscardSavedData] = useState(false);



  const [showClearFormOverlay, setShowClearFormOverlay] = useState(false);

  const [showLoadSavedDialog, setShowLoadSavedDialog] = useState(false);
  const [savedFormData, setSavedFormData] = useState(null);

  const [showSubmittedBookingRequest, setShowSubmittedBookingRequest] =
    useState(false);
  const [hideAnimation, setHideAnimation] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [filteredUnits, setFilteredUnits] = useState(unitData || []);
  const selectedUnit = unitData.find((unit) => unit.id === selectedCarId);


  useEffect(() => {
    if (!unitData || unitData.length === 0) {
      console.log("🔍 No unitData yet — clearing filteredUnits");
      setFilteredUnits([]);
      return;
    }

    // 🧩 Normalize car type to prevent accidental blanks or undefined
    const type = selectedCarType?.trim() || "ALL";

    // 🧠 Filter logic with double safety
    const filtered =
      type === "ALL"
        ? unitData
        : unitData.filter(
            (unit) => unit.carType?.toLowerCase() === type.toLowerCase()
          );

    console.log(`✅ Filtered units set: ${filtered.length} (type: ${type})`);
    setFilteredUnits(filtered);
  }, [unitData, selectedCarType]);

  const derivedPrefill = prefillData || user || {};

  const [actionOverlay, setActionOverlay] = useState({
    isVisible: false,
    message: "",
    type: "success", // "success" => green, "warning" => red
  });
  const [hideCancelAnimation, setHideCancelAnimation] = useState(true);

  const [fetchedImages, setFetchedImages] = useState({});


  const showActionOverlay = ({
    message = "",
    type = "success",
    autoHide = true,
    duration = 5000,
  } = {}) => {
    setHideCancelAnimation(false);
    setActionOverlay({ isVisible: true, message, type });
    if (autoHide) {
      setTimeout(() => {
        setHideCancelAnimation(true);
        setTimeout(
          () => setActionOverlay((s) => ({ ...s, isVisible: false })),
          400
        );
      }, duration);
    }
  };

  




// useEffect(() => {
//   if (selectedCarId) {
//     const selectedUnit = unitData.find((unit) => unit.id === selectedCarId);
//     if (selectedUnit?.imageId) {
//       fetchImageFromFirestore(selectedUnit.imageId)
//         .then(({ base64 }) => {
//           setPreviewImage(base64 || pickacar);
//         })
//         .catch(() => {
//           setPreviewImage(pickacar);
//         });
//     } else {
//       setPreviewImage(pickacar);
//     }
//   } else {
//     setPreviewImage(pickacar);
//   }
// }, [selectedCarId, unitData, fetchImageFromFirestore]);


useEffect(() => {
  if (skipImageUpdate) {
    setSkipImageUpdate(false);
    return;
  }

  const selectedUnit = unitData.find((u) => u.id === selectedCarId);
  if (selectedUnit?.imageId) {
    fetchImageFromFirestore(selectedUnit.imageId)
      .then(({ base64 }) => {
        setPreviewImage(base64 || "/assets/images/image1.png");
      })
      .catch(() => {
        setPreviewImage("/assets/images/image1.png");
      });
  } else {
    setPreviewImage("/assets/images/image1.png");
  }
}, [selectedCarId, unitData, fetchImageFromFirestore]);












const galleryRef = useRef(null);

useEffect(() => {
  const lightbox = new PhotoSwipeLightbox({
    gallery: galleryRef.current,
    children: "a",
    pswpModule: () => import("photoswipe"),
    showHideAnimationType: "fade",
    paddingFn: () => ({ top: 50, bottom: 50, left: 20, right: 20 }),
    maxWidth: window.innerWidth * 0.8,
    maxHeight: window.innerHeight * 0.8,
  });

  lightbox.init();
  return () => lightbox.destroy();
}, []);









  useEffect(() => {
    const checkForSavedData = async () => {
      try {
        console.log("🚀 Checking for saved booking data...");
        const result = await loadSavedBookingFormData();
        console.log("📦 loadSavedBookingFormData() result:", result);

        if (result.success && result.data) {
          console.log("✅ Found saved data, showing dialog...");
          setSavedFormData(result.data);
          setShowLoadSavedDialog(true);
        } else {
          console.log("ℹ️ No saved data found or load failed.");
        }
      } catch (error) {
        console.error("❌ Error checking saved data:", error);
      }
    };

    if (isOpen) {
      console.log(
        "📖 Booking form opened, deciding whether to check for saved data..."
      );
      console.log("➡️ editingBookingData:", editingBookingData);

      const isResubmitting = editingBookingData?.isResubmitting === true;
      const isEditing = editingBookingData?.isResubmitting === false;

      if (isResubmitting || isEditing) {
        console.log("⏭️ Skipping saved data check (editing or resubmitting).");
        return; // ⛔ Don’t trigger load dialog for edit/resubmit
      }

      // ✅ New booking → check for saved data
      checkForSavedData();
    } else {
      console.log("📕 Booking form closed, skipping check.");
    }
  }, [isOpen, editingBookingData]);





const handleLoadSavedData = async () => {
  try {
    setLoadSavedData(true); // 🟢 Show loading overlay

    // Optional delay for animation feel
    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (savedFormData) {
      // 🧩 Load the saved form data
      setFormData({
        firstName: savedFormData.firstName || "",
        middleName: savedFormData.middleName || "",
        surname: savedFormData.surname || "",
        occupation: savedFormData.occupation || "",
        address: savedFormData.address || "",
        contactNo: savedFormData.contactNo || "",
        email: savedFormData.email || "",
        location: savedFormData.location || "",
        dropoffLocation: savedFormData.dropoffLocation || "",
        purpose: savedFormData.purpose || "",
        additionalMessage: savedFormData.additionalMessage || "",
        referralSource: savedFormData.referralSource || "",
      });

      // 🚗 Load other fields
      // setSelectedCar(savedFormData.selectedCar || "");
      const savedUnit = unitData.find((u) => u.name === savedFormData.selectedCar);
setSelectedCarId(savedUnit?.id || "");

      setSelectedCarType(savedFormData.selectedCarType || "ALL");
      setDriveType(savedFormData.driveType || "Self-Drive");
      setDropOffType(savedFormData.dropOffType || "Pickup");
      setStartDate(savedFormData.startDate || "");
      setStartTime(savedFormData.startTime || "");
      setEndDate(savedFormData.endDate || "");
      setEndTime(savedFormData.endTime || "");
      setUploadedID(savedFormData.driverLicense || null);

      const selectedUnit = unitData.find(
        (u) => u.name === savedFormData.selectedCar
      );
      // setPreviewImage(selectedUnit?.image || pickacar);
      if (selectedUnit?.imageId) {
        const { base64 } = await fetchImageFromFirestore(selectedUnit.imageId);
        setPreviewImage(base64 || "/assets/images/image1.png");
      } else {
        setPreviewImage("/assets/images/image1.png");
      }

      setHasChanges(true);
    }

    // 🟢 Hide loading first before showing success
    setLoadSavedData(false);

    // ✅ Then show confirmation overlay
    setShowLoadSavedData(true);

    // ⏳ Hide success overlay after 4 seconds
    setTimeout(() => setShowLoadSavedData(false), 4000);
  } catch (error) {
    console.error("❌ Error loading saved data:", error);
    setLoadSavedData(false);
  } finally {
    setShowLoadSavedDialog(false);
  }
};







  // const handleDiscardSavedData = () => {
  //   // Clear saved data without loading
  //   clearSavedBookingFormData();
  //   setShowLoadSavedDialog(false);
  // };


const handleDiscardSavedData = async () => {
  try {
    setDiscardSavedData(true); // 🟢 Show “Discarding…” overlay

    await new Promise((resolve) => setTimeout(resolve, 1200)); // Simulate brief delay

    // 🧹 Clear the saved booking data
    await clearSavedBookingFormData();

    // 🟣 Hide the loading overlay first
    setDiscardSavedData(false);

    // ✅ Then show success overlay
    setShowDiscardSavedData(true);

    // ⏳ Hide success overlay after 4 seconds
    setTimeout(() => setShowDiscardSavedData(false), 4000);
  } catch (error) {
    console.error("❌ Error discarding saved data:", error);
    setDiscardSavedData(false);
  } finally {
    setShowLoadSavedDialog(false);
  }
};



  //AUTOFILL DATA
  const [formData, setFormData] = useState({
    firstName: derivedPrefill.firstName || "",
    middleName: derivedPrefill.middleName || "",
    surname: derivedPrefill.surname || "",
    occupation: derivedPrefill.occupation || "",
    address: derivedPrefill.address || "",
    contactNo: derivedPrefill.phone || "",
    email: derivedPrefill.email || "",
    location: "",
    dropoffLocation: "",
    purpose: "",
    additionalMessage: "",
  });

  useEffect(() => {
    if (prefillData) {
      setSelectedCarType(prefillData.carType || "ALL");
      // setSelectedCar(prefillData.carName || "");
      const prefillUnit = unitData.find((u) => u.name === prefillData.carName);
setSelectedCarId(prefillUnit?.id || "");

      setDriveType(prefillData.drivingOption || "Self-Drive");
      setDropOffType(prefillData.pickupOption || "Pickup");

      setStartDate(prefillData.startDate || "");
      setStartTime(prefillData.startTime || "");
      setEndDate(prefillData.endDate || "");
      setEndTime(prefillData.endTime || "");

      // Image
      const selectedUnit = unitData.find((u) => u.name === prefillData.carName);
      // setPreviewImage(selectedUnit?.image || pickacar);
      if (selectedUnit?.imageId) {
          fetchImageFromFirestore(selectedUnit.imageId)
            .then(({ base64 }) => {
              setPreviewImage(base64 || "/assets/images/image1.png");
            })
            .catch(() => {
              setPreviewImage("/assets/images/image1.png");
            });
        } else {
          setPreviewImage("/assets/images/image1.png");
        }

      // Form data
      setFormData((prev) => ({
        ...prev,
        firstName: prefillData.firstName || prev.firstName,
        middleName: prefillData.middleName || prev.middleName,
        surname: prefillData.surname || prev.surname,
        occupation: prefillData.occupation || prev.occupation,
        address: prefillData.address || prev.address,
        contactNo: prefillData.contact || prev.contactNo,
        email: prefillData.email || prev.email,
        location: prefillData.location || prev.location,
        dropoffLocation: prefillData.dropoffLocation || prev.dropoffLocation,
        purpose: prefillData.purpose || prev.purpose,
        additionalMessage:
          prefillData.additionalMessage || prev.additionalMessage,
      }));

      if (prefillData.driverLicense) {
        setUploadedID(prefillData.driverLicense);
      }
    }
  }, [prefillData, unitData, fetchImageFromFirestore]);

  useEffect(() => {
    if (!startDate || !endDate || !startTime || !endTime) {
      setIsDurationInvalid(false);
      return;
    }

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const diffTime = end.getTime() - start.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);

    setIsDurationInvalid(diffHours < 1);
  }, [startDate, endDate, startTime, endTime]);

  const handleImageClick = () => {
    setIsImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
  };

  const [showBookingConfirmOverlay, setShowBookingConfirmOverlay] =
    useState(false);

  // RENDER PROBLEMS IF DEBOUNCE IS INSIDE THE COMPONENT
  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  const debouncedSetHasChanges = debounce(() => {
    setHasChanges(true);
  }, 500);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // ✅ Update formData immediately for responsive typing
    setFormData((prev) => ({ ...prev, [name]: value }));

    // ✅ Call debounced function to setHasChanges(true)
    debouncedSetHasChanges();
  };

  const getColorForSelectedOption = (value) => {
    return value ? "green-label" : "red-label";
  };

  const QuotationSummary = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
      const handleResize = () => {
        if (window.innerWidth < 900) {
          setIsCollapsed(false);
        } else {
          setIsCollapsed(true);
        }
      };

      // Set default state when component mounts
      handleResize();

      // Add event listener to handle resizing
      window.addEventListener("resize", handleResize);

      // Cleanup the event listener on unmount
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    // const selectedUnit = unitData.find((unit) => unit.name === selectedCar);
    const selectedUnit = unitData.find((unit) => unit.id === selectedCarId);


    return (
      <div className="quotation-summary">
        <h3
          className="collapsible-header"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          QUOTATION SUMMARY
          <img
            src="/assets/nxt-btn.png"
            alt="Hide icon"
            className={`toggle-icon ${isCollapsed ? "hidden" : ""}`}
          />
          <img
            src="/assets/prv-btn.png"
            alt="Show icon"
            className={`toggle-icon ${!isCollapsed ? "hidden" : ""}`}
          />
        </h3>

        {/* Total Price section placed directly under the header */}
        <div className="checkout-total">
          <strong>Total Price:</strong>
          <span className="total-price">₱{totalPrice.toLocaleString()}</span>
        </div>

        {/* The rest of the summary details with animation */}
        <div className={`sticky-details ${isCollapsed ? "open" : ""}`}>
          <div className="checkout-item">
            {/* <span className={`label ${getColorForSelectedOption(selectedCar)}`}> */}
              <span className={`label ${getColorForSelectedOption(selectedCarId)}`}>
              <label>Car:</label> <br />
              {/* {selectedCar || "Pick a Car"} */}
              {selectedUnit?.name || "Pick a Car"}
            </span>
            <span className="price">{getCarRate()}</span>
          </div>

          <div className="checkout-item">
            <span className={`label ${getColorForSelectedOption(driveType)}`}>
              <label>Driving Option:</label> <br />
              {driveType}
            </span>
            <span className="price">{getDrivingPrice(selectedUnit)}</span>
          </div>

          <div className="checkout-item">
            <span className={`label ${getColorForSelectedOption(dropOffType)}`}>
              <label>Pickup / Drop-off:</label> <br />
              {dropOffType}
            </span>
            <span className="price">{getDropOffPrice(selectedUnit)}</span>
          </div>

          <div className="checkout-item">
            <span
              className={`label ${
                startDate && startTime && endDate && endTime
                  ? "green-label"
                  : "red-label"
              }`}
            >
              <label>Rental Period:</label> <br />
              <span
                dangerouslySetInnerHTML={{ __html: getRentalPeriodText() }}
              />
            </span>
            <span className="price">{getRentalDuration()}</span>
            {/* Display error message below Rental Period */}
            {errorMessage && (
              <div className="date-error-message">{errorMessage}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    calculateTotalPrice();
  }, [
    selectedCarId,
    startDate,
    endDate,
    startTime,
    endTime,
    driveType,
    dropOffType,
  ]);

const calculateTotalPrice = () => {
  if (!selectedCarId) {
    setTotalPrice(0);
    return;
  }

    const start = startDate
      ? new Date(`${startDate}T${startTime || "10:00"}`)
      : null;
    const end = endDate ? new Date(`${endDate}T${endTime || "10:00"}`) : null;

    // const selectedUnit = unitData.find((unit) => unit.name === selectedCar);
    const selectedUnit = unitData.find((unit) => unit.id === selectedCarId);

    let diffDays = 1;
    let extraHours = 0;
    let extraHourCharge = 0;
    let isFlatRateSameDay = false;

    if (start && end) {
      const diffTime = end.getTime() - start.getTime();
      const diffHours = diffTime / (1000 * 60 * 60);

      isFlatRateSameDay = startDate === endDate && diffHours < 24;

      if (!isFlatRateSameDay) {
        diffDays = Math.floor(diffHours / 24);
        extraHours = Math.round(diffHours % 24);
        // extraHourCharge = extraHours > 0 ? extraHours * 350 : 0;
        extraHourCharge =
          extraHours > 0 ? extraHours * (selectedUnit.extension || 0) : 0;
      } else {
        diffDays = 1;
      }
    }

    if (!selectedUnit) return;

    const finalRate = getDiscountedRate(selectedUnit, diffDays);
    let total = finalRate * diffDays;

    if (driveType === "With Driver") {
      // total += diffDays * 1000;
      total += diffDays * (selectedUnit.driverRate || 0);
    }

    if (dropOffType === "Drop-off") {
      // total += 500;
      total += selectedUnit.deliveryFee || 0;
    }

    if (!isFlatRateSameDay) {
      total += extraHourCharge;
    }

    setTotalPrice(total);
  };

  // const getDiscountedRate = (unit, rentalDays) => {
  //   if (!unit || !unit.rates) return unit?.price || 0;

  //   const { daily, discount3Days, discount7Days, discount30Days } = unit.rates;

  //   if (rentalDays >= 30) return discount30Days || daily;
  //   if (rentalDays >= 7) return discount7Days || daily;
  //   if (rentalDays >= 3) return discount3Days || daily;
  //   return daily;
  // };

  const getDiscountedRate = (unit, rentalDays) => {
    if (!unit) return 0;
    return unit.price;
  };

  // const getDrivingPrice = (unit) => {
  //   if (!unit || driveType !== "With Driver") return "₱0";

  //   if (startDate && endDate && startTime && endTime) {
  //     const start = new Date(`${startDate}T${startTime}`);
  //     const end = new Date(`${endDate}T${endTime}`);
  //     const diffTime = end - start;
  //     const diffHours = diffTime / (1000 * 60 * 60);

  //     const isFlatRateSameDay = startDate === endDate && diffHours < 24;
  //     const rentalDays = isFlatRateSameDay ? 1 : Math.floor(diffHours / 24);

  //     const total = rentalDays * (unit.driverRate || 0);

  //     return `(₱${(unit.driverRate || 0).toLocaleString()} x ${rentalDays} Day${
  //       rentalDays > 1 ? "s" : ""
  //     }) ₱${total.toLocaleString()}`;
  //   }

  //   return `(₱${(unit.driverRate || 0).toLocaleString()} x 1 Day) ₱${(unit.driverRate || 0).toLocaleString()}`;
  // };

  // const getDropOffPrice = (unit) => {
  //   return dropOffType === "Drop-off"
  //     ? `₱${(unit.deliveryFee || 0).toLocaleString()}`
  //     : "₱0";
  // };

  const getDrivingPrice = (unit) => {
    if (driveType !== "With Driver") return "₱0";

    if (startDate && endDate && startTime && endTime) {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);
      const diffTime = end - start;
      const diffHours = diffTime / (1000 * 60 * 60);

      const isFlatRateSameDay = startDate === endDate && diffHours < 24;
      const rentalDays = isFlatRateSameDay ? 1 : Math.floor(diffHours / 24);

      const total = rentalDays * (unit?.driverRate || DEFAULT_DRIVER_RATE);

      return `(₱${(
        unit?.driverRate || DEFAULT_DRIVER_RATE
      ).toLocaleString()} x ${rentalDays} Day${
        rentalDays > 1 ? "s" : ""
      }) ₱${total.toLocaleString()}`;
    }

    return `(₱${(
      unit?.driverRate || DEFAULT_DRIVER_RATE
    ).toLocaleString()} x 1 Day) ₱${(
      unit?.driverRate || DEFAULT_DRIVER_RATE
    ).toLocaleString()}`;
  };

  const getDropOffPrice = (unit) => {
    return dropOffType === "Drop-off"
      ? `₱${(unit?.deliveryFee || DEFAULT_DELIVERY_FEE).toLocaleString()}`
      : "₱0";
  };

const getCarRate = () => {
  if (!selectedCarId) return "";

    // const selectedUnit = unitData.find((unit) => unit.name === selectedCar);
      const selectedUnit = unitData.find((unit) => unit.id === selectedCarId);


    if (!selectedUnit) return "";

    let rentalDays = 1; // Default to 1 day if dates not selected
    let isFlatRateSameDay = false;

    if (startDate && endDate && startTime && endTime) {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);
      const diffTime = end.getTime() - start.getTime();
      const diffHours = diffTime / (1000 * 60 * 60);

      isFlatRateSameDay = startDate === endDate && diffHours < 24;
      rentalDays = isFlatRateSameDay ? 1 : Math.floor(diffHours / 24);
    }

    const finalRate = getDiscountedRate(selectedUnit, rentalDays);

    return `(₱${finalRate.toLocaleString()} x ${rentalDays} Day${
      rentalDays > 1 ? "s" : ""
    }) ₱${(finalRate * rentalDays).toLocaleString()}`;
  };

  // const getCarRate = () => {
  //   if (!selectedCar || !startDate || !endDate || !startTime || !endTime)
  //     return "";

  //   const start = new Date(`${startDate}T${startTime}`);
  //   const end = new Date(`${endDate}T${endTime}`);
  //   const diffTime = end.getTime() - start.getTime();
  //   const diffHours = diffTime / (1000 * 60 * 60);

  //   const isFlatRateSameDay = startDate === endDate && diffHours < 24;
  //   const rentalDays = isFlatRateSameDay ? 1 : Math.floor(diffHours / 24);

  //   const selectedUnit = unitData.find((unit) => unit.name === selectedCar);
  //   if (!selectedUnit) return "";

  //   const finalRate = getDiscountedRate(selectedUnit, rentalDays);

  //   return `(₱${finalRate.toLocaleString()} x ${rentalDays} Day${
  //     rentalDays > 1 ? "s" : ""
  //   }) ₱${(finalRate * rentalDays).toLocaleString()}`;
  // };

  // const getDrivingPrice = () => {
  //   const dailyRate = 1000;

  //   if (driveType !== "With Driver") return "₱0";

  //   if (startDate && endDate && startTime && endTime) {
  //     const start = new Date(`${startDate}T${startTime}`);
  //     const end = new Date(`${endDate}T${endTime}`);
  //     const diffTime = end - start;
  //     const diffHours = diffTime / (1000 * 60 * 60);

  //     const isFlatRateSameDay = startDate === endDate && diffHours < 24;
  //     const rentalDays = isFlatRateSameDay ? 1 : Math.ceil(diffHours / 24);

  //     const total = rentalDays * dailyRate;

  //     return `(₱${dailyRate.toLocaleString()} x ${rentalDays} Day${
  //       rentalDays > 1 ? "s" : ""
  //     }) ₱${total.toLocaleString()}`;
  //   }

  //   // Default fallback if dates not selected
  //   return `(₱${dailyRate.toLocaleString()} x 1 Day) ₱${dailyRate.toLocaleString()}`;
  // };

  // const getDropOffPrice = () => {
  //   return dropOffType === "Drop-off" ? "₱500" : "₱0";
  // };

  // const getRentalDuration = () => {
  //   if (!startDate || !endDate || !startTime || !endTime) return "";

  //   const start = new Date(`${startDate}T${startTime}`);
  //   const end = new Date(`${endDate}T${endTime}`);
  //   const diffTime = end.getTime() - start.getTime();
  //   const diffHours = diffTime / (1000 * 60 * 60);

  //   const isFlatRateSameDay = startDate === endDate && diffHours < 24;
  //   const isExactOneDay = diffHours === 24;

  //   if (isFlatRateSameDay) {
  //     return (
  //       <>
  //         (1 Day / for{" "}
  //         <span style={{ color: "#dc3545" }}>
  //           {Math.round(diffHours)}hr{Math.round(diffHours) !== 1 ? "s" : ""}
  //         </span>{" "}
  //         only)
  //         <br />
  //         <span style={{ color: "#dc3545" }}>
  //           (Flat rate applies for same-day rental)
  //         </span>
  //       </>
  //     );
  //   }

  //   const diffDays = Math.floor(diffHours / 24);
  //   const extraHours = Math.round(diffHours % 24);

  //   const selectedUnit = unitData.find((unit) => unit.name === selectedCar);
  //   const extraHourCharge = extraHours > 0 ? extraHours * (selectedUnit?.extension || 0) : 0;

  //   // const extraHourCharge = extraHours > 0 ? extraHours * 350 : 0;

  //   return (
  //     <>
  //       ({diffDays} Day{diffDays !== 1 ? "s" : ""} / 24 hrs)
  //       {extraHours > 0 && (
  //         <>
  //           <br />(
  //           <span style={{ color: "#dc3545" }}>
  //             +{extraHours}hr{extraHours !== 1 ? "s" : ""} | ₱
  //             {extraHourCharge.toLocaleString()}
  //           </span>
  //           )
  //         </>
  //       )}
  //     </>
  //   );
  // };

  // const getRentalDuration = () => {
  //   if (!startDate || !endDate || !startTime || !endTime) return "";

  //   const start = new Date(`${startDate}T${startTime}`);
  //   const end = new Date(`${endDate}T${endTime}`);
  //   const diffTime = end.getTime() - start.getTime();
  //   const diffHours = diffTime / (1000 * 60 * 60);

  //   const isFlatRateSameDay = startDate === endDate && diffHours < 24;
  //   const isExactOneDay = diffHours === 24;

  //   if (isFlatRateSameDay) {
  //     return (
  //       <>
  //         (1 Day / for{" "}
  //         <span style={{ color: "#dc3545" }}>
  //           {Math.round(diffHours)}hr{Math.round(diffHours) !== 1 ? "s" : ""}
  //         </span>{" "}
  //         only)
  //         <br />
  //         <span style={{ color: "#dc3545" }}>
  //           (Flat rate applies for same-day rental)
  //         </span>
  //       </>
  //     );
  //   }

  //   const diffDays = Math.floor(diffHours / 24);
  //   const extraHours = Math.round(diffHours % 24);

  //   const selectedUnit = unitData.find((unit) => unit.name === selectedCar);
  //   const extraHourCharge = extraHours > 0 ? extraHours * (selectedUnit?.extension || 0) : 0;

  //   return (
  //     <>
  //       ({diffDays} Day{diffDays !== 1 ? "s" : ""} / {diffDays * 24} hrs)
  // {extraHours > 0 && (
  //   <>
  //     <br />(<span style={{ color: "#dc3545" }}>+{extraHours} hr | {extraHours !== 1 ? "s" : ""} ₱{extraHourCharge.toLocaleString()}</span>)
  //   </>
  // )}

  //     </>
  //   );
  // };

  const getRentalDuration = () => {
    if (!startDate || !endDate || !startTime || !endTime) return "";

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const diffTime = end.getTime() - start.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);

    if (diffHours < 1) {
      return (
        <span style={{ color: "#dc3545" }}>
          Rental duration must be at least 1 hour
        </span>
      );
    }

    const isFlatRateSameDay = startDate === endDate && diffHours < 24;
    const isExactOneDay = diffHours === 24;

    if (isFlatRateSameDay) {
      return (
        <>
          (1 Day / for{" "}
          <span style={{ color: "#dc3545" }}>
            {Math.round(diffHours)}hr{Math.round(diffHours) !== 1 ? "s" : ""}
          </span>{" "}
          only)
          <br />
          <span style={{ color: "#dc3545" }}>
            (Flat rate applies for same-day rental)
          </span>
        </>
      );
    }

    const diffDays = Math.floor(diffHours / 24);
    const extraHours = Math.round(diffHours % 24);

    // const selectedUnit = unitData.find((unit) => unit.name === selectedCar);
    const selectedUnit = unitData.find((unit) => unit.id === selectedCarId);

    const extraHourCharge =
      extraHours > 0 ? extraHours * (selectedUnit?.extension || 0) : 0;

    return (
      <>
        ({diffDays} Day{diffDays !== 1 ? "s" : ""} / {diffDays * 24} hrs)
        {extraHours > 0 && (
          <>
            <br />(
            <span style={{ color: "#dc3545" }}>
              {extraHours} hr{extraHours !== 1 ? "s" : ""} ₱
              {extraHourCharge.toLocaleString()}
            </span>
            )
          </>
        )}
      </>
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target.closest("form");
    const isEditing = Boolean(editingBookingData);

    if (isDurationInvalid) {
      endTimeRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!uploadedID) {
      setFileError(true);
      return;
    }

    // const selectedUnit = unitData.find((unit) => unit.name === selectedCar);
    const selectedUnit = unitData.find((unit) => unit.id === selectedCarId);

    if (!selectedUnit) return;

    const drivingDailyRate = selectedUnit.driverRate || 0;
    const dropOffFlatRate = selectedUnit.deliveryFee || 0;

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const diffTime = end.getTime() - start.getTime();
    const totalHours = diffTime / (1000 * 60 * 60);
    const totalDurationInSeconds = Math.floor(diffTime / 1000);

    const isFlatRateSameDay = startDate === endDate && totalHours < 24;

    let rentalDays = isFlatRateSameDay ? 0 : Math.floor(totalHours / 24);
    let extraHour = isFlatRateSameDay ? 0 : Math.round(totalHours % 24);
    // let extraHourCharge = isFlatRateSameDay ? 0 : extraHour * 350;

    let extraHourCharge = isFlatRateSameDay
      ? 0
      : extraHour * (selectedUnit.extension || 0);

    const discountedRate = getDiscountedRate(selectedUnit, rentalDays || 1);
    const billedDays = isFlatRateSameDay
      ? 1
      : rentalDays + (extraHour >= 24 ? 1 : 0);

    const drivingPrice = driveType === "With Driver" ? drivingDailyRate : 0;
    const pickupPrice = dropOffType === "Drop-off" ? dropOffFlatRate : 0;

    const baseRentalCharge = isFlatRateSameDay
      ? discountedRate
      : rentalDays * discountedRate;

    const drivingCharge = drivingPrice * (rentalDays || 1);
    const total =
      baseRentalCharge + drivingCharge + pickupPrice + extraHourCharge;

    const isRejected = editingBookingData?.status === "Rejected";

    const startDateTimeString = `${startDate}T${startTime}:00`;
    const userStartTime = new Date(startDateTimeString);
    const startTimestamp = Timestamp.fromDate(
      isNaN(userStartTime.getTime()) ? new Date() : userStartTime
    );

    const previewData = {
      // unitImage: selectedUnit?.image || "N/A",
      unitImage: selectedUnit?.imageId || "N/A",
      imageId: selectedUnit?.imageId || "N/A",
      plateNo: selectedUnit?.plateNo || "N/A",
      carType: selectedUnit?.carType || "N/A",
      // carName: selectedCar,
      carName: selectedUnit?.name || "",

      drivingOption: driveType,
      pickupOption: dropOffType,
      ...(dropOffType !== "Pickup" && {
        dropoffLocation: formData.dropoffLocation,
      }),
      startDate,
      endDate,
      startTime,
      endTime,

      location: formData.location,
      purpose: formData.purpose,
      referralSource: formData.referralSource || "Not Specified",
      additionalMessage: formData.additionalMessage || "None",

      firstName: formData.firstName,
      middleName: formData.middleName,
      surname: formData.surname,
      contact: formData.contactNo,
      email: formData.email,
      occupation: formData.occupation,

      address: formData.address,
      driverLicense: uploadedID,
      billedDays,
      drivingPrice,
      pickupPrice,
      discountedRate,
      extraHourCharge,
      rentalDuration: {
        days: rentalDays,
        extraHour: extraHour,
        actualSeconds: totalDurationInSeconds,
        isFlatRateSameDay,
      },
      totalPrice: total,
      totalDurationInSeconds,
      startTimestamp,

      isEditing: isEditing && !isRejected,
      isResubmitting: isRejected,

      ...(editingBookingData?.id && { bookingId: editingBookingData.id }),

      status: editingBookingData?.status || "Pending",
    };

    setBookingPreviewData(previewData);
    setShowBookingConfirmOverlay(true);
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    setErrorMessage("");
    setHasChanges(true);
  };

  const handleEndDateChange = (e) => {
    const selectedEndDate = e.target.value;

    if (startDate && new Date(selectedEndDate) < new Date(startDate)) {
      setErrorMessage("End Date CANNOT BE BEFORE the Start Date");
      setEndDate("");
    } else {
      setEndDate(selectedEndDate);
      setErrorMessage("");
      setHasChanges(true);
    }
  };

  const handleStartTimeChange = (e) => {
    const selectedTime = e.target.value;
    setStartTime(selectedTime);
    setHasChanges(true);

    // If the user has not set an end time, set it to match start time
    if (!endTime) {
      setEndTime(selectedTime);
    }
  };

  const handleEndTimeChange = (e) => {
    setEndTime(e.target.value);
    setHasChanges(true);

    if (!startTime) {
      setStartTime(e.target.value);
    }
  };

  const getRentalPeriodText = () => {
    if (!startDate) return "Pick a START DATE";
    if (!startTime) return "Pick a START TIME";
    if (!endDate) return "Pick an END DATE";
    if (new Date(endDate) < new Date(startDate))
      return "End Date CANNOT BE BEFORE Start Date";
    if (!endTime) return "Pick an END TIME";
    return `${formatDateTime(
      startDate,
      startTime
    )} <br> to <br> ${formatDateTime(endDate, endTime)}`;
  };

  const formatDateTime = (date, time) => {
    if (!date || !time) return "N/A";

    const dateObj = new Date(`${date}T${time}`);
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    const formattedTime = dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return `${formattedDate} | ${formattedTime}`;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedID(file);
      setFileError(false);
      setHasChanges(true);
    }
  };





  const handleConfirmBooking = async () => {
    if (!user?.emailVerified) {
      setShowVerifyOverlay(true); // ✅ opens the global verification overlay
      return;
    }

    if (isAdmin) {
      setHasChanges(false);
      handleClearForm();
      setShowConfirmOverlay(false);
      setShowBookingConfirmOverlay(false);
      closeOverlay();
      // navigate("/admin");
      router.push("/admin");
      return;
    }

    try {
      if (!bookingPreviewData) return;

      const isEditing = bookingPreviewData?.isEditing;
      const isResubmitting = bookingPreviewData?.isResubmitting;

      setIsSubmitting(true); // show submitting overlay

      if (isResubmitting) {
        // 🟡 Resubmitting a rejected booking
        await resubmitUserBookingRequest(bookingPreviewData);
      } else if (isEditing) {
        // 🔵 Editing an existing booking
        await submitUserBookingRequest(bookingPreviewData);
      } else {
        // 🟢 New booking
        await submitUserBookingRequest(bookingPreviewData);
      }

      // ✅ Reset everything
      handleClearForm();
      setShowBookingConfirmOverlay(false);
      closeOverlay();

      // ✅ Show success message
      if (typeof triggerSuccessOverlay === "function") {
        const message = isResubmitting
          ? "Successfully Re-submitted Booking Request!"
          : isEditing
          ? "Successfully Updated Booking Request!"
          : "Successfully Sent Booking Request!";
        triggerSuccessOverlay(message, isEditing || isResubmitting);
      }
    } catch (error) {
      console.error("❌ Failed to confirm booking:", error);
    } finally {
      setIsSubmitting(false);
    }
  };





  const handleCloseOverlay = () => {
    if (hasChanges) {
      setShowConfirmOverlay(true); // Show confirmation overlay
    } else {
      closeOverlay(); // Close immediately if no changes
    }
  };

  const handleClearForm = () => {
    // setSelectedCar("");
setSelectedCarId("");

    setSelectedCarType("ALL");
    setDriveType("Self-Drive");
    setDropOffType("Pickup");

    setStartDate("");
    setEndDate("");
    setStartTime("");
    setEndTime("");
    setErrorMessage("");
    setUploadedID(null);
    setTotalPrice(0);
    setPreviewImage("/assets/images/image1.png");

    setHasChanges(false);

    setFormData({
      firstName: "",
      middleName: "",
      surname: "",
      occupation: "",
      address: "",
      contactNo: "",
      email: "",
      location: "",
      dropoffLocation: "",
      purpose: "",
      referralSource: "",
      additionalMessage: "",
    });
  };

  // const handleDiscardChanges = () => {
  //   setSelectedCar("");
  //   setSelectedCarType("ALL");
  //   setDriveType("Self-Drive");
  //   setDropOffType("Pickup");

  //   setStartDate("");
  //   setEndDate("");
  //   setStartTime("");
  //   setEndTime("");
  //   setErrorMessage("");
  //   setUploadedID(null);
  //   setTotalPrice(0);
  //   setPreviewImage(pickacar);

  //   setHasChanges(false);

  //   setFormData({
  //     firstName: "",
  //     middleName: "",
  //     surname: "",
  //     occupation: "",
  //     address: "",
  //     contactNo: "",
  //     email: "",
  //     location: "",
  //     dropoffLocation: "",
  //     purpose: "",
  //     additionalMessage: "",
  //   });

  //   setShowConfirmOverlay(false);
  //   closeOverlay();
  // };


  const handleDiscardChanges = async () => {
  try {
    setIsDiscarding(true); // 🟢 show overlay

    // ⏳ small delay for smoother UX
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // 🧹 your existing discard logic
    // setSelectedCar("");
setSelectedCarId("");

    setSelectedCarType("ALL");
    setDriveType("Self-Drive");
    setDropOffType("Pickup");

    setStartDate("");
    setEndDate("");
    setStartTime("");
    setEndTime("");
    setErrorMessage("");
    setUploadedID(null);
    setTotalPrice(0);
    setPreviewImage("/assets/images/image1.png");

    setHasChanges(false);

    setFormData({
      firstName: "",
      middleName: "",
      surname: "",
      occupation: "",
      address: "",
      contactNo: "",
      email: "",
      location: "",
      dropoffLocation: "",
      purpose: "",
      additionalMessage: "",
    });

    setShowConfirmOverlay(false);
    closeOverlay();

    if (typeof triggerSuccessOverlay === "function") {
      triggerSuccessOverlay("All unsaved changes have been discarded.", "discard");
    }
  } catch (error) {
    console.error("❌ Error discarding form data:", error);
    showActionOverlay({
      message: "Error discarding form data. Please try again.",
      type: "warning",
    });
  } finally {
    setIsDiscarding(false); // 🟣 hide overlay
  }
};


  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";

      setOverlayStyle({ opacity: 1 });

      setContainerStyle({
        position: "absolute",
        top: "47px",
        width: "75px",
        height: "50px",
        opacity: 0.5,
      });

      requestAnimationFrame(() => {
        setTimeout(() => {
          setContainerStyle({
            top: "42.5%",
            width: "90%",
            maxWidth: "1100px",
            maxHeight: "85vh",
            height: "auto",
            opacity: 1,
            padding: "20px",
            margin: "0px 10px 0px 10px",
            transform: "translate(0%, -50%) scale(1)",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          });
        }, 50);
      });
    } else {
      document.body.style.overflow = "";

      setContainerStyle((prev) => ({
        ...prev,
        opacity: 0,
        transform: "translate(-50%, -50%) scale(0.3)",
      }));

      setTimeout(() => {
        setOverlayStyle({ opacity: 0 });
      }, 300);
    }

    return () => {
      document.body.style.overflow = ""; // Cleanup in case of unmount
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="booking-overlay" style={overlayStyle}>
      {isSubmitting && (
        <div className="submitting-overlay">
          <div className="loading-container">
            <div className="loading-bar-road">
              <img
                src="/images/submitting.gif"
                alt="Submitting Car"
                className="car-gif"
              />
            </div>
            <p className="submitting-text">
              Submitting Your Booking Request...
            </p>
          </div>
        </div>
      )}


      {isSaving && (
        <div className="submitting-overlay">
          <div className="loading-container">
            <div className="loading-bar-road">
              <img
                src="/images/submitting.gif"
                alt="Submitting Car"
                className="car-gif"
              />
            </div>
            <p className="submitting-text">
              Saving Your Booking Form...
            </p>
          </div>
        </div>
      )}

      {isDiscarding && (
      <div className="submitting-overlay">
      <div className="loading-container">
      <div className="loading-bar-road">
        <img
          src="/images/submitting.gif"
          alt="Discarding Changes"
          className="car-gif"
        />
      </div>
      <p className="submitting-text-red">Discarding Unsaved Changes...</p>
      </div>
      </div>
      )}




      {showLoadSavedData && (
  <div className={`sent-ongoing-overlay ${hideAnimation ? "hide" : ""}`}>
    <button
      className="close-sent-ongoing"
      onClick={() => {
        setHideAnimation(true);
        setTimeout(() => setShowLoadSavedData(false), 400);
      }}
    >
      ✖
    </button>
    <span className="warning-text">
      Saved booking data loaded successfully!
    </span>
    <div className="sent-ongoing-progress-bar"></div>
  </div>
)}

{/* 🟢 Loading Overlay */}
{loadSavedData && (
  <div className="submitting-overlay">
    <div className="loading-container">
      <div className="loading-bar-road">
        <img
          src="/images/submitting.gif"
          alt="Loading Saved Data"
          className="car-gif"
        />
      </div>
      <p className="submitting-text">Loading Saved Data...</p>
    </div>
  </div>
)}



{/* 🟡 Success Overlay for Discard */}
{showDiscardSavedData && (
  <div className={`date-warning-overlay ${hideAnimation ? "hide" : ""}`}>
    <button
      className="close-warning"
      onClick={() => {
        setHideAnimation(true);
        setTimeout(() => setShowDiscardSavedData(false), 400);
      }}
    >
      ✖
    </button>
    <span className="warning-text" style={{ color: "#dc3545" }}>
      Saved booking data discarded successfully!
    </span>
    <div className="progress-bar"></div>
  </div>
)}

{/* 🔴 Loading Overlay for Discard */}
{discardSavedData && (
  <div className="submitting-overlay">
    <div className="loading-container">
      <div className="loading-bar-road">
        <img
          src="/images/submitting.gif"
          alt="Discarding Saved Data"
          className="car-gif"
        />
      </div>
      <p className="submitting-text-red">Discarding Saved Data...</p>
    </div>
  </div>
)}






      {isImageModalOpen && uploadedID && (
        <div
          className={`image-modal-overlay ${isImageModalOpen ? "active" : ""}`}
          onClick={handleCloseImageModal}
        >
          <div className="image-modal-content">
            <img
              src={
                typeof uploadedID === "string"
                  ? uploadedID
                  : URL.createObjectURL(uploadedID)
              }
              alt="Driver's License"
              className="image-fullview"
            />
          </div>
        </div>
      )}

      {showClearFormOverlay && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Clear all form fields?</h3>
            <p>This will remove all entered data from the booking form.</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  handleClearForm();
                  setShowClearFormOverlay(false);
                }}
              >
                Yes, Clear
              </button>
              <button
                className="confirm-btn cancel"
                onClick={() => setShowClearFormOverlay(false)}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}


      {showConfirmOverlay && (
        <div className="overlay-revert">
          <div className="confirm-modal">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowConfirmOverlay(false)}
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

            <h3>Unsaved Changes</h3>
            <p>What would you like to do?</p>

            <div className="confirm-buttons">
<button
  className="confirm-btn revert"
onClick={async () => {
  try {
    setIsSaving(true); // 🟢 show saving overlay

    const currentFormData = {
      firstName: formData.firstName,
      middleName: formData.middleName,
      surname: formData.surname,
      occupation: formData.occupation,
      address: formData.address,
      contactNo: formData.contactNo,
      email: formData.email,
      location: formData.location,
      dropoffLocation: formData.dropoffLocation,
      purpose: formData.purpose,
      additionalMessage: formData.additionalMessage,
      referralSource: formData.referralSource || "Not Specified",
      // selectedCar,
      selectedCar: selectedUnit?.name || "",

      selectedCarType,
      driveType,
      dropOffType,
      startDate,
      startTime,
      endDate,
      endTime,
      driverLicense: uploadedID,
    };

    const result = await saveBookingFormData(currentFormData);

    if (result.success) {
      setShowConfirmOverlay(false);
      closeOverlay();

      if (typeof triggerSuccessOverlay === "function") {
        triggerSuccessOverlay("Booking form saved successfully!");
      }
    } else {
      showActionOverlay({
        message: "Failed to save booking form. Please try again.",
        type: "warning",
      });
    }
  } catch (error) {
    console.error("Error saving form:", error);
    showActionOverlay({
      message: "Error saving form. Please try again.",
      type: "warning",
    });
  } finally {
    setIsSaving(false); // 🟣 hide saving overlay
  }
}}

>
  Save
</button>


              <button
                className="confirm-btn cancel"
                onClick={handleDiscardChanges}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}


      {showLoadSavedDialog && savedFormData && (
        <div className="overlay-revert">
          <div className="confirm-modal">
            <h3>Load Saved Booking Data?</h3>
            <p>
              We found a previously saved booking form. Would you like to load
              it?
            </p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn revert"
                onClick={handleLoadSavedData}
              >
                Yes, Load Saved Data
              </button>
              <button
                className="confirm-btn cancel"
                onClick={handleDiscardSavedData}
              >
                No, Start Fresh
              </button>
            </div>
          </div>
        </div>
      )}

      {showBookingConfirmOverlay && (
        <div className="booking-confirm-overlay">
          <div className="booking-confirm-container">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowBookingConfirmOverlay(false)}
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

            <h3 className="confirm-header">CONFIRM CHANGES?</h3>
            <p className="confirm-text">
              Please review your booking details before proceeding.
            </p>

            <div className="confirm-details">
              <div className="confirm-scroll-container">
                <div className="confirm-details">
                  <div className="confirm-row">
                    <strong className="confirm-label">Car Selected:</strong>
                    <span className="confirm-value">
                      {bookingPreviewData?.carName || "None"}
                    </span>
                  </div>

                  <div className="confirm-row">
                    <strong className="confirm-label">Drive Type:</strong>
                    <span className="confirm-value">
                      {bookingPreviewData?.drivingOption}
                    </span>
                  </div>

                  <div className="confirm-row">
                    <strong className="confirm-label">Drop-off Type:</strong>
                    <span className="confirm-value">
                      {bookingPreviewData?.pickupOption}
                    </span>
                  </div>

                  {bookingPreviewData?.pickupOption === "Drop-off" && (
                    <div className="confirm-row">
                      <strong className="confirm-label">
                        Drop-off Location:
                      </strong>
                      <span className="confirm-value">
                        {bookingPreviewData?.dropoffLocation || "Not specified"}
                      </span>
                    </div>
                  )}

                  <div className="confirm-row">
                    <strong className="confirm-label">Rental Period:</strong>
                    <span className="confirm-value">
                      {formatDateTime(
                        bookingPreviewData?.startDate,
                        bookingPreviewData?.startTime
                      )}{" "}
                      <br /> to <br />
                      {formatDateTime(
                        bookingPreviewData?.endDate,
                        bookingPreviewData?.endTime
                      )}
                    </span>
                  </div>

                  <div className="confirm-row">
                    <strong className="confirm-label">Travel Location:</strong>
                    <span className="confirm-value">
                      {bookingPreviewData?.location || "Not specified"}
                    </span>
                  </div>

                  <div className="confirm-row">
                    <strong className="confirm-label">Purpose:</strong>
                    <span className="confirm-value">
                      {bookingPreviewData?.purpose || "Not specified"}
                    </span>
                  </div>

                  <div className="confirm-row">
                    <strong className="confirm-label">Referral Source:</strong>
                    <span className="confirm-value">
                      {bookingPreviewData?.referralSource || "Not specified"}
                    </span>
                  </div>

                  <div className="confirm-row">
                    <strong className="confirm-label">
                      Additional <br /> Message:
                    </strong>
                    <span className="confirm-value">
                      {bookingPreviewData?.additionalMessage || "None"}
                    </span>
                  </div>
                </div>
              </div>

              <h4 className="confirm-subtitle">PERSONAL INFORMATION</h4>

              <div className="confirm-row">
                <strong className="confirm-label">Name:</strong>
                <span className="confirm-value">
                  {bookingPreviewData?.firstName}{" "}
                  {bookingPreviewData?.middleName} {bookingPreviewData?.surname}
                </span>
              </div>

              <div className="confirm-row">
                <strong className="confirm-label">Contact:</strong>
                <span className="confirm-value">
                  {bookingPreviewData?.contact}
                </span>
              </div>

              <div className="confirm-row">
                <strong className="confirm-label">Email:</strong>
                <span className="confirm-value">
                  {bookingPreviewData?.email}
                </span>
              </div>

              <div className="confirm-row">
                <strong className="confirm-label">Occupation:</strong>
                <span className="confirm-value">
                  {bookingPreviewData?.occupation}
                </span>
              </div>

              <div className="confirm-row">
                <strong className="confirm-label">Current Address:</strong>
                <span className="confirm-value">
                  {bookingPreviewData?.address}
                </span>
              </div>

              <h4 className="confirm-subtitle">DRIVER'S LICENSE</h4>

              <div className="confirm-image-container">
                {uploadedID ? (
                  <img
                    src={URL.createObjectURL(uploadedID)}
                    alt="Driver's License"
                    className="confirm-id-preview"
                    onClick={handleImageClick}
                  />
                ) : (
                  <p className="confirm-no-id">No file uploaded</p>
                )}
              </div>

              <h4 className="confirm-subtitle">QUOTATION SUMMARY</h4>
              <ul className="confirm-summary-list">
                {(() => {
                  const selectedUnit = unitData.find(
                    (unit) => unit.name === bookingPreviewData?.carName
                  );
                  return (
                    <>
                      <li>
                        <strong className="summary-label">
                          (
                          <span style={{ color: "#28a745" }}>
                            {bookingPreviewData?.carName}
                          </span>
                          ):
                        </strong>
                        <span className="summary-value">{getCarRate()}</span>
                      </li>
                      <li>
                        <strong className="summary-label">
                          (
                          <span style={{ color: "#28a745" }}>
                            {bookingPreviewData?.drivingOption}
                          </span>
                          ):
                        </strong>
                        <span className="summary-value">
                          {getDrivingPrice(selectedUnit)}
                        </span>
                      </li>
                      <li>
                        <strong className="summary-label">
                          (
                          <span style={{ color: "#28a745" }}>
                            {bookingPreviewData?.pickupOption}
                          </span>
                          ):
                        </strong>
                        <span className="summary-value">
                          {getDropOffPrice(selectedUnit)}
                        </span>
                      </li>
                      <li>
                        <strong className="summary-label">
                          Rental Duration:
                        </strong>
                        <span className="summary-value">
                          {getRentalDuration()}
                        </span>
                      </li>
                      <li className="confirm-total-price">
                        <strong className="summary-label">Total Price:</strong>
                        <span className="summary-value">
                          ₱{totalPrice.toLocaleString()}
                        </span>
                      </li>
                    </>
                  );
                })()}
              </ul>
            </div>

            <div className="confirm-button-group">
              <button
                className="confirm-proceed-btn"
                onClick={handleConfirmBooking}
              >
                Confirm & Proceed
              </button>
              <button
                className="confirm-cancel-btn"
                onClick={() => setShowBookingConfirmOverlay(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <form
        className="booking-container"
        style={containerStyle}
        onSubmit={handleSubmit}
      >
        <button
          className="close-btn"
          type="button"
          onClick={handleCloseOverlay}
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

        {/* <h2
  style={{
    fontSize: "1.2rem",
    color: prefillData && editingBookingData?.isResubmitting
      ? "#dc3545" // Color for "RESUBMIT BOOKING REQUEST"
      : prefillData
      ? "#ffb347" // Color for "EDIT BOOKING REQUEST"
      : "", // Default color if neither condition is true (you can remove or set to a specific color)
  }}
>
  {prefillData && editingBookingData?.isResubmitting
    ? "RESUBMIT BOOKING REQUEST"
    : prefillData
    ? "EDIT BOOKING REQUEST"
    : "BOOKING FORM"}
</h2> */}

        <h2
          style={{
            fontSize: "1.2rem",
            color:
              editingBookingData?.isResubmitting === true
                ? "#dc3545" // Color for "RESUBMIT BOOKING REQUEST"
                : editingBookingData &&
                  editingBookingData?.isResubmitting === false
                ? "#ffb347" // Color for "EDIT BOOKING REQUEST"
                : "", // Default color for "BOOKING FORM"
          }}
        >
          {editingBookingData?.isResubmitting === true
            ? "RESUBMIT BOOKING REQUEST"
            : editingBookingData && editingBookingData?.isResubmitting === false
            ? "EDIT BOOKING REQUEST"
            : "BOOKING FORM"}
        </h2>

        {/* <div className="booking-image">
          <img
            src={previewImage}
            alt="Selected Car"
            className={`booking-image ${imageAnimation}`}
            onAnimationEnd={() => setImageAnimation("")}
          />
        </div> */}

<div className="booking-image-container">
  <div
    className={`booking-bg ${imageAnimation}`}
    style={{ backgroundImage: `url(${previewImage})` }}
  ></div>
  <img
    src={previewImage || "/assets/images/image1.png"}
    alt="Selected Car"
    className={`booking-image ${imageAnimation}`}
    onClick={() => {
      document.querySelector(`[data-pswp-index="0"]`)?.click();
    }}
    onAnimationEnd={() => setImageAnimation("")}
  />
</div>




        <div className="booking-content">
          <div className="booking-column">
            <div className="fill-up-form">
              <h3 className="fixed-header">FILL-UP FORM</h3>

              <div className="form-row car-selection-row">
                <div>
                  <label className="pickacar">Car Type:</label>
                  <select
                    value={selectedCarType}
                    onChange={(e) => setSelectedCarType(e.target.value)}
                  >
                    <option value="ALL">ALL</option>
                    <option value="SEDAN">SEDAN</option>
                    <option value="SUV">SUV</option>
                    <option value="MPV">MPV</option>
                    <option value="VAN">VAN</option>
                    <option value="PICKUP">PICKUP</option>
                  </select>
                </div>

                <div>
                  <label className="pickacar">Pick a Car:</label>
                  {/* <select
                    value={selectedCar}
onChange={(e) => {
                      const car = e.target.value;
                      setSelectedCar(car);
                      setHasChanges(true);
                      setImageAnimation("fade-out");
                      const selectedUnit = unitData.find((u) => u.name === car);
                      setTimeout(() => {
                        setPreviewImage(selectedUnit?.imageId || pickacar);
                        setImageAnimation("fade-slide-in");
                      }, 100);
                    }}

                    required
                  >
                    <option value="" disabled hidden>
                      Pick a Car
                    </option>
                    {filteredUnits.map((unit) => (
                      <option key={unit.id} value={unit.name}>
                        {unit.name}
                      </option>
                    ))}
                  </select> */}

                  <select
  value={selectedCarId}
  // onChange={(e) => {
  //   const carId = e.target.value;
  //   setSelectedCarId(carId);
  //   setHasChanges(true);
  //   setImageAnimation("fade-out");

  //   const selectedUnit = unitData.find((u) => u.id === carId);
  //   setTimeout(() => {
  //     setPreviewImage(selectedUnit?.imageId || pickacar);
  //     setImageAnimation("fade-slide-in");
  //   }, 100);
  // }}

onChange={(e) => {
  const carId = e.target.value;
  setSelectedCarId(carId);
  setSkipImageUpdate(true);
  setHasChanges(true);
  setImageAnimation("fade-out");

  const selectedUnit = unitData.find((u) => u.id === carId);

  if (selectedUnit?.imageId) {
    fetchImageFromFirestore(selectedUnit.imageId)
      .then(({ base64 }) => {
        setTimeout(() => {
          setPreviewImage(base64 || "/assets/images/image1.png");
          setImageAnimation("fade-slide-in");
        }, 200);
      })
      .catch(() => {
        setTimeout(() => {
          setPreviewImage("/assets/images/image1.png");
          setImageAnimation("fade-slide-in");
        }, 200);
      });
  } else {
    setTimeout(() => {
      setPreviewImage("/assets/images/image1.png");
      setImageAnimation("fade-slide-in");
    }, 200);
  }
}}


  required
>
  <option value="" disabled hidden>
    Pick a Car
  </option>
  {filteredUnits.map((unit) => (
    <option key={unit.id} value={unit.id}>
      {unit.name}
    </option>
  ))}
</select>

                </div>
              </div>

              <div className="drive-type-form-row">
                <div>
                  <label>Driving Option:</label>
                  <select
                    value={driveType}
                    onChange={(e) => setDriveType(e.target.value)}
                    required
                  >
                    <option value="Self-Drive">Self-Drive</option>
                    <option value="With Driver">With Driver</option>
                  </select>
                </div>
                <div>
                  <label>Pickup / Drop-off:</label>
                  <select
                    value={dropOffType}
                    onChange={(e) => setDropOffType(e.target.value)}
                    required
                  >
                    <option value="Pickup">Pickup</option>
                    <option value="Drop-off">Drop-off</option>
                  </select>
                </div>
              </div>

              {dropOffType === "Drop-off" && (
                <div className="location-input">
                  <label>Drop-off Location:</label>
                  <input
                    type="text"
                    name="dropoffLocation"
                    placeholder="Enter Drop-off Location"
                    value={formData.dropoffLocation}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              )}

              <div className="date-form-row">
                <div>
                  <label>Start Date:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    required
                  />
                </div>

                <div>
                  <label>Start Time:</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={handleStartTimeChange}
                    required
                  />
                </div>
              </div>

              <div className="date-form-row">
                <div>
                  <label>End Date:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={handleEndDateChange}
                    className={errorMessage ? "id-error-input" : ""}
                    required
                  />
                </div>

                <div>
                  <label>End Time:</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={handleEndTimeChange}
                    style={{
                      borderColor: isDurationInvalid ? "#dc3545" : undefined,
                    }}
                    ref={endTimeRef}
                    required
                  />
                </div>
              </div>

              <div className="location-input">
                <label>Travel Location:</label>
                <input
                  type="text"
                  name="location"
                  placeholder="Enter Location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="purpose-input">
                <label>Purpose:</label>
                <input
                  type="text"
                  name="purpose"
                  placeholder="Enter Purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <label>Upload Driver's License:</label>
              <input
                type="file"
                id="uploadID"
                accept="image/*"
                onChange={handleFileUpload}
                className={`file-input ${fileError ? "error-border" : ""}`}
              />

              {fileError && (
                <div className="id-error-message">
                  Driver's License is required!
                </div>
              )}

              {uploadedID && (
                <div className="image-preview">
                  {(() => {
                    if (typeof uploadedID === "string") {
                      return (
                        <img
                          src={uploadedID}
                          alt="Uploaded ID"
                          onClick={handleImageClick}
                          className="preview-thumbnail"
                        />
                      );
                    } else if (
                      uploadedID instanceof File ||
                      uploadedID instanceof Blob
                    ) {
                      return (
                        <img
                          src={URL.createObjectURL(uploadedID)}
                          alt="Uploaded ID"
                          onClick={handleImageClick}
                          className="preview-thumbnail"
                        />
                      );
                    } else {
                      console.warn(
                        "⚠️ Unsupported uploadedID type:",
                        uploadedID
                      );
                      return null;
                    }
                  })()}
                </div>
              )}

              <label htmlFor="uploadID" className="file-label">
                {uploadedID
                  ? "Change Driver's License"
                  : "Upload Driver's License"}
              </label>

              <label className="form-label">Personal Information</label>
              <div className="form-row">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />

                <input
                  type="text"
                  name="middleName"
                  placeholder="Middle Name (N/A if none)"
                  value={formData.middleName}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="text"
                  name="surname"
                  placeholder="Surname"
                  value={formData.surname}
                  onChange={handleInputChange}
                  required
                />

                <input
                  type="text"
                  name="occupation"
                  placeholder="Occupation"
                  value={formData.occupation}
                  onChange={handleInputChange}
                  required
                />

                <input
                  type="text"
                  name="address"
                  placeholder="Current Address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <label className="form-label">Contacts</label>
              <div className="form-row">
                <input
                  type="text"
                  name="contactNo"
                  placeholder="Contact No."
                  value={formData.contactNo}
                  onChange={(e) => {
                    const formattedNumber = e.target.value.replace(
                      /[^0-9-]/g,
                      ""
                    );
                    setFormData((prev) => ({
                      ...prev,
                      contactNo: formattedNumber,
                    }));
                    setHasChanges(true);
                  }}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="message-section">
                <h4 className="message-label">Referral Source (Optional)</h4>


                <select
                  name="referralSource"
                  className="referral-info"
                  value={formData.referralSource || ""}
                  onChange={handleInputChange}
                >
                  {referralSources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>

              </div>

              <div className="message-input">
                <label>Additional Message:</label>
                <textarea
                  name="additionalMessage"
                  placeholder="Enter any additional message..."
                  value={formData.additionalMessage}
                  onChange={handleInputChange}
                  rows="3"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="booking-column">
            <QuotationSummary />
          </div>
        </div>

        {/* DEBUG SUBMIT BUTTON */}
        {/* <button
  style={{ position: "fixed", bottom: 20, right: 20, zIndex: 99999 }}
  onClick={() => {
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 100000);
  }}
>
  🔧 Test Submit Animation
</button> */}

        {/* <button
  style={{
    position: "fixed",
    bottom: 70,
    right: 20,
    zIndex: 99999,
    padding: "8px 12px",
    background: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  }}
  onClick={() => {
    const progressDuration = 5000; // Match .sent-ongoing-progress-bar duration
    setSuccessMessage("Booking request successfully submitted!");
    setShowSubmittedBookingRequest(true);
    setHideAnimation(false);

    setTimeout(() => {
      setHideAnimation(true);
      setTimeout(() => setShowSubmittedBookingRequest(false), 400); // Matches .hide animation
    }, progressDuration);
  }}
>
  ✅ Test Success Overlay
</button> */}

        <button className="confirm-btn" type="submit">
          Confirm Booking
        </button>

        <button
          type="button"
          className="clear-btn"
          onClick={() => setShowClearFormOverlay(true)}
        >
          Clear All
        </button>
      </form>


<div ref={galleryRef} style={{ display: "none" }}>
  <a
    href={previewImage}
    data-pswp-width={2873}   // actual image width
      data-pswp-height={1690}  // actual image height
    data-pswp-index={0}
  >
    <img src={previewImage} alt="" />
  </a>
</div>


    </div>
  );
};

export default BookingPage;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// import React, { useState, useEffect } from "react";
// import "./BookingPage.css";
// import pickacar from "../assets/images/image1.jpg";
// import vios from "../assets/images/image2.jpg";
// import mirage from "../assets/images/image3.jpg";
// import livina from "../assets/images/image4.jpg";
// import showBtn from "../assets/prv-btn.png";
// import hideBtn from "../assets/nxt-btn.png";
// import close_0Btn from "../assets/close_0.png";
// import close_1Btn from "../assets/close_1.png";

// const BookingPage = ({ isOpen, closeOverlay }) => {
//   const [overlayStyle, setOverlayStyle] = useState({ opacity: 0 });
//   const [containerStyle, setContainerStyle] = useState({});
//   const [selectedCar, setSelectedCar] = useState("");
//   const [driveType, setDriveType] = useState("Self-Drive");
//   const [dropOffType, setDropOffType] = useState("Pickup");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [errorMessage, setErrorMessage] = useState("");
//   const [uploadedID, setUploadedID] = useState(null);
//   const [totalPrice, setTotalPrice] = useState(0);
//   const [isSummaryOpen, setIsSummaryOpen] = useState(false);
//   const [previewImage, setPreviewImage] = useState(pickacar);
//   const [imageAnimation, setImageAnimation] = useState("");
//   const [fileError, setFileError] = useState(false);

//   const [hasChanges, setHasChanges] = useState(false);
//   const [showConfirmOverlay, setShowConfirmOverlay] = useState(false);

//   const [showBookingConfirmOverlay, setShowBookingConfirmOverlay] =
//     useState(false);

//   const carImages = {
//     VIOS: vios,
//     MIRAGE: mirage,
//     LIVINA: livina,
//   };

//   // RENDER PROB
//   const debounce = (func, delay) => {
//     let timeout;
//     return (...args) => {
//       clearTimeout(timeout);
//       timeout = setTimeout(() => func(...args), delay);
//     };
//   };

//   // const handleInputChange = debounce((e) => {
//   //   setFormData({ ...formData, [e.target.name]: e.target.value });
//   //   setHasChanges(true);
//   // }, 500);

//   const debouncedSetHasChanges = debounce(() => {
//     setHasChanges(true);
//   }, 500);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;

//     // ✅ Update formData immediately for responsive typing
//     setFormData((prev) => ({ ...prev, [name]: value }));

//     // ✅ Call debounced function to setHasChanges(true)
//     debouncedSetHasChanges();
//   };

//   const getColorForSelectedOption = (value) => {
//     return value ? "green-label" : "red-label"; // Apply green for selected, red for unselected
//   };

//   const QuotationSummary = () => {
//     const [isCollapsed, setIsCollapsed] = useState(false);

//     useEffect(() => {
//       const handleResize = () => {
//         if (window.innerWidth < 900) {
//           setIsCollapsed(false); // Collapsed by default on small screens
//         } else {
//           setIsCollapsed(true); // Expanded by default on larger screens
//         }
//       };

//       // Set default state when component mounts
//       handleResize();

//       // Add event listener to handle resizing
//       window.addEventListener("resize", handleResize);

//       // Cleanup the event listener on unmount
//       return () => window.removeEventListener("resize", handleResize);
//     }, []);

//     return (
//       <div className="quotation-summary">
//         <h3
//           className="collapsible-header"
//           onClick={() => setIsCollapsed(!isCollapsed)}
//         >
//           QUOTATION SUMMARY
//           <img
//             src={hideBtn}
//             alt="Hide icon"
//             className={`toggle-icon ${isCollapsed ? "hidden" : ""}`}
//           />
//           <img
//             src={showBtn}
//             alt="Show icon"
//             className={`toggle-icon ${!isCollapsed ? "hidden" : ""}`}
//           />
//         </h3>

//         {/* Total Price section placed directly under the header */}
//         <div className="checkout-total">
//           <strong>Total Price:</strong>
//           <span className="price">₱{totalPrice.toLocaleString()}</span>
//         </div>

//         {/* The rest of the summary details with animation */}
//         <div className={`sticky-details ${isCollapsed ? "open" : ""}`}>
//           <div className="checkout-item">
//             <span className={`label ${getColorForSelectedOption(selectedCar)}`}>
//               <strong>Car:</strong> <br />
//               {selectedCar || "Pick a Car"}
//             </span>
//             <span className="price">{getCarRate()}</span>
//           </div>

//           <div className="checkout-item">
//             <span className={`label ${getColorForSelectedOption(driveType)}`}>
//               <strong>Driving Option:</strong> <br />
//               {driveType}
//             </span>
//             <span className="price">{getDrivingPrice()}</span>
//           </div>

//           <div className="checkout-item">
//             <span className={`label ${getColorForSelectedOption(dropOffType)}`}>
//               <strong>Pickup / Drop-off:</strong> <br />
//               {dropOffType}
//             </span>
//             <span className="price">{getDropOffPrice()}</span>
//           </div>

//           <div className="checkout-item">
//             <span
//               className={`label ${
//                 startDate && endDate ? "green-label" : "red-label"
//               }`}
//             >
//               <strong>Rental Period:</strong> <br />
//               {startDate ? `${startDate} to ${endDate}` : "Pick a Date"}
//             </span>
//             <span className="price">{getRentalDuration()}</span>
//             {/* Display error message below Rental Period */}
//             {errorMessage && (
//               <div className="date-error-message">{errorMessage}</div>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const calculateTotalPrice = () => {
//     if (!selectedCar || !startDate || !endDate) {
//       setTotalPrice(0);
//       return;
//     }

//     const start = new Date(startDate);
//     const end = new Date(endDate);
//     const rentalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

//     const carRates = {
//       VIOS: {
//         daily: 2000,
//         discount3Days: 1500,
//         discount7Days: 1500,
//         discount30Days: 1000,
//       },
//       MIRAGE: {
//         daily: 1800,
//         discount3Days: 1400,
//         discount7Days: 1300,
//         discount30Days: 900,
//       },
//       LIVINA: {
//         daily: 2200,
//         discount3Days: 1800,
//         discount7Days: 1700,
//         discount30Days: 1200,
//       },
//     };

//     const rates = carRates[selectedCar];
//     if (!rates) return;

//     let finalRate = rates.daily;
//     if (rentalDays >= 30) {
//       finalRate = rates.discount30Days;
//     } else if (rentalDays >= 7) {
//       finalRate = rates.discount7Days;
//     } else if (rentalDays >= 3) {
//       finalRate = rates.discount3Days;
//     }

//     let total = rentalDays * finalRate;

//     if (driveType === "With Driver") {
//       total += rentalDays * 1000;
//     }

//     if (dropOffType === "Drop-off") {
//       total += 500;
//     }

//     setTotalPrice(total);
//   };

//   useEffect(() => {
//     calculateTotalPrice();
//   }, [selectedCar, startDate, endDate, driveType, dropOffType]);

//   const getCarRate = () => {
//     if (!selectedCar || !startDate || !endDate) return "";

//     const start = new Date(startDate);
//     const end = new Date(endDate);
//     const rentalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

//     const carRates = {
//       VIOS: {
//         daily: 2000,
//         discount3Days: 1500,
//         discount7Days: 1500,
//         discount30Days: 1000,
//       },
//       MIRAGE: {
//         daily: 1800,
//         discount3Days: 1400,
//         discount7Days: 1300,
//         discount30Days: 900,
//       },
//       LIVINA: {
//         daily: 2200,
//         discount3Days: 1800,
//         discount7Days: 1700,
//         discount30Days: 1200,
//       },
//     };

//     const rates = carRates[selectedCar];

//     if (!rates) return "";

//     let finalRate = rates.daily;
//     if (rentalDays >= 30) {
//       finalRate = rates.discount30Days;
//     } else if (rentalDays >= 3) {
//       finalRate = rates.discount3Days;
//     }

//     return `(₱${finalRate} / ${rentalDays} Day${rentalDays > 1 ? "s" : ""})`;
//   };

//   const getDrivingPrice = () => {
//     // If "With Driver" is selected, show ₱1,000 per day by default
//     if (driveType === "With Driver") {
//       // If dates are selected, calculate rental days
//       if (startDate && endDate) {
//         const start = new Date(startDate);
//         const end = new Date(endDate);
//         const rentalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)); // Calculate rental days

//         return `(₱1000 / ${rentalDays} Day${rentalDays > 1 ? "s" : ""})`; // Show rental days and price
//       }

//       // If no dates are selected yet, just show the daily rate
//       return `(₱1000 / Day)`; // Default showing daily rate when no dates are selected
//     }

//     // Return ₱0 if "Self-Drive" is selected
//     return "(₱0)";
//   };

//   const getDropOffPrice = () => {
//     return dropOffType === "Drop-off" ? "(₱500)" : "(₱0)";
//   };

//   const handleStartDateChange = (e) => {
//     setStartDate(e.target.value);
//     setErrorMessage("");
//     setHasChanges(true);
//   };

//   const handleEndDateChange = (e) => {
//     const selectedEndDate = e.target.value;

//     if (startDate && new Date(selectedEndDate) < new Date(startDate)) {
//       setErrorMessage("End Date CANNOT BE BEFORE the Start Date");
//       setEndDate("");
//     } else {
//       setEndDate(selectedEndDate);
//       setErrorMessage("");
//       setHasChanges(true);
//     }
//   };

//   const getRentalDuration = () => {
//     if (!startDate || !endDate) return "";

//     const start = new Date(startDate);
//     const end = new Date(endDate);
//     const diffTime = end.getTime() - start.getTime();
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     const diffHours = diffDays * 24;

//     return `(${diffDays} Day${diffDays > 1 ? "s" : ""} / ${diffHours} hrs)`;
//   };

//   const [formData, setFormData] = useState({
//     firstName: "",
//     middleName: "",
//     surname: "",
//     occupation: "",
//     contactNo: "",
//     email: "",
//   });

//   const handleFileUpload = (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       setUploadedID(file);
//       setFileError(false);
//       setHasChanges(true);
//     }
//   };

//   // const handleSubmit = (e) => {
//   //   e.preventDefault(); // Prevent default form submission

//   //   const form = e.target.closest("form"); // Get the form element

//   //   // 1️⃣ Check if the form has missing required fields
//   //   if (!form.checkValidity()) {
//   //     form.reportValidity(); // Show built-in validation messages
//   //     return; // Stop submission if any required fields are empty
//   //   }

//   //   // 2️⃣ Check if the file input is empty
//   //   if (!uploadedID) {
//   //     setFileError(true); // Show error for missing file
//   //     return; // Stop form submission if no file is uploaded
//   //   }

//   //   // 3️⃣ Proceed if everything is valid
//   //   console.log("Form submitted successfully!");
//   // };

//   const handleSubmit = (e) => {
//     e.preventDefault(); // Prevent actual submission
//     const form = e.target.closest("form");

//     // Check for missing required fields
//     if (!form.checkValidity()) {
//       form.reportValidity();
//       return;
//     }

//     // Check if the file input is empty
//     if (!uploadedID) {
//       setFileError(true);
//       return;
//     }

//     // Show booking confirmation overlay instead of direct submission
//     setShowBookingConfirmOverlay(true);
//   };

//   const handleConfirmBooking = () => {
//     // Placeholder for actual form submission logic (e.g., sending data to API)
//     console.log("Booking confirmed!");

//     // Close the confirmation overlay after submission
//     setShowBookingConfirmOverlay(false);

//     // Reset form after submission
//     handleDiscardChanges();
//   };

//   const handleCloseOverlay = () => {
//     if (hasChanges) {
//       setShowConfirmOverlay(true); // Show confirmation overlay
//     } else {
//       closeOverlay(); // Close immediately if no changes
//     }
//   };

//   const handleDiscardChanges = () => {
//     // Reset all state values to their original defaults
//     setSelectedCar("");
//     setDriveType("Self-Drive");
//     setDropOffType("Pickup");
//     setStartDate("");
//     setEndDate("");
//     setErrorMessage("");
//     setUploadedID(null);
//     setTotalPrice(0);
//     setPreviewImage(pickacar); // Reset car image to default
//     setHasChanges(false); // Reset change tracking

//     // Close both overlays
//     setShowConfirmOverlay(false);
//     closeOverlay();
//   };

//   useEffect(() => {
//     if (isOpen) {
//       document.body.style.overflow = "hidden";

//       setOverlayStyle({ opacity: 1 });

//       setContainerStyle({
//         position: "absolute",
//         top: "47px",
//         width: "75px",
//         height: "50px",
//         opacity: 0.5,
//       });

//       requestAnimationFrame(() => {
//         setTimeout(() => {
//           setContainerStyle({
//             top: "47%",
//             width: "90%",
//             maxWidth: "1100px",
//             maxHeight: "90vh",
//             height: "auto",
//             opacity: 1,
//             padding: "20px",
//             margin: "0px 10px 0px 10px",
//             transform: "translate(0%, -50%) scale(1)",
//             overflow: "auto",
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//           });
//         }, 50);
//       });
//     } else {
//       document.body.style.overflow = "";

//       setContainerStyle((prev) => ({
//         ...prev,
//         opacity: 0,
//         transform: "translate(-50%, -50%) scale(0.3)",
//       }));

//       setTimeout(() => {
//         setOverlayStyle({ opacity: 0 });
//       }, 300);
//     }

//     return () => {
//       document.body.style.overflow = ""; // Cleanup in case of unmount
//     };
//   }, [isOpen]);

//   if (!isOpen) return null;

//   return (
//     <div className="booking-overlay" style={overlayStyle}>
//       {showConfirmOverlay && (
//         <div className="confirmation-overlay">
//           <div className="confirmation-container">
//             <button
//               className="close-btn"
//               type="button"
//               onClick={() => setShowConfirmOverlay(false)}
//             >
//               <img
//                 src={close_0Btn}
//                 alt="Close"
//                 className="close-icon close-icon-0"
//               />
//               <img
//                 src={close_1Btn}
//                 alt="Close"
//                 className="close-icon close-icon-1"
//               />
//             </button>

//             <h3>Unsaved Changes</h3>
//             <p>What would you like to do?</p>

//             <div className="button-group">
//               <button className="discard-btn" onClick={handleDiscardChanges}>
//                 Discard Changes
//               </button>
//               <button className="save-btn">Save for Later</button>
//               <button
//                 className="cancel-btn"
//                 onClick={() => setShowConfirmOverlay(false)}
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {showBookingConfirmOverlay && (
//         <div className="booking-confirm-overlay">
//           <div className="booking-confirm-container">
//             <button
//               className="close-btn"
//               type="button"
//               onClick={() => setShowBookingConfirmOverlay(false)}
//             >
//               <img
//                 src={close_0Btn}
//                 alt="Close"
//                 className="close-icon close-icon-0"
//               />
//               <img
//                 src={close_1Btn}
//                 alt="Close"
//                 className="close-icon close-icon-1"
//               />
//             </button>

//             <h3 className="confirm-header">Confirm Changes?</h3>
//             <p className="confirm-text">
//               Please review your booking details before proceeding.
//             </p>

//             <div className="confirm-details">
//               <p>
//                 <strong>Car Selected:</strong> {selectedCar || "None"}
//               </p>
//               <p>
//                 <strong>Drive Type:</strong> {driveType}
//               </p>
//               <p>
//                 <strong>Drop-off Type:</strong> {dropOffType}
//               </p>
//               <p>
//                 <strong>Rental Period:</strong> {startDate} to {endDate}
//               </p>

//               <h4 className="confirm-subtitle">Personal Information</h4>
//               <p>
//                 <strong>Name:</strong> {formData.firstName}{" "}
//                 {formData.middleName} {formData.surname}
//               </p>
//               <p>
//                 <strong>Occupation:</strong> {formData.occupation}
//               </p>
//               <p>
//                 <strong>Contact:</strong> {formData.contactNo}
//               </p>
//               <p>
//                 <strong>Email:</strong> {formData.email}
//               </p>

//               <h4 className="confirm-subtitle">Driver’s License</h4>
//               {uploadedID ? (
//                 <img
//                   src={URL.createObjectURL(uploadedID)}
//                   alt="Driver's License"
//                   className="confirm-id-preview"
//                 />
//               ) : (
//                 <p className="confirm-no-id">No file uploaded</p>
//               )}

//               <h4 className="confirm-subtitle">Quotation Summary</h4>
//               <ul className="confirm-summary-list">
//                 <li>
//                   <strong>Car Rate:</strong> {getCarRate()}
//                 </li>
//                 <li>
//                   <strong>Driving Price:</strong> {getDrivingPrice()}
//                 </li>
//                 <li>
//                   <strong>Drop-off Price:</strong> {getDropOffPrice()}
//                 </li>
//                 <li>
//                   <strong>Rental Duration:</strong> {getRentalDuration()}
//                 </li>
//                 <li className="confirm-total-price">
//                   <strong>Total Price:</strong> ₱{totalPrice.toLocaleString()}
//                 </li>
//               </ul>
//             </div>

//             <div className="confirm-button-group">
//               <button
//                 className="confirm-proceed-btn"
//                 onClick={handleConfirmBooking}
//               >
//                 Confirm & Proceed
//               </button>
//               <button
//                 className="confirm-cancel-btn"
//                 onClick={() => setShowBookingConfirmOverlay(false)}
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <form
//         className="booking-container"
//         style={containerStyle}
//         onSubmit={handleSubmit}
//       >
//         {/* <button className="close-btn" onClick={closeOverlay}> */}

//         <button
//           className="close-btn"
//           type="button"
//           onClick={handleCloseOverlay}
//         >
//           <img
//             src={close_0Btn}
//             alt="Close"
//             className="close-icon close-icon-0"
//           />
//           <img
//             src={close_1Btn}
//             alt="Close"
//             className="close-icon close-icon-1"
//           />
//         </button>

//         <h2>BOOKING FORM</h2>

//         <div className="booking-image">
//           <img
//             src={previewImage}
//             alt="Selected Car"
//             className={`booking-image ${imageAnimation}`}
//             onAnimationEnd={() => setImageAnimation("")} // Reset animation after completion
//           />
//         </div>

//         <div className="booking-content">
//           <div className="booking-column">
//             <div className="fill-up-form">
//               <h3 className="fixed-header">FILL-UP FORM</h3>

//               <label className="pickacar">Pick a Car:</label>
//               <select
//                 value={selectedCar}
//                 onChange={(e) => {
//                   const car = e.target.value;
//                   setSelectedCar(car);
//                   setHasChanges(true);
//                   setImageAnimation("fade-out");

//                   setTimeout(() => {
//                     setPreviewImage(carImages[car]);
//                     setImageAnimation("fade-slide-in");
//                   }, 100);
//                 }}
//                 required
//               >
//                 <option value="" disabled hidden>
//                   Pick a Car
//                 </option>
//                 <option value="VIOS">VIOS</option>
//                 <option value="MIRAGE">MIRAGE</option>
//                 <option value="LIVINA">LIVINA</option>
//               </select>

//               <div className="drive-type-form-row">
//                 <div>
//                   <label>Driving Option:</label>
//                   <select
//                     value={driveType}
//                     onChange={(e) => setDriveType(e.target.value)}
//                     required
//                   >
//                     <option value="Self-Drive">Self-Drive</option>
//                     <option value="With Driver">With Driver</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label>Pickup / Drop-off:</label>
//                   <select
//                     value={dropOffType}
//                     onChange={(e) => setDropOffType(e.target.value)}
//                     required
//                   >
//                     <option value="Pickup">Pickup</option>
//                     <option value="Drop-off">Drop-off</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="date-form-row">
//                 <div>
//                   <label>Start Date:</label>
//                   <input
//                     type="date"
//                     value={startDate}
//                     onChange={handleStartDateChange}
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label>End Date:</label>
//                   <input
//                     type="date"
//                     value={endDate}
//                     onChange={handleEndDateChange}
//                     className={errorMessage ? "id-error-input" : ""}
//                     required
//                   />
//                 </div>
//               </div>

//               <label>Upload Driver's License:</label>
//               <input
//                 type="file"
//                 id="uploadID"
//                 accept="image/*"
//                 onChange={handleFileUpload}
//                 className={`file-input ${fileError ? "error-border" : ""}`}
//               />

//               {fileError && (
//                 <div className="id-error-message">
//                   Driver's License is required!
//                 </div>
//               )}

//               {uploadedID && (
//                 <div className="image-preview">
//                   <img
//                     src={URL.createObjectURL(uploadedID)}
//                     alt="Uploaded ID"
//                   />
//                 </div>
//               )}

//               <label htmlFor="uploadID" className="file-label">
//                 {uploadedID
//                   ? "Change Driver's License"
//                   : "Upload Driver's License"}
//               </label>

//               <label className="form-label">Personal Information</label>
//               <div className="form-row">
//                 {/* <input
//                   type="text"
//                   placeholder="First Name"
//                   value={formData.firstName}
//                   onChange={(e) =>
//                     setFormData((prev) => ({ ...prev, firstName: e.target.value }))
//                   }
//                   required
//                 /> */}

//                 <input
//                   type="text"
//                   name="firstName"
//                   placeholder="First Name"
//                   value={formData.firstName}
//                   onChange={handleInputChange}
//                   required
//                 />

//                 <input
//                   type="text"
//                   name="middleName"
//                   placeholder="Middle Name (N/A if none)"
//                   //   onChange={(e) =>
//                   //     setFormData({ ...formData, middleName: e.target.value })
//                   //   }
//                   value={formData.middleName}
//                   onChange={handleInputChange}
//                   required
//                 />
//                 <input
//                   type="text"
//                   name="surname"
//                   placeholder="Surname"
//                   //   onChange={(e) =>
//                   //     setFormData({ ...formData, surname: e.target.value })
//                   //   }
//                   value={formData.surname}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </div>

//               <label className="form-label">Contact & Occupation</label>
//               <div className="form-row">
//                 <input
//                   type="text"
//                   name="occupation"
//                   placeholder="Occupation"
//                   //   onChange={(e) =>
//                   //     setFormData({ ...formData, occupation: e.target.value })
//                   //   }
//                   value={formData.occupation}
//                   onChange={handleInputChange}
//                   required
//                 />
//                 <input
//                   type="text"
//                   name="contactNo"
//                   placeholder="Contact No."
//                   //   onChange={(e) =>
//                   //     setFormData({ ...formData, contactNo: e.target.value })
//                   //   }
//                   value={formData.contactNo}
//                   onChange={(e) => {
//                     const formattedNumber = e.target.value.replace(
//                       /[^0-9-]/g,
//                       ""
//                     ); // ✅ Allow numbers & dashes only
//                     setFormData((prev) => ({
//                       ...prev,
//                       contactNo: formattedNumber,
//                     }));
//                     setHasChanges(true);
//                   }}
//                   required
//                 />
//                 <input
//                   type="email"
//                   name="email"
//                   placeholder="Email Address"
//                   //   onChange={(e) =>
//                   //     setFormData({ ...formData, email: e.target.value })
//                   //   }
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </div>
//             </div>
//           </div>

//           <div className="booking-column">
//             <QuotationSummary />
//           </div>
//         </div>

//         <button className="confirm-btn" type="submit">
//           Confirm Booking
//         </button>
//       </form>
//     </div>
//   );
// };

// export default BookingPage;

// useEffect(() => {
//   if (prefillData) {
//     // Set primitive fields
//     setSelectedCar(prefillData.selectedCar || "");
//  setDriveType(prefillData.drivingOption || "Self-Drive");
//     setDropOffType(prefillData.pickupOption || "Pickup");
//     setStartDate(prefillData.startDate || "");
//     setStartTime(prefillData.startTime || "");
//     setEndDate(prefillData.endDate || "");
//     setEndTime(prefillData.endTime || "");

//     // Set preview image based on selected car
//      const selectedUnit = unitData.find((u) => u.name === prefillData.carName);
//     setPreviewImage(selectedUnit?.image || pickacar);

//     // Set formData object
// setFormData((prev) => ({
//   ...prev,
//   firstName: prefillData.firstName || prev.firstName,
//   middleName: prefillData.middleName || prev.middleName,
//   surname: prefillData.surname || prev.surname,
//   occupation: prefillData.occupation || prev.occupation,
//   address: prefillData.address || prev.address,
//    contactNo: prefillData.contact || prev.contactNo,
//   email: prefillData.email || prev.email,
//   location: prefillData.location || prev.location,
//   dropoffLocation: prefillData.dropoffLocation || prev.dropoffLocation,
//   purpose: prefillData.purpose || prev.purpose,
//   additionalMessage: prefillData.additionalMessage || prev.additionalMessage,
// }));

// if (prefillData.license) {
//       setUploadedID(prefillData.license);
//     }
//   }
// }, [prefillData, unitData]);

// const getDrivingPrice = () => {
//   const dailyRate = 1000;

//   if (driveType === "With Driver") {
//     if (startDate && endDate) {
//       const start = new Date(startDate);
//       const end = new Date(endDate);
//       const rentalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

//       const total = dailyRate * rentalDays;

//       return `(₱${dailyRate.toLocaleString()} x ${rentalDays} Day${
//         rentalDays > 1 ? "s" : ""
//       }) ₱${total.toLocaleString()}`;
//     }

//     return `(₱${dailyRate.toLocaleString()} x 1 Day) ₱${dailyRate.toLocaleString()}`;
//   }

//   return "₱0";
// };

// const handleSubmit = (e) => {

//   e.preventDefault();
//   const form = e.target.closest("form");

//  const isEditing = Boolean(editingBooking);

//   if (!form.checkValidity()) {
//     form.reportValidity();
//     return;
//   }

//   if (!uploadedID) {
//     setFileError(true);
//     return;
//   }

//   const selectedUnit = unitData.find((unit) => unit.name === selectedCar);
//   if (!selectedUnit) return;

//   const drivingDailyRate = 1000;
//   const dropOffFlatRate = 500;

//   const start = new Date(`${startDate}T${startTime}`);
//   const end = new Date(`${endDate}T${endTime}`);
//   const diffTime = end.getTime() - start.getTime();
//   const totalHours = diffTime / (1000 * 60 * 60);
//   const totalDurationInSeconds = Math.floor(diffTime / 1000);

//   const isFlatRateSameDay = startDate === endDate && totalHours < 24;

//   let rentalDays = isFlatRateSameDay ? 0 : Math.floor(totalHours / 24);
//   let extraHour = isFlatRateSameDay ? 0 : Math.round(totalHours % 24);
//   let extraHourCharge = isFlatRateSameDay ? 0 : extraHour * 50;

//   const discountedRate = getDiscountedRate(selectedUnit, rentalDays || 1); // force min 1 day for rate

//   const billedDays = isFlatRateSameDay
//     ? 1
//     : rentalDays + (extraHour >= 24 ? 1 : 0); // 24 extra hours = full day

//   const drivingPrice = driveType === "With Driver" ? drivingDailyRate : 0;
//   const pickupPrice = dropOffType === "Drop-off" ? dropOffFlatRate : 0;

//   const baseRentalCharge = isFlatRateSameDay
//     ? discountedRate // flat daily rate
//     : rentalDays * discountedRate;

//   const drivingCharge = drivingPrice * (rentalDays || 1); // charge driver fee even for same-day
//   const total = baseRentalCharge + drivingCharge + pickupPrice + extraHourCharge;

//   setBookingPreviewData({
//     unitImage: selectedUnit?.image || "N/A",
//     plateNo: selectedUnit?.plateNo || "N/A",
//     carType: selectedUnit?.carType || "N/A",
//     carName: selectedCar,
//     drivingOption: driveType,
//     pickupOption: dropOffType,
//     ...(dropOffType !== "Pickup" && {
//       dropoffLocation: formData.dropoffLocation,
//     }),
//     startDate,
//     endDate,
//     startTime,
//     endTime,

//     location: formData.location,
//     purpose: formData.purpose,
//     additionalMessage: formData.additionalMessage || "None",

//     firstName: formData.firstName,
//     middleName: formData.middleName,
//     surname: formData.surname,
//     contact: formData.contactNo,
//     email: formData.email,
//     occupation: formData.occupation,

//     address: formData.address,
//     driverLicense: uploadedID,
//     billedDays,
//     drivingPrice,
//     pickupPrice,
//     discountedRate,
//     extraHourCharge,
//     rentalDuration: {
//       days: rentalDays,
//       extraHour: extraHour,
//       actualSeconds: totalDurationInSeconds,
//       isFlatRateSameDay,
//     },
//     totalPrice: total,
//     totalDurationInSeconds,

// ...(editingBooking?.id && { bookingId: editingBooking.id }),
//   isEditing,

//   });

// console.log("Booking Preview Data (Pre-State):", bookingPreviewData);
// setBookingPreviewData(bookingPreviewData);
// setShowBookingConfirmOverlay(true);

//   // console.log("Booking Preview Data:", bookingPreviewData);
//   // setShowBookingConfirmOverlay(true);
// };

// const [formData, setFormData] = useState({
//   firstName: "",
//   middleName: "",
//   surname: "",
//   occupation: "",
//   address: "",
//   contactNo: "",
//   email: "",
//   location: "",
//   dropoffLocation: "",
//   purpose: "",
//   additionalMessage: "",
// });

//   const handleSubmit = (e) => {
//     e.preventDefault(); // Prevent actual submission
//     const form = e.target.closest("form");

//     // Check for missing required fields
//     if (!form.checkValidity()) {
//       form.reportValidity();
//       return;
//     }

//     // Check if the file input is empty
//     if (!uploadedID) {
//       setFileError(true);
//       return;
//     }

//     const selectedUnit = unitData.find((unit) => unit.name === selectedCar);

// // 👇 Use your defined rules
// const drivingDailyRate = 1000;
// const dropOffFlatRate = 500;

// let rentalDays = 1;
// if (startDate && endDate) {
//   const start = new Date(startDate);
//   const end = new Date(endDate);
//   rentalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
// }

// const drivingPrice = driveType === "With Driver" ? drivingDailyRate : 0;
// const pickupPrice = dropOffType === "Drop-off" ? dropOffFlatRate : 0;

// let discountedRate = getDiscountedRate(selectedUnit, rentalDays);

//   const start = new Date(`${startDate}T${startTime}`);
//   const end = new Date(`${endDate}T${endTime}`);
//   const totalDurationInSeconds = Math.floor((end - start) / 1000);

//     setBookingPreviewData({
//       unitImage: selectedUnit?.image || "N/A",
//       plateNo: selectedUnit?.plateNo || "N/A",
//       carType: selectedUnit?.carType || "N/A",
//       carName: selectedCar,
//       drivingOption: driveType,
//       pickupOption: dropOffType,
//         ...(dropOffType !== "Pickup" && {
//     dropoffLocation: formData.dropoffLocation,
//   }),
//       startDate,
//       endDate,
//       startTime,
//       endTime,

//       location: formData.location,
//       purpose: formData.purpose,
//       additionalMessage: formData.additionalMessage,

//       firstName: formData.firstName,
//       middleName: formData.middleName,
//       surname: formData.surname,
//       contact: formData.contactNo,
//       email: formData.email,
//       occupation: formData.occupation,

//       address: formData.address,
//       driverLicense: uploadedID,

//       drivingPrice,
// pickupPrice,
// discountedRate,
//       totalPrice,
//       totalDurationInSeconds,
//     });

//     console.log("Booking Preview Data:", bookingPreviewData);

//     // Show booking confirmation overlay instead of direct submission
//     setShowBookingConfirmOverlay(true);
//   };

// // DEBUG SUBMITTING ANIMATION
// useEffect(() => {
//   // 💡 Automatically trigger animation after page loads (for dev use only)
//   const testAnimation = () => {
//     setIsSubmitting(true);

//     // Automatically stop the animation after 3 seconds
//     setTimeout(() => {
//       setIsSubmitting(false);
//     }, 100000);
//   };

//   // Comment this out in production!
//   testAnimation();
// }, []);

// // 🔧 Dev-only success overlay preview
// useEffect(() => {
//   // 🔧 Dev-only success overlay preview
//   const testSuccessOverlay = () => {
//     setSuccessMessage("Booking request successfully submitted!");
//     setShowSubmittedBookingRequest(true);
//     setHideAnimation(false);

//     setTimeout(() => {
//       setHideAnimation(true);
//       setTimeout(() => setShowSubmittedBookingRequest(false), 400);
//     }, 5000); // visible for 2.5 seconds
//   };

//   // Comment this out in production
//   testSuccessOverlay();
// }, []);

// const handleConfirmBooking = async () => {
//   if (isAdmin) {
//     setHasChanges(false);
//     handleClearForm();
//     setShowConfirmOverlay(false);
//     setShowBookingConfirmOverlay(false);
//     closeOverlay();
//     navigate("/admin");
//     return;
//   }

//   try {
//     if (!bookingPreviewData) return;

// const isEditing = bookingPreviewData?.isEditing;

//     // 🟡 Show submitting overlay
//     setIsSubmitting(true);

//     // ✅ Proceed with booking
//     await submitUserBookingRequest(bookingPreviewData);

//     // ✅ Close booking overlays
//     handleClearForm();
//     setShowBookingConfirmOverlay(false);
//     closeOverlay();

//     if (typeof triggerSuccessOverlay === "function") {
//   const message = isEditing
//     ? "Successfully Updated Booking Request!"
//     : "Successfully Sent Booking Request!";
//   triggerSuccessOverlay(message, isEditing);
// }

//   } catch (error) {
//     console.error("❌ Failed to confirm booking:", error);
//   } finally {
//     // 🔴 Hide submitting overlay
//     setIsSubmitting(false);
//   }
// };

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
