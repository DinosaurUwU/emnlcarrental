"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useUser } from "../lib/UserContext";
import { useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";
import "./BookingPage.css";

const BookingPage = ({
  isOpen,
  closeOverlay,
  buttonRect,
  triggerSuccessOverlay,
  prefillData,
  editingBookingData,
}) => {
  const {
    unitData,
    allUnitData,
    user,
    setShowVerifyOverlay,
    referralSources,
    fetchImageFromFirestore,
  } = useUser();
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

  // Save booking data to localStorage
  const saveBookingDataToStorage = () => {
  const bookingData = {
    selectedCarId,
    selectedCarType,
    driveType,
    dropOffType,
    startDate,
    endDate,
    startTime,
    endTime,
    formData,
    uploadedID,
    totalPrice,
  };
    localStorage.setItem("pendingBookingData", JSON.stringify(bookingData));
  };

 // Check for pending booking data on mount
useEffect(() => {
  if (user?.uid) {
    const pendingData = localStorage.getItem(
      `pendingBookingData_${user.uid}`,
    );

    if (pendingData) {
      try {
        const data = JSON.parse(pendingData);

        // Restore all the fields
        if (data.selectedCarId) setSelectedCarId(data.selectedCarId);
        if (data.selectedCarType) setSelectedCarType(data.selectedCarType);
        if (data.driveType) setDriveType(data.driveType);
        if (data.dropOffType) setDropOffType(data.dropOffType);
        if (data.startDate) setStartDate(data.startDate);
        if (data.endDate) setEndDate(data.endDate);
        if (data.startTime) setStartTime(data.startTime);
        if (data.endTime) setEndTime(data.endTime);
        if (data.formData) setFormData(data.formData);
        if (data.uploadedID) setUploadedID(data.uploadedID);
        if (data.totalPrice) setTotalPrice(data.totalPrice);

        // Clear the stored data
        localStorage.removeItem(`pendingBookingData_${user.uid}`);

        console.log("✅ Booking data restored!");
      } catch (error) {
        console.error("Error restoring booking data:", error);
      }
    }
  }
}, [user]);

useEffect(() => {
  // Check for URL search params (from guest session redirect)
  const searchParams = new URLSearchParams(window.location.search);
  const hasPrefill = searchParams.get('prefill') === 'true';
  
  if (hasPrefill) {
    const urlPrefillData = {
      carType: searchParams.get('carType') || undefined,
      carName: searchParams.get('carName') || undefined,
      drivingOption: searchParams.get('drivingOption') || undefined,
      pickupOption: searchParams.get('pickupOption') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      startTime: searchParams.get('startTime') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      endTime: searchParams.get('endTime') || undefined,
      firstName: searchParams.get('firstName') || undefined,
      middleName: searchParams.get('middleName') || undefined,
      surname: searchParams.get('surname') || undefined,
      occupation: searchParams.get('occupation') || undefined,
      address: searchParams.get('address') || undefined,
      contact: searchParams.get('contact') || undefined,
      email: searchParams.get('email') || undefined,
      location: searchParams.get('location') || undefined,
      dropoffLocation: searchParams.get('dropoffLocation') || undefined,
      purpose: searchParams.get('purpose') || undefined,
      additionalMessage: searchParams.get('additionalMessage') || undefined,
      referralSource: searchParams.get('referralSource') || undefined,
      driverLicense: searchParams.get('driverLicense') || undefined,
    };
    
    // Clean URL without reloading
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Merge with existing prefillData
    setPrefillData(urlPrefillData);
  }
}, []);








  const [filteredUnits, setFilteredUnits] = useState(allUnitData || []);
  const selectedUnit = allUnitData.find((unit) => unit.id === selectedCarId);

  useEffect(() => {
    if (!allUnitData || allUnitData.length === 0) {
      setFilteredUnits([]);
      return;
    }
    const type = selectedCarType?.trim() || "ALL";
    const filtered =
      type === "ALL"
        ? allUnitData
        : allUnitData.filter(
            (unit) => unit.carType?.toLowerCase() === type.toLowerCase(),
          );
    setFilteredUnits(filtered);
  }, [allUnitData, selectedCarType]);

  useEffect(() => {
    if (!allUnitData || allUnitData.length === 0) {
      console.log("🔍 No allUnitData yet — clearing filteredUnits");
      setFilteredUnits([]);
      return;
    }

    // Nrmalize car type to prevent accidental blanks or undefined
    const type = selectedCarType?.trim() || "ALL";

    // Show ALL units including hidden
    const filtered =
      type === "ALL"
        ? allUnitData
        : allUnitData.filter(
            (unit) => unit.carType?.toLowerCase() === type.toLowerCase(),
          );

    console.log(`✅ Filtered units set: ${filtered.length} (type: ${type})`);
    setFilteredUnits(filtered);
  }, [allUnitData, selectedCarType]);

  const derivedPrefill = prefillData || user || {};

  const [actionOverlay, setActionOverlay] = useState({
    isVisible: false,
    message: "",
    type: "success", // "success" => green, "warning" => red
  });
  const [hideCancelAnimation, setHideCancelAnimation] = useState(true);

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
          400,
        );
      }, duration);
    }
  };

  useEffect(() => {
    if (skipImageUpdate) {
      setSkipImageUpdate(false);
      return;
    }

    const selectedUnit = allUnitData.find((u) => u.id === selectedCarId);
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
  }, [selectedCarId, allUnitData, fetchImageFromFirestore]);

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
        "📖 Booking form opened, deciding whether to check for saved data...",
      );
      console.log("➡️ editingBookingData:", editingBookingData);

      const isResubmitting = editingBookingData?.isResubmitting === true;
      const isEditing = editingBookingData?.isResubmitting === false;

      if (isResubmitting || isEditing) {
        console.log("⏭️ Skipping saved data check (editing or resubmitting).");
        return; // Don’t trigger load dialog for edit/resubmit
      }

      // New booking, check for saved data
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
        // Load the saved form data
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

        // Load other fields
        // setSelectedCar(savedFormData.selectedCar || "");
        const savedUnit = unitData.find(
          (u) => u.name === savedFormData.selectedCar,
        );
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
          (u) => u.name === savedFormData.selectedCar,
        );
        // setPreviewImage(selectedUnit?.image || pickacar);
        if (selectedUnit?.imageId) {
          const { base64 } = await fetchImageFromFirestore(
            selectedUnit.imageId,
          );
          setPreviewImage(base64 || "/assets/images/image1.png");
        } else {
          setPreviewImage("/assets/images/image1.png");
        }

        setHasChanges(true);
      }

      setLoadSavedData(false);

      setShowLoadSavedData(true);

      setTimeout(() => setShowLoadSavedData(false), 4000);
    } catch (error) {
      console.error("❌ Error loading saved data:", error);
      setLoadSavedData(false);
    } finally {
      setShowLoadSavedDialog(false);
    }
  };

  const handleDiscardSavedData = async () => {
    try {
      setDiscardSavedData(true);

      await new Promise((resolve) => setTimeout(resolve, 1200));

      await clearSavedBookingFormData();

      setDiscardSavedData(false);

      setShowDiscardSavedData(true);

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
    // Car selection
    setSelectedCarType(prefillData.carType || "ALL");

    if (prefillData.carId) {
      const unitById = unitData.find((u) => u.id === prefillData.carId);
      if (unitById) {
        setSelectedCarId(unitById.id);
      } else {
        setSelectedCarId(prefillData.carId);
      }
    }

    // Fallback: also look for carName if provided
    if (prefillData.carName) {
      const unitByName = unitData.find((u) => u.name === prefillData.carName);
      if (unitByName) {
        setSelectedCarId(unitByName.id);
      }
    }

    // Drive/Drop options
    setDriveType(prefillData.drivingOption || "Self-Drive");
    setDropOffType(prefillData.pickupOption || "Pickup");

    // Dates and times
    setStartDate(prefillData.startDate || "");
    setStartTime(prefillData.startTime || "");
    setEndDate(prefillData.endDate || "");
    setEndTime(prefillData.endTime || "");

    // Form data fields
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
      additionalMessage: prefillData.additionalMessage || prev.additionalMessage,
      referralSource: prefillData.referralSource || prev.referralSource,
    }));

    // Driver's License
    if (prefillData.driverLicense) {
      setUploadedID(prefillData.driverLicense);
    }

    // Image handling
    const selectedUnit = unitData.find((u) => u.id === prefillData.carId) ||
                         unitData.find((u) => u.name === prefillData.carName);
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
  }
}, [prefillData, unitData, fetchImageFromFirestore]);

