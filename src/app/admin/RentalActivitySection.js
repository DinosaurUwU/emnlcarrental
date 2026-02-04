"use client";
//RentalActivitySection.js
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useUser } from "../lib/UserContext";
import { Timestamp } from "firebase/firestore";
import { generateFilledContract } from "./generateFilledContract";
import PrintContract from "./PrintContract";
import "./RentalActivitySection.css";

const RentalActivitySection = ({ subSection }) => {
  const [filePreviews, setFilePreviews] = useState({});
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [showDateWarning, setShowDateWarning] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [hideAnimation, setHideAnimation] = useState(false);
  const [isEndDateInvalid, setIsEndDateInvalid] = useState(false);
  const [expandedUnits, setExpandedUnits] = useState({});
  const [formData, setFormData] = useState({});
  const scrollRefs = useRef({});
  const fileInputRefs = useRef({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearUnitId, setClearUnitId] = useState(null);
  const [showBookingConfirmOverlay, setShowBookingConfirmOverlay] =
    useState(false);
  const [confirmUnitId, setConfirmUnitId] = useState(null);
  const [fileErrors, setFileErrors] = useState({});
  const uploadBoxRefs = useRef({});
  const endTimeRefs = useRef({});
  const [highlightedEndTime, setHighlightedEndTime] = useState(null);
  const [quotationDetailsVisibility, setQuotationDetailsVisibility] = useState(
    {},
  );
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessBooking, setShowSuccessBooking] = useState(false);

  const {
    serverTimestamp,
    triggerForceFinishRental,
    unitData,
    allUnitData,
    saveBookingToFirestore,
    completedBookingsAnalytics,
    activeBookings,
    markRentalAsCompleted,
    cancelRental,
    reserveUnit,
    extendRentalDuration,
    adminBookingRequests,
    fetchAdminBookingRequests,
    moveUserBookingToActiveRentals,
    rejectBookingRequest,
    updateAdminToUserBookingRequest,
    compressAndConvertFileToBase64,
    updateActiveBooking,
    updateBalanceDueBooking,
    markBookingAsPaid,

    paymentEntries,
    setPaymentEntries,
    addPaymentEntry,
    updatePaymentEntry,
    removePaymentEntry,

    triggerAutoFill,
    autoFillTrigger,

    triggerCancelFill,

    mopTypes,
    popTypesRevenue,
    referralSources,
    fetchImageFromFirestore,
    imageUpdateTrigger,
    user,
    userAccounts,
  } = useUser();
  const [clientsSearchTerm, setClientsSearchTerm] = useState("");
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [ongoingRentals, setOngoingRentals] = useState([]);
  const [showDetailsOverlay, setShowDetailsOverlay] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [finishRentalId, setFinishRentalId] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelRentalId, setCancelRentalId] = useState(null);
  const [showReserveConfirm, setShowReserveConfirm] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [showUpdatePaymentConfirm, setShowUpdatePaymentConfirm] =
    useState(false);
  const [showRemovePaymentConfirm, setShowRemovePaymentConfirm] =
    useState(false);
  const [
    showRemoveUserRequestPaymentConfirm,
    setShowRemoveUserRequestPaymentConfirm,
  ] = useState(false);
  const [removePaymentIndex, setRemovePaymentIndex] = useState(null);
  const [showRemovePaymentEntryConfirm, setShowRemovePaymentEntryConfirm] =
    useState(false);
  const [removePaymentEntryIndex, setRemovePaymentEntryIndex] = useState(null);

  const [
    showRemoveBalanceDuePaymentConfirm,
    setShowRemoveBalanceDuePaymentConfirm,
  ] = useState(false);

  const [showEditRequestConfirmOverlay, setShowEditRequestConfirmOverlay] =
    useState(false);
  const [showEditRequest, setShowEditRequest] = useState(false);
  const [editRequestFormData, setEditRequestFormData] = useState({});
  const [showEditRequestConfirm, setShowEditRequestConfirm] = useState(false);

  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [showEditBalanceDueConfirm, setShowEditBalanceDueConfirm] =
    useState(false);
  const [editRentalId, setEditRentalId] = useState(null);

  const [showEditBooking, setShowEditBooking] = useState(false);
  const [showEditBalanceDueBooking, setShowEditBalanceDueBooking] =
    useState(false);
  const [showMarkAsPaidConfirm, setShowMarkAsPaidConfirm] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [balanceDueFormData, setBalanceDueFormData] = useState({});

  const [balanceDueBookings, setBalanceDueBookings] = useState([]);
  const [showBalanceDetailsOverlay, setShowBalanceDetailsOverlay] =
    useState(false);

  const [reserveUnitId, setReserveUnitId] = useState(null);
  const [showUnitConflict, setShowUnitConflict] = useState(false);
  const [showExtendConfirm, setShowExtendConfirm] = useState(false);
  const [showFinalExtendConfirm, setShowFinalExtendConfirm] = useState(false);
  const [extendRentalId, setExtendRentalId] = useState(null);
  const [showAcceptBookingConfirm, setShowAcceptBookingConfirm] =
    useState(false);
  const [showCallBookingConfirm, setShowCallBookingConfirm] = useState(false);
  const [showCallActiveBookingConfirm, setShowCallActiveBookingConfirm] =
    useState(false);
  const [showRejectBookingConfirm, setShowRejectBookingConfirm] =
    useState(false);
  const [showRejectBookingReason, setShowRejectBookingReason] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [extendValue, setExtendValue] = useState(1); // default to 1
  const [extendUnit, setExtendUnit] = useState("Hours"); // default unit
  const printRef = useRef();
  const [filterType, setFilterType] = useState("ALL");
  const [ongoingFilter, setOngoingFilter] = useState("ACTIVE");
  const [balanceFilter, setBalanceFilter] = useState("ALL");

  const filteredOngoingRentals = ongoingRentals.filter((rental) => {
    if (ongoingFilter === "ACTIVE")
      return rental.status?.toUpperCase() === "ACTIVE";
    if (ongoingFilter === "PENDING")
      return rental.status?.toUpperCase() === "PENDING";
    return false;
  });

  const [showCustomerSelectDialog, setShowCustomerSelectDialog] =
    useState(false);

  const [selectedUnitId, setSelectedUnitId] = useState(null);

  const [fetchedImages, setFetchedImages] = useState({});

  const [localPaymentEntries, setLocalPaymentEntries] = useState([]);

  const [editingIndex, setEditingIndex] = useState(null);
  const [currentPayment, setCurrentPayment] = useState({
    amount: "",
    mop: "",
    pop: "",
    date: "",
  });

  useEffect(() => {
    if (!unitData || unitData.length === 0) return;

    const fetchImages = async () => {
      const imageIds = new Set();

      // Collect imageIds from bookings and units (ignore hidden)
      unitData.forEach((unit) => {
        if (unit.imageId) imageIds.add(unit.imageId);
      });

      activeBookings.forEach((booking) => {
        if (booking.imageId) imageIds.add(booking.imageId);
        else imageIds.add(`${booking.plateNo}_main`);
      });

      const results = await Promise.all(
        [...imageIds].map(async (id) => {
          const image = await fetchImageFromFirestore(id);
          return image ? { [id]: image } : null;
        }),
      );

      setFetchedImages((prev) => ({
        ...prev,
        ...Object.assign({}, ...results.filter(Boolean)),
      }));
    };

    fetchImages();
  }, [unitData, activeBookings, imageUpdateTrigger]);

  const clientsList = useMemo(() => {
    const allBookings = [
      ...activeBookings,
      ...Object.values(completedBookingsAnalytics).flatMap(
        (car) => car.bookings || [],
      ),
    ];

    const emailMap = {};

    // Process all bookings to group by email
    allBookings.forEach((booking) => {
      const email = booking.email;
      if (email) {
        if (!emailMap[email]) {
          emailMap[email] = {
            name:
              `${booking.firstName || ""} ${booking.middleName || ""} ${
                booking.surname || ""
              }`.trim() || "Walk-in Client",
            firstName: booking.firstName || "",
            middleName: booking.middleName || "",
            surname: booking.surname || "",
            contact: booking.contact || "",
            email,
            address: booking.address || "",
            occupation: booking.occupation || "",
            createdAt: null,
            bookingsCount: 0,
            totalDue: 0,
            isRegistered: false,
          };
        }
        emailMap[email].bookingsCount += 1;
        emailMap[email].totalDue += booking.balanceDue || 0;

        // Use the earliest booking date as "created at" for walk-ins
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
      if (user.role === "admin") return; // Skip admin users
      const email = user.email;
      if (email) {
        if (emailMap[email]) {
          // Update existing entry with user data
          emailMap[email].isRegistered = true;
          emailMap[email].createdAt = user.createdAt
            ? new Date(user.createdAt.seconds * 1000)
            : emailMap[email].createdAt;
          emailMap[email].name = user.name || emailMap[email].name;
          emailMap[email].contact = user.phone || emailMap[email].contact;
          emailMap[email].address = user.address || "";
          emailMap[email].occupation = user.occupation || "";
          // Add individual name fields
          emailMap[email].firstName =
            user.firstName || emailMap[email].firstName || "";
          emailMap[email].middleName =
            user.middleName || emailMap[email].middleName || "";
          emailMap[email].surname =
            user.surname || emailMap[email].surname || "";
        } else {
          // Add registered user with no bookings (if any)
          emailMap[email] = {
            name:
              user.name ||
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
            // Add individual name fields
            firstName: user.firstName || "",
            middleName: user.middleName || "",
            surname: user.surname || "",
          };
        }
      }
    });

    return Object.values(emailMap);
  }, [activeBookings, completedBookingsAnalytics, userAccounts]);

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

  useEffect(() => {
    if (editRequestFormData?.id) {
      const currentEntries = paymentEntries[editRequestFormData.id] || [];
      setLocalPaymentEntries(currentEntries);
    } else if (editFormData?.bookingUid) {
      const currentEntries = paymentEntries[editFormData.bookingUid] || [];
      setLocalPaymentEntries(currentEntries);
    } else {
      setLocalPaymentEntries([]);
    }
  }, [paymentEntries, editRequestFormData?.id, editFormData?.bookingUid]);

  const [showMoreFor, setShowMoreFor] = useState(null);

  const [showSettings, setShowSettings] = useState(false);

  const [hideCancelAnimation, setHideCancelAnimation] = useState(false);

  const [showRejectedBookingOverlay, setShowRejectedBookingOverlay] =
    useState(false);

  const [processingBooking, setProcessingBooking] = useState({
    isProcessing: false,
    message: "",
    textClass: "submitting-text-red",
  });

  const [actionOverlay, setActionOverlay] = useState({
    isVisible: false,
    message: "",
    type: "warning",
  });

  const displayedPayments = balanceDueFormData?.paymentEntries || [];

  //SCROLL RELATED
  const scrollYRef = useRef(0);

  // BALANCE DUE DISPLAY
  useEffect(() => {
    if (
      !completedBookingsAnalytics ||
      typeof completedBookingsAnalytics !== "object"
    )
      return;

    const allBookings = [];

    Object.values(completedBookingsAnalytics).forEach((carData) => {
      if (Array.isArray(carData.bookings)) {
        carData.bookings.forEach((booking) => {
          // Show only unpaid rentals (paid = false)
          if (booking.paid === false) {
            allBookings.push({
              ...booking,
              carName: carData.carName,
              carType: carData.carType,
              unitImage: carData.unitImage,
            });
          }
        });
      }
    });

    console.log("✅ Flattened unpaid bookings:", allBookings);
    setBalanceDueBookings(allBookings);
  }, [completedBookingsAnalytics]);

  const filteredBalanceBookings = balanceDueBookings
    .filter((booking) => {
      if (balanceFilter === "ZERO") return booking.balanceDue === 0;
      if (balanceFilter === "NONZERO") return booking.balanceDue !== 0;
      return true; // ALL
    })
    .sort((a, b) => {
      if (a.balanceDue === 0 && b.balanceDue !== 0) return -1;
      if (a.balanceDue !== 0 && b.balanceDue === 0) return 1;
      return 0;
    });

  // PICK-A-CAR DISPLAY
useEffect(() => {
  if (allUnitData.length > 0) {
    let leastRentedUnit = null;
    let leastTimes = Infinity;

    allUnitData.forEach((unit) => {
      if (!unit.hidden) {
        const analytics = completedBookingsAnalytics?.[unit.id];  // ✅ Safe with optional chaining
        const timesRented = analytics?.timesRented || 0;

        if (timesRented < leastTimes) {
          leastTimes = timesRented;
          leastRentedUnit = unit.id;
        }
      }
    });

    if (leastRentedUnit) {
      setSelectedUnitId(leastRentedUnit);
    }
  }
}, [allUnitData]); // ✅ Only depends on allUnitData


  //OVERLAY STOP BACKGROUND CLICK AND SCROLL
  useEffect(() => {
    const handleClickOrScroll = (e) => {
      if (
        !showBookingConfirmOverlay &&
        !showDetailsOverlay &&
        !showExtendConfirm &&
        !showFinalExtendConfirm &&
        !showCancelConfirm &&
        !showFinishConfirm &&
        !showReserveConfirm &&
        !showAcceptBookingConfirm &&
        !showCallBookingConfirm &&
        !showCallActiveBookingConfirm &&
        !showRejectBookingReason &&
        !showClearConfirm &&
        !showEditConfirm &&
        !showEditBooking &&
        !showEditBalanceDueConfirm &&
        !showEditBalanceDueBooking &&
        !showBalanceDetailsOverlay &&
        !showEditRequestConfirmOverlay &&
        !showEditRequest &&
        !showEditRequestConfirm &&
        !showRemoveUserRequestPaymentConfirm
      ) {
        setShowSettings(false);
      }
    };

    const preventTouch = (e) => {
      if (
        isImageModalOpen ||
        showBookingConfirmOverlay ||
        showDetailsOverlay ||
        showDateWarning ||
        showTimeWarning ||
        showUnitConflict ||
        showSuccessBooking ||
        showExtendConfirm ||
        showFinalExtendConfirm ||
        showCancelConfirm ||
        showFinishConfirm ||
        showReserveConfirm ||
        showAcceptBookingConfirm ||
        showCallBookingConfirm ||
        showRejectBookingReason ||
        showClearConfirm ||
        showEditConfirm ||
        showEditBooking
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("mousedown", handleClickOrScroll);
    document.addEventListener("scroll", handleClickOrScroll);
    document.addEventListener("touchmove", preventTouch, { passive: false });

    if (
      showBookingConfirmOverlay ||
      showDetailsOverlay ||
      showExtendConfirm ||
      showFinalExtendConfirm ||
      showCancelConfirm ||
      showFinishConfirm ||
      showReserveConfirm ||
      showAcceptBookingConfirm ||
      showCallBookingConfirm ||
      showCallActiveBookingConfirm ||
      showRejectBookingReason ||
      showClearConfirm ||
      showEditConfirm ||
      showEditBooking ||
      showEditBalanceDueConfirm ||
      showEditBalanceDueBooking ||
      showBalanceDetailsOverlay ||
      showEditRequestConfirmOverlay ||
      showEditRequest ||
      showEditRequestConfirm ||
      showRemoveUserRequestPaymentConfirm
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
    showBookingConfirmOverlay,
    showDetailsOverlay,
    showExtendConfirm,
    showFinalExtendConfirm,
    showCancelConfirm,
    showFinishConfirm,
    showReserveConfirm,
    showAcceptBookingConfirm,
    showCallBookingConfirm,
    showCallActiveBookingConfirm,
    showRejectBookingReason,
    showClearConfirm,
    showEditConfirm,
    showEditBooking,
    showEditBalanceDueConfirm,
    showEditBalanceDueBooking,
    showBalanceDetailsOverlay,
    showEditRequestConfirmOverlay,
    showEditRequest,
    showEditRequestConfirm,
    showRemoveUserRequestPaymentConfirm,
  ]);

  useEffect(() => {
    fetchAdminBookingRequests();
  }, []);

  useEffect(() => {
    if (!activeBookings) return;

    const now = Date.now();

    const mappedRentals = activeBookings
      .filter((booking) => booking.startTimestamp?.seconds)
      .map((booking) => {
        const {
          firstName,
          middleName,
          surname,
          startTimestamp,
          totalDurationInSeconds = 0,
        } = booking;

        const fullName = `${surname}, ${firstName} ${middleName || ""}`.trim();

        const startTime = startTimestamp.toMillis?.() || startTimestamp || now;

        const GRACE_PERIOD_MS = 30 * 1000; // 30 seconds
        const hasStarted = now >= startTime + GRACE_PERIOD_MS;

        const elapsedSeconds = hasStarted
          ? Math.floor((now - startTime) / 1000)
          : 0;

        const currentTimeLeftInSeconds = hasStarted
          ? Math.max(totalDurationInSeconds - elapsedSeconds, 0)
          : totalDurationInSeconds;

        return {
          ...booking,
          renterName: fullName,
          currentTimeLeftInSeconds,
          startTime,
        };
      });

    setOngoingRentals(mappedRentals);
  }, [activeBookings]);

  // TIME INTERVAL
  useEffect(() => {
    const timerInterval = setInterval(() => {
      const now = new Date();

      setOngoingRentals((prev) =>
        prev.map((rental) => {
          const startTime = rental.startTimestamp?.toDate?.() || new Date();
          const endTime =
            rental.endTimestamp?.toDate?.() ||
            new Date(
              startTime.getTime() + rental.totalDurationInSeconds * 1000,
            );

          const hasStarted = now >= startTime;

          const updatedTime = hasStarted
            ? Math.max(Math.floor((endTime - now) / 1000), 0)
            : rental.totalDurationInSeconds;

          if (updatedTime === 0 && !rental.completed && !rental.markedDone) {
            const completedRental = {
              ...rental,
              timeRemainingOnFinish: 0,
              dateCompleted: now.toISOString(),
            };

            markRentalAsCompleted(completedRental);

            return {
              ...rental,
              currentTimeLeftInSeconds: 0,
              completed: true,
              markedDone: true,
              hasStarted,
            };
          }

          return {
            ...rental,
            currentTimeLeftInSeconds: updatedTime,
            completed: updatedTime === 0 ? true : rental.completed || false,
            hasStarted,
          };
        }),
      );
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

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

  const forceFinishRental = async (rentalId) => {
    const rentalToFinish = ongoingRentals.find((r) => r.id === rentalId);
    if (!rentalToFinish) return;

    const now = new Date();
    const forceFinishedAt = now.toISOString();

    const completedRental = {
      ...rentalToFinish,
      forceFinishedAt,
      timeRemainingOnFinish: rentalToFinish.currentTimeLeftInSeconds,
      dateCompleted: forceFinishedAt,
    };

    return await markRentalAsCompleted(completedRental);
  };

  const handleConfirmBooking = () => {
    const currentUnit = unitData.find((u) => u.id === confirmUnitId);

    const unitForm = formData[confirmUnitId] || {};

    // Check for unit conflict BEFORE processing
    const isUnitInUse = activeBookings.some(
      (booking) => booking.plateNo === currentUnit.plateNo,
    );

    if (isUnitInUse) {
      setHideAnimation(false);
      setShowUnitConflict(true);
      setTimeout(() => {
        setHideAnimation(true);
        setTimeout(() => setShowUnitConflict(false), 400);
      }, 3000);
      return;
    }

    const duration = getRentalDuration(unitForm);

    const rentalDays =
      unitForm.startDate === unitForm.endDate && duration?.diffHours < 24
        ? 0
        : duration?.diffDays || 0;

    const discountedRate = getDiscountedRate(currentUnit, rentalDays);
    const drivingPrice = getDrivingPrice(currentUnit, unitForm.drivingOption);
    const pickupPrice = getPickupPrice(currentUnit, unitForm.pickupOption);

    const extraHourCharge =
      duration?.isFlatRateSameDay || !duration?.extraHours
        ? 0
        : duration.extraHours * currentUnit.extension;

    const billedDays = duration?.isFlatRateSameDay ? 1 : rentalDays;

    const total =
      billedDays * discountedRate +
      billedDays * drivingPrice +
      extraHourCharge +
      pickupPrice;

    // Combine date + time into Firestore Timestamp
    const startDateTimeString = `${unitForm.startDate}T${unitForm.startTime}:00`;
    const userStartTime = new Date(startDateTimeString);
    const startTimestamp = Timestamp.fromDate(
      isNaN(userStartTime.getTime()) ? new Date() : userStartTime,
    );

    const discountType = unitForm.discountType || "peso";
    const discountValue = Number(unitForm.discountValue || 0);
    const rawTotal =
      billedDays * discountedRate +
      billedDays * drivingPrice +
      extraHourCharge +
      pickupPrice;

    let discountAmount = 0;
    if (discountType === "peso") {
      discountAmount = Math.min(discountValue, rawTotal);
    } else if (discountType === "percent") {
      discountAmount = Math.min((discountValue / 100) * rawTotal, rawTotal);
    }

    const discountedTotal = Math.max(0, rawTotal - discountAmount);

    const totalPaid = (localPaymentEntries || []).reduce(
      (sum, entry) => sum + Number(entry.amount || 0),
      0,
    );

    const balanceDue = Math.max(0, discountedTotal - totalPaid);
    const paid = balanceDue === 0;

    const now = new Date();
    const readableTimestamp = `${String(now.getMonth() + 1).padStart(
      2,
      "0",
    )}${String(now.getDate()).padStart(2, "0")}${now.getFullYear()}${String(
      now.getHours(),
    ).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(
      now.getSeconds(),
    ).padStart(2, "0")}`;
    const bookingUid = `${String(confirmUnitId)}_${readableTimestamp}`;

    const bookingData = {
      paymentEntries: localPaymentEntries || [],

      totalPaid,
      balanceDue,
      paid,

      startTimestamp,

      carName: currentUnit.name,

      imageId: currentUnit.imageId,
      plateNo: currentUnit.plateNo,
      carType: currentUnit.carType,
      drivingOption: unitForm.drivingOption || "Self-Drive",

      pickupOption: unitForm.pickupOption || "Pickup",
      ...(unitForm.pickupOption === "Drop-off" && unitForm.dropoffLocation
        ? { dropoffLocation: unitForm.dropoffLocation }
        : {}),
      assignedDriver: unitForm.assignedDriver || "",

      startDate: unitForm.startDate,
      startTime: unitForm.startTime,
      endDate: unitForm.endDate,
      endTime: unitForm.endTime,

      firstName: unitForm.firstName,
      middleName: unitForm.middleName,
      surname: unitForm.surname,
      occupation: unitForm.occupation,
      address: unitForm.address,
      contact: unitForm.contact,
      email: unitForm.email,

      location: unitForm.location,
      purpose: unitForm.purpose,

      referralSource: unitForm.referralSource || "Not Specified",

      additionalMessage: unitForm.additionalMessage || "None",

      // Include discount info
      discountType: unitForm.discountType || "peso",
      discountValue: Number(unitForm.discountValue || 0),

      // Include reservation toggle
      reservation: !!unitForm.reservation,

      // Breakdown of pricing
      discountedRate,
      drivingPrice,
      pickupPrice,
      extraHourCharge,

      totalPrice: discountedTotal,

      billedDays,

      // Duration details
      rentalDuration: {
        days: rentalDays,
        extraHours: duration?.extraHours || 0,
        isFlatRateSameDay: duration?.isFlatRateSameDay || false,
        actualSeconds: duration?.actualSeconds || 0,
      },
      totalDurationInSeconds:
        duration?.actualSeconds ||
        rentalDays * 86400 + (duration?.extraHours || 0) * 3600,

      // Driver’s license image (base64 string or URL from Firebase Storage)
      driverLicense: unitForm.driverLicense || null,

      bookingUid,
    };

    // Save to Firestore
    saveBookingToFirestore(String(confirmUnitId), bookingData, bookingUid);

    // 🟢 Merge new booking into existing paymentEntries first
    triggerAutoFill((prevPaymentEntries) => ({
      ...prevPaymentEntries,
      [bookingUid]: (localPaymentEntries || []).map((entry) => ({
        ...entry,
        carName: currentUnit.name,
        bookingId: bookingUid,
      })),
    }));

    // UI cleanup
    setShowBookingConfirmOverlay(false);
    console.log("Clearing form for unit ID:", clearUnitId); // Debug
    console.log("Confirming booking for unit ID:", confirmUnitId); // Debug
    console.log("CURRENT UNIT:", currentUnit); // Debug
    console.log("BOOKING DATA:", bookingData); // Debug
    console.log("PRICING:", discountedRate); // Debug

    handleClearForm(confirmUnitId);

    setSuccessMessage(`${currentUnit.name} sent to Ongoing Rentals`);
    setShowSuccessBooking(true);

    setSelectedUnitId(null);

    setTimeout(() => {
      setHideAnimation(true);

      setTimeout(() => {
        setShowSuccessBooking(false);
        setHideAnimation(false);
      }, 400);
    }, 5000);
  };

  const toggleExpand = (unitId) => {
    setExpandedUnits((prev) => ({
      ...prev,
      [unitId]: !prev[unitId],
    }));
  };

  const toggleQuotationDetails = (unitId) => {
    setQuotationDetailsVisibility((prev) => ({
      ...prev,
      [unitId]: !prev[unitId],
    }));
  };

  const getDiscountedRate = (unit, rentalDays) => {
    return unit.price;
  };

  const getDrivingPrice = (unit, option) => {
    return option === "With Driver" ? unit.driverRate || 0 : 0;
  };

  const getPickupPrice = (unit, option) => {
    return option === "Drop-off" ? unit.deliveryFee || 0 : 0;
  };

  const getRentalDuration = (unitForm) => {
    const { startDate, startTime, endDate, endTime } = unitForm;
    if (!startDate || !startTime || !endDate || !endTime) return null;

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const diffMs = end - start;

    if (diffMs <= 0) return null;

    const totalHours = diffMs / (1000 * 60 * 60);
    const diffHours = Math.floor(totalHours);
    const diffDays = Math.floor(totalHours / 24);
    const extraHours = Math.ceil(totalHours % 24);
    const isFlatRateSameDay = startDate === endDate && totalHours < 24;

    return {
      diffHours,
      diffDays: isFlatRateSameDay ? 1 : diffDays,
      extraHours: isFlatRateSameDay ? 0 : extraHours,
      actualSeconds: Math.floor(diffMs / 1000),
      isFlatRateSameDay,
      start,
      end,
    };
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
    if (isNaN(date.getTime())) return dateString;
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${month}-${day}-${year} | ${hour12}:${minutes} ${ampm}`;
  };

  const handleInputChange = (unitId, e) => {
    const { name, type, value, files } = e.target;

    const updatedUnitForm = {
      ...formData[unitId],
      [name]: type === "file" ? files[0] : value,
    };

    if (name === "startTime") {
      // Autofill endTime only if it hasn't been edited manually
      if (!formData[unitId]?.hasEditedEndTime) {
        updatedUnitForm.endTime = value;
        console.log(`Auto-updating endTime for unit ${unitId} to:`, value);
      }
    }

    if (name === "endTime") {
      updatedUnitForm.hasEditedEndTime = true;
      if (!formData[unitId]?.startTime) {
        updatedUnitForm.startTime = value;
      }
    }

    // Date validation
    const { startDate, endDate } = updatedUnitForm;
    const isInvalid =
      startDate && endDate && new Date(endDate) < new Date(startDate);

    if (isInvalid) {
      setShowDateWarning(true);
      setIsEndDateInvalid(true);
    } else {
      setIsEndDateInvalid(false);
    }

    console.log(`Updated form data for unit ${unitId}:`, updatedUnitForm);

    setFormData((prev) => ({
      ...prev,
      [unitId]: updatedUnitForm,
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, type, value, files } = e.target;
    const updatedEditForm = {
      ...editFormData,
      [name]: type === "file" ? files[0] : value,
    };
    setEditFormData(updatedEditForm);
  };

  const handleEditRequestInputChange = (e) => {
    const { name, type, value, files } = e.target;
    const updatedEditRequestForm = {
      ...editRequestFormData,
      [name]: type === "file" ? files[0] : value,
    };
    setEditRequestFormData(updatedEditRequestForm);
  };

  const calculateEditRequestPricing = (formData, selectedBooking, unitData) => {
    if (
      !formData.startDate ||
      !formData.startTime ||
      !formData.endDate ||
      !formData.endTime
    ) {
      return null;
    }

    const duration = getRentalDuration(formData);
    if (!duration) return null;

    const rentalDays = duration.diffDays || 1;

    // Get the unit data to access the extension rate
    const currentUnit = unitData.find(
      (unit) => unit.plateNo === selectedBooking.plateNo,
    );
    const extensionRate = currentUnit?.extension || 0;

    const discountedRate = getDiscountedRate(
      { price: selectedBooking.discountedRate },
      rentalDays,
    );
    const drivingPrice = getDrivingPrice(
      { driverRate: selectedBooking.drivingPrice },
      formData.drivingOption,
    );
    const pickupPrice = getPickupPrice(
      { deliveryFee: selectedBooking.pickupPrice },
      formData.pickupOption,
    );
    const extraHourCharge = (duration.extraHours || 0) * extensionRate;

    const rawTotal =
      rentalDays * discountedRate +
      rentalDays * drivingPrice +
      extraHourCharge +
      pickupPrice;
    const discountValue = Number(formData.discountValue || 0);
    const discountType = formData.discountType || "peso";
    let discountAmount = 0;

    if (discountType === "peso") {
      discountAmount = Math.min(discountValue, rawTotal);
    } else if (discountType === "percent") {
      discountAmount = Math.min((discountValue / 100) * rawTotal, rawTotal);
    }

    const discountedTotal = Math.max(0, rawTotal - discountAmount);
    const paymentEntries = formData.paymentEntries || [];
    const totalPaid = paymentEntries.reduce(
      (sum, entry) => sum + Number(entry.amount || 0),
      0,
    );
    const balanceDue = Math.max(0, discountedTotal - totalPaid);

    return {
      rentalDays,
      discountedRate,
      drivingPrice,
      pickupPrice,
      extraHourCharge,
      rawTotal,
      discountAmount,
      discountedTotal,
      totalPaid,
      balanceDue,
      duration,
    };
  };

  // Handle payment input changes
  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setCurrentPayment((prev) => ({ ...prev, [name]: value }));
  };

  // Save or update a payment entry
  const savePaymentEntry = () => {
    if (
      !currentPayment.amount ||
      !currentPayment.mop ||
      !currentPayment.pop ||
      !currentPayment.date
    ) {
      alert(
        "Please fill in all payment fields (Amount, MOP, POP, Date) before saving.",
      );
      return;
    }

    // Editing an existing payment
    if (editingIndex !== null) {
      setLocalPaymentEntries((prev) =>
        prev.map((entry, index) =>
          index === editingIndex ? currentPayment : entry,
        ),
      );

      // 🟡 Call global context for user requests
      if (editRequestFormData?.id) {
        updatePaymentEntry(
          editRequestFormData.id,
          editingIndex,
          currentPayment,
        );
        setPaymentEntries((prev) => ({
          ...prev,
          [editRequestFormData.id]:
            prev[editRequestFormData.id]?.map((entry, index) =>
              index === editingIndex ? { ...entry, ...currentPayment } : entry,
            ) || [],
        }));
      }

      // 🟡 Call global context for active bookings
      if (editFormData?.bookingUid) {
        updatePaymentEntry(
          editFormData.bookingUid,
          editingIndex,
          currentPayment,
        );
        setPaymentEntries((prev) => ({
          ...prev,
          [editFormData.bookingUid]:
            prev[editFormData.bookingUid]?.map((entry, index) =>
              index === editingIndex ? { ...entry, ...currentPayment } : entry,
            ) || [],
        }));
      }

      setEditingIndex(null);
    }
    // Adding new payment
    else {
      setLocalPaymentEntries((prev) => [...prev, currentPayment]);

      // 🟡 Call global context for user requests
      if (editRequestFormData?.id) {
        addPaymentEntry(editRequestFormData.id, currentPayment);
        setPaymentEntries((prev) => ({
          ...prev,
          [editRequestFormData.id]: [
            ...(prev[editRequestFormData.id] || []),
            {
              ...currentPayment,
              carName: editRequestFormData.carName || "",
              bookingId: editRequestFormData.id,
            },
          ],
        }));
      }

      // 🟡 Call global context for active bookings
      if (editFormData?.bookingUid) {
        addPaymentEntry(editFormData.bookingUid, currentPayment);
        setPaymentEntries((prev) => ({
          ...prev,
          [editFormData.bookingUid]: [
            ...(prev[editFormData.bookingUid] || []),
            {
              ...currentPayment,
              carName: editFormData.carName || "",
              bookingId: editFormData.bookingUid,
            },
          ],
        }));
      }
    }

    // Reset input
    setCurrentPayment({ amount: "", mop: "", pop: "", date: "" });
  };

  const localRemovePaymentEntry = (index) => {
    setLocalPaymentEntries((prev) => prev.filter((_, i) => i !== index));

    // 🟡 Call global context for user requests
    if (editRequestFormData?.id) {
      removePaymentEntry(editRequestFormData.id, index);
      setPaymentEntries((prev) => {
        const updated = { ...prev };
        const filtered =
          updated[editRequestFormData.id]?.filter((_, i) => i !== index) || [];
        if (filtered.length === 0) {
          delete updated[editRequestFormData.id]; // Delete key if empty
        } else {
          updated[editRequestFormData.id] = filtered;
        }
        return updated;
      });
    }

    // 🟡 Call global context for active bookings
    if (editFormData?.bookingUid) {
      removePaymentEntry(editFormData.bookingUid, index);
      setPaymentEntries((prev) => {
        const updated = { ...prev };
        const filtered =
          updated[editFormData.bookingUid]?.filter((_, i) => i !== index) || [];
        if (filtered.length === 0) {
          delete updated[editFormData.bookingUid]; // Delete key if empty
        } else {
          updated[editFormData.bookingUid] = filtered;
        }
        return updated;
      });
    }
  };

  // Edit payment entry
  const editPaymentEntry = (index) => {
    setCurrentPayment(localPaymentEntries[index]);
    setEditingIndex(index);
  };

  // Add new payment
  const addNewPayment = () => {
    setCurrentPayment({ amount: "", mop: "", pop: "", date: "" });
    setEditingIndex(null);
  };

  useEffect(() => {
    return () => {
      // When component unmounts, revoke all object URLs
      Object.values(filePreviews).forEach((url) => {
        if (url?.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (showDateWarning) {
      setHideAnimation(false);

      const timer = setTimeout(() => {
        setHideAnimation(true);

        setTimeout(() => {
          setShowDateWarning(false);
        }, 400);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showDateWarning]);

  useEffect(() => {
    if (showTimeWarning) {
      setHideAnimation(false);

      const timer = setTimeout(() => {
        setHideAnimation(true);

        setTimeout(() => setShowTimeWarning(false), 400);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showTimeWarning]);

  useEffect(() => {
    if (showUnitConflict) {
      setHideAnimation(false);

      const timer = setTimeout(() => {
        setHideAnimation(true);

        setTimeout(() => setShowTimeWarning(false), 400);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showUnitConflict]);

  useEffect(() => {
    if (showSuccessBooking) {
      setHideAnimation(false);

      const timer = setTimeout(() => {
        setHideAnimation(true);

        setTimeout(() => setShowTimeWarning(false), 400);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showSuccessBooking]);

  const closeModal = () => {
    setIsImageModalOpen(false);
    setModalImage(null);
  };

  const handleSubmit = (e, unitId) => {
    e.preventDefault();
    const form = e.target.closest("form");

    // Basic built-in form validation
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    const currentForm = formData[unitId];

    // Check if form data exists before accessing driverLicense
    if (!currentForm) {
      console.error("No form data found for unit:", unitId);
      return;
    }

    if (!currentForm.driverLicense) {
      setFileErrors((prev) => ({ ...prev, [unitId]: true }));

      const uploadBox = uploadBoxRefs.current[unitId];
      if (uploadBox) {
        uploadBox.scrollIntoView({ behavior: "smooth", block: "center" });

        // Reset and re-add class to retrigger animation
        uploadBox.classList.remove("highlight-upload-box");
        void uploadBox.offsetWidth; // Force reflow to restart animation
        uploadBox.classList.add("highlight-upload-box");
      }

      return;
    }

    if (
      !currentForm ||
      !currentForm.startDate ||
      !currentForm.startTime ||
      !currentForm.endDate ||
      !currentForm.endTime ||
      !currentForm.firstName ||
      !currentForm.surname ||
      !currentForm.contact ||
      !currentForm.driverLicense
    ) {
      alert("Please complete all required fields before proceeding.");
      return;
    }

    const duration = getRentalDuration(currentForm);

    if (!duration) {
      setShowTimeWarning(true);
      setHideAnimation(false);

      const endTimeInput = endTimeRefs.current[unitId];
      if (endTimeInput) {
        endTimeInput.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedEndTime(unitId);

        // Remove highlight after animation
        setTimeout(() => setHighlightedEndTime(null), 5000);
      }

      return;
    }

    // Set confirm ID and show overlay
    setConfirmUnitId(unitId);
    setShowBookingConfirmOverlay(true);
  };

  const handleClearForm = (unitId) => {
    setFormData((prev) => ({
      ...prev,
      [unitId]: {
        drivingOption: "Self-Drive",
        pickupOption: "Pickup",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        assignedDriver: "",
        dropoffLocation: "",
        location: "",
        purpose: "",
        driverLicense: null,
        firstName: "",
        middleName: "",
        surname: "",
        contact: "",
        email: "",
        occupation: "",
        address: "",
        referralSource: "",
        additionalMessage: "",

        discountType: "peso",
        discountValue: 0,
        reservation: false,
      },
    }));

    setFilePreviews((prev) => ({
      ...prev,
      [unitId]: null,
    }));

    // Reset local payment entries
    setLocalPaymentEntries([]);
    setCurrentPayment({ amount: "", mop: "", pop: "", date: "" });
    setEditingIndex(null);

    // Reset file input manually
    if (fileInputRefs.current[unitId]) {
      fileInputRefs.current[unitId].value = "";
    }
  };

  useEffect(() => {
    const cleanupFns = [];

    unitData.forEach((unit) => {
      const container = scrollRefs.current[unit.id];
      if (!container) return;

      const handleScroll = () => {
        setQuotationDetailsVisibility((prev) => ({
          ...prev,
          [unit.id]: false,
        }));
      };

      container.addEventListener("scroll", handleScroll);
      cleanupFns.push(() =>
        container.removeEventListener("scroll", handleScroll),
      );
    });

    return () => {
      cleanupFns.forEach((cleanup) => cleanup());
    };
  }, [unitData]);

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

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSelectedCustomerName(customer.name);
  };

  const handleCancelEdit = () => {
    setShowCustomerSelectDialog(false);
    setSelectedCustomer(null);
    setSelectedCustomerName("None");
  };

useEffect(() => {
  if (!selectedUnitId) return;

  const filteredUnits = allUnitData.filter(
    (unit) =>
      filterType === "ALL" || unit.carType?.toUpperCase() === filterType,
  );

  // Check if selected unit still exists and matches filterType
  const selectedUnit = filteredUnits.find((u) => u.id === selectedUnitId);
  
  // Only auto-select if:
  // 1. Selected unit no longer exists (deleted), OR
  // 2. Selected unit no longer matches filterType
  if (!selectedUnit && filteredUnits.length > 0) {
    // Pick the first unit that matches filter (can be hidden or not)
    const firstUnit = filteredUnits[0];
    setSelectedUnitId(firstUnit.id);
  }
}, [allUnitData, filterType, selectedUnitId]);


  return (
    <>
      {isImageModalOpen && modalImage && (
        <div className="admin-image-modal-overlay" onClick={closeModal}>
          <img
            src={modalImage}
            alt="Full License"
            className="admin-full-image-view"
          />
        </div>
      )}

      {/* BOOKING FORM RENTAL DETAILS */}
      {showBookingConfirmOverlay && confirmUnitId && (
        <div className="admin-booking-confirm-overlay">
          <div className="admin-booking-confirm-container">
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

            <div className="admin-confirm-details">
              <div className="admin-confirm-scroll-container">
                <div className="admin-confirm-details">
                  {/* Car info to additional message */}
                  {(() => {
                    const currentUnit = unitData.find(
                      (u) => u.id === confirmUnitId,
                    );
                    const unitForm = formData[confirmUnitId] || {};
                    const drivingOption =
                      unitForm.drivingOption || "Self-Drive";
                    const pickupOption = unitForm.pickupOption || "Pickup";

                    return (
                      <>
                        <div className="confirm-row">
                          <strong className="confirm-label">
                            Car Selected:
                          </strong>
                          <span className="confirm-value">
                            {currentUnit.name}
                          </span>
                        </div>

                        <div className="confirm-row">
                          <strong className="confirm-label">Drive Type:</strong>
                          <span className="confirm-value">{drivingOption}</span>
                        </div>

                        {drivingOption === "With Driver" &&
                          unitForm.assignedDriver && (
                            <div className="confirm-row">
                              <strong className="confirm-label">
                                Assigned Driver:
                              </strong>
                              <span className="confirm-value">
                                {unitForm.assignedDriver}
                              </span>
                            </div>
                          )}

                        <div className="confirm-row">
                          <strong className="confirm-label">
                            Drop-off Type:
                          </strong>
                          <span className="confirm-value">{pickupOption}</span>
                        </div>

                        {pickupOption === "Drop-off" &&
                          unitForm.dropoffLocation && (
                            <div className="confirm-row">
                              <strong className="confirm-label">
                                Drop-off Location:
                              </strong>
                              <span className="confirm-value">
                                {unitForm.dropoffLocation}
                              </span>
                            </div>
                          )}

                        <div className="confirm-row">
                          <strong className="confirm-label">
                            Rental Period:
                          </strong>
                          <span className="confirm-value">
                            {formatDateTime(
                              new Date(
                                `${unitForm.startDate}T${unitForm.startTime}`,
                              ),
                            )}{" "}
                            <br /> to <br />
                            {formatDateTime(
                              new Date(
                                `${unitForm.endDate}T${unitForm.endTime}`,
                              ),
                            )}
                          </span>
                        </div>

                        <div className="confirm-row">
                          <strong className="confirm-label">
                            Travel Location:
                          </strong>
                          <span className="confirm-value">
                            {unitForm.location || "Not specified"}
                          </span>
                        </div>

                        <div className="confirm-row">
                          <strong className="confirm-label">Purpose:</strong>
                          <span className="confirm-value">
                            {unitForm.purpose || "Not specified"}
                          </span>
                        </div>

                        <div className="confirm-row">
                          <strong className="confirm-label">
                            Referral Source:
                          </strong>
                          <span className="confirm-value">
                            {unitForm.referralSource || "Not specified"}
                          </span>
                        </div>

                        <div className="confirm-row">
                          <strong className="confirm-label">
                            Additional <br /> Message:
                          </strong>
                          <span className="confirm-value">
                            {unitForm.additionalMessage || "None"}
                          </span>
                        </div>

                        {localPaymentEntries.length > 0 && (
                          <div className="confirm-row">
                            <strong className="confirm-label">Payments:</strong>
                            <span className="confirm-value">
                              {localPaymentEntries.map((entry, index) => (
                                <div key={index}>
                                  <br /> ₱{entry.amount} <br /> {entry.mop} |{" "}
                                  {entry.pop
                                    .toLowerCase()
                                    .split(" ")
                                    .map(
                                      (word) =>
                                        word.charAt(0).toUpperCase() +
                                        word.slice(1),
                                    )
                                    .join(" ")}{" "}
                                  <br /> {formatPaymentDate(entry.date)}
                                </div>
                              ))}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Second section: personal info to summary */}
              <div className="admin-confirm-details">
                {(() => {
                  const currentUnit = unitData.find(
                    (u) => u.id === confirmUnitId,
                  );
                  const unitForm = formData[confirmUnitId] || {};
                  const duration = getRentalDuration(unitForm);
                  const rentalDays = duration?.diffDays || 1;

                  // Use discounted rate instead of fixed price
                  const discountedRate = getDiscountedRate(
                    currentUnit,
                    rentalDays,
                  );
                  const drivingPrice = getDrivingPrice(
                    currentUnit,
                    unitForm.drivingOption,
                  );
                  const pickupPrice = getPickupPrice(
                    currentUnit,
                    unitForm.pickupOption,
                  );

                  const extraHourCharge =
                    (duration?.extraHours || 0) * currentUnit.extension;

                  // Updated total with discounted rate
                  const total =
                    rentalDays * discountedRate +
                    rentalDays * drivingPrice +
                    extraHourCharge +
                    pickupPrice;

                  const discountValue = Number(unitForm.discountValue || 0);
                  const discountType = unitForm.discountType || "peso";

                  const rawTotal =
                    rentalDays * discountedRate +
                    rentalDays * drivingPrice +
                    extraHourCharge +
                    pickupPrice;

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
                    <>
                      <h4 className="confirm-subtitle">PERSONAL INFORMATION</h4>
                      <div className="confirm-row">
                        <strong className="confirm-label">Name:</strong>
                        <span className="confirm-value">
                          {unitForm.firstName} {unitForm.middleName}{" "}
                          {unitForm.surname}
                        </span>
                      </div>

                      <div className="confirm-row">
                        <strong className="confirm-label">Contact:</strong>
                        <span className="confirm-value">
                          {unitForm.contact}
                        </span>
                      </div>

                      <div className="confirm-row">
                        <strong className="confirm-label">Email:</strong>
                        <span className="confirm-value">{unitForm.email}</span>
                      </div>

                      <div className="confirm-row">
                        <strong className="confirm-label">Occupation:</strong>
                        <span className="confirm-value">
                          {unitForm.occupation}
                        </span>
                      </div>

                      <div className="confirm-row">
                        <strong className="confirm-label">
                          Current Address:
                        </strong>
                        <span className="confirm-value">
                          {unitForm.address}
                        </span>
                      </div>

                      <h4 className="confirm-subtitle">DRIVER'S LICENSE</h4>

                      <div className="admin-confirm-image-container">
                        {unitForm.driverLicense ? (
                          <img
                            src={
                              filePreviews[confirmUnitId] ||
                              URL.createObjectURL(unitForm.driverLicense)
                            }
                            alt="Driver's License"
                            className="admin-confirm-id-preview"
                            onClick={() => {
                              const previewUrl =
                                filePreviews[confirmUnitId] ||
                                URL.createObjectURL(unitForm.driverLicense);
                              setModalImage(previewUrl);
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
                                {currentUnit.name}
                              </span>
                              ):
                            </strong>
                            <span className="summary-value">
                              {(() => {
                                const rentalDays = duration?.diffDays || 1;

                                const discountedRate = getDiscountedRate(
                                  currentUnit,
                                  rentalDays,
                                );
                                const total = discountedRate * rentalDays;

                                return `(₱${discountedRate.toLocaleString()} x ${rentalDays} Day${
                                  rentalDays > 1 ? "s" : ""
                                }) ₱${total.toLocaleString()}`;
                              })()}
                            </span>
                          </li>

                          <li>
                            <strong className="summary-label">
                              (
                              <span style={{ color: "#28a745" }}>
                                {unitForm.drivingOption || "Self-Drive"}
                              </span>
                              ):
                            </strong>
                            <span className="summary-value">
                              {drivingPrice === 0 ? (
                                <>₱0</>
                              ) : (
                                <>
                                  (₱{drivingPrice.toLocaleString()} x{" "}
                                  {duration?.diffDays || 1} Day
                                  {duration?.diffDays > 1 ? "s" : ""}) ₱
                                  {(
                                    drivingPrice * (duration?.diffDays || 1)
                                  ).toLocaleString()}
                                </>
                              )}
                            </span>
                          </li>
                          <li>
                            <strong className="summary-label">
                              (
                              <span style={{ color: "#28a745" }}>
                                {unitForm.pickupOption || "Pickup"}
                              </span>
                              ):
                            </strong>
                            <span className="summary-value">
                              ₱{pickupPrice.toLocaleString()}
                            </span>
                          </li>
                          <li>
                            <strong className="summary-label">
                              Rental Duration:
                            </strong>
                            <span className="summary-value">
                              ({duration?.diffDays || 1} Day
                              {duration?.diffDays > 1 ? "s" : ""}
                              {/* SAME DAY and under 24 hrs */}
                              {unitForm.startDate === unitForm.endDate &&
                                duration?.diffHours < 24 && (
                                  <>
                                    {" "}
                                    / for{" "}
                                    <span style={{ color: "#dc3545" }}>
                                      {duration?.diffHours}hr
                                      {duration?.diffHours > 1 ? "s" : ""}
                                    </span>{" "}
                                    only)
                                  </>
                                )}
                              {/* SAME DAY but full 24 hrs */}
                              {unitForm.startDate === unitForm.endDate &&
                                duration?.diffHours >= 24 && <> / 24 hrs)</>}
                              {/* MULTI-DAY booking — show only full-day hours */}
                              {unitForm.startDate !== unitForm.endDate && (
                                <> / {duration.diffDays * 24} hrs)</>
                              )}
                              {/* Flat-rate note only if same-day & no extra hours */}
                              {duration?.diffDays === 1 &&
                                duration?.extraHours === 0 &&
                                unitForm.startDate === unitForm.endDate && (
                                  <>
                                    <br />
                                    <span
                                      style={{
                                        color: "#dc3545",
                                        lineHeight: "1",
                                      }}
                                    >
                                      (Flat rate applies
                                      <br />
                                      for same-day rental)
                                    </span>
                                  </>
                                )}
                              {/* Extra hour charge, if applicable */}
                              {duration?.extraHours > 0 && (
                                <>
                                  <br />(
                                  <span style={{ color: "#dc3545" }}>
                                    +{duration.extraHours} hr
                                    {duration.extraHours > 1 ? "s" : ""} | ₱
                                    {(
                                      duration.extraHours *
                                      currentUnit.extension
                                    ).toLocaleString()}
                                  </span>
                                  )
                                </>
                              )}
                            </span>
                          </li>

                          {(() => {
                            const discountValue = Number(
                              unitForm.discountValue || 0,
                            );
                            const discountType =
                              unitForm.discountType || "peso";

                            if (discountValue > 0) {
                              return (
                                <li>
                                  <strong className="summary-label">
                                    Discount:
                                  </strong>
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

                          {localPaymentEntries.map((entry, index) => {
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
                          })}
                        </div>

                        <li className="confirm-total-price">
                          <strong className="summary-label">
                            Total Price:
                          </strong>
                          <span className="summary-value">
                            ₱{discountedTotal.toLocaleString()}
                          </span>
                        </li>

                        {(() => {
                          const totalPaid = (localPaymentEntries || []).reduce(
                            (sum, entry) => sum + Number(entry.amount || 0),
                            0,
                          );

                          const balanceDue = Math.max(
                            0,
                            discountedTotal - totalPaid,
                          );

                          return (
                            <>
                              <li>
                                <strong className="summary-label">
                                  Total Paid:
                                </strong>
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
                                      balanceDue === 0 ? "#28a745" : "#ffb347",
                                  }}
                                >
                                  Balance Due:
                                </strong>
                                <span
                                  className="summary-value"
                                  style={{
                                    color:
                                      balanceDue === 0 ? "#28a745" : "#dc3545",
                                  }}
                                >
                                  ₱{balanceDue.toLocaleString()}
                                </span>
                              </li>
                            </>
                          );
                        })()}
                      </ul>
                    </>
                  );
                })()}
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
        </div>
      )}

      {/* ACTIVE RENTAL DETAILS */}
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
                        {selectedBooking.paymentEntries
                          .filter((entry) => entry)
                          .map((entry, index) => (
                            <div key={index} style={{ marginBottom: "0.5rem" }}>
                              <br />₱{Number(entry.amount).toLocaleString()}{" "}
                              <br />
                              {entry.mop} |{" "}
                              {entry.pop
                                .toLowerCase()
                                .split(" ")
                                .map(
                                  (word) =>
                                    word.charAt(0).toUpperCase() +
                                    word.slice(1),
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
                              color: balanceDue === 0 ? "#28a745" : "#ffb347",
                            }}
                          >
                            Balance Due:
                          </strong>
                          <span
                            className="summary-value"
                            style={{
                              color: balanceDue === 0 ? "#28a745" : "#dc3545",
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

      {/* BALACNCE DUE DETAILS */}
      {showBalanceDetailsOverlay && selectedBooking && (
        <div className="admin-booking-confirm-overlay">
          <div className="admin-booking-confirm-container">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowBalanceDetailsOverlay(false)}
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
                              color: balanceDue === 0 ? "#28a745" : "#ffb347",
                            }}
                          >
                            Balance Due:
                          </strong>
                          <span
                            className="summary-value"
                            style={{
                              color: balanceDue === 0 ? "#28a745" : "#dc3545",
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
                  onClick={() => setShowBalanceDetailsOverlay(false)}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE BOOKING */}
      {showExtendConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Extend Rental Duration?</h3>
            <p>Choose how much time to extend this rental.</p>

            <div className="extend-input-group">
              {/* Counter Input */}
              <div className="counter-input">
                <button
                  onClick={() => setExtendValue((v) => Math.max(v - 1, 1))}
                >
                  −
                </button>
                <input
                  type="number"
                  value={extendValue}
                  min={1}
                  onChange={(e) =>
                    setExtendValue(Math.max(1, Number(e.target.value)))
                  }
                />
                <button onClick={() => setExtendValue((v) => v + 1)}>+</button>
              </div>

              {/* Combo Select */}
              <select
                className="extend-unit-select"
                value={extendUnit}
                onChange={(e) => setExtendUnit(e.target.value)}
              >
                <option value="Months">Months</option>
                <option value="Days">Days</option>
                <option value="Hours">Hours</option>
              </select>
            </div>

            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  setShowExtendConfirm(false);
                  setShowFinalExtendConfirm(true); // Show next modal
                }}
              >
                Yes, Extend
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowExtendConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showFinalExtendConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Confirm Extension</h3>
            <p>
              Are you sure you want to extend this rental by{" "}
              <strong style={{ color: "#dc3545" }}>
                {extendValue}{" "}
                {extendValue === 1
                  ? extendUnit.slice(0, -1) // Remove trailing 's' (e.g., "Hours" → "Hour")
                  : extendUnit}
              </strong>
              ?
            </p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={async () => {
                  setProcessingBooking({
                    isProcessing: true,
                    message: "Extending Rental...",
                    textClass: "submitting-text",
                  });

                  try {
                    const secondsMap = {
                      Months: 30 * 24 * 60 * 60,
                      Days: 24 * 60 * 60,
                      Hours: 60 * 60,
                      Minutes: 60,
                    };

                    const addedSeconds = extendValue * secondsMap[extendUnit];
                    const newDuration = await extendRentalDuration(
                      extendRentalId,
                      addedSeconds,
                    );

                    setOngoingRentals((prev) =>
                      prev.map((rental) =>
                        rental.id === extendRentalId
                          ? { ...rental, totalDurationInSeconds: newDuration }
                          : rental,
                      ),
                    );

                    setActionOverlay({
                      isVisible: true,
                      type: "success",
                      message: "Rental extended successfully!",
                    });

                    setTimeout(() => {
                      setHideCancelAnimation(true);
                      setTimeout(() => {
                        setActionOverlay((prev) => ({
                          ...prev,
                          isVisible: false,
                        }));
                        setHideCancelAnimation(false);
                      }, 400);
                    }, 5000);
                  } catch (error) {
                    setActionOverlay({
                      isVisible: true,
                      type: "error",
                      message: "Failed to extend rental.",
                    });

                    setTimeout(() => {
                      setHideCancelAnimation(true);
                      setTimeout(() => {
                        setActionOverlay((prev) => ({
                          ...prev,
                          isVisible: false,
                        }));
                        setHideCancelAnimation(false);
                      }, 400);
                    }, 5000);
                  } finally {
                    setProcessingBooking({
                      isProcessing: false,
                      message: "",
                      textClass: "submitting-text",
                    });

                    setShowFinalExtendConfirm(false);
                  }
                }}
              >
                Confirm
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowFinalExtendConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Are you sure you want to cancel this rental?</h3>
            <p>This action cannot be undone once confirmed.</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={async () => {
                  setShowCancelConfirm(false);

                  setProcessingBooking({
                    isProcessing: true,
                    message: "Cancelling Rental...",
                    textClass: "submitting-text-red",
                  });

                  try {
                    await cancelRental(cancelRentalId);

                    triggerCancelFill(cancelRentalId);

                    console.log(
                      "🗑️ Removed payment entries for:",
                      cancelRentalId,
                    );

                    setProcessingBooking({
                      isProcessing: false,
                      message: "",
                      textClass: "submitting-text-red",
                    });

                    setHideCancelAnimation(false);
                    setActionOverlay({
                      isVisible: true,
                      message: "Rental has been cancelled!",
                      type: "warning",
                    });

                    setTimeout(() => {
                      setHideCancelAnimation(true);
                      setTimeout(
                        () =>
                          setActionOverlay((prev) => ({
                            ...prev,
                            isVisible: false,
                          })),
                        400,
                      );
                    }, 5000);
                  } catch (err) {
                    setProcessingBooking({
                      isProcessing: false,
                      message: "",
                      textClass: "submitting-text-red",
                    });

                    setHideCancelAnimation(false);
                    setActionOverlay({
                      isVisible: true,
                      message: "Failed to cancel rental. Please try again.",
                      type: "warning",
                    });

                    setTimeout(() => {
                      setHideCancelAnimation(true);
                      setTimeout(
                        () =>
                          setActionOverlay((prev) => ({
                            ...prev,
                            isVisible: false,
                          })),
                        400,
                      );
                    }, 5000);
                  }
                }}
              >
                Yes, Cancel
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowCancelConfirm(false)}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {showFinishConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Are you sure you want to finish this rental?</h3>
            <p>
              This will mark the unit as completed and restore it to
              availability.
            </p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={async () => {
                  setShowFinishConfirm(false);

                  setProcessingBooking({
                    isProcessing: true,
                    message: "Finishing Rental...",
                    textClass: "submitting-text",
                  });

                  try {
                    await forceFinishRental(finishRentalId);

                    setProcessingBooking({
                      isProcessing: false,
                      message: "",
                      textClass: "submitting-text",
                    });

                    setHideCancelAnimation(false);
                    setActionOverlay({
                      isVisible: true,
                      message: "Rental Finished Successfully!",
                      type: "success",
                    });

                    setTimeout(() => {
                      setHideCancelAnimation(true);
                      setTimeout(
                        () =>
                          setActionOverlay({
                            ...actionOverlay,
                            isVisible: false,
                          }),
                        400,
                      );
                    }, 5000);
                  } catch (err) {
                    console.error("❌ Failed to finish rental:", err);

                    setProcessingBooking({
                      isProcessing: false,
                      message: "",
                      textClass: "submitting-text",
                    });

                    setHideCancelAnimation(false);
                    setActionOverlay({
                      isVisible: true,
                      message: "Failed to Finish Rental!",
                      type: "warning",
                    });

                    setTimeout(() => {
                      setHideCancelAnimation(true);
                      setTimeout(
                        () =>
                          setActionOverlay({
                            ...actionOverlay,
                            isVisible: false,
                          }),
                        400,
                      );
                    }, 5000);
                  }
                }}
              >
                Yes, Finish
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowFinishConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showReserveConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Reserve this unit again?</h3>
            <p>This will re-initiate a rental request for this unit.</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={async () => {
                  setShowReserveConfirm(false);

                  setProcessingBooking({
                    isProcessing: true,
                    message: "Reserving Unit...",
                    textClass: "submitting-text",
                  });

                  try {
                    await reserveUnit(reserveUnitId);

                    setProcessingBooking({
                      isProcessing: false,
                      message: "",
                      textClass: "submitting-text",
                    });

                    setHideCancelAnimation(false);
                    setActionOverlay({
                      isVisible: true,
                      message: "Unit Reserved Successfully!",
                      type: "success",
                    });

                    setTimeout(() => {
                      setHideCancelAnimation(true);
                      setTimeout(
                        () =>
                          setActionOverlay({
                            ...actionOverlay,
                            isVisible: false,
                          }),
                        400,
                      );
                    }, 5000);
                  } catch (err) {
                    console.error("❌ Failed to reserve unit:", err);

                    setProcessingBooking({
                      isProcessing: false,
                      message: "",
                      textClass: "submitting-text",
                    });

                    setHideCancelAnimation(false);
                    setActionOverlay({
                      isVisible: true,
                      message: "Failed to Reserve Unit!",
                      type: "warning",
                    });

                    setTimeout(() => {
                      setHideCancelAnimation(true);
                      setTimeout(
                        () =>
                          setActionOverlay({
                            ...actionOverlay,
                            isVisible: false,
                          }),
                        400,
                      );
                    }, 5000);
                  }
                }}
              >
                Yes, Reserve
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowReserveConfirm(false)}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {showCallBookingConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Call this renter now?</h3>
            <p>This will prompt an immediate phone call to the renter.</p>
            <div className="renter-info">
              <p>
                <strong>Name:</strong> {selectedBooking.surname},{" "}
                {selectedBooking.firstName} {selectedBooking.middleName}
              </p>
              <p>
                <strong>Contact:</strong> {selectedBooking.contact}
              </p>
              <p>
                <strong>Car:</strong> {selectedBooking.carName}
              </p>
            </div>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  console.log(
                    "📞 Initiating call to:",
                    selectedBooking?.contact,
                  );

                  window.location.href = `tel:${
                    selectedBooking?.contact || "09XXXXXXXXX"
                  }`;
                  setShowCallBookingConfirm(false);
                }}
              >
                Call Now
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowCallBookingConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCallActiveBookingConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Call this renter now?</h3>
            <p>This will prompt an immediate phone call to the renter.</p>

            <div className="renter-info">
              <p>
                <strong>Name:</strong> {selectedBooking.surname},{" "}
                {selectedBooking.firstName} {selectedBooking.middleName}
              </p>
              <p>
                <strong>Contact:</strong> {selectedBooking.contact}
              </p>
              <p>
                <strong>Car:</strong> {selectedBooking.carName}
              </p>
            </div>

            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  console.log(
                    "📞 ACTIVE BOOKING CALL to:",
                    selectedBooking?.contact,
                  );

                  window.location.href = `tel:${
                    selectedBooking?.contact || "09XXXXXXXXX"
                  }`;
                  setShowCallActiveBookingConfirm(false);
                }}
              >
                Call Now
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowCallActiveBookingConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING FORM */}
      {showRemovePaymentEntryConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Are you sure you want to remove this payment entry?</h3>
            <p>This action cannot be undone once confirmed.</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={async () => {
                  setShowRemovePaymentEntryConfirm(false);

                  setProcessingBooking({
                    isProcessing: true,
                    message: "Removing payment entry...",
                    textClass: "submitting-text-red",
                  });

                  try {
                    localRemovePaymentEntry(removePaymentEntryIndex);

                    if (editingIndex === removePaymentEntryIndex) {
                      setEditingIndex(null);
                      setCurrentPayment({
                        amount: "",
                        mop: "",
                        pop: "",
                        date: "",
                      });
                    }

                    setHideCancelAnimation(false);
                    setActionOverlay({
                      isVisible: true,
                      message: "Payment entry removed!",
                      type: "warning",
                    });

                    setTimeout(() => {
                      setHideCancelAnimation(true);
                      setTimeout(() => {
                        setActionOverlay((prev) => ({
                          ...prev,
                          isVisible: false,
                        }));
                        setHideCancelAnimation(false);
                      }, 400);
                    }, 5000);
                  } catch (err) {
                    console.error("Failed to remove payment entry:", err);

                    setHideCancelAnimation(false);
                    setActionOverlay({
                      isVisible: true,
                      message:
                        "Failed to remove payment entry. Please try again.",
                      type: "warning",
                    });

                    setTimeout(() => {
                      setHideCancelAnimation(true);
                      setTimeout(() => {
                        setActionOverlay((prev) => ({
                          ...prev,
                          isVisible: false,
                        }));
                        setHideCancelAnimation(false);
                      }, 400);
                    }, 5000);
                  } finally {
                    setProcessingBooking({
                      isProcessing: false,
                      message: "",
                      textClass: "submitting-text",
                    });
                    setRemovePaymentEntryIndex(null);
                  }
                }}
              >
                Yes, Remove
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => {
                  setShowRemovePaymentEntryConfirm(false);
                  setRemovePaymentEntryIndex(null);
                }}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Are you sure you want to clear all fields?</h3>
            <p>This will reset all input fields for this booking unit.</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  handleClearForm(clearUnitId);
                  setShowClearConfirm(false);
                }}
              >
                Yes, Clear
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER REQUEST */}
      {showEditRequestConfirmOverlay && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Edit this rental request?</h3>
            <p>This will allow you to modify the rental request details.</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  setShowEditRequest(true);
                  setShowEditRequestConfirmOverlay(false); // Proceed next overlay
                }}
              >
                Yes, Edit
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowEditRequestConfirmOverlay(false)}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditRequest && (
        <div className="admin-booking-confirm-overlay">
          <div className="admin-booking-confirm-container">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowEditRequest(false)}
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

            <h3 className="confirm-header">EDIT RENTAL REQUEST</h3>
            <p className="confirm-text">
              You can modify the rental request details here.
            </p>

            <div className="select-container">
              <div className="payment-section">
                <h4 className="payment-label">Payment Details</h4>

                {editRequestFormData?.paymentEntries?.length > 0 && (
                  <div className="payment-table-container">
                    <table className="payment-table">
                      <thead>
                        <tr>
                          <th>AMOUNT</th>
                          <th>MOP</th>
                          <th>POP</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editRequestFormData.paymentEntries.map(
                          (entry, index) => (
                            <tr
                              key={index}
                              className={
                                editingIndex === index ? "editing-row" : ""
                              }
                            >
                              <td>₱{entry.amount}</td>
                              <td>{entry.mop}</td>
                              <td>{entry.pop}</td>
                              <td>{formatPaymentDate(entry.date)}</td>
                              <td>
                                <div className="payment-buttons-group">
                                  <button
                                    type="button"
                                    className="edit-payment-btn"
                                    onClick={() => {
                                      setCurrentPayment(entry);
                                      setEditingIndex(index);
                                    }}
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="remove-payment-btn"
                                    onClick={() => {
                                      setRemovePaymentIndex(index);
                                      setShowRemoveUserRequestPaymentConfirm(
                                        true,
                                      );
                                    }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="payment-labels">
                  <span>AMOUNT</span>
                  <span>MOP</span>
                  <span>POP</span>
                  <span>Date</span>
                </div>

                <div className="scrollable-selects">
                  <input
                    type="number"
                    name="amount"
                    value={currentPayment.amount}
                    onChange={handlePaymentChange}
                    placeholder="Enter Amount"
                    min="0"
                  />

                  <select
                    name="mop"
                    value={currentPayment.mop}
                    onChange={handlePaymentChange}
                  >
                    <option value="">Select MOP</option>
                    {mopTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <select
                    name="pop"
                    value={currentPayment.pop}
                    onChange={handlePaymentChange}
                  >
                    <option value="">Select POP</option>
                    {popTypesRevenue.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <input
                    type="datetime-local"
                    name="date"
                    value={currentPayment.date}
                    onChange={handlePaymentChange}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      !currentPayment.amount ||
                      !currentPayment.mop ||
                      !currentPayment.pop ||
                      !currentPayment.date
                    ) {
                      alert(
                        "Please fill in all payment fields (Amount, MOP, POP, Date) before saving.",
                      );
                      return;
                    }

                    if (editingIndex !== null) {
                      setEditRequestFormData((prev) => ({
                        ...prev,
                        paymentEntries: prev.paymentEntries.map(
                          (entry, index) =>
                            index === editingIndex ? currentPayment : entry,
                        ),
                      }));
                      setEditingIndex(null);
                    } else {
                      setEditRequestFormData((prev) => ({
                        ...prev,
                        paymentEntries: [
                          ...(prev.paymentEntries || []),
                          currentPayment,
                        ],
                      }));
                    }
                    setCurrentPayment({
                      amount: "",
                      mop: "",
                      pop: "",
                      date: "",
                    });
                  }}
                  className="save-payment-btn"
                >
                  {editingIndex !== null ? "Update Payment" : "Save Payment"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPayment({
                      amount: "",
                      mop: "",
                      pop: "",
                      date: "",
                    });
                    setEditingIndex(null);
                  }}
                  className="add-new-payment-btn"
                >
                  Reset Input
                </button>
              </div>

              <div className="contact-occupation-section">
                <h4>Discounts (Not Required)</h4>

                <div className="discount-fields">
                  <div className="discount-input-group-vertical">
                    <div className="discount-row">
                      <select
                        name="discountType"
                        value={editRequestFormData.discountType || "peso"}
                        onChange={(e) =>
                          setEditRequestFormData((prev) => ({
                            ...prev,
                            discountType: e.target.value,
                          }))
                        }
                        className="percentage-toggle-select"
                      >
                        <option value="peso">₱</option>
                        <option value="percent">%</option>
                      </select>

                      <input
                        type="number"
                        name="discountValue"
                        className="discount-value-input"
                        min={0}
                        value={editRequestFormData.discountValue ?? 0}
                        onChange={(e) => {
                          let value = Number(e.target.value);
                          if (isNaN(value)) value = 0;
                          setEditRequestFormData((prev) => ({
                            ...prev,
                            discountValue: value,
                          }));
                        }}
                      />
                    </div>

                    <div className="discount-divider-row">
                      <div className="discount-buttons">
                        {[10, 100, 1000].map((amount) => (
                          <button
                            key={`minus-${amount}`}
                            type="button"
                            className="discount-btn"
                            onClick={() => {
                              const current = Math.max(
                                0,
                                Number(editRequestFormData.discountValue || 0) -
                                  amount,
                              );
                              setEditRequestFormData((prev) => ({
                                ...prev,
                                discountValue: current,
                              }));
                            }}
                          >
                            -{amount}
                          </button>
                        ))}
                      </div>

                      <span className="discount-divider">||</span>

                      <div className="discount-buttons">
                        {[10, 100, 1000].map((amount) => (
                          <button
                            key={`plus-${amount}`}
                            type="button"
                            className="discount-btn"
                            onClick={() => {
                              const current =
                                Number(editRequestFormData.discountValue || 0) +
                                amount;
                              setEditRequestFormData((prev) => ({
                                ...prev,
                                discountValue: current,
                              }));
                            }}
                          >
                            +{amount}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <h4 className="confirm-subtitle">QUOTATION SUMMARY</h4>
              <ul className="admin-confirm-summary-list">
                {(() => {
                  const pricing = calculateEditRequestPricing(
                    editRequestFormData,
                    selectedBooking,
                    unitData,
                  );
                  if (!pricing) {
                    return (
                      <li style={{ color: "red" }}>
                        Please fill in all date/time fields to see pricing
                      </li>
                    );
                  }

                  return (
                    <>
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
                            (₱{pricing.discountedRate.toLocaleString()} x{" "}
                            {pricing.rentalDays} Day
                            {pricing.rentalDays > 1 ? "s" : ""}) ₱
                            {(
                              pricing.discountedRate * pricing.rentalDays
                            ).toLocaleString()}
                          </span>
                        </li>
                        <li>
                          <strong className="summary-label">
                            (
                            <span style={{ color: "#28a745" }}>
                              {editRequestFormData.drivingOption ||
                                selectedBooking.drivingOption}
                            </span>
                            ):
                          </strong>
                          <span className="summary-value">
                            {pricing.drivingPrice > 0 ? (
                              <>
                                (₱{pricing.drivingPrice.toLocaleString()} x{" "}
                                {pricing.rentalDays} Day
                                {pricing.rentalDays > 1 ? "s" : ""}) ₱
                                {(
                                  pricing.drivingPrice * pricing.rentalDays
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
                              {editRequestFormData.pickupOption ||
                                selectedBooking.pickupOption}
                            </span>
                            ):
                          </strong>
                          <span className="summary-value">
                            ₱{pricing.pickupPrice.toLocaleString()}
                          </span>
                        </li>
                        <li>
                          <strong className="summary-label">
                            Rental Duration:
                          </strong>
                          <span className="summary-value">
                            ({pricing.rentalDays} Day
                            {pricing.rentalDays > 1 ? "s" : ""} /{" "}
                            {pricing.duration.isFlatRateSameDay ? (
                              <>
                                for{" "}
                                <span style={{ color: "#dc3545" }}>
                                  {Math.floor(
                                    pricing.duration.actualSeconds / 3600,
                                  )}
                                  hr
                                  {Math.floor(
                                    pricing.duration.actualSeconds / 3600,
                                  ) > 1
                                    ? "s"
                                    : ""}
                                </span>{" "}
                                only
                              </>
                            ) : (
                              `${24 * pricing.rentalDays} hrs`
                            )}
                            )
                            <br />
                            {pricing.duration.extraHours > 0 && (
                              <>
                                (
                                <span style={{ color: "#dc3545" }}>
                                  +{pricing.duration.extraHours} hr
                                  {pricing.duration.extraHours > 1 ? "s" : ""} |
                                  ₱{pricing.extraHourCharge.toLocaleString()}
                                </span>
                                )
                              </>
                            )}
                          </span>
                        </li>
                        {pricing.discountAmount > 0 && (
                          <li>
                            <strong className="summary-label">Discount:</strong>
                            <span
                              className="summary-value"
                              style={{ color: "#dc3545" }}
                            >
                              {editRequestFormData.discountType === "peso"
                                ? `- ₱${editRequestFormData.discountValue.toLocaleString()}`
                                : `- ${editRequestFormData.discountValue}%`}
                            </span>
                          </li>
                        )}
                        {(editRequestFormData.paymentEntries || []).map(
                          (entry, index) => (
                            <li key={index}>
                              <strong className="summary-label">
                                {formatPaymentDate(entry.date)} <br />
                                {entry.mop} |{" "}
                                {entry.pop
                                  ? entry.pop
                                      .toLowerCase()
                                      .split(" ")
                                      .map(
                                        (w) =>
                                          w.charAt(0).toUpperCase() +
                                          w.slice(1),
                                      )
                                      .join(" ")
                                  : ""}
                              </strong>
                              <span
                                className="summary-value"
                                style={{ color: "#dc3545" }}
                              >
                                - ₱{Number(entry.amount).toLocaleString()}
                              </span>
                            </li>
                          ),
                        )}
                      </div>
                      <li className="confirm-total-price">
                        <strong className="summary-label">Total Price:</strong>
                        <span className="summary-value">
                          ₱{pricing.discountedTotal.toLocaleString()}
                        </span>
                      </li>
                      <li>
                        <strong className="summary-label">Total Paid:</strong>
                        <span
                          className="summary-value"
                          style={{ color: "#dc3545" }}
                        >
                          - ₱{pricing.totalPaid.toLocaleString()}
                        </span>
                      </li>
                      <li className="confirm-total-price">
                        <strong
                          className="summary-label"
                          style={{
                            color:
                              pricing.balanceDue === 0 ? "#28a745" : "#ffb347",
                          }}
                        >
                          Balance Due:
                        </strong>
                        <span
                          className="summary-value"
                          style={{
                            color:
                              pricing.balanceDue === 0 ? "#28a745" : "#dc3545",
                          }}
                        >
                          ₱{pricing.balanceDue.toLocaleString()}
                        </span>
                      </li>
                    </>
                  );
                })()}
              </ul>

              <div className="select-row">
                <div className="select-box">
                  <label>Driving Option</label>
                  <select
                    name="drivingOption"
                    value={editRequestFormData?.drivingOption || "Self-Drive"}
                    onChange={handleEditRequestInputChange}
                    required
                  >
                    <option value="Self-Drive">Self Drive</option>
                    <option value="With Driver">With Driver</option>
                  </select>
                </div>

                <div className="select-box">
                  <label>Pickup / Drop-off</label>
                  <select
                    name="pickupOption"
                    value={editRequestFormData?.pickupOption || "Pickup"}
                    onChange={handleEditRequestInputChange}
                    required
                  >
                    <option value="Pickup">Pickup</option>
                    <option value="Drop-off">Drop-off</option>
                  </select>
                </div>
              </div>

              {editRequestFormData?.drivingOption === "With Driver" && (
                <div className="select-row">
                  <div className="select-box">
                    <label>Assigned Driver</label>
                    <input
                      type="text"
                      name="assignedDriver"
                      value={editRequestFormData?.assignedDriver || ""}
                      onChange={handleEditRequestInputChange}
                      className="default-text-input"
                      placeholder="Enter assigned driver"
                    />
                  </div>
                </div>
              )}

              {editRequestFormData?.pickupOption === "Drop-off" && (
                <div className="select-row">
                  <div className="select-box">
                    <label>Drop-off Location</label>
                    <input
                      type="text"
                      name="dropoffLocation"
                      value={editRequestFormData?.dropoffLocation || ""}
                      onChange={handleEditRequestInputChange}
                      className="default-text-input"
                      placeholder="Enter drop-off location"
                    />
                  </div>
                </div>
              )}

              <div className="select-row">
                <div className="select-box">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={editRequestFormData?.startDate || ""}
                    onChange={handleEditRequestInputChange}
                    required
                  />
                </div>

                <div className="select-box">
                  <label>Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    value={editRequestFormData?.startTime || ""}
                    onChange={handleEditRequestInputChange}
                    required
                  />
                </div>
              </div>

              <div className="select-row">
                <div className="select-box">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={editRequestFormData?.endDate || ""}
                    onChange={handleEditRequestInputChange}
                    required
                  />
                </div>

                <div className="select-box">
                  <label>End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    value={editRequestFormData?.endTime || ""}
                    onChange={handleEditRequestInputChange}
                    required
                  />
                </div>
              </div>

              <div className="select-row">
                <div className="select-box">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={editRequestFormData?.location || ""}
                    onChange={(e) =>
                      setEditRequestFormData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    className="default-text-input"
                    placeholder="Enter location"
                    required
                  />
                </div>
              </div>

              <div className="select-row">
                <div className="select-box">
                  <label>Purpose</label>
                  <input
                    type="text"
                    name="purpose"
                    value={editRequestFormData?.purpose || ""}
                    onChange={(e) =>
                      setEditRequestFormData((prev) => ({
                        ...prev,
                        purpose: e.target.value,
                      }))
                    }
                    className="default-text-input"
                    placeholder="Enter purpose"
                    required
                  />
                </div>
              </div>

              <div className="upload-box-wrapper">
                <div className="upload-box">
                  <label style={{ marginTop: "20px" }}>
                    Upload Driver's License
                  </label>
                  {filePreviews.edit && (
                    <img
                      src={filePreviews.edit}
                      alt="Driver's License"
                      className="license-preview"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setModalImage(filePreviews.edit);
                        setIsImageModalOpen(true);
                      }}
                    />
                  )}
                  <label htmlFor="edit-license-upload" className="upload-label">
                    {editRequestFormData?.driverLicense
                      ? "Change Driver's License"
                      : "Upload Driver's License"}
                  </label>
                  <input
                    type="file"
                    id="edit-license-upload"
                    name="driverLicense"
                    accept="image/*"
                    className="hidden-file-input"
                    onChange={async (e) => {
                      const { name, value, files } = e.target;
                      const file = files[0];

                      if (file) {
                        try {
                          // Use the compressAndConvertFileToBase64 function from UserContext
                          const compressedBase64 =
                            await compressAndConvertFileToBase64(file);
                          setFilePreviews((prev) => ({
                            ...prev,
                            edit: compressedBase64,
                          }));
                          // Update the form data with the new base64 image
                          setEditRequestFormData((prev) => ({
                            ...prev,
                            driverLicense: compressedBase64,
                          }));
                        } catch (error) {
                          console.error("Error compressing image:", error);
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="personal-info-section">
                <h4>Personal Information</h4>
                <div className="personal-info-fields">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    className="personal-info-input"
                    value={editRequestFormData?.firstName || ""}
                    onChange={handleEditRequestInputChange}
                    required
                  />
                  <input
                    type="text"
                    name="middleName"
                    placeholder="Middle Name (N/A if none)"
                    className="personal-info-input"
                    value={editRequestFormData?.middleName || ""}
                    onChange={handleEditRequestInputChange}
                    required
                  />
                  <input
                    type="text"
                    name="surname"
                    placeholder="Surname"
                    className="personal-info-input"
                    value={editRequestFormData?.surname || ""}
                    onChange={handleEditRequestInputChange}
                    required
                  />

                  <input
                    type="text"
                    name="address"
                    placeholder="Current Address"
                    className="personal-info-input"
                    value={editRequestFormData?.address || ""}
                    onChange={handleEditRequestInputChange}
                    required
                  />
                </div>
              </div>

              <div className="contact-occupation-section">
                <h4>Contact & Occupation</h4>
                <div className="contact-occupation-fields">
                  <input
                    type="tel"
                    name="contact"
                    placeholder="Contact No."
                    className="personal-info-input"
                    value={editRequestFormData?.contact || ""}
                    onChange={handleEditRequestInputChange}
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="personal-info-input"
                    value={editRequestFormData?.email || ""}
                    onChange={handleEditRequestInputChange}
                    required
                  />
                  <input
                    type="text"
                    name="occupation"
                    placeholder="Occupation"
                    className="personal-info-input"
                    value={editRequestFormData?.occupation || ""}
                    onChange={handleEditRequestInputChange}
                    required
                  />
                </div>
              </div>

              <div className="message-section">
                <h4 className="message-label">Referral Source (Optional)</h4>

                <select
                  name="referralSource"
                  className="referral-info"
                  value={formData.referralSource || ""}
                  onChange={handleEditRequestInputChange}
                >
                  {referralSources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>

              <div className="message-section">
                <h4 className="message-label">Additional Message</h4>
                <textarea
                  name="additionalMessage"
                  placeholder="Enter any additional message..."
                  className="message-input"
                  value={editRequestFormData?.additionalMessage || ""}
                  onChange={handleEditRequestInputChange}
                />
              </div>
            </div>

            <div className="rental-actions-container">
              <button
                className="rental-actions start-rental"
                onClick={() => setShowEditRequestConfirm(true)}
              >
                Save Changes
              </button>

              <button
                type="button"
                className="rental-actions clear-all"
                onClick={() => setShowEditRequest(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRemoveUserRequestPaymentConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Remove this payment entry?</h3>
            <p>This action cannot be undone once confirmed.</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  // Create new payment entries array without the item at removePaymentIndex
                  const updatedPaymentEntries = (
                    editRequestFormData.paymentEntries || []
                  ).filter((_, i) => i !== removePaymentIndex);

                  // Update the editRequestFormData state with the new array
                  setEditRequestFormData((prev) => ({
                    ...prev,
                    paymentEntries: updatedPaymentEntries,
                  }));

                  // Reset editing state if the removed entry was being edited
                  if (editingIndex === removePaymentIndex) {
                    setEditingIndex(null);
                    setCurrentPayment({
                      amount: "",
                      mop: "",
                      pop: "",
                      date: "",
                    });
                  }

                  setShowRemoveUserRequestPaymentConfirm(false);

                  // Reset the remove index
                  setRemovePaymentIndex(null);

                  setActionOverlay({
                    isVisible: true,
                    message: "Payment entry removed successfully!",
                    type: "warning",
                  });

                  setTimeout(() => {
                    setActionOverlay((prev) => ({
                      ...prev,
                      isVisible: false,
                    }));
                  }, 3000);
                }}
              >
                Yes, Remove
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => {
                  setShowRemoveUserRequestPaymentConfirm(false);
                  setRemovePaymentIndex(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditRequestConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Save Rental Request Changes?</h3>
            <p>This will update the rental request with your modifications.</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={async () => {
                  setShowEditRequestConfirm(false);

                  setProcessingBooking({
                    isProcessing: true,
                    message: "Saving Rental Request Changes...",
                    textClass: "submitting-text",
                  });

                  try {
                    console.log(
                      "Saving rental request changes:",
                      editRequestFormData,
                    );
                    await updateAdminToUserBookingRequest(
                      selectedBooking.id,
                      editRequestFormData,
                    );

                    // 🟢 Trigger autofill update for FinancialReports.js
                    triggerAutoFill({
                      ...paymentEntries,
                      [String(editRequestFormData.bookingUid)]:
                        editRequestFormData.paymentEntries.map((entry) => ({
                          ...entry,
                          carName: editRequestFormData.carName,
                          bookingId: String(editRequestFormData.bookingUid),
                        })),
                    });

                    setShowEditRequest(false);

                    setActionOverlay({
                      isVisible: true,
                      type: "success",
                      message: "Rental Request updated successfully!",
                    });

                    setTimeout(() => {
                      setHideCancelAnimation(true);
                      setTimeout(() => {
                        setActionOverlay((prev) => ({
                          ...prev,
                          isVisible: false,
                        }));
                        setHideCancelAnimation(false);
                      }, 400);
                    }, 5000);
                  } catch (error) {
                    console.log("❌ ERROR UPDATING USER REQUEST: ", error);

                    setActionOverlay({
                      isVisible: true,
                      type: "error",
                      message: "Failed to update Rental Request ❌",
                    });

                    setTimeout(() => {
                      setHideCancelAnimation(true);
                      setTimeout(() => {
                        setActionOverlay((prev) => ({
                          ...prev,
                          isVisible: false,
                        }));
                        setHideCancelAnimation(false);
                      }, 400);
                    }, 5000);
                  } finally {
                    setProcessingBooking({
                      isProcessing: false,
                      message: "",
                      textClass: "submitting-text",
                    });
                  }
                }}
              >
                Yes, Save
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowEditRequestConfirm(false)}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {showAcceptBookingConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Accept this rental request?</h3>
            <p>This will approve the request and activate the booking.</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={async () => {
                  setShowAcceptBookingConfirm(false);

                  setProcessingBooking({
                    isProcessing: true,
                    message: "Accepting Booking Request...",
                    textClass: "submitting-text",
                  });

                  const selectedBooking = adminBookingRequests.find(
                    (rental) => rental.id === finishRentalId,
                  );

                  if (!selectedBooking) {
                    console.error("Booking not found.");
                    setProcessingBooking({
                      isProcessing: false,
                      message: "",
                      textClass: "submitting-text",
                    });
                    return;
                  }

                  try {
                    const updatedBooking = {
                      ...selectedBooking,
                      status: "Active",
                    };

                    await moveUserBookingToActiveRentals(updatedBooking);

                    console.log("✅ Rental accepted and moved to active.");

                    setProcessingBooking({
                      isProcessing: false,
                      message: "",
                      textClass: "submitting-text",
                    });

                    setHideCancelAnimation(false);
                    setActionOverlay({
                      isVisible: true,
                      message: "Booking Request Accepted & Activated!",
                      type: "success",
                    });

                    setTimeout(() => {
                      setHideCancelAnimation(true);
                      setTimeout(
                        () =>
                          setActionOverlay({
                            ...actionOverlay,
                            isVisible: false,
                          }),
                        400,
                      );
                    }, 5000);
                  } catch (err) {
                    console.error("❌ Failed to accept booking:", err);

                    setProcessingBooking({
                      isProcessing: false,
                      message: "",
                      textClass: "submitting-text",
                    });
                    setHideCancelAnimation(false);
                    setActionOverlay({
                      isVisible: true,
                      message: "Failed to Accept Booking!",
                      type: "warning",
                    });
                    setTimeout(() => {
                      setHideCancelAnimation(true);
                      setTimeout(
                        () =>
                          setActionOverlay({
                            ...actionOverlay,
                            isVisible: false,
                          }),
                        400,
                      );
                    }, 5000);
                  }
                }}
              >
                Yes, Accept
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowAcceptBookingConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectBookingReason && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Reject this rental request?</h3>
            <p>This will deny the request and remove it from the list.</p>

            {/* REASON INPUT */}
            <textarea
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="message-reject"
            ></textarea>

            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={async () => {
                  setShowRejectBookingReason(false);

                  setProcessingBooking({
                    isProcessing: true,
                    message: "Rejecting Booking Request...",
                    textClass: "submitting-text-red",
                  });

                  await rejectBookingRequest(cancelRentalId, rejectionReason);

                  setProcessingBooking({
                    isProcessing: false,
                    message: "",
                    textClass: "submitting-text-red",
                  });

                  setHideCancelAnimation(false);
                  setActionOverlay({
                    isVisible: true,
                    message: "Booking Request Rejected & Deleted!",
                    type: "warning",
                  });

                  setTimeout(() => {
                    setHideCancelAnimation(true);
                    setTimeout(
                      () =>
                        setActionOverlay({
                          ...actionOverlay,
                          isVisible: false,
                        }),
                      400,
                    );
                  }, 5000);

                  setRejectionReason("");
                }}
              >
                Yes, Reject
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowRejectBookingReason(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectedBookingOverlay && (
        <div
          className={`date-warning-overlay ${
            hideCancelAnimation ? "hide" : ""
          }`}
        >
          <button
            className="close-warning"
            onClick={() => {
              setHideCancelAnimation(true);
              setTimeout(() => setShowRejectedBookingOverlay(false), 400);
            }}
          >
            ✖
          </button>
          <span className="warning-text">
            Booking Request Rejected & Deleted!
          </span>
          <div className="progress-bar"></div>
        </div>
      )}

      {/* EDIT ACTIVE RENTAL */}
      {showEditConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Edit this rental?</h3>
            <p>This will allow you to modify the rental details.</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  const rentalToEdit = ongoingRentals.find(
                    (rental) => rental.id === editRentalId,
                  );

                  console.log("📝 Selected booking for edit:", rentalToEdit);

                  if (!rentalToEdit) {
                    console.error(
                      "Rental not found for edit. Check editRentalId:",
                      editRentalId,
                    );
                    alert(
                      "Error: Unable to find the rental to edit. Please try again.",
                    );
                    return;
                  }
                  setFilePreviews((prev) => ({
                    ...prev,
                    edit: rentalToEdit.driverLicense,
                  }));
                  setSelectedBooking(rentalToEdit);
                  setEditFormData({
                    ...rentalToEdit,
                    paymentEntries: rentalToEdit.paymentEntries || [],
                    startTime: new Date(rentalToEdit.startTime)
                      .toTimeString()
                      .slice(0, 5),
                  });

                  setShowEditConfirm(false);
                  setShowEditBooking(true);
                }}
              >
                Yes, Edit
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowEditConfirm(false)}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditBooking && (
        <div className="admin-booking-confirm-overlay">
          <div className="admin-booking-confirm-container">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowEditBooking(false)}
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

            <h3 className="confirm-header">EDIT BOOKING</h3>
            <p className="confirm-text">
              You can modify the booking details here.
            </p>

            <div className="select-container">
              <div className="payment-section">
                <h4 className="payment-label">Payment Details</h4>

                {editFormData?.paymentEntries?.length > 0 && (
                  <div className="payment-table-container">
                    <table className="payment-table">
                      <thead>
                        <tr>
                          <th>AMOUNT</th>
                          <th>MOP</th>
                          <th>POP</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editFormData.paymentEntries.map((entry, index) => (
                          <tr
                            key={index}
                            className={
                              editingIndex === index ? "editing-row" : ""
                            }
                          >
                            <td>₱{entry.amount}</td>
                            <td>{entry.mop}</td>
                            <td>{entry.pop}</td>
                            <td>{formatPaymentDate(entry.date)}</td>
                            <td>
                              <div className="payment-buttons-group">
                                <button
                                  type="button"
                                  className="edit-payment-btn"
                                  onClick={() => {
                                    setCurrentPayment(entry);
                                    setEditingIndex(index);
                                  }}
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="remove-payment-btn"
                                  onClick={() => {
                                    setRemovePaymentIndex(index); // store which payment to remove
                                    setShowRemovePaymentConfirm(true);
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="payment-labels">
                  <span>AMOUNT</span>
                  <span>MOP</span>
                  <span>POP</span>
                  <span>Date</span>
                </div>
                <div className="scrollable-selects">
                  <input
                    type="number"
                    name="amount"
                    value={currentPayment.amount}
                    onChange={handlePaymentChange}
                    placeholder="Enter Amount"
                    min="0"
                  />

                  <select
                    name="mop"
                    value={currentPayment.mop}
                    onChange={handlePaymentChange}
                  >
                    <option value="">Select MOP</option>
                    {mopTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <select
                    name="pop"
                    value={currentPayment.pop}
                    onChange={handlePaymentChange}
                  >
                    <option value="">Select POP</option>
                    {popTypesRevenue.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <input
                    type="datetime-local"
                    name="date"
                    value={currentPayment.date}
                    onChange={handlePaymentChange}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    // Add validation: Ensure all fields are filled
                    if (
                      !currentPayment.amount ||
                      !currentPayment.mop ||
                      !currentPayment.pop ||
                      !currentPayment.date
                    ) {
                      alert(
                        "Please fill in all payment fields (Amount, MOP, POP, Date) before saving.",
                      );
                      return;
                    }

                    if (editingIndex !== null) {
                      // Edit existing in editFormData
                      setEditFormData((prev) => ({
                        ...prev,
                        paymentEntries: prev.paymentEntries.map(
                          (entry, index) =>
                            index === editingIndex ? currentPayment : entry,
                        ),
                      }));
                      setEditingIndex(null);
                    } else {
                      // Add new to editFormData
                      setEditFormData((prev) => ({
                        ...prev,
                        paymentEntries: [
                          ...(prev.paymentEntries || []),
                          currentPayment,
                        ],
                      }));
                    }
                    setCurrentPayment({
                      amount: "",
                      mop: "",
                      pop: "",
                      date: "",
                    });
                  }}
                  className="save-payment-btn"
                >
                  {editingIndex !== null ? "Update Payment" : "Save Payment"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPayment({
                      amount: "",
                      mop: "",
                      pop: "",
                      date: "",
                    });
                    setEditingIndex(null);
                  }}
                  className="add-new-payment-btn"
                >
                  Reset Input
                </button>
              </div>

              <div className="contact-occupation-section">
                <h4>Discounts (Not Required)</h4>

                <div className="discount-fields">
                  <div className="discount-input-group-vertical">
                    <div className="discount-row">
                      <select
                        name="discountType"
                        value={editFormData.discountType || "peso"}
                        onChange={(e) =>
                          handleEditInputChange({
                            target: {
                              name: "discountType",
                              value: e.target.value,
                            },
                          })
                        }
                        className="percentage-toggle-select"
                      >
                        <option value="peso">₱</option>
                        <option value="percent">%</option>
                      </select>

                      <input
                        type="number"
                        name="discountValue"
                        className="discount-value-input"
                        min={0}
                        value={editFormData.discountValue ?? 0}
                        onChange={(e) => {
                          let value = Number(e.target.value);
                          if (isNaN(value)) value = 0;
                          handleEditInputChange({
                            target: {
                              name: "discountValue",
                              value,
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="discount-divider-row">
                      <div className="discount-buttons">
                        {[10, 100, 1000].map((amount) => (
                          <button
                            key={`minus-${amount}`}
                            type="button"
                            className="discount-btn"
                            onClick={() => {
                              const current = Math.max(
                                0,
                                Number(editFormData.discountValue || 0) -
                                  amount,
                              );
                              handleEditInputChange({
                                target: {
                                  name: "discountValue",
                                  value: current,
                                },
                              });
                            }}
                          >
                            -{amount}
                          </button>
                        ))}
                      </div>

                      <span className="discount-divider">||</span>

                      <div className="discount-buttons">
                        {[10, 100, 1000].map((amount) => (
                          <button
                            key={`plus-${amount}`}
                            type="button"
                            className="discount-btn"
                            onClick={() => {
                              const current =
                                Number(editFormData.discountValue || 0) +
                                amount;
                              handleEditInputChange({
                                target: {
                                  name: "discountValue",
                                  value: current,
                                },
                              });
                            }}
                          >
                            +{amount}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
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
                    <strong className="summary-label">Rental Duration:</strong>
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
                      editFormData?.discountValue || 0,
                    );
                    const discountType = editFormData?.discountType || "peso";

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

                  {(editFormData?.paymentEntries || []).map((entry, index) => (
                    <li key={index}>
                      <strong className="summary-label">
                        {formatPaymentDate(entry.date)} <br />
                        {entry.mop} |{" "}
                        {entry.pop
                          ? entry.pop
                              .toLowerCase()
                              .split(" ")
                              .map(
                                (w) => w.charAt(0).toUpperCase() + w.slice(1),
                              )
                              .join(" ")
                          : ""}
                      </strong>
                      <span
                        className="summary-value"
                        style={{ color: "#dc3545" }}
                      >
                        - ₱{Number(entry.amount).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </div>

                {(() => {
                  const discountValue = Number(
                    editFormData?.discountValue || 0,
                  );
                  const discountType = editFormData?.discountType || "peso";
                  const rawTotal =
                    selectedBooking.billedDays *
                      selectedBooking.discountedRate +
                    selectedBooking.billedDays * selectedBooking.drivingPrice +
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
                    editFormData?.discountValue || 0,
                  );
                  const discountType = editFormData?.discountType || "peso";

                  const rawTotal =
                    selectedBooking.billedDays *
                      selectedBooking.discountedRate +
                    selectedBooking.billedDays * selectedBooking.drivingPrice +
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

                  // Use editFormData.paymentEntries for this overlay
                  const paymentEntries = editFormData?.paymentEntries || [];

                  const totalPaid = paymentEntries.reduce(
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
                            color: balanceDue === 0 ? "#28a745" : "#ffb347",
                          }}
                        >
                          Balance Due:
                        </strong>
                        <span
                          className="summary-value"
                          style={{
                            color: balanceDue === 0 ? "#28a745" : "#dc3545",
                          }}
                        >
                          ₱{balanceDue.toLocaleString()}
                        </span>
                      </li>
                    </>
                  );
                })()}
              </ul>

              <div className="select-row">
                <div className="select-box">
                  <label>Driving Option</label>
                  <select
                    name="drivingOption"
                    value={editFormData?.drivingOption || "Self-Drive"}
                    onChange={handleEditInputChange}
                    required
                    disabled
                  >
                    <option value="Self-Drive">Self Drive</option>
                    <option value="With Driver">With Driver</option>
                  </select>
                </div>

                <div className="select-box">
                  <label>Pickup / Drop-off</label>
                  <select
                    name="pickupOption"
                    value={editFormData?.pickupOption || "Pickup"}
                    onChange={handleEditInputChange}
                    required
                    disabled
                  >
                    <option value="Pickup">Pickup</option>
                    <option value="Drop-off">Drop-off</option>
                  </select>
                </div>
              </div>

              {editFormData?.drivingOption === "With Driver" && (
                <div className="select-row">
                  <div className="select-box">
                    <label>Assigned Driver</label>
                    <input
                      type="text"
                      name="assignedDriver"
                      value={editFormData?.assignedDriver || ""}
                      onChange={handleEditInputChange}
                      className="default-text-input"
                      placeholder="Enter assigned driver"
                    />
                  </div>
                </div>
              )}

              {editFormData?.pickupOption === "Drop-off" && (
                <div className="select-row">
                  <div className="select-box">
                    <label>Drop-off Location</label>
                    <input
                      type="text"
                      name="dropoffLocation"
                      value={editFormData?.dropoffLocation || ""}
                      onChange={handleEditInputChange}
                      className="default-text-input"
                      placeholder="Enter drop-off location"
                    />
                  </div>
                </div>
              )}

              <div className="select-row">
                <div className="select-box">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={editFormData?.startDate || ""}
                    onChange={handleEditInputChange}
                    required
                    disabled
                  />
                </div>

                <div className="select-box">
                  <label>Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    value={editFormData?.startTime || ""}
                    onChange={handleEditInputChange}
                    required
                    disabled
                  />
                </div>
              </div>

              <div className="select-row">
                <div className="select-box">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={editFormData?.endDate || ""}
                    onChange={handleEditInputChange}
                    required
                    disabled
                  />
                </div>

                <div className="select-box">
                  <label>End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    value={editFormData?.endTime || ""}
                    onChange={handleEditInputChange}
                    required
                    disabled
                  />
                </div>
              </div>

              <div className="select-row">
                <div className="select-box">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={editFormData?.location || ""}
                    onChange={handleEditInputChange}
                    className="default-text-input"
                    placeholder="Enter location"
                    required
                  />
                </div>
              </div>

              <div className="select-row">
                <div className="select-box">
                  <label>Purpose</label>
                  <input
                    type="text"
                    name="purpose"
                    value={editFormData?.purpose || ""}
                    onChange={handleEditInputChange}
                    className="default-text-input"
                    placeholder="Enter purpose"
                    required
                  />
                </div>
              </div>

              <div className="upload-box-wrapper">
                <div className="upload-box">
                  <label style={{ marginTop: "20px" }}>Driver's License</label>
                  {filePreviews.edit && (
                    <img
                      src={filePreviews.edit}
                      alt="Driver's License"
                      className="license-preview"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setModalImage(filePreviews.edit);
                        setIsImageModalOpen(true);
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="personal-info-section">
                <h4>Personal Information</h4>
                <div className="personal-info-fields">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    className="personal-info-input"
                    value={editFormData?.firstName || ""}
                    onChange={handleEditInputChange}
                    required
                  />
                  <input
                    type="text"
                    name="middleName"
                    placeholder="Middle Name (N/A if none)"
                    className="personal-info-input"
                    value={editFormData?.middleName || ""}
                    onChange={handleEditInputChange}
                    required
                  />
                  <input
                    type="text"
                    name="surname"
                    placeholder="Surname"
                    className="personal-info-input"
                    value={editFormData?.surname || ""}
                    onChange={handleEditInputChange}
                    required
                  />

                  <input
                    type="text"
                    name="address"
                    placeholder="Current Address"
                    className="personal-info-input"
                    value={editFormData?.address || ""}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
              </div>

              <div className="contact-occupation-section">
                <h4>Contact & Occupation</h4>
                <div className="contact-occupation-fields">
                  <input
                    type="tel"
                    name="contact"
                    placeholder="Contact No."
                    className="personal-info-input"
                    value={editFormData?.contact || ""}
                    onChange={handleEditInputChange}
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="personal-info-input"
                    value={editFormData?.email || ""}
                    onChange={handleEditInputChange}
                    required
                  />
                  <input
                    type="text"
                    name="occupation"
                    placeholder="Occupation"
                    className="personal-info-input"
                    value={editFormData?.occupation || ""}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
              </div>

              <div className="message-section">
                <h4 className="message-label">Referral Source (Optional)</h4>

                <select
                  name="referralSource"
                  className="referral-info"
                  value={formData.referralSource || ""}
                  onChange={handleEditInputChange}
                >
                  {referralSources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>

              <div className="message-section">
                <h4 className="message-label">Additional Message</h4>
                <textarea
                  name="additionalMessage"
                  placeholder="Enter any additional message..."
                  className="message-input"
                  value={editFormData?.additionalMessage || ""}
                  onChange={handleEditInputChange}
                />
              </div>
            </div>

            <div className="rental-actions-container">
              <button
                className="rental-actions start-rental"
                onClick={() => setShowUpdateConfirm(true)}
              >
                Save
              </button>

              <button
                type="button"
                className="rental-actions print-contract"
                disabled={!editFormData?.firstName}
                onClick={() => {
                  // Handle print contract logic using editFormData
                  const enrichedBooking = {
                    ...editFormData,
                    carName: selectedBooking.carName, // From selectedBooking
                  };
                  generateFilledContract(enrichedBooking);
                }}
              >
                Print Contract
              </button>

              <button
                type="button"
                className="rental-actions clear-all"
                onClick={() => setShowEditBooking(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRemovePaymentConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Remove this payment entry?</h3>
            <p>This action cannot be undone once confirmed.</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  setShowRemovePaymentConfirm(false);

                  // Perform the actual remove
                  setEditFormData((prev) => ({
                    ...prev,
                    paymentEntries: (prev.paymentEntries || []).filter(
                      (_, i) => i !== removePaymentIndex,
                    ),
                  }));

                  // Reset editing state if needed
                  if (editingIndex === removePaymentIndex) {
                    setEditingIndex(null);
                    setCurrentPayment({
                      amount: "",
                      mop: "",
                      pop: "",
                      date: "",
                    });
                  }

                  setHideCancelAnimation(false);
                  setActionOverlay({
                    isVisible: true,
                    message: "Payment entry removed!",
                    type: "warning",
                  });

                  setTimeout(() => {
                    setHideCancelAnimation(true);
                    setTimeout(() => {
                      setActionOverlay((prev) => ({
                        ...prev,
                        isVisible: false,
                      }));
                      setHideCancelAnimation(false);
                    }, 400);
                  }, 5000);
                }}
              >
                Yes, Remove
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowRemovePaymentConfirm(false)}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Update Active Rental?</h3>
            <p>This will save your changes to the active rental.</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={async () => {
                  setShowUpdateConfirm(false);

                  setProcessingBooking({
                    isProcessing: true,
                    message: "Updating Active Rental...",
                    textClass: "submitting-text",
                  });

                  try {
                    await updateActiveBooking(selectedBooking.id, editFormData);

                    // 🟢 Trigger autofill update for FinancialReports.js
                    triggerAutoFill({
                      ...paymentEntries,
                      [String(editFormData.bookingUid)]:
                        editFormData.paymentEntries.map((entry) => ({
                          ...entry,
                          carName: editFormData.carName,
                          bookingId: String(editFormData.bookingUid),
                        })),
                    });

                    setActionOverlay({
                      isVisible: true,
                      type: "success",
                      message: "Updated Active Rental Successfully!",
                    });

                    setShowEditBooking(false);

                    setTimeout(() => {
                      setHideCancelAnimation(true);
                      setTimeout(() => {
                        setActionOverlay((prev) => ({
                          ...prev,
                          isVisible: false,
                        }));
                        setHideCancelAnimation(false);
                      }, 400);
                    }, 5000);
                  } catch (err) {
                    console.error("❌ Failed to Update Active Rental:", err);

                    setActionOverlay({
                      isVisible: true,
                      type: "error",
                      message: "Failed to Update Active Rental.",
                    });

                    setTimeout(() => {
                      setHideCancelAnimation(true);
                      setTimeout(() => {
                        setActionOverlay((prev) => ({
                          ...prev,
                          isVisible: false,
                        }));
                        setHideCancelAnimation(false);
                      }, 400);
                    }, 5000);
                  } finally {
                    setProcessingBooking({
                      isProcessing: false,
                      message: "",
                      textClass: "submitting-text",
                    });
                  }
                }}
              >
                Yes, Update
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowUpdateConfirm(false)}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BALANCE DUE BOOKING */}
      {showEditBalanceDueConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Update the Payment for this rental?</h3>
            <p>This will allow you to Update the Payment for this rental.</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  setShowEditBalanceDueConfirm(false);
                  setShowEditBalanceDueBooking(true);
                }}
              >
                Yes, Update
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowEditBalanceDueConfirm(false)}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditBalanceDueBooking && (
        <div className="admin-booking-confirm-overlay">
          <div className="admin-booking-confirm-container">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowEditBalanceDueBooking(false)}
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

            <h3 className="confirm-header">UPDATE PAYMENT</h3>
            <p className="confirm-text">Update this booking's payment.</p>

            <div className="select-container">
              <div className="payment-section">
                <h4 className="payment-label">Payment Details</h4>

                {balanceDueFormData?.paymentEntries?.length > 0 && (
                  <div className="payment-table-container">
                    <table className="payment-table">
                      <thead>
                        <tr>
                          <th>AMOUNT</th>
                          <th>MOP</th>
                          <th>POP</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {balanceDueFormData.paymentEntries.map(
                          (entry, index) => (
                            <tr
                              key={index}
                              className={
                                editingIndex === index ? "editing-row" : ""
                              }
                            >
                              <td>₱{entry.amount}</td>
                              <td>{entry.mop}</td>
                              <td>{entry.pop}</td>
                              <td>{formatPaymentDate(entry.date)}</td>
                              <td>
                                <div className="payment-buttons-group">
                                  <button
                                    type="button"
                                    className="edit-payment-btn"
                                    onClick={() => {
                                      setCurrentPayment(entry);
                                      setEditingIndex(index);
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="remove-payment-btn"
                                    onClick={() => {
                                      setRemovePaymentIndex(index);
                                      setShowRemoveBalanceDuePaymentConfirm(
                                        true,
                                      );
                                    }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="payment-labels">
                  <span>AMOUNT</span>
                  <span>MOP</span>
                  <span>POP</span>
                  <span>Date</span>
                </div>
                <div className="scrollable-selects">
                  <input
                    type="number"
                    name="amount"
                    value={currentPayment.amount}
                    onChange={handlePaymentChange}
                    placeholder="Enter Amount"
                    min="0"
                  />

                  <select
                    name="mop"
                    value={currentPayment.mop}
                    onChange={handlePaymentChange}
                  >
                    <option value="">Select MOP</option>
                    {mopTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <select
                    name="pop"
                    value={currentPayment.pop}
                    onChange={handlePaymentChange}
                  >
                    <option value="">Select POP</option>
                    {popTypesRevenue.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <input
                    type="datetime-local"
                    name="date"
                    value={currentPayment.date}
                    onChange={handlePaymentChange}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    // Add validation: Ensure all fields are filled
                    if (
                      !currentPayment.amount ||
                      !currentPayment.mop ||
                      !currentPayment.pop ||
                      !currentPayment.date
                    ) {
                      alert(
                        "Please fill in all payment fields (Amount, MOP, POP, Date) before saving.",
                      );
                      return;
                    }

                    if (editingIndex !== null) {
                      // Edit existing in balanceDueFormData
                      setBalanceDueFormData((prev) => ({
                        ...prev,
                        paymentEntries: prev.paymentEntries.map(
                          (entry, index) =>
                            index === editingIndex ? currentPayment : entry,
                        ),
                      }));
                      setEditingIndex(null);
                    } else {
                      // Add new to balanceDueFormData
                      setBalanceDueFormData((prev) => ({
                        ...prev,
                        paymentEntries: [
                          ...(prev.paymentEntries || []),
                          currentPayment,
                        ],
                      }));
                    }
                    setCurrentPayment({
                      amount: "",
                      mop: "",
                      pop: "",
                      date: "",
                    });
                  }}
                  className="save-payment-btn"
                >
                  {editingIndex !== null ? "Update Payment" : "Save Payment"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentPayment({
                      amount: "",
                      mop: "",
                      pop: "",
                      date: "",
                    });
                    setEditingIndex(null);
                  }}
                  className="add-new-payment-btn"
                >
                  Reset Input
                </button>
              </div>

              <div className="contact-occupation-section">
                <h4>Discounts (Not Required)</h4>

                <div className="discount-fields">
                  <div className="discount-input-group-vertical">
                    <div className="discount-row">
                      <select
                        name="discountType"
                        value={balanceDueFormData.discountType || "peso"}
                        onChange={(e) =>
                          setBalanceDueFormData((prev) => ({
                            ...prev,
                            discountType: e.target.value,
                          }))
                        }
                        className="percentage-toggle-select"
                      >
                        <option value="peso">₱</option>
                        <option value="percent">%</option>
                      </select>

                      <input
                        type="number"
                        name="discountValue"
                        className="discount-value-input"
                        min={0}
                        value={balanceDueFormData.discountValue ?? 0}
                        onChange={(e) => {
                          let value = Number(e.target.value);
                          if (isNaN(value)) value = 0;
                          setBalanceDueFormData((prev) => ({
                            ...prev,
                            discountValue: value,
                          }));
                        }}
                      />
                    </div>

                    <div className="discount-divider-row">
                      <div className="discount-buttons">
                        {[10, 100, 1000].map((amount) => (
                          <button
                            key={`minus-${amount}`}
                            type="button"
                            className="discount-btn"
                            onClick={() => {
                              const current = Math.max(
                                0,
                                Number(balanceDueFormData.discountValue || 0) -
                                  amount,
                              );
                              setBalanceDueFormData((prev) => ({
                                ...prev,
                                discountValue: current,
                              }));
                            }}
                          >
                            -{amount}
                          </button>
                        ))}
                      </div>

                      <span className="discount-divider">||</span>

                      <div className="discount-buttons">
                        {[10, 100, 1000].map((amount) => (
                          <button
                            key={`plus-${amount}`}
                            type="button"
                            className="discount-btn"
                            onClick={() => {
                              const current =
                                Number(balanceDueFormData.discountValue || 0) +
                                amount;
                              setBalanceDueFormData((prev) => ({
                                ...prev,
                                discountValue: current,
                              }));
                            }}
                          >
                            +{amount}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                  <strong className="summary-label">Rental Duration:</strong>
                  <span className="summary-value">
                    ({selectedBooking.billedDays} Day /{" "}
                    {selectedBooking.rentalDuration.isFlatRateSameDay ? (
                      <>
                        for{" "}
                        <span style={{ color: "#dc3545" }}>
                          {Math.floor(
                            selectedBooking.rentalDuration.actualSeconds / 3600,
                          )}
                          {Math.floor(
                            selectedBooking.rentalDuration.actualSeconds / 3600,
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
                    balanceDueFormData?.discountValue || 0,
                  );
                  const discountType =
                    balanceDueFormData?.discountType || "peso";

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

                {displayedPayments.length > 0 &&
                  displayedPayments.map((entry, index) => {
                    const titleCasePop = entry.pop
                      ? entry.pop
                          .toLowerCase()
                          .split(" ")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1),
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
                  })}
              </div>

              {(() => {
                const discountValue = Number(
                  balanceDueFormData?.discountValue || 0,
                );
                const discountType = balanceDueFormData?.discountType || "peso";
                const rawTotal =
                  selectedBooking.billedDays * selectedBooking.discountedRate +
                  selectedBooking.billedDays * selectedBooking.drivingPrice +
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
                const discountedTotal = Math.max(0, rawTotal - discountAmount);
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
                  balanceDueFormData?.discountValue || 0,
                );
                const discountType = balanceDueFormData?.discountType || "peso";

                const rawTotal =
                  selectedBooking.billedDays * selectedBooking.discountedRate +
                  selectedBooking.billedDays * selectedBooking.drivingPrice +
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

                const discountedTotal = Math.max(0, rawTotal - discountAmount);

                // Use the actual displayedPayments state (already declared outside)
                const totalPaid = displayedPayments.reduce(
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
                          color: balanceDue === 0 ? "#28a745" : "#ffb347",
                        }}
                      >
                        Balance Due:
                      </strong>
                      <span
                        className="summary-value"
                        style={{
                          color: balanceDue === 0 ? "#28a745" : "#dc3545",
                        }}
                      >
                        ₱{balanceDue.toLocaleString()}
                      </span>
                    </li>
                  </>
                );
              })()}
            </ul>

            <div className="rental-actions-container">
              <button
                className="rental-actions start-rental"
                onClick={() => setShowUpdatePaymentConfirm(true)}
              >
                Save
              </button>

              <button
                type="button"
                className="rental-actions clear-all"
                onClick={() => setShowEditBalanceDueBooking(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRemoveBalanceDuePaymentConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Remove this payment entry?</h3>
            <p>This action cannot be undone once confirmed.</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  setShowRemoveBalanceDuePaymentConfirm(false);

                  // Perform the actual remove for balance due
                  setBalanceDueFormData((prev) => ({
                    ...prev,
                    paymentEntries: (prev.paymentEntries || []).filter(
                      (_, i) => i !== removePaymentIndex,
                    ),
                  }));

                  // Reset editing state if needed
                  if (editingIndex === removePaymentIndex) {
                    setEditingIndex(null);
                    setCurrentPayment({
                      amount: "",
                      mop: "",
                      pop: "",
                      date: "",
                    });
                  }

                  setHideCancelAnimation(false);
                  setActionOverlay({
                    isVisible: true,
                    message: "Payment entry removed!",
                    type: "warning",
                  });

                  setTimeout(() => {
                    setHideCancelAnimation(true);
                    setTimeout(() => {
                      setActionOverlay((prev) => ({
                        ...prev,
                        isVisible: false,
                      }));
                      setHideCancelAnimation(false);
                    }, 400);
                  }, 5000);
                }}
              >
                Yes, Remove
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowRemoveBalanceDuePaymentConfirm(false)}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdatePaymentConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3 className="confirm-header">Update Payment?</h3>
            <p className="confirm-text">
              This will save the updated payment details.
            </p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={async () => {
                  setShowUpdatePaymentConfirm(false);
                  setProcessingBooking({
                    isProcessing: true,
                    message: "Updating Payment...",
                    textClass: "submitting-text",
                  });
                  try {
                    await updateBalanceDueBooking(
                      balanceDueFormData.id,
                      balanceDueFormData,
                    );

                    // 🟢 Trigger autofill update for FinancialReports
                    triggerAutoFill({
                      ...paymentEntries,
                      [String(balanceDueFormData.id)]:
                        balanceDueFormData.paymentEntries.map((entry) => ({
                          ...entry,
                          carName: balanceDueFormData.carName,
                          bookingId: String(balanceDueFormData.id),
                        })),
                    });

                    console.log(
                      "✅ PAYMENT ENTRIES RENTAL ACTIVITY SECTION:",
                      balanceDueFormData.paymentEntries,
                    );
                    setActionOverlay({
                      isVisible: true,
                      type: "success",
                      message: "Payment updated successfully!",
                    });
                    setShowEditBalanceDueBooking(false);
                    setTimeout(() => {
                      setHideCancelAnimation(true);
                      setTimeout(() => {
                        setActionOverlay((prev) => ({
                          ...prev,
                          isVisible: false,
                        }));
                        setHideCancelAnimation(false);
                      }, 400);
                    }, 5000);
                  } catch (err) {
                    console.error("❌ Failed to Update Payment:", err);
                    setActionOverlay({
                      isVisible: true,
                      type: "error",
                      message: "Failed to update payment.",
                    });
                    setTimeout(() => {
                      setHideCancelAnimation(true);
                      setTimeout(() => {
                        setActionOverlay((prev) => ({
                          ...prev,
                          isVisible: false,
                        }));
                        setHideCancelAnimation(false);
                      }, 400);
                    }, 5000);
                  } finally {
                    setProcessingBooking({
                      isProcessing: false,
                      message: "",
                      textClass: "submitting-text",
                    });
                  }
                }}
              >
                Yes, Update
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowUpdatePaymentConfirm(false)}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {showMarkAsPaidConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Mark this rental as Paid?</h3>
            <p>
              This will finalize the payment and set the rental as fully paid.
            </p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={async () => {
                  setShowMarkAsPaidConfirm(false);

                  setProcessingBooking({
                    isProcessing: true,
                    message: "Marking Booking as Paid...",
                    textClass: "submitting-text",
                  });

                  try {
                    await markBookingAsPaid(selectedBooking.id);

                    setActionOverlay({
                      isVisible: true,
                      type: "success",
                      message: "Booking marked as Paid successfully!",
                    });

                    setTimeout(() => {
                      setHideCancelAnimation(true);
                      setTimeout(() => {
                        setActionOverlay((prev) => ({
                          ...prev,
                          isVisible: false,
                        }));
                        setHideCancelAnimation(false);
                      }, 400);
                    }, 5000);
                  } catch (err) {
                    console.error("❌ Failed to Mark Booking as Paid:", err);

                    setActionOverlay({
                      isVisible: true,
                      type: "error",
                      message: "Failed to mark booking as Paid ❌",
                    });

                    setTimeout(() => {
                      setHideCancelAnimation(true);
                      setTimeout(() => {
                        setActionOverlay((prev) => ({
                          ...prev,
                          isVisible: false,
                        }));
                        setHideCancelAnimation(false);
                      }, 400);
                    }, 5000);
                  } finally {
                    setProcessingBooking({
                      isProcessing: false,
                      message: "",
                      textClass: "submitting-text",
                    });
                  }
                }}
              >
                Yes, Mark as Paid
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowMarkAsPaidConfirm(false)}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAYS */}
      {showDateWarning && (
        <div className={`date-warning-overlay ${hideAnimation ? "hide" : ""}`}>
          <button
            className="close-warning"
            onClick={() => {
              setHideAnimation(true);
              setTimeout(() => setShowDateWarning(false), 400);
            }}
          >
            ✖
          </button>
          <span className="warning-text">
            End date cannot be earlier than start date.
          </span>
          <div className="progress-bar"></div>
        </div>
      )}

      {showTimeWarning && (
        <div className={`date-warning-overlay ${hideAnimation ? "hide" : ""}`}>
          <button
            className="close-warning"
            onClick={() => {
              setHideAnimation(true);
              setTimeout(() => setShowTimeWarning(false), 400);
            }}
          >
            ✖
          </button>
          <span className="warning-text">
            Rental duration must be at least 1 hour.
          </span>
          <div className="progress-bar"></div>
        </div>
      )}

      {showUnitConflict && (
        <div className={`date-warning-overlay ${hideAnimation ? "hide" : ""}`}>
          <button
            className="close-warning"
            onClick={() => {
              setHideAnimation(true);
              setTimeout(() => setShowUnitConflict(false), 400);
            }}
          >
            ✖
          </button>
          <span className="warning-text">
            This unit is already assigned to an ongoing rental.
          </span>
          <div className="progress-bar"></div>
        </div>
      )}

      {showSuccessBooking && (
        <div className={`sent-ongoing-overlay ${hideAnimation ? "hide" : ""}`}>
          <button
            className="close-sent-ongoing"
            onClick={() => {
              setHideAnimation(true);
              setTimeout(() => setShowSuccessBooking(false), 400);
            }}
          >
            ✖
          </button>
          <span className="warning-text">
            {successMessage || "Booking confirmed and sent to Ongoing Rentals"}
          </span>
          <div className="sent-ongoing-progress-bar"></div>
        </div>
      )}

      {actionOverlay.isVisible && (
        <div
          className={`${
            actionOverlay.type === "warning"
              ? "date-warning-overlay"
              : "sent-ongoing-overlay"
          } ${hideCancelAnimation ? "hide" : ""}`}
        >
          <button
            className={
              actionOverlay.type === "warning"
                ? "close-warning"
                : "close-sent-ongoing"
            }
            onClick={() => {
              setHideCancelAnimation(true);
              setTimeout(
                () => setActionOverlay({ ...actionOverlay, isVisible: false }),
                400,
              );
            }}
          >
            ✖
          </button>
          <span className="warning-text">{actionOverlay.message}</span>
          <div
            className={
              actionOverlay.type === "warning"
                ? "progress-bar"
                : "sent-ongoing-progress-bar"
            }
          ></div>
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
            <p className={processingBooking.textClass}>
              {processingBooking.message}
            </p>
          </div>
        </div>
      )}

      {showCustomerSelectDialog && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3 style={{ marginBottom: 0 }}>Select Existing Customer</h3>

            <p style={{ marginTop: "5px", marginBottom: "5px" }}>
              Selected Clients:
            </p>
            {selectedCustomerName && (
              <div
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700,
                  backgroundColor: "#f8d7da",
                  border: "1px solid #dc3545",
                  color: "#dc3545",
                  borderRadius: "5px",
                  padding: "20px",
                  marginBottom: "20px",
                }}
              >
                {selectedCustomerName}
              </div>
            )}

            {/* Search Bar */}
            <div style={{ marginBottom: "10px" }}>
              <input
                type="text"
                placeholder="Search by name, contact, or email"
                value={clientsSearchTerm}
                onChange={(e) => setClientsSearchTerm(e.target.value)}
                className="search-bar"
              />
            </div>

            {/* Scrollable customer table */}
            <div className="customer-list">
              <table className="customer-table">
                <thead>
                  <tr>
                    <th>Profile</th>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClientsList.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="clients-no-data">
                        {clientsSearchTerm
                          ? `No clients found matching "${clientsSearchTerm}"`
                          : "No clients available"}
                      </td>
                    </tr>
                  ) : (
                    filteredClientsList.map((client) => {
                      // Correctly define customer based on client data
                      const user = userAccounts.find(
                        (u) => u.email === client.email,
                      ); // Find registered user if exists
                      const customer = {
                        id: client.email, // Use email as unique ID for both registered and unregistered
                        name:
                          client.firstName &&
                          client.middleName &&
                          client.surname
                            ? `${client.firstName} ${client.middleName} ${client.surname}`
                            : client.name,
                        // Add individual name fields
                        firstName: client.firstName || "",
                        middleName: client.middleName || "",
                        surname: client.surname || "",
                        contactNumber: client.contact || "",
                        email: client.email,
                        photo:
                          client.isRegistered && user
                            ? user.profilePic || "/assets/profile.png"
                            : "/assets/profile.png",
                        occupation: client.occupation,
                        address: client.address,
                      };

                      return (
                        <tr
                          key={customer.id}
                          className="customer-row"
                          onClick={() => handleSelectCustomer(customer)}
                        >
                          <td>
                            <img
                              src={customer.photo || "/assets/profile.png"}
                              alt={customer.name}
                              className="customer-avatar"
                            />
                          </td>
                          <td>{customer.name}</td>
                          <td>{customer.contactNumber}</td>
                          <td>{customer.email}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  if (selectedCustomer) {
                    // Populate the form with selected customer data
                    setFormData((prev) => ({
                      ...prev,
                      [selectedUnitId]: {
                        ...prev[selectedUnitId],
                        firstName: selectedCustomer.firstName || "",
                        middleName: selectedCustomer.middleName || "",
                        surname: selectedCustomer.surname || "",
                        contact: selectedCustomer.contactNumber || "",
                        email: selectedCustomer.email || "",
                        occupation: selectedCustomer.occupation,
                        address: selectedCustomer.address,
                      },
                    }));
                  }
                  setShowCustomerSelectDialog(false);
                  setSelectedCustomer(null); // Reset for next use
                  setSelectedCustomerName("None"); // Reset for next use
                }}
              >
                Confirm
              </button>

              <button className="confirm-btn cancel" onClick={handleCancelEdit}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="rental-activity-section">
        <h2 className="section-title">Rental Activities</h2>

        <div
          className={`rental-columns ${
            subSection === "ongoing-rent"
              ? "single-ongoing"
              : subSection === "available-units"
                ? "single-available"
                : ""
          }`}
        >
          {(subSection === "overview" || subSection === "ongoing-rent") && (
            <div
              className="ongoing-rent-column"
              style={{
                display:
                  subSection === "overview" || subSection === "ongoing-rent"
                    ? "block"
                    : "none",
              }} // New: conditional display
            >
              <div className="ongoing-units-header-wrapper">
                <h2 className="ongoing-units-header">
                  {ongoingFilter === "PENDING"
                    ? "PENDING RENTS"
                    : ongoingFilter === "REQUESTS"
                      ? "BOOKING REQUESTS"
                      : "ONGOING RENTS"}
                </h2>
                <div className="filter-dropdown hoverable-dropdown">
                  <button className="filter-button">
                    {ongoingFilter.charAt(0).toUpperCase() +
                      ongoingFilter.slice(1).toLowerCase()}{" "}
                    ▾
                  </button>
                  <div className="filter-menu">
                    {["ACTIVE", "PENDING", "REQUESTS"].map((type) => (
                      <div
                        key={type}
                        className={`filter-option ${
                          ongoingFilter === type ? "selected" : ""
                        }`}
                        onClick={() => setOngoingFilter(type)}
                      >
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="ongoing-rent-cards">
                {ongoingFilter === "REQUESTS" ? (
                  adminBookingRequests.length === 0 ? (
                    <div className="no-ongoing-rentals-message">
                      No BOOKING {ongoingFilter} Yet...
                    </div>
                  ) : (
                    adminBookingRequests.map((rental) => {
                      const now = Date.now();
                      const hasStarted = rental.hasStarted;
                      const startTime = new Date(rental.startTime).getTime();
                      const totalDurationInSeconds =
                        rental.totalDurationInSeconds;

                      const elapsedSeconds = hasStarted
                        ? Math.floor((now - startTime) / 1000)
                        : 0;

                      const currentTimeLeftInSeconds = hasStarted
                        ? Math.max(totalDurationInSeconds - elapsedSeconds, 0)
                        : totalDurationInSeconds;

                      return (
                        <div key={rental.id} className="ongoing-unit-card">
                          <div className="ongoing-unit-gradient-overlay">
                            <h3 style={{ color: "#28a745", margin: "0px" }}>
                              {rental.carName}
                            </h3>
                            <div className="ongoing-unit-info">
                              <div className="info-block">
                                <span className="label">Renter:</span>
                                <span className="value">
                                  {rental.renterName}
                                </span>
                              </div>
                              <div className="info-block">
                                <span className="label">Travel Location:</span>
                                <span className="value">{rental.location}</span>
                              </div>
                              <div className="info-block">
                                <span className="label">Time Left:</span>

                                <span className="value">
                                  {hasStarted
                                    ? formatTime(
                                        rental.currentTimeLeftInSeconds,
                                      )
                                    : `Starts on ${
                                        isToday(
                                          new Date(
                                            `${rental.startDate}T${rental.startTime}:00`,
                                          ),
                                        )
                                          ? `Today at ${formatHourMinute(
                                              new Date(
                                                `${rental.startDate}T${rental.startTime}:00`,
                                              ),
                                            )}`
                                          : formatDateTime(
                                              new Date(
                                                `${rental.startDate}T${rental.startTime}:00`,
                                              ),
                                            )
                                      }`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="ongoing-unit-image-wrapper">
                            {(() => {
                              if (!rental) return null;

                              const imageId =
                                rental.imageId ||
                                unitData.find((u) => u.name === rental.carName)
                                  ?.imageId ||
                                `${rental.plateNo}_main`;

                              const image = fetchedImages[imageId];

                              if (!image?.base64) {
                                return (
                                  <div className="unit-main-image-placeholder">
                                    Loading...
                                  </div>
                                );
                              }

                              return (
                                <img
                                  src={image.base64}
                                  key={image.updatedAt}
                                  alt={`Ongoing rental: ${rental.carName}`}
                                  className="ongoing-unit-image"
                                />
                              );
                            })()}
                          </div>

                          <button
                            className="edit-unit-status-badge"
                            onClick={() => {
                              console.log("Edit request:", rental);
                              setSelectedBooking(rental);
                              setEditRequestFormData({
                                ...rental,
                                paymentEntries: rental.paymentEntries || [],
                              });

                              // Set the existing driver's license image in filePreviews
                              if (
                                rental.driverLicense &&
                                rental.driverLicense.startsWith("data:image")
                              ) {
                                setFilePreviews((prev) => ({
                                  ...prev,
                                  edit: rental.driverLicense,
                                }));
                              }

                              setShowEditRequestConfirmOverlay(true);
                            }}
                          >
                            Edit
                          </button>

                          <button
                            className="ongoing-unit-details-button"
                            onClick={() => {
                              console.log("USER BOOKING REQUEST:", rental);
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
                                  width: `${Math.min(
                                    Math.max(
                                      ((totalDurationInSeconds -
                                        currentTimeLeftInSeconds) /
                                        totalDurationInSeconds) *
                                        100,
                                      0,
                                    ),
                                    100,
                                  ).toFixed(2)}%`,
                                }}
                              ></div>
                            </div>

                            <span className="ongoing-unit-time-left">
                              {formatTime(currentTimeLeftInSeconds)}
                            </span>

                            <div className="ongoing-unit-action-buttons">
                              <button
                                className="action-button finish"
                                onClick={() => {
                                  setFinishRentalId(rental.id);
                                  setShowAcceptBookingConfirm(true);
                                }}
                              >
                                Accept
                              </button>

                              <button
                                className="action-button reserve"
                                onClick={() => {
                                  setReserveUnitId(rental.plateNo);
                                  setShowCallBookingConfirm(true);
                                }}
                              >
                                Call Now?
                              </button>

                              <button
                                className="action-button cancel"
                                onClick={() => {
                                  setCancelRentalId(rental.id);
                                  setShowRejectBookingReason(true);
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )
                ) : filteredOngoingRentals.length === 0 ? (
                  <div className="no-ongoing-rentals-message">
                    No {ongoingFilter} Rentals Yet...
                  </div>
                ) : (
                  [...filteredOngoingRentals]
                    .sort(
                      (a, b) =>
                        a.currentTimeLeftInSeconds - b.currentTimeLeftInSeconds,
                    )
                    .map((rental) => (
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
                              <span className="value">
                                {rental.location || "N/A"}
                              </span>
                            </div>
                            <div className="info-block">
                              <span className="label">Time Left:</span>
                              <span className="value">
                                {rental.hasStarted
                                  ? formatTime(rental.currentTimeLeftInSeconds)
                                  : `Starts on ${
                                      isToday(rental.startTime)
                                        ? `Today at ${formatHourMinute(
                                            rental.startTime,
                                          )}`
                                        : formatDateTime(
                                            new Date(rental.startTime),
                                          )
                                    }`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="ongoing-unit-image-wrapper">
                          {(() => {
                            if (!rental) return null;

                            const imageId =
                              rental.imageId ||
                              unitData.find((u) => u.name === rental.carName)
                                ?.imageId ||
                              `${rental.plateNo}_main`;

                            const image = fetchedImages[imageId];

                            if (!image?.base64) {
                              return (
                                <div className="unit-main-image-placeholder">
                                  Loading...
                                </div>
                              );
                            }

                            return (
                              <img
                                src={image.base64}
                                key={image.updatedAt}
                                alt={`Ongoing rental: ${rental.carName}`}
                                className="ongoing-unit-image"
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
                            console.log("Selected Booking Details:", rental);
                            setSelectedBooking(rental);
                            setShowDetailsOverlay(true);
                          }}
                        >
                          Details
                        </button>

                        <div className="ongoing-unit-progress-container">
                          {rental.currentTimeLeftInSeconds <=
                            rental.totalDurationInSeconds * 0.1 && ( // 3600 seconds = 1 hour
                            <div
                              className="phone-icon-marker"
                              style={{
                                position: "absolute",
                                left: "75%",
                                top: "-35px",
                                zIndex: 10,
                              }}
                            >
                              <button
                                className="phone-call-button"
                                onClick={() => {
                                  setSelectedBooking(rental);
                                  setShowCallActiveBookingConfirm(true);
                                }}
                                title="Call Renter - Rental ending soon!"
                                style={{
                                  backgroundColor: "white",
                                  borderRadius: "10px",
                                  border: "2px solid #28a745",
                                  cursor: "pointer",
                                  fontSize: "20px",
                                  padding: "5px",
                                }}
                              >
                                📞
                              </button>
                            </div>
                          )}

                          <div className="ongoing-unit-progress-bar-outer">
                            <div
                              className="ongoing-unit-progress-bar-inner"
                              style={{
                                width: `${Math.min(
                                  Math.max(
                                    ((rental.totalDurationInSeconds -
                                      rental.currentTimeLeftInSeconds) /
                                      rental.totalDurationInSeconds) *
                                      100,
                                    0,
                                  ),
                                  100,
                                ).toFixed(2)}%`,
                              }}
                            ></div>
                          </div>

                          <span className="ongoing-unit-time-left">
                            {formatTime(rental.currentTimeLeftInSeconds)}
                          </span>

                          <div className="ongoing-unit-action-buttons">
                            <button
                              className="action-button extend"
                              onClick={() => {
                                setExtendRentalId(rental.id);
                                setExtendValue(1);
                                setExtendUnit("Hours");
                                setShowExtendConfirm(true);
                              }}
                            >
                              Extend
                            </button>

                            <button
                              className="action-button cancel"
                              onClick={() => {
                                setCancelRentalId(rental.id);
                                setShowCancelConfirm(true);
                              }}
                            >
                              Cancel
                            </button>

                            <button
                              className="action-button finish"
                              onClick={() => {
                                setFinishRentalId(rental.id);
                                setShowFinishConfirm(true);
                              }}
                            >
                              Finish
                            </button>

                            {/* More button with dropdown */}
                            <div className="action-more">
                              <button
                                className="action-button more"
                                onClick={() =>
                                  setShowMoreFor(
                                    rental.id === showMoreFor
                                      ? null
                                      : rental.id,
                                  )
                                }
                              >
                                More ▾
                              </button>

                              {showMoreFor === rental.id && (
                                <div className="more-dropdown">
                                  <button
                                    className="action-button reserve"
                                    onClick={() => {
                                      setReserveUnitId(rental.plateNo);
                                      setShowReserveConfirm(true);
                                      setShowMoreFor(null);
                                    }}
                                  >
                                    Reserve
                                  </button>
                                  <button
                                    className="action-button extend"
                                    onClick={() => {
                                      setSelectedBooking(rental); // store the current booking data
                                      setShowCallActiveBookingConfirm(true);
                                    }}
                                  >
                                    Call
                                  </button>
                                  <button
                                    className="action-button edit"
                                    onClick={() => {
                                      setEditRentalId(rental.id);
                                      setShowEditConfirm(true);
                                      setShowMoreFor(null);
                                    }}
                                  >
                                    Edit
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {(subSection === "overview" || subSection === "available-units") && (
            <div
              className="available-units-column"
              style={{
                display:
                  subSection === "overview" || subSection === "available-units"
                    ? "block"
                    : "none",
              }} // New: conditional display
            >
              <div className="available-units-header-wrapper">
                <h2 className="available-units-header">BOOKINGS</h2>

                <div className="pick-a-car">
                  {(() => {
                    const filteredUnits = allUnitData.filter(
                      (unit) =>
                        filterType === "ALL" ||
                        unit.carType?.toUpperCase() === filterType,
                    );

                    if (filteredUnits.length > 0) {
                      return (
                        <select
                          value={selectedUnitId || ""}
                          onChange={(e) => setSelectedUnitId(e.target.value)}
                        >
                          <option value="">Pick a Car</option>
                          {filteredUnits.map((unit) => (
                            <option
                              key={unit.id}
                              value={unit.id}
                              style={
                                unit.hidden
                                  ? {
                                      color: "#DC3545",
                                      backgroundColor: "#F8D7DA",
                                    }
                                  : {}
                              }
                            >
                              {unit.name} - {unit.plateNo}
                            </option>
                          ))}
                        </select>
                      );
                    } else {
                      return (
                        <div className="no-ongoing-rentals-message">
                          {filterType === "ALL"
                            ? "Fully Booked!"
                            : `No ${filterType} Available!`}
                        </div>
                      );
                    }
                  })()}
                </div>

                <div className="filter-dropdown">
                  <button className="filter-button">
                    {filterType.charAt(0).toUpperCase() +
                      filterType.slice(1).toUpperCase()}{" "}
                    ▾
                  </button>
                  <div className="filter-menu">
                    {["ALL", "SEDAN", "SUV", "MPV", "VAN", "PICKUP"].map(
                      (carType) => (
                        <div
                          key={carType}
                          className={`filter-option ${
                            filterType === carType ? "selected" : ""
                          }`}
                          onClick={() => setFilterType(carType)}
                        >
                          {carType}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="select-container">
                  {(() => {
                    const filteredUnits = allUnitData.filter(
                      (u) =>
                        // !u.hidden &&
                        (filterType === "ALL" ||
                          u.carType?.toUpperCase() === filterType),
                    );

                    if (selectedUnitId) {
                      return <></>;
                    } else if (filteredUnits.length === 0) {
                      return (
                        <div className="no-units-message">
                          {filterType === "ALL"
                            ? "All cars are currently Fully Booked! Please check back later."
                            : `No ${filterType} Available Right Now!`}
                        </div>
                      );
                    } else {
                      return (
                        <div className="no-units-message">
                          Please pick a car from the dropdown above to start
                          booking.
                        </div>
                      );
                    }
                  })()}

                  {selectedUnitId &&
                    (() => {
                      const selectedUnit =
                        allUnitData.find((u) => u.id === selectedUnitId) || null;

                      if (!selectedUnit) {
                        return null;
                      }

                      const unitForm = formData[selectedUnitId] || {};

                      const mop = unitForm.mop || "Cash";
                      const pop = unitForm.pop || "None";
                      const dateTime = new Date()
                        .toISOString()
                        .split("T")
                        .join(" ")
                        .slice(0, 16);

                      const drivingOption =
                        unitForm.drivingOption || "Self-Drive";
                      const pickupOption = unitForm.pickupOption || "Pickup";
                      const duration = getRentalDuration(unitForm);
                      const rentalDays = duration?.diffDays || 1;

                      const discountedRate = getDiscountedRate(
                        selectedUnit,
                        rentalDays,
                      );
                      const drivingPrice = getDrivingPrice(
                        selectedUnit,
                        drivingOption,
                      );
                      const pickupPrice = getPickupPrice(
                        selectedUnit,
                        pickupOption,
                      );
                      const extraHourCharge =
                        (duration?.extraHours || 0) * selectedUnit.extension;

                      const rawTotal =
                        rentalDays * discountedRate +
                        rentalDays * drivingPrice +
                        extraHourCharge +
                        pickupPrice;

                      const discountValue = Number(
                        formData[selectedUnit.id]?.discountValue || 0,
                      );
                      const discountType =
                        formData[selectedUnit.id]?.discountType || "peso";

                      let discountAmount = 0;

                      if (discountType === "peso") {
                        discountAmount = Math.min(discountValue, rawTotal);
                      } else if (discountType === "percent") {
                        discountAmount = Math.min(
                          (discountValue / 100) * rawTotal,
                          rawTotal,
                        );
                      }

                      const total = Math.max(0, rawTotal - discountAmount);

                      return (
                        <>
                          <div className="sticky-banner-group">
                            <div className="selected-unit-image">
                              {(() => {
                                if (!selectedUnit) {
                                  return (
                                    <div className="unit-main-image-placeholder">
                                      No image
                                    </div>
                                  );
                                }

                                const imageId =
                                  selectedUnit.imageId ||
                                  `${selectedUnit.plateNo}_main`;

                                const image = fetchedImages[imageId];

                                if (!image?.base64) {
                                  return (
                                    <div className="unit-main-image-placeholder">
                                      Loading...
                                    </div>
                                  );
                                }

                                return (
                                  <img
                                    src={image.base64}
                                    key={image.updatedAt}
                                    alt={selectedUnit.name}
                                    className="unit-image"
                                  />
                                );
                              })()}
                            </div>

                            <div className="quotation-summary-banner">
                              <span>QUOTATION SUMMARY</span>
                              <button
                                type="button"
                                className="quotation-toggle-btn"
                                onClick={() =>
                                  toggleQuotationDetails(selectedUnitId)
                                }
                              >
                                <img
                                  src={
                                    quotationDetailsVisibility[selectedUnitId]
                                      ? "/assets/nxt-btn.png"
                                      : "/assets/prv-btn.png"
                                  }
                                  alt="Toggle Quotation"
                                />
                              </button>
                            </div>

                            <div className="quotation-total-banner">
                              <span className="total-label">TOTAL PRICE:</span>
                              <span className="total-value">
                                ₱{total.toLocaleString()}
                              </span>
                            </div>

                            <div
                              className={`quotation-details ${
                                quotationDetailsVisibility[selectedUnitId]
                                  ? "visible"
                                  : ""
                              }`}
                            >
                              <div className="quotation-detail-row">
                                <div className="quotation-label">
                                  Unit:
                                  <br />
                                  <span className="quotation-sub">
                                    {selectedUnit.name}
                                  </span>
                                </div>
                                <div className="quotation-price">
                                  {(() => {
                                    const discountedRate = getDiscountedRate(
                                      selectedUnit,
                                      rentalDays,
                                    );
                                    const totalUnitPrice =
                                      discountedRate * rentalDays;
                                    return `(₱${discountedRate.toLocaleString()} x ${rentalDays} Day${
                                      rentalDays > 1 ? "s" : ""
                                    })`;
                                  })()}
                                </div>
                              </div>

                              <div className="quotation-detail-row">
                                <div className="quotation-label">
                                  Driving Option:
                                  <br />
                                  <span className="quotation-sub">
                                    {drivingOption}
                                  </span>
                                </div>
                                <div className="quotation-price">
                                  {drivingOption === "With Driver"
                                    ? `(₱${drivingPrice.toLocaleString()} x ${rentalDays} Day${
                                        rentalDays > 1 ? "s" : ""
                                      })`
                                    : "₱0"}
                                </div>
                              </div>

                              <div className="quotation-detail-row">
                                <div className="quotation-label">
                                  Pickup / Drop-off:
                                  <br />
                                  <span className="quotation-sub">
                                    {pickupOption}
                                  </span>
                                </div>
                                <div className="quotation-price">
                                  ₱{pickupPrice.toLocaleString()}
                                </div>
                              </div>

                              <div className="quotation-detail-row">
                                <div className="quotation-label">
                                  Rental Period:
                                  <br />
                                  <span className="quotation-sub">
                                    {(() => {
                                      const {
                                        startDate,
                                        startTime,
                                        endDate,
                                        endTime,
                                      } = unitForm;

                                      if (!startDate)
                                        return "Pick a START DATE";
                                      if (!startTime)
                                        return "Pick a START TIME";
                                      if (!endDate) return "Pick an END DATE";
                                      if (!endTime) return "Pick an END TIME";

                                      return (
                                        <>
                                          {formatDateTime(
                                            new Date(
                                              `${startDate}T${startTime}`,
                                            ),
                                          )}
                                          <br />
                                          to
                                          <br />
                                          {formatDateTime(
                                            new Date(`${endDate}T${endTime}`),
                                          )}
                                        </>
                                      );
                                    })()}
                                  </span>
                                </div>

                                <div className="quotation-price">
                                  {duration ? (
                                    <>
                                      (
                                      {unitForm.startDate ===
                                        unitForm.endDate &&
                                      duration.diffHours < 24 ? (
                                        <>
                                          1 Day / for{" "}
                                          <span style={{ color: "#dc3545" }}>
                                            {duration.diffHours}hr
                                            {duration.diffHours > 1 ? "s" : ""}
                                          </span>{" "}
                                          only
                                        </>
                                      ) : unitForm.startDate ===
                                          unitForm.endDate &&
                                        duration.diffHours >= 24 ? (
                                        <>
                                          1 Day /{" "}
                                          <span style={{ color: "#28a745" }}>
                                            24 hrs
                                          </span>
                                        </>
                                      ) : unitForm.startDate !==
                                        unitForm.endDate ? (
                                        <>
                                          {duration.diffDays} Day
                                          {duration.diffDays > 1
                                            ? "s"
                                            : ""} /{" "}
                                          <span style={{ color: "#28a745" }}>
                                            {duration.diffDays * 24} hrs
                                          </span>
                                        </>
                                      ) : null}
                                      )
                                      {duration?.diffDays === 1 &&
                                        duration?.extraHours === 0 &&
                                        unitForm.startDate ===
                                          unitForm.endDate && (
                                          <>
                                            <br />
                                            <span
                                              style={{
                                                color: "#dc3545",
                                                lineHeight: "1",
                                                fontSize: "14px",
                                              }}
                                            >
                                              (Flat rate applies
                                              <br />
                                              for same-day <br /> rental)
                                            </span>
                                          </>
                                        )}
                                      {duration.extraHours > 0 && (
                                        <>
                                          <br />
                                          (+
                                          <span style={{ color: "#dc3545" }}>
                                            {duration.extraHours} hr
                                            {duration.extraHours > 1
                                              ? "s"
                                              : ""}{" "}
                                            | ₱
                                            {duration.extraHours *
                                              selectedUnit.extension}
                                          </span>
                                          )
                                        </>
                                      )}
                                    </>
                                  ) : (
                                    <span style={{ color: "red" }}>
                                      Rental duration must be at least 1 hour
                                    </span>
                                  )}
                                </div>
                              </div>
                              {discountAmount > 0 && (
                                <div className="quotation-detail-row">
                                  <div className="quotation-label">
                                    Discount:
                                    <br />
                                    <span className="quotation-sub">
                                      {discountType === "peso"
                                        ? `₱${discountValue.toLocaleString()}`
                                        : `${discountValue}%`}
                                    </span>
                                  </div>
                                  <div
                                    className="quotation-price"
                                    style={{ color: "#dc3545" }}
                                  >
                                    - ₱{discountAmount.toLocaleString()}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="fill-up-form-banner">
                              FILL-UP FORM
                            </div>
                          </div>

                          <div className="select-row">
                            <div className="select-box">
                              <label>Driving Option</label>
                              <select
                                name="drivingOption"
                                value={unitForm.drivingOption || "Self-Drive"}
                                onChange={(e) =>
                                  handleInputChange(selectedUnitId, e)
                                }
                                required
                              >
                                <option value="Self-Drive">Self Drive</option>
                                <option value="With Driver">With Driver</option>
                              </select>
                            </div>

                            <div className="select-box">
                              <label>Pickup / Drop-off</label>
                              <select
                                name="pickupOption"
                                value={unitForm.pickupOption || "Pickup"}
                                onChange={(e) =>
                                  handleInputChange(selectedUnitId, e)
                                }
                                required
                              >
                                <option value="Pickup">Pickup</option>
                                <option value="Drop-off">Drop-off</option>
                              </select>
                            </div>
                          </div>

                          {formData[selectedUnit.id]?.drivingOption ===
                            "With Driver" && (
                            <div className="select-row">
                              <div className="select-box">
                                <label>Assigned Driver</label>
                                <input
                                  type="text"
                                  name="assignedDriver"
                                  value={
                                    formData[selectedUnit.id]?.assignedDriver ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    handleInputChange(selectedUnit.id, e)
                                  }
                                  className="default-text-input"
                                  placeholder="Enter Assigned Driver"
                                  required
                                />
                              </div>
                            </div>
                          )}

                          {formData[selectedUnit.id]?.pickupOption ===
                            "Drop-off" && (
                            <div className="select-row">
                              <div className="select-box">
                                <label>Drop-off Location</label>
                                <input
                                  type="text"
                                  name="dropoffLocation"
                                  value={
                                    formData[selectedUnit.id]
                                      ?.dropoffLocation || ""
                                  }
                                  onChange={(e) =>
                                    handleInputChange(selectedUnit.id, e)
                                  }
                                  className="default-text-input"
                                  placeholder="Enter Drop-off Location"
                                  required
                                />
                              </div>
                            </div>
                          )}

                          <div className="select-row">
                            <div className="select-box">
                              <label>Start Date</label>
                              <input
                                type="date"
                                name="startDate"
                                value={unitForm.startDate || ""}
                                onChange={(e) =>
                                  handleInputChange(selectedUnitId, e)
                                }
                                required
                              />
                            </div>

                            <div className="select-box">
                              <label>Start Time</label>
                              <input
                                type="time"
                                name="startTime"
                                value={unitForm.startTime || ""}
                                onChange={(e) =>
                                  handleInputChange(selectedUnitId, e)
                                }
                                required
                              />
                            </div>
                          </div>

                          <div className="select-row">
                            <div className="select-box">
                              <label>End Date</label>
                              <input
                                type="date"
                                name="endDate"
                                value={unitForm.endDate || ""}
                                onChange={(e) =>
                                  handleInputChange(selectedUnitId, e)
                                }
                                required
                                className={
                                  isEndDateInvalid ? "invalid-input" : ""
                                }
                              />
                            </div>

                            <div className="select-box">
                              <label>End Time</label>
                              <input
                                type="time"
                                name="endTime"
                                value={unitForm.endTime || ""}
                                onChange={(e) =>
                                  handleInputChange(selectedUnitId, e)
                                }
                                required
                                ref={(el) =>
                                  (endTimeRefs.current[selectedUnitId] = el)
                                }
                                className={
                                  highlightedEndTime === selectedUnitId
                                    ? "highlight-endtime"
                                    : ""
                                }
                              />
                            </div>
                          </div>

                          <div className="select-row">
                            <div className="select-box">
                              <label>Location</label>
                              <input
                                type="text"
                                name="location"
                                value={unitForm.location || ""}
                                onChange={(e) =>
                                  handleInputChange(selectedUnitId, e)
                                }
                                className="default-text-input"
                                placeholder="Enter location"
                                required
                              />
                            </div>
                          </div>

                          <div className="select-row">
                            <div className="select-box">
                              <label>Purpose</label>
                              <input
                                type="text"
                                name="purpose"
                                value={unitForm.purpose || ""}
                                onChange={(e) =>
                                  handleInputChange(selectedUnitId, e)
                                }
                                className="default-text-input"
                                placeholder="Enter purpose"
                                required
                              />
                            </div>
                          </div>

                          <div
                            className="upload-box-wrapper"
                            ref={(el) =>
                              (uploadBoxRefs.current[selectedUnitId] = el)
                            }
                          >
                            <div className="upload-box">
                              <label style={{ marginTop: "20px" }}>
                                Upload Driver's License
                              </label>

                              {fileErrors[selectedUnitId] && (
                                <div style={{ color: "red" }}>
                                  Driver's License is required!
                                </div>
                              )}

                              {filePreviews[selectedUnitId] && (
                                <img
                                  src={filePreviews[selectedUnitId]}
                                  alt="Driver's License"
                                  className="license-preview"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => {
                                    setModalImage(
                                      filePreviews[selectedUnit.id],
                                    );
                                    setIsImageModalOpen(true);
                                  }}
                                />
                              )}

                              <label
                                htmlFor={`license-upload-${selectedUnitId}`}
                                className="upload-label"
                              >
                                {unitForm.driverLicense
                                  ? "Change Driver's License"
                                  : "Upload Driver's License"}
                              </label>

                              <input
                                type="file"
                                id={`license-upload-${selectedUnitId}`}
                                name="driverLicense"
                                accept="image/*"
                                className={`hidden-file-input ${
                                  fileErrors[selectedUnitId]
                                    ? "error-border"
                                    : ""
                                }`}
                                ref={(el) =>
                                  (fileInputRefs.current[selectedUnitId] = el)
                                }
                                onChange={(e) => {
                                  handleInputChange(selectedUnitId, e);
                                  const file = e.target.files[0];
                                  if (file) {
                                    setFilePreviews((prev) => ({
                                      ...prev,
                                      [selectedUnitId]:
                                        URL.createObjectURL(file),
                                    }));
                                    setFileErrors((prev) => ({
                                      ...prev,
                                      [selectedUnitId]: false,
                                    }));
                                  }
                                }}
                              />
                            </div>
                          </div>

                          <div className="personal-info-section">
                            <h4>Personal Information</h4>
                            <div className="personal-info-fields">
                              <div className="input-with-icon">
                                <input
                                  type="text"
                                  name="firstName"
                                  placeholder="First Name"
                                  className="personal-info-input"
                                  value={unitForm.firstName || ""}
                                  onChange={(e) =>
                                    handleInputChange(selectedUnitId, e)
                                  }
                                  required
                                />
                                <div
                                  className="icon-container"
                                  onClick={() =>
                                    setShowCustomerSelectDialog(true)
                                  }
                                >
                                  <img
                                    src="/assets/passenger.png"
                                    alt="Passenger"
                                  />
                                </div>
                              </div>
                              <input
                                type="text"
                                name="middleName"
                                placeholder="Middle Name (N/A if none)"
                                className="personal-info-input"
                                value={unitForm.middleName || ""}
                                onChange={(e) =>
                                  handleInputChange(selectedUnitId, e)
                                }
                                required
                              />
                              <input
                                type="text"
                                name="surname"
                                placeholder="Surname"
                                className="personal-info-input"
                                value={unitForm.surname || ""}
                                onChange={(e) =>
                                  handleInputChange(selectedUnitId, e)
                                }
                                required
                              />

                              <input
                                type="text"
                                name="address"
                                placeholder="Current Address"
                                className="personal-info-input"
                                value={unitForm.address || ""}
                                onChange={(e) =>
                                  handleInputChange(selectedUnitId, e)
                                }
                                required
                              />
                            </div>
                          </div>

                          <div className="contact-occupation-section">
                            <h4>Contact & Occupation</h4>
                            <div className="contact-occupation-fields">
                              <input
                                type="tel"
                                name="contact"
                                placeholder="Contact No."
                                className="personal-info-input"
                                value={unitForm.contact || ""}
                                onChange={(e) =>
                                  handleInputChange(selectedUnitId, e)
                                }
                                required
                              />
                              <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                className="personal-info-input"
                                value={unitForm.email || ""}
                                onChange={(e) =>
                                  handleInputChange(selectedUnitId, e)
                                }
                                required
                              />
                              <input
                                type="text"
                                name="occupation"
                                placeholder="Occupation"
                                className="personal-info-input"
                                value={unitForm.occupation || ""}
                                onChange={(e) =>
                                  handleInputChange(selectedUnitId, e)
                                }
                                required
                              />
                            </div>
                          </div>

                          <div className="message-section">
                            <h4 className="message-label">
                              Referral Source (Optional)
                            </h4>

                            <select
                              name="referralSource"
                              className="referral-info"
                              value={unitForm.referralSource || ""}
                              onChange={(e) =>
                                handleInputChange(selectedUnitId, e)
                              }
                            >
                              <option value="" disabled>
                                Select referral source
                              </option>

                              {referralSources.map((source) => (
                                <option key={source} value={source}>
                                  {source}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="message-section">
                            <h4 className="message-label">
                              Additional Message
                            </h4>
                            <textarea
                              name="additionalMessage"
                              placeholder="Enter any additional message..."
                              className="message-input"
                              value={unitForm.additionalMessage || ""}
                              onChange={(e) =>
                                handleInputChange(selectedUnitId, e)
                              }
                            />
                          </div>

                          <div className="payment-section">
                            <h4 className="payment-label">Payment Details</h4>

                            {localPaymentEntries.length > 0 && (
                              <div className="payment-table-container">
                                <table className="payment-table">
                                  <thead>
                                    <tr>
                                      <th>AMOUNT</th>
                                      <th>MOP</th>
                                      <th>POP</th>
                                      <th>Date</th>
                                      <th>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {localPaymentEntries.map((entry, index) => (
                                      <tr
                                        key={index}
                                        className={
                                          editingIndex === index
                                            ? "editing-row"
                                            : ""
                                        }
                                      >
                                        <td>₱{entry.amount}</td>
                                        <td>{entry.mop}</td>
                                        <td>{entry.pop}</td>
                                        <td>{formatPaymentDate(entry.date)}</td>
                                        <td>
                                          <div className="payment-buttons-group">
                                            <button
                                              type="button"
                                              className="edit-payment-btn"
                                              onClick={() =>
                                                editPaymentEntry(index)
                                              }
                                            >
                                              Edit
                                            </button>

                                            <button
                                              type="button"
                                              className="remove-payment-btn"
                                              onClick={() => {
                                                setRemovePaymentEntryIndex(
                                                  index,
                                                ); // store which row to remove
                                                setShowRemovePaymentEntryConfirm(
                                                  true,
                                                );
                                              }}
                                            >
                                              Remove
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            <div className="payment-labels">
                              <span>AMOUNT</span>
                              <span>MOP</span>
                              <span>POP</span>
                              <span>Date</span>
                            </div>
                            <div className="scrollable-selects">
                              <input
                                type="number"
                                name="amount"
                                value={currentPayment.amount}
                                onChange={handlePaymentChange}
                                placeholder="Enter Amount"
                                min="0"
                              />

                              <select
                                name="mop"
                                value={currentPayment.mop}
                                onChange={handlePaymentChange}
                              >
                                <option value="">Select MOP</option>
                                {mopTypes.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>

                              <select
                                name="pop"
                                value={currentPayment.pop}
                                onChange={handlePaymentChange}
                              >
                                <option value="">Select POP</option>
                                {popTypesRevenue.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>

                              <input
                                type="datetime-local"
                                name="date"
                                value={currentPayment.date}
                                onChange={handlePaymentChange}
                              />
                            </div>

                            <button
                              type="button"
                              onClick={savePaymentEntry}
                              className="save-payment-btn"
                            >
                              {editingIndex !== null
                                ? "Update Payment"
                                : "Save Payment"}
                            </button>
                            <button
                              type="button"
                              onClick={addNewPayment}
                              className="add-new-payment-btn"
                            >
                              Reset Input
                            </button>
                          </div>

                          <div className="contact-occupation-section">
                            <h4>Discounts (Not Required)</h4>

                            <div className="discount-fields">
                              <div className="discount-input-group-vertical">
                                <div className="discount-row">
                                  <select
                                    name="discountType"
                                    value={
                                      formData[selectedUnit.id]?.discountType ||
                                      "peso"
                                    }
                                    onChange={(e) =>
                                      handleInputChange(selectedUnit.id, {
                                        target: {
                                          name: "discountType",
                                          value: e.target.value,
                                        },
                                      })
                                    }
                                    className="percentage-toggle-select"
                                  >
                                    <option value="peso">₱</option>
                                    <option value="percent">%</option>
                                  </select>

                                  <input
                                    type="number"
                                    name="discountValue"
                                    className="discount-value-input"
                                    min={0}
                                    value={discountValue}
                                    onChange={(e) => {
                                      let value = Number(e.target.value);
                                      if (isNaN(value)) value = 0;
                                      handleInputChange(selectedUnit.id, {
                                        target: {
                                          name: "discountValue",
                                          value,
                                        },
                                      });
                                    }}
                                  />
                                </div>

                                <div className="discount-divider-row">
                                  <div className="discount-buttons">
                                    {[10, 100, 1000].map((amount) => (
                                      <button
                                        key={`minus-${amount}`}
                                        type="button"
                                        className="discount-btn"
                                        onClick={() => {
                                          const current = Math.max(
                                            0,
                                            Number(
                                              formData[selectedUnit.id]
                                                ?.discountValue || 0,
                                            ) - amount,
                                          );
                                          handleInputChange(selectedUnit.id, {
                                            target: {
                                              name: "discountValue",
                                              value: current,
                                            },
                                          });
                                        }}
                                      >
                                        -{amount}
                                      </button>
                                    ))}
                                  </div>

                                  <span className="discount-divider">||</span>

                                  <div className="discount-buttons">
                                    {[10, 100, 1000].map((amount) => (
                                      <button
                                        key={`plus-${amount}`}
                                        type="button"
                                        className="discount-btn"
                                        onClick={() => {
                                          const current =
                                            Number(
                                              formData[selectedUnit.id]
                                                ?.discountValue || 0,
                                            ) + amount;
                                          handleInputChange(selectedUnit.id, {
                                            target: {
                                              name: "discountValue",
                                              value: current,
                                            },
                                          });
                                        }}
                                      >
                                        +{amount}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}

                  {selectedUnitId && (
                    <div className="rental-actions-container">
                      <button
                        type="button"
                        className="rental-actions print-contract"
                        disabled={!formData[selectedUnitId]?.firstName}
                        onClick={() => {
                          const unitForm = formData[selectedUnitId];

                          const selectedUnit =
                            unitData.find((u) => u.id === selectedUnitId) ||
                            null;

                          if (!selectedUnit) {
                            return null;
                          }

                          const duration = getRentalDuration(unitForm);

                          const rentalDays =
                            unitForm.startDate === unitForm.endDate &&
                            duration?.diffHours < 24
                              ? 0
                              : duration?.diffDays || 0;

                          const billedDays = duration?.isFlatRateSameDay
                            ? 1
                            : rentalDays;

                          const discountedRate = getDiscountedRate(
                            selectedUnit,
                            rentalDays,
                          );
                          const drivingPrice = getDrivingPrice(
                            selectedUnit,
                            unitForm.drivingOption,
                          );
                          const pickupPrice = getPickupPrice(
                            selectedUnit,
                            unitForm.pickupOption,
                          );

                          const extraHourCharge =
                            duration?.isFlatRateSameDay || !duration?.extraHours
                              ? 0
                              : duration.extraHours * selectedUnit.extension;

                          const total =
                            billedDays * discountedRate +
                            billedDays * drivingPrice +
                            pickupPrice +
                            extraHourCharge;

                          const enrichedBooking = {
                            ...unitForm,
                            carName: selectedUnit.name,
                            plateNo: selectedUnit.plateNo,
                            totalPrice: total,
                            discountedRate,
                            extraHourCharge,
                            billedDays,
                            rentalDuration: {
                              days: rentalDays,
                              extraHours: duration?.extraHours || 0,
                              isFlatRateSameDay:
                                duration?.isFlatRateSameDay || false,
                              actualSeconds: duration?.actualSeconds || 0,
                            },
                          };

                          generateFilledContract(enrichedBooking);
                        }}
                      >
                        Print Contract
                      </button>

                      <button
                        className="rental-actions start-rental"
                        onClick={(e) => handleSubmit(e, selectedUnitId)}
                      >
                        Start Rental
                      </button>

                      <button
                        type="button"
                        className="rental-actions clear-all"
                        onClick={() => {
                          setClearUnitId(selectedUnitId);
                          setShowClearConfirm(true);
                        }}
                      >
                        Clear All
                      </button>
                    </div>
                  )}

                  {selectedUnitId && formData[selectedUnitId] && (
                    <div style={{ display: "none" }}>
                      <div ref={printRef}>
                        <PrintContract booking={formData[selectedUnitId]} />
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>

        {(subSection === "overview" || subSection === "balance-due") && (
          <div
            className={`balance-due-column ${subSection === "balance-due" ? "single-balance" : ""}`}
            style={{
              display:
                subSection === "overview" || subSection === "balance-due"
                  ? "block"
                  : "none",
            }}
          >
            <div className="ongoing-units-header-wrapper">
              <h2 className="ongoing-units-header">BALANCE DUE</h2>
              <div className="filter-dropdown hoverable-dropdown">
                <button className="filter-button">
                  {balanceFilter === "ALL"
                    ? "All"
                    : balanceFilter === "ZERO"
                      ? "Pending"
                      : "Unpaid"}{" "}
                  ▾
                </button>
                <div className="filter-menu">
                  {["ALL", "ZERO", "NONZERO"].map((type) => (
                    <div
                      key={type}
                      className={`filter-option ${
                        balanceFilter === type ? "selected" : ""
                      }`}
                      onClick={() => setBalanceFilter(type)}
                    >
                      {type === "ALL"
                        ? "All"
                        : type === "ZERO"
                          ? "Pending"
                          : "Unpaid"}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="balance-due-cards">
              {filteredBalanceBookings.length === 0 ? (
                <div className="no-balance-message">
                  🎉 Hooray! No rentals with balance due! 🎉
                </div>
              ) : (
                filteredBalanceBookings.map((booking) => (
                  <div key={booking.id} className="ongoing-unit-card">
                    <div className="ongoing-unit-gradient-overlay">
                      <h3 style={{ color: "#28a745", margin: "0px" }}>
                        {booking.carName}
                      </h3>
                      <div className="ongoing-unit-info">
                        <div className="info-block">
                          <span className="label">Renter:</span>
                          <span className="value">{booking.renterName}</span>
                        </div>
                        <div className="info-block">
                          <span className="label">Total Price:</span>
                          <span className="value">
                            ₱{booking.totalPrice?.toLocaleString()}
                          </span>
                        </div>
                        <div
                          className="info-block"
                          style={{ fontWeight: "bold" }}
                        >
                          <span className="label" style={{ fontSize: "1rem" }}>
                            Balance Due:
                          </span>
                          <span
                            className="value"
                            style={{
                              fontSize: "1.5rem",
                              color:
                                Number(booking.balanceDue) === 0
                                  ? "#28a745"
                                  : "#dc3545",
                            }}
                          >
                            ₱{booking.balanceDue?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="ongoing-unit-image-wrapper">
                      {(() => {
                        if (!booking) return null;

                        // Use booking.imageId first, then try unitData, then fallback to plateNo_main
                        const imageId =
                          booking.imageId ||
                          unitData.find((u) => u.name === booking.carName)
                            ?.imageId ||
                          `${booking.plateNo}_main`;

                        const image = fetchedImages[imageId];

                        if (!image?.base64) {
                          return (
                            <div className="unit-main-image-placeholder">
                              Loading...
                            </div>
                          );
                        }

                        return (
                          <img
                            src={image.base64}
                            key={image.updatedAt}
                            alt={booking.carName}
                            className="ongoing-unit-image"
                          />
                        );
                      })()}
                    </div>

                    <span
                      className={`ongoing-unit-status-badge ${
                        booking.balanceDue === 0 ? "paid" : "unpaid"
                      }`}
                    >
                      {booking.status === "Completed"
                        ? booking.balanceDue === 0
                          ? "Pending for ( Mark as Paid )"
                          : "Unpaid"
                        : booking.status}
                    </span>

                    <button
                      className="ongoing-unit-details-button"
                      onClick={() => {
                        console.log("Selected Booking Details:", booking);
                        setSelectedBooking(booking);
                        setShowBalanceDetailsOverlay(true);
                      }}
                    >
                      Details
                    </button>
                    <div className="ongoing-unit-progress-container">
                      <div className="ongoing-unit-action-buttons">
                        <button
                          className="action-button cancel"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setBalanceDueFormData(booking);
                            setShowEditBalanceDueConfirm(true);
                          }}
                        >
                          Update Payment
                        </button>

                        {booking.balanceDue === 0 && !booking.paid && (
                          <button
                            className="action-button finish"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowMarkAsPaidConfirm(true);
                            }}
                          >
                            Mark as Paid
                          </button>
                        )}

                        <button
                          className="action-button reserve"
                          onClick={() => {
                            setSelectedBooking(booking); // store the current booking data
                            setShowCallBookingConfirm(true);
                          }}
                        >
                          Call
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
};

// export default RentalActivitySection;


export default React.memo(RentalActivitySection);