useEffect(() => {
  if (prefillData?.carId && unitData.length > 0 && selectedCarId !== prefillData.carId) {
    const unitById = unitData.find((u) => u.id === prefillData.carId);
    if (unitById) {
      setSelectedCarId(unitById.id);
      
      // Also update image
      if (unitById.imageId) {
        fetchImageFromFirestore(unitById.imageId)
          .then(({ base64 }) => {
            setPreviewImage(base64 || "/assets/images/image1.png");
          })
          .catch(() => {
            setPreviewImage("/assets/images/image1.png");
          });
      }
    }
  }
}, [unitData, prefillData]);


  // useEffect(() => {
  //   if (prefillData) {
  //     setSelectedCarType(prefillData.carType || "ALL");
  //     // setSelectedCar(prefillData.carName || "");
  //     const prefillUnit = unitData.find((u) => u.name === prefillData.carName);
  //     setSelectedCarId(prefillUnit?.id || "");

  //     setDriveType(prefillData.drivingOption || "Self-Drive");
  //     setDropOffType(prefillData.pickupOption || "Pickup");

  //     setStartDate(prefillData.startDate || "");
  //     setStartTime(prefillData.startTime || "");
  //     setEndDate(prefillData.endDate || "");
  //     setEndTime(prefillData.endTime || "");

  //     // Image
  //     const selectedUnit = unitData.find((u) => u.name === prefillData.carName);
  //     // setPreviewImage(selectedUnit?.image || pickacar);
  //     if (selectedUnit?.imageId) {
  //       fetchImageFromFirestore(selectedUnit.imageId)
  //         .then(({ base64 }) => {
  //           setPreviewImage(base64 || "/assets/images/image1.png");
  //         })
  //         .catch(() => {
  //           setPreviewImage("/assets/images/image1.png");
  //         });
  //     } else {
  //       setPreviewImage("/assets/images/image1.png");
  //     }

  //     // Form data
  //     setFormData((prev) => ({
  //       ...prev,
  //       firstName: prefillData.firstName || prev.firstName,
  //       middleName: prefillData.middleName || prev.middleName,
  //       surname: prefillData.surname || prev.surname,
  //       occupation: prefillData.occupation || prev.occupation,
  //       address: prefillData.address || prev.address,
  //       contactNo: prefillData.contact || prev.contactNo,
  //       email: prefillData.email || prev.email,
  //       location: prefillData.location || prev.location,
  //       dropoffLocation: prefillData.dropoffLocation || prev.dropoffLocation,
  //       purpose: prefillData.purpose || prev.purpose,
  //       additionalMessage:
  //         prefillData.additionalMessage || prev.additionalMessage,
  //     }));

  //     if (prefillData.driverLicense) {
  //       setUploadedID(prefillData.driverLicense);
  //     }
  //   }
  // }, [prefillData, unitData, fetchImageFromFirestore]);

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

    // Update formData immediately for responsive typing
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Call debounced function to setHasChanges(true)
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
            <span
              className={`label ${getColorForSelectedOption(selectedCarId)}`}
            >
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

  const getDiscountedRate = (unit, rentalDays) => {
    if (!unit) return 0;
    return unit.price;
  };

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
      isNaN(userStartTime.getTime()) ? new Date() : userStartTime,
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
      startTime,
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
if (!user) {
    saveBookingDataToStorage();
    
    // Add user ID to the saved data for later retrieval
    const bookingData = localStorage.getItem("pendingBookingData");
    if (bookingData) {
      const data = JSON.parse(bookingData);
      data.tempUserEmail = formData.email; // Store email to identify user
      localStorage.setItem("pendingBookingData", JSON.stringify(data));
    }
    
    setShowBookingConfirmOverlay(false);
    setShowConfirmOverlay(false);
    closeOverlay();
    router.push("/auth/login");
    return;
  }

    if (!user?.emailVerified) {
      setShowVerifyOverlay(true); // Opens the global verification overlay
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
        // Resubmitting a rejected booking
        await resubmitUserBookingRequest(bookingPreviewData);
      } else if (isEditing) {
        // Editing an existing booking
        await submitUserBookingRequest(bookingPreviewData);
      } else {
        // New booking
        await submitUserBookingRequest(bookingPreviewData);
      }

      // Reset everything
      handleClearForm();
      setShowBookingConfirmOverlay(false);
      closeOverlay();

      // Show success message
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

  const handleDiscardChanges = async () => {
    try {
      setIsDiscarding(true);

      await new Promise((resolve) => setTimeout(resolve, 1200));

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
        triggerSuccessOverlay(
          "All unsaved changes have been discarded.",
          "discard",
        );
      }
    } catch (error) {
      console.error("❌ Error discarding form data:", error);
      showActionOverlay({
        message: "Error discarding form data. Please try again.",
        type: "warning",
      });
    } finally {
      setIsDiscarding(false);
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
                src="/assets/images/submitting.gif"
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
                src="/assets/images/submitting.gif"
                alt="Submitting Car"
                className="car-gif"
              />
            </div>
            <p className="submitting-text">Saving Your Booking Form...</p>
          </div>
        </div>
      )}

      {isDiscarding && (
        <div className="submitting-overlay">
          <div className="loading-container">
            <div className="loading-bar-road">
              <img
                src="/assets/images/submitting.gif"
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
                src="/assets/images/submitting.gif"
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
                src="/assets/images/submitting.gif"
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
                    setIsSaving(true);

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
                      referralSource:
                        formData.referralSource || "Not Specified",
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
                        triggerSuccessOverlay(
                          "Booking form saved successfully!",
                        );
                      }
                    } else {
                      showActionOverlay({
                        message:
                          "Failed to save booking form. Please try again.",
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
                    setIsSaving(false);
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
                        bookingPreviewData?.startTime,
                      )}{" "}
                      <br /> to <br />
                      {formatDateTime(
                        bookingPreviewData?.endDate,
                        bookingPreviewData?.endTime,
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
                    (unit) => unit.name === bookingPreviewData?.carName,
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

        <h2
          style={{
            fontSize: "1.2rem",
            color:
              editingBookingData?.isResubmitting === true
                ? "#dc3545" // Color for "RESUBMIT BOOKING REQUEST"
                : editingBookingData &&
                    editingBookingData?.isResubmitting === false
                  ? "#ffb347" // Color for "EDIT BOOKING REQUEST"
                  : "", // Color for "BOOKING FORM"
          }}
        >
          {editingBookingData?.isResubmitting === true
            ? "RESUBMIT BOOKING REQUEST"
            : editingBookingData && editingBookingData?.isResubmitting === false
              ? "EDIT BOOKING REQUEST"
              : "BOOKING FORM"}
        </h2>

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

                  <select
                    value={selectedCarId}
                    onChange={(e) => {
                      const carId = e.target.value;
                      setSelectedCarId(carId);
                      setSkipImageUpdate(true);
                      setHasChanges(true);
                      setImageAnimation("fade-out");

                      const selectedUnit = allUnitData.find(
                        (u) => u.id === carId,
                      );

                      if (selectedUnit?.imageId) {
                        fetchImageFromFirestore(selectedUnit.imageId)
                          .then(({ base64 }) => {
                            setTimeout(() => {
                              setPreviewImage(
                                base64 || "/assets/images/image1.png",
                              );
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
                      <option
                        key={unit.id}
                        value={unit.id}
                        className={unit.hidden ? "hidden-unit" : ""}
                      >
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
                        uploadedID,
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
                      "",
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
          data-pswp-width={2873} // Recommended width
          data-pswp-height={1690} // Recommended height
          data-pswp-index={0}
        >
          <img src={previewImage} alt="" />
        </a>
      </div>
    </div>
  );
};

export default BookingPage;
