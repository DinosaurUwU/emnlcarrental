"use client";
//AnalyticsSection.js
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./AnalyticsSection.css";
import { generateFilledCalendar } from "./generateFilledCalendar";

import ChartDataLabels from "chartjs-plugin-datalabels";
import { useUser } from "../lib/UserContext";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler,
  Tooltip,
  Legend,
  ChartDataLabels,
);

console.log("AnalyticsSection render");

const AnalyticsSection = ({ subSection = "overview" }) => {
  const {
    completedBookingsAnalytics,
    calendarEvents,
    generatePerDayCalendarEvents,
    unitData,
    revenueGrid,
    expenseGrid,
    fetchImageFromFirestore,
    imageUpdateTrigger,
    activeBookings,
    generateCalendarEventsWithVacant,
  } = useUser();
  const [analyticsData, setAnalyticsData] = useState({});
  const calendarRef = useRef();

  const [metric, setMetric] = useState("sales");
  const [carType, setCarType] = useState("ALL");
  const [timeRange, setTimeRange] = useState("month");

  const [scrollCarType, setScrollCarType] = useState("ALL");
  const [scrollTimeRange, setScrollTimeRange] = useState("month");

  const [summaryMetric, setSummaryMetric] = useState("profit");
  const [summaryCarType, setSummaryCarType] = useState("ALL");
  const [summaryTimeRange, setSummaryTimeRange] = useState("month");

  const [showUnitDetailsOverlay, setShowUnitDetailsOverlay] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  const [selectedUnitBookings, setSelectedUnitBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsOverlay, setShowDetailsOverlay] = useState(false);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  const [showCalendarEventsOverlay, setShowCalendarEventsOverlay] =
    useState(false);
  const [selectedCalendarBooking, setSelectedCalendarBooking] = useState(null);
  const [showDataLabels, setShowDataLabels] = useState(false);

  const [showLabels, setShowLabels] = useState(false);
  const [showPoints, setShowPoints] = useState(true);

  const [pieChartCategory, setPieChartCategory] = useState("financial");
  const [lineChartMode, setLineChartMode] = useState("financial"); // "financial" or "bookings"
  const [scrollMetric, setScrollMetric] = useState("bookings");

  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [chartType, setChartType] = useState("line");

  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const [searchQuery, setSearchQuery] = useState("");

  const [affTableMode, setAffTableMode] = useState("partners"); // "partners" | "units"
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);

  const [affSortKey, setAffSortKey] = useState(null);
  const [affSortDirection, setAffSortDirection] = useState("asc");
  const [activeColumn, setActiveColumn] = useState(null);
  const [affSearchQuery, setAffSearchQuery] = useState("");

  const [unitSortKey, setUnitSortKey] = useState(null);
  const [unitSortDirection, setUnitSortDirection] = useState("asc");
  const [unitSearchQuery, setUnitSearchQuery] = useState("");

  const [fetchedImages, setFetchedImages] = useState({});

  const [showSettings, setShowSettings] = useState(false);
  //SCROLL RELATED
  const scrollYRef = useRef(0);

  const [profit, setProfit] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [bookings, setBookings] = useState(0);
  const [unpaidBookingsSum, setUnpaidBookingsSum] = useState(0);
  const [unpaidBookingsCount, setUnpaidBookingsCount] = useState(0);

  useEffect(() => {
    console.time("summaryData computation");

    const entries = Object.entries(analyticsData || {}).filter(
      ([plateNo, car]) => {
        if (
          summaryCarType !== "ALL" &&
          car.carType?.toUpperCase() !== summaryCarType
        )
          return false;
        return true;
      },
    );

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalProfit = 0;
    let totalBookings = 0;
    let totalUnpaidSum = 0;
    let totalUnpaidCount = 0;

    const timeFilter = (key) => {
      if (summaryTimeRange === "custom") {
        if (!customStartDate || !customEndDate) return false;
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        let date;
        if (/^\d{4}-\d{2}$/.test(key)) {
          // month
          date = new Date(
            Number(key.split("-")[0]),
            Number(key.split("-")[1]) - 1,
            1,
          );
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
          // day
          date = new Date(key);
        } else {
          return false;
        }
        return date >= start && date <= end;
      } else if (summaryTimeRange === "year") {
        return key === getTimeKey("year");
      } else if (summaryTimeRange === "month") {
        return key === getTimeKey("month");
      } else if (summaryTimeRange === "week") {
        return key === "thisWeek";
      } else if (summaryTimeRange === "yesterday") {
        return key === "yesterday";
      }
      return false;
    };

    entries.forEach(([plateNo, car]) => {
      if (!car.bookings) return;

      car.bookings.forEach((booking) => {
        const bookingDate = new Date(booking.endDate);

        let include = false;
        switch (summaryTimeRange) {
          case "custom":
            if (!customStartDate || !customEndDate) return;
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            if (bookingDate >= start && bookingDate <= end) include = true;
            break;
          case "year":
            if (booking.endDate.startsWith(getTimeKey("year"))) include = true;
            break;
          case "month":
            if (booking.endDate.startsWith(getTimeKey("month"))) include = true;
            break;
          case "week":
            if (booking.isThisWeek) include = true;
            break;
          case "yesterday":
            if (booking.isYesterday) include = true;
            break;
        }
        if (!include) return;

        totalBookings++;

        const income = booking.totalPaid || 0;

        const matchingUnit = unitData.find(
          (unit) =>
            unit.plateNo.trim().toLowerCase() === plateNo.trim().toLowerCase(),
        );

        const ownerShareRaw = matchingUnit?.ownerShare ?? 0;
        const expense =
          ownerShareRaw <= 1 ? income * ownerShareRaw : ownerShareRaw;

        totalIncome += income;
        totalExpenses += expense;
        totalProfit += income - expense;

        if (booking.paid === false) {
          totalUnpaidSum += booking.balanceDue || 0;
          totalUnpaidCount += 1;
        }
      });
    });

    setProfit(totalProfit);
    setRevenue(totalIncome);
    setExpenses(totalExpenses);
    setBookings(totalBookings);
    setUnpaidBookingsSum(totalUnpaidSum);
    setUnpaidBookingsCount(totalUnpaidCount);

    console.timeEnd("summaryData computation");
  }, [
    analyticsData,
    summaryCarType,
    summaryTimeRange,
    customStartDate,
    customEndDate,
    unitData,
  ]);

  useEffect(() => {
    if (!unitData || unitData.length === 0) return;

    const fetchTableImages = async () => {
      const imageIds = new Set();

      // Add unit images
      unitData.forEach((unit) => {
        if (unit.imageId) imageIds.add(unit.imageId);
        else if (unit.plateNo) imageIds.add(`${unit.plateNo}_main`);
      });

      // Add active bookings images (if available)
      activeBookings?.forEach((booking) => {
        if (booking.imageId) imageIds.add(booking.imageId);
        else if (booking.plateNo) imageIds.add(`${booking.plateNo}_main`);
      });

      const promises = [...imageIds].map(async (id) => {
        try {
          const image = await fetchImageFromFirestore(id);
          if (image) return { [id]: image };
          return {
            [id]: { base64: "/images/default.png", updatedAt: Date.now() },
          };
        } catch {
          return {
            [id]: { base64: "/images/default.png", updatedAt: Date.now() },
          };
        }
      });

      const results = await Promise.all(promises);

      const merged = results
        .filter(Boolean)
        .reduce((acc, cur) => ({ ...acc, ...cur }), {});

      // Merge into existing images, don't replace
      setFetchedImages((prev) => ({
        ...prev,
        ...merged,
      }));
    };

    fetchTableImages();
  }, [unitData, activeBookings, imageUpdateTrigger]);

  const [calendarViewMode, setCalendarViewMode] = useState("ALL"); // "ALL" or unitId
  const carUnitOptions = Object.entries(analyticsData).map(
    ([unitId, carData]) => ({
      unitId,
      label: carData.carName,
      plateNo: carData.plateNo || unitId,
    }),
  );

  const [calendarStatusFilter, setCalendarStatusFilter] = useState("ALL");

  const filteredCalendarEvents = useMemo(() => {
    let filtered = calendarEvents;

    // Filter by status
    if (calendarStatusFilter !== "ALL") {
      const statusSet = new Set();

      switch (calendarStatusFilter) {
        case "COMPLETED":
          statusSet.add("COMPLETED");
          break;
        case "ACTIVE":
          statusSet.add("ACTIVE");
          break;
        case "PENDING":
          statusSet.add("PENDING");
          break;
        case "ACTIVE_PENDING":
          statusSet.add("ACTIVE");
          statusSet.add("PENDING");
          break;
        case "ACTIVE_COMPLETED":
          statusSet.add("ACTIVE");
          statusSet.add("COMPLETED");
          break;
        case "PENDING_COMPLETED":
          statusSet.add("PENDING");
          statusSet.add("COMPLETED");
          break;
        default:
          break;
      }

      filtered = filtered.filter((e) => {
        const status = e.fullData?.status?.toUpperCase() || "";
        return statusSet.has(status);
      });
    }

    // Filter by unit
    if (calendarViewMode !== "ALL") {
      filtered = filtered.filter((e) => {
        const eventUnitId = e.fullData?.unitId || e.fullData?.plateNo || "";
        return eventUnitId === calendarViewMode;
      });

      // Per-unit logic (vacant days, per-day conversion)
      const timeZone = "Asia/Manila";
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const bookedDates = new Set();

      filtered.forEach((e) => {
        const start = new Date(e.start);
        const end = new Date(e.end);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        const current = new Date(start);
        while (current <= end) {
          const iso = current.toLocaleDateString("en-CA", { timeZone });
          bookedDates.add(iso);
          current.setDate(current.getDate() + 1);
        }
      });

      const earliestDate = filtered.length
        ? new Date(
            Math.min(...filtered.map((e) => new Date(e.start).getTime())),
          )
        : (() => {
            const fallback = new Date();
            fallback.setDate(fallback.getDate() - 30);
            fallback.setHours(0, 0, 0, 0);
            return fallback;
          })();

      const vacantEvents = [];
      (() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const firstDayOfLastMonth = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1,
        );
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        const current = new Date(firstDayOfLastMonth);

        while (current <= yesterday) {
          const iso = current.toLocaleDateString("en-CA", { timeZone });
          if (!bookedDates.has(iso)) {
            vacantEvents.push({
              title: "Vacant",
              start: iso,
              end: iso,
              backgroundColor: "#e9ecef",
              textColor: "#000",
              borderColor: "#ced4da",
              fullData: { unitId: calendarViewMode },
              clickable: false,
            });
          }
          current.setDate(current.getDate() + 1);
        }
      })();

      const perDayTransformed = filtered.flatMap((e) => {
        const fullData = e.fullData;
        if (!fullData || fullData.status !== "Completed") return [e];
        return generatePerDayCalendarEvents(fullData);
      });

      return [...vacantEvents, ...perDayTransformed];
    }

    return filtered;
  }, [calendarViewMode, calendarStatusFilter, calendarEvents]);

  //OVERLAY STOP BACKGROUND CLICK AND SCROLL
  useEffect(() => {
    const handleClickOrScroll = (e) => {
      if (
        !showUnitDetailsOverlay &&
        !showDetailsOverlay &&
        !showCalendarEventsOverlay
      ) {
        setShowSettings(false);
      }
    };

    const preventTouch = (e) => {
      if (
        showUnitDetailsOverlay ||
        showDetailsOverlay ||
        showCalendarEventsOverlay
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("mousedown", handleClickOrScroll);
    document.addEventListener("scroll", handleClickOrScroll);
    document.addEventListener("touchmove", preventTouch, { passive: false });

    if (
      showUnitDetailsOverlay ||
      showDetailsOverlay ||
      showCalendarEventsOverlay
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
  }, [showUnitDetailsOverlay, showDetailsOverlay, showCalendarEventsOverlay]);

  // PRELOAD UNITS TABLE IMAGES
  useEffect(() => {
    // Preload images to prevent flash when switching tabs or rendering units
    const imagesToPreload = unitData.map(
      (unit) => unit.image || "/images/default.png",
    );
    imagesToPreload.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [unitData]);

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

  const closeModal = () => {
    setIsImageModalOpen(false);
    setModalImage(null);
  };

  useEffect(() => {
    console.log(
      "📊 Real-time Completed Bookings Analytics:",
      completedBookingsAnalytics,
    );
    setAnalyticsData(completedBookingsAnalytics);
  }, [completedBookingsAnalytics]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp?.seconds) return "";
    const date = new Date(timestamp.seconds * 1000);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const formatEndDate = (endDateStr) => {
    if (!endDateStr) return "";
    const [yyyy, mm, dd] = endDateStr.split("-");
    return `${mm}/${dd}/${yyyy}`;
  };

  const handleShowDetailsOverlay = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsOverlay(true);
  };

  const backgroundPlugin = {
    id: "custom_canvas_background_color",
    beforeDraw: (chart) => {
      const ctx = chart.canvas.getContext("2d");
      ctx.save();
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#c8e6c9";
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    },
  };

  const getTimeKey = (range) => {
    switch (range) {
      case "yesterday":
        return "yesterday";
      case "week":
        return "thisWeek";
      case "month":
        return new Date().toISOString().slice(0, 7);
      case "year":
        return new Date().getFullYear().toString();
      default:
        return new Date().toISOString().slice(0, 7);
    }
  };

  const getEmptyMessage = (carType, timeRange) => {
    if (carType === "ALL") return "No data available for this period.";

    const carTypeLabel = carType.toUpperCase();

    const timeMap = {
      today: "Today",
      yesterday: "Yesterday",
      week: "This Week",
      month: "This Month",
      year: "This Year",
    };

    return `No ${carTypeLabel} units rented ${
      timeMap[timeRange] || "for this period"
    }`;
  };

  const timeKey = getTimeKey(timeRange);

  const selectedData = Object.entries(analyticsData)
    .filter(([_, carData]) => {
      if (carType === "ALL") return true;
      return carData.carType === carType;
    })

    .map(([unitId, carData]) => {
      const timeData = carData[timeKey] || {};
      return {
        unitId,
        model: carData.carName,
        hoursRented: timeData.hours || 0,
        revenue: timeData.revenue || 0,
        timesRented: timeData.timesRented || 0,
      };
    })

    .filter((car) => {
      // Remove cars with zero values for the selected metric
      return metric === "sales" ? car.revenue > 0 : car.timesRented > 0;
    })
    .sort((a, b) => {
      // Sort by selected metric, high to low
      return metric === "sales"
        ? b.revenue - a.revenue
        : b.timesRented - a.timesRented;
    });

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const scrollableData = useMemo(() => {
    const timeFilter = (booking) => {
      const bookingDate = new Date(booking.endDate);
      switch (summaryTimeRange) {
        case "custom":
          if (!customStartDate || !customEndDate) return false;
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          return bookingDate >= start && bookingDate <= end;
        case "year":
          return bookingDate.toISOString().slice(0, 4) === getTimeKey("year");
        case "month":
          return bookingDate.toISOString().slice(0, 7) === getTimeKey("month");
        case "week":
          return booking.isThisWeek;
        case "yesterday":
          return booking.isYesterday;
        default:
          return false;
      }
    };

    const result = Object.entries(analyticsData)
      // Filter car type
      .filter(([_, carData]) => {
        if (summaryCarType === "ALL") return true;
        return carData.carType === summaryCarType;
      })

      .filter(([unitId, carData]) => {
        if (!searchQuery.trim()) return true;
        const plateNo = carData.plateNo || unitId;
        return (
          carData.carName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plateNo?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })

      .map(([unitId, carData]) => {
        let totalRevenue = 0;
        let totalTimesRented = 0;
        let totalExpense = 0;

        const filteredBookings = (carData.bookings || []).filter(timeFilter);

        // Find matching unit once per unitId
        const matchingUnit = unitData.find(
          (u) =>
            u.plateNo?.trim().toLowerCase() === unitId.trim().toLowerCase(),
        );

        filteredBookings.forEach((booking) => {
          const paidAmount = booking.totalPaid || 0;

          totalRevenue += paidAmount;
          totalTimesRented++;

          // EXPENSE LOGIC COPIED FROM summaryData
          const ownerShareRaw = matchingUnit?.ownerShare ?? 0;
          const expense =
            ownerShareRaw <= 1 ? paidAmount * ownerShareRaw : ownerShareRaw;

          totalExpense += expense;
        });

        const unpaidBookings = filteredBookings.filter((b) => !b.paid);
        const unpaidCount = unpaidBookings.length;
        const dueBalances = unpaidBookings.reduce(
          (sum, b) => sum + (b.balanceDue || 0),
          0,
        );

        return {
          unitId,
          model: carData.carName,
          plateNo: carData.plateNo || unitId,
          revenue: totalRevenue,
          expenses: totalExpense,
          profit: totalRevenue - totalExpense,
          timesRented: totalTimesRented,
          imageId: matchingUnit?.imageId,
          bookings: filteredBookings,
          unpaidCount,
          dueBalances,
        };
      })

      .filter((car) => car.timesRented > 0 || car.revenue > 0);

    // Sort after calculation
    if (sortKey) {
      result.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        if (sortKey === "model") {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (sortDirection === "asc") {
          return valA > valB ? 1 : valA < valB ? -1 : 0;
        } else {
          return valA < valB ? 1 : valA > valB ? -1 : 0;
        }
      });
    }

    return result;
  }, [
    analyticsData,
    summaryCarType,
    summaryTimeRange,
    customStartDate,
    customEndDate,
    sortKey,
    sortDirection,
    searchQuery,
  ]);

  const handleAffSort = (key) => {
    if (affSortKey === key) {
      setAffSortDirection(affSortDirection === "asc" ? "desc" : "asc");
    } else {
      setAffSortKey(key);
      setAffSortDirection("desc");
    }
    setActiveColumn(key);
  };

  const affiliationPartnersData = useMemo(() => {
    const timeFilter = (booking) => {
      const bookingDate = new Date(booking.endDate);
      switch (summaryTimeRange) {
        case "custom":
          if (!customStartDate || !customEndDate) return false;
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          return bookingDate >= start && bookingDate <= end;
        case "year":
          return bookingDate.toISOString().slice(0, 4) === getTimeKey("year");
        case "month":
          return bookingDate.toISOString().slice(0, 7) === getTimeKey("month");
        case "week":
          return booking.isThisWeek;
        case "yesterday":
          return booking.isYesterday;
        default:
          return false;
      }
    };

    let grouped = {};

    unitData.forEach((unit) => {
      if (!unit?.owner) return; // skip units without owner

      const ownerId = unit.owner; // use owner as key
      if (!grouped[ownerId]) {
        grouped[ownerId] = {
          partnerId: ownerId,
          partnerName: unit.owner || "Unnamed Owner",
          cars: [],
          totalRevenue: 0,
          ownerShareTotal: 0,
          companyShareTotal: 0,
        };
      }

      // Find car analytics from analyticsData
      const carAnalytics = analyticsData[unit.plateNo?.trim()] || null;

      let revenue = 0;
      let totalOwnerShare = 0;
      let bookingsCount = 0;
      if (carAnalytics?.bookings?.length > 0) {
        const filteredBookings = carAnalytics.bookings.filter(timeFilter);
        revenue = filteredBookings.reduce(
          (sum, b) => sum + (b.totalPaid || 0),
          0,
        );
        bookingsCount = filteredBookings.length;

        const rawShare = unit.ownerShare || 0;
        filteredBookings.forEach((booking) => {
          const paidAmount = booking.totalPaid || 0;
          const expense = rawShare <= 1 ? paidAmount * rawShare : rawShare;
          totalOwnerShare += expense;
        });
      }

      const companyShare = revenue - totalOwnerShare;

      grouped[ownerId].cars.push({
        plateNo: unit.plateNo,
        carName: unit.name || "Unnamed Car",
        revenue,
        ownerShare: totalOwnerShare,
        companyShare,
        bookingsCount,
        ownerName: unit.owner || "Unnamed Owner",
        imageId: unit.imageId,
      });

      grouped[ownerId].totalRevenue += revenue;
      grouped[ownerId].ownerShareTotal += totalOwnerShare;
      grouped[ownerId].companyShareTotal += companyShare;
    });

    // Calculate totalBookings for each partner
    Object.values(grouped).forEach((partner) => {
      partner.totalBookings = partner.cars.reduce(
        (sum, car) => sum + car.bookingsCount,
        0,
      );
    });

    // Sort partners
    let partners = Object.values(grouped);
    if (affSortKey) {
      partners.sort((a, b) => {
        let valA, valB;
        switch (affSortKey) {
          case "partnerName":
            valA = a.partnerName.toLowerCase();
            valB = b.partnerName.toLowerCase();
            break;
          case "unitsOwned":
            valA = a.cars.length;
            valB = b.cars.length;
            break;
          case "totalBookings":
            valA = a.totalBookings;
            valB = b.totalBookings;
            break;
          case "totalRevenue":
            valA = a.totalRevenue;
            valB = b.totalRevenue;
            break;
          case "ownerShareTotal":
            valA = a.ownerShareTotal;
            valB = b.ownerShareTotal;
            break;
          case "companyShareTotal":
            valA = a.companyShareTotal;
            valB = b.companyShareTotal;
            break;
          default:
            return 0;
        }
        if (affSortDirection === "asc") {
          return valA > valB ? 1 : valA < valB ? -1 : 0;
        } else {
          return valA < valB ? 1 : valA > valB ? -1 : 0;
        }
      });
    }

    // Sort units
    let units = partners.flatMap((ownerGroup) => ownerGroup.cars);
    if (affSortKey) {
      units.sort((a, b) => {
        let valA, valB;
        switch (affSortKey) {
          case "carName":
            valA = a.carName.toLowerCase();
            valB = b.carName.toLowerCase();
            break;
          case "bookingsCount":
            valA = a.bookingsCount;
            valB = b.bookingsCount;
            break;
          case "ownerName":
            valA = a.ownerName.toLowerCase();
            valB = b.ownerName.toLowerCase();
            break;
          case "revenue":
            valA = a.revenue;
            valB = b.revenue;
            break;
          case "ownerShare":
            valA = a.ownerShare;
            valB = b.ownerShare;
            break;
          case "companyShare":
            valA = a.companyShare;
            valB = b.companyShare;
            break;
          default:
            return 0;
        }
        if (affSortDirection === "asc") {
          return valA > valB ? 1 : valA < valB ? -1 : 0;
        } else {
          return valA < valB ? 1 : valA > valB ? -1 : 0;
        }
      });
    }

    return { partners, units };
  }, [
    unitData,
    analyticsData,
    summaryTimeRange,
    customStartDate,
    customEndDate,
    affSortKey,
    affSortDirection,
    affSearchQuery,
  ]);

  const affiliationSummaryData = useMemo(() => {
    const totalRevenue = affiliationPartnersData.partners.reduce(
      (sum, p) => sum + p.totalRevenue,
      0,
    );
    const totalPartnerShare = affiliationPartnersData.partners.reduce(
      (sum, p) => sum + p.ownerShareTotal,
      0,
    );
    const totalCompanyShare = affiliationPartnersData.partners.reduce(
      (sum, p) => sum + p.companyShareTotal,
      0,
    );

    return {
      totalRevenue,
      totalPartnerShare,
      totalCompanyShare,
    };
  }, [affiliationPartnersData]);

  const filteredPartners = affiliationPartnersData.partners.filter((p) => {
    const query = affSearchQuery.toLowerCase().trim();
    if (!query) return p.totalRevenue > 0;
    // Check partner name
    if (p.partnerName.toLowerCase().includes(query)) return true;
    // Check if any car matches
    return p.cars.some(
      (car) =>
        car.carName.toLowerCase().includes(query) ||
        car.plateNo.toLowerCase().includes(query),
    );
  });

  const filteredUnits = affiliationPartnersData.units.filter((car) => {
    const query = affSearchQuery.toLowerCase().trim();
    if (!query) return car.bookingsCount > 0;
    return (
      car.carName.toLowerCase().includes(query) ||
      car.ownerName.toLowerCase().includes(query) ||
      car.plateNo.toLowerCase().includes(query)
    );
  });

  const handleUnitSort = (key) => {
    if (unitSortKey === key) {
      setUnitSortDirection(unitSortDirection === "asc" ? "desc" : "asc");
    } else {
      setUnitSortKey(key);
      setUnitSortDirection("desc");
    }
  };

  const formatPeso = (value) => {
    value = Number(value.toFixed(2));
    return `₱${value.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getCenterText = (summaryTimeRange) => {
    const now = new Date();
    const year = now.getFullYear();
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

    switch (summaryTimeRange) {
      case "year":
        return `Year ${year}`;

      case "month":
        return `${monthNames[now.getMonth()]} ${year}`;

      case "week": {
        // Compute current week's Sunday–Saturday range (localized to Asia/Manila)
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0=Sun
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - dayOfWeek);
        const saturday = new Date(today);
        saturday.setDate(today.getDate() + (6 - dayOfWeek));

        const startMonth = monthNames[sunday.getMonth()];
        const endMonth = monthNames[saturday.getMonth()];
        const startDay = sunday.getDate();
        const endDay = saturday.getDate();

        // Handle month crossover (e.g., Sep 29–Oct 5)
        if (startMonth === endMonth) {
          return `${startMonth} ${startDay}–${endDay}`;
        } else {
          return `${startMonth} ${startDay}–${endMonth} ${endDay}`;
        }
      }
      case "yesterday": {
        const yest = new Date(now);
        yest.setDate(now.getDate() - 1);
        return `Yesterday\n${monthNames[yest.getMonth()]} ${yest.getDate()}`;
      }

      case "custom":
        if (!customStartDate || !customEndDate) return "Custom\nSelect Dates";
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        const startMonth = monthNames[start.getMonth()];
        const startDay = start.getDate();
        const endMonth = monthNames[end.getMonth()];
        const endDay = end.getDate();
        const customYear = start.getFullYear();
        return `Custom\n${startMonth} ${startDay} - ${endMonth} ${endDay}\n${customYear}`;

      default:
        return "";
    }
  };

  const isDateIncluded = (
    date,
    summaryTimeRange,
    customStartDate,
    customEndDate,
  ) => {
    if (!(date instanceof Date) || isNaN(date)) return false;

    const today = new Date();

    switch (summaryTimeRange) {
      case "custom": {
        if (!customStartDate || !customEndDate) return false;
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999); // include whole day
        return date >= start && date <= end;
      }

      case "year":
        return date.getFullYear() === today.getFullYear();

      case "month":
        return (
          date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth()
        );

      case "week": {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return date >= startOfWeek && date <= endOfWeek;
      }

      case "yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const endYesterday = new Date(yesterday);
        endYesterday.setHours(23, 59, 59, 999);

        return date >= yesterday && date <= endYesterday;
      }

      default:
        return true;
    }
  };

  const pieChartData = useMemo(() => {
    const rentedUnits = Object.entries(analyticsData || {}).filter(
      ([_, car]) =>
        (summaryCarType === "ALL" || car.carType === summaryCarType) &&
        Array.isArray(car.bookings) &&
        car.bookings.length > 0,
    );

    // ======== Per-unit financial & bookings arrays ========
    const profitData = [];
    const revenueData = [];
    const expenseData = [];
    const bookingsData = [];
    const unpaidBookingsData = [];
    const dueBalancesData = [];

    const profitColors = [];
    const revenueColors = [];
    const expenseColors = [];
    const bookingsColors = [];
    const unpaidBookingsColors = [];
    const dueBalancesColors = [];

    const baseProfit = { h: 145, s: 63, l: 45 };
    const baseRevenue = { h: 45, s: 100, l: 50 };
    const baseExpense = { h: 0, s: 80, l: 50 };
    const baseBookings = { h: 210, s: 90, l: 50 };
    const baseUnpaid = { h: 30, s: 90, l: 50 };
    const baseDue = { h: 0, s: 80, l: 50 };

    rentedUnits.forEach(([plateNo, car], i) => {
      let totalProfit = 0;
      let totalRevenue = 0;
      let totalExpense = 0;
      let totalBookings = 0;
      let totalUnpaidCount = 0;
      let totalUnpaidSum = 0;

      car.bookings.forEach((booking) => {
        const bookingDate = new Date(booking.endDate);
        if (
          !isDateIncluded(
            bookingDate,
            summaryTimeRange,
            customStartDate,
            customEndDate,
          )
        )
          return;

        const income = booking.totalPaid || 0;
        const matchingUnit = unitData?.find(
          (unit) =>
            unit.plateNo.trim().toLowerCase() === plateNo.trim().toLowerCase(),
        );
        const ownerShareRaw = matchingUnit?.ownerShare ?? 0;
        const expense =
          ownerShareRaw <= 1 ? income * ownerShareRaw : ownerShareRaw;
        const profit = income - expense;

        totalRevenue += income;
        totalExpense += expense;
        totalProfit += profit;
        totalBookings++;

        if (booking.paid === false) {
          totalUnpaidSum += booking.balanceDue || 0;
          totalUnpaidCount++;
        }
      });

      profitData.push(totalProfit);
      revenueData.push(totalRevenue);
      expenseData.push(totalExpense);

      // bookingsData.push(totalBookings > 0 ? totalBookings : 0.01);
      // unpaidBookingsData.push(totalUnpaidCount > 0 ? totalUnpaidCount : 0.01);
      // dueBalancesData.push(totalUnpaidSum > 0 ? totalUnpaidSum : 0.01);

      bookingsData.push(totalBookings);
      unpaidBookingsData.push(totalUnpaidCount);
      dueBalancesData.push(totalUnpaidSum);

      // Colors
      profitColors.push(
        totalProfit > 0
          ? `hsl(${baseProfit.h}, ${baseProfit.s}%, ${
              baseProfit.l + (i / rentedUnits.length) * 20 - 10
            }%)`
          : totalProfit < 0
            ? "rgba(255,0,0,0.75)"
            : "#adb5bd",
      );
      revenueColors.push(
        totalRevenue !== 0
          ? `hsl(${baseRevenue.h}, ${baseRevenue.s}%, ${
              baseRevenue.l + (i / rentedUnits.length) * 20 - 10
            }%)`
          : "#adb5bd",
      );
      expenseColors.push(
        totalExpense !== 0
          ? `hsl(${baseExpense.h}, ${baseExpense.s}%, ${
              baseExpense.l + (i / rentedUnits.length) * 20 - 10
            }%)`
          : "#adb5bd",
      );
      bookingsColors.push(
        totalBookings > 0
          ? `hsl(${baseBookings.h}, ${baseBookings.s}%, ${
              baseBookings.l + (i / rentedUnits.length) * 20 - 10
            }%)`
          : "#adb5bd",
      );
      unpaidBookingsColors.push(
        totalUnpaidCount > 0
          ? `hsl(${baseUnpaid.h}, ${baseUnpaid.s}%, ${
              baseUnpaid.l + (i / rentedUnits.length) * 20 - 10
            }%)`
          : "#adb5bd",
      );
      dueBalancesColors.push(
        totalUnpaidSum > 0
          ? `hsl(${baseDue.h}, ${baseDue.s}%, ${
              baseDue.l + (i / rentedUnits.length) * 20 - 10
            }%)`
          : "#adb5bd",
      );
    });

    // ======== Pie chart datasets ========
    let labels = [];
    let datasets = [];

    // Referral
    if (pieChartCategory === "referral") {
      const referralCounts = {};
      rentedUnits.forEach(([_, car]) => {
        car.bookings.forEach((booking) => {
          const date = new Date(booking.endDate);
          if (
            !isDateIncluded(
              date,
              summaryTimeRange,
              customStartDate,
              customEndDate,
            )
          )
            return;

          const ref = booking.referralSource || "Not specified";
          referralCounts[ref] = (referralCounts[ref] || 0) + 1;
        });
      });

      labels = Object.keys(referralCounts);
      datasets = [
        {
          label: "Referral Sources",
          data: Object.values(referralCounts),
          backgroundColor: labels.map(
            (_, i) => `hsl(${210 + i * 30}, 90%, 50%)`,
          ),
          radius: "100%",
          cutout: "60%",
        },
      ];
    }

    // Revenue summary (aggregated)
    else if (pieChartCategory === "revenue") {
      const mopCounts = {};
      const popCounts = {};

      Object.values(revenueGrid || {}).forEach((monthRows) => {
        if (!Array.isArray(monthRows)) return;
        monthRows.forEach((row) => {
          const date = new Date(row?.[4]);
          if (
            !isDateIncluded(
              date,
              summaryTimeRange,
              customStartDate,
              customEndDate,
            )
          )
            return;

          const amount = parseFloat(row?.[1]?.replace(/[₱,]/g, "")) || 0;
          const mop = row?.[2];
          const pop = row?.[3];

          if (mop && amount > 0)
            mopCounts[mop] = (mopCounts[mop] || 0) + amount;
          if (pop && amount > 0)
            popCounts[pop] = (popCounts[pop] || 0) + amount;
        });
      });

      const mopLabels = Object.keys(mopCounts).map((l) => `MOP: ${l}`);
      const popLabels = Object.keys(popCounts).map((l) => `POP: ${l}`);

      datasets = [
        {
          label: "Revenue MOP",
          data: Object.values(mopCounts),
          sliceLabels: mopLabels,
          backgroundColor: mopLabels.map(
            (_, i) => `hsl(${120 + i * 30}, 70%, 50%)`,
          ),
          radius: "100%",
          cutout: "55%",
        },
        {
          label: "Revenue POP",
          data: Object.values(popCounts),
          sliceLabels: popLabels,
          backgroundColor: popLabels.map(
            (_, i) => `hsl(${200 + i * 30}, 70%, 55%)`,
          ),
          radius: "95%",
          cutout: "50%",
        },
      ];
      labels = Array(Math.max(mopLabels.length, popLabels.length)).fill("");
    }

    // Expense summary (aggregated)
    else if (pieChartCategory === "expense") {
      const mopCounts = {};
      const poeCounts = {};

      Object.values(expenseGrid || {}).forEach((monthRows) => {
        if (!Array.isArray(monthRows)) return;
        monthRows.forEach((row) => {
          const date = new Date(row?.[4]);
          if (
            !isDateIncluded(
              date,
              summaryTimeRange,
              customStartDate,
              customEndDate,
            )
          )
            return;

          const amount = parseFloat(row?.[1]?.replace(/[₱,]/g, "")) || 0;
          const mop = row?.[2];
          const poe = row?.[3];

          if (mop && amount > 0)
            mopCounts[mop] = (mopCounts[mop] || 0) + amount;
          if (poe && amount > 0)
            poeCounts[poe] = (poeCounts[poe] || 0) + amount;
        });
      });

      const mopLabels = Object.keys(mopCounts).map((l) => `MOP: ${l}`);
      const poeLabels = Object.keys(poeCounts).map((l) => `POE: ${l}`);

      datasets = [
        {
          label: "Expense MOP",
          data: Object.values(mopCounts),
          sliceLabels: mopLabels,
          backgroundColor: mopLabels.map(
            (_, i) => `hsl(${0 + i * 30}, 70%, 50%)`,
          ),
          radius: "100%",
          cutout: "55%",
        },
        {
          label: "Expense POE",
          data: Object.values(poeCounts),
          sliceLabels: poeLabels,
          backgroundColor: poeLabels.map(
            (_, i) => `hsl(${30 + i * 30}, 70%, 55%)`,
          ),
          radius: "95%",
          cutout: "50%",
        },
      ];
      labels = Array(Math.max(mopLabels.length, poeLabels.length)).fill("");
    } else {
      labels = rentedUnits.map(
        ([plateNo, car]) => `${car.carName} (${plateNo})`,
      );
      datasets =
        pieChartCategory === "financial"
          ? [
              {
                label: "Profit",
                data: profitData,
                backgroundColor: profitColors,
                cutout: "60%",
                radius: "100%",
                sliceLabels: rentedUnits.map(
                  ([plateNo, car]) => `${car.carName} (${plateNo})`,
                ),
              },
              {
                label: "Revenue",
                data: revenueData,
                backgroundColor: revenueColors,
                cutout: "60%",
                radius: "95%",
                sliceLabels: rentedUnits.map(
                  ([plateNo, car]) => `${car.carName} (${plateNo})`,
                ),
              },
              {
                label: "Expense",
                data: expenseData,
                backgroundColor: expenseColors,
                cutout: "60%",
                radius: "90%",
                sliceLabels: rentedUnits.map(
                  ([plateNo, car]) => `${car.carName} (${plateNo})`,
                ),
              },
            ]
          : [
              {
                label: "Bookings",
                data: bookingsData,
                backgroundColor: bookingsColors,
                cutout: "60%",
                radius: "100%",
              },
              {
                label: "Unpaid Bookings",
                data: unpaidBookingsData,
                backgroundColor: unpaidBookingsColors,
                cutout: "60%",
                radius: "95%",
              },
              {
                label: "Due Balances",
                data: dueBalancesData,
                backgroundColor: dueBalancesColors,
                cutout: "60%",
                radius: "90%",
              },
            ];
    }

    const hasData = datasets.some(
      (ds) => Array.isArray(ds.data) && ds.data.some((v) => v > 0),
    );

    if (!hasData) {
      return {
        labels: ["No Data"],
        datasets: [
          {
            label: "No Data",
            data: [1],
            backgroundColor: ["#dc3545"], // red
            radius: "100%",
            cutout: "70%",
          },
        ],
      };
    }

    return { labels, datasets };
  }, [
    analyticsData,
    summaryCarType,
    summaryTimeRange,
    customStartDate,
    customEndDate,
    unitData,
    pieChartCategory,
    revenueGrid,
    expenseGrid,
  ]);

  const lineChartData = useMemo(() => {
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

    let labels = [];
    let revenueData = [];
    let expensesData = [];
    let profitData = [];
    let bookingsData = [];
    let unpaidBookingsData = [];
    let dueBalancesData = [];

    const now = new Date();

    // Filter by car type
    const filteredAnalytics = Object.entries(analyticsData).filter(
      ([_, car]) => summaryCarType === "ALL" || car.carType === summaryCarType,
    );

    // YEAR VIEW
    if (summaryTimeRange === "year") {
      const carTypeLabel =
        summaryCarType && summaryCarType !== ""
          ? summaryCarType.toUpperCase()
          : "ALL";

      labels = Array.from(
        { length: 12 },
        (_, m) => `$monthNames[m] - ${carTypeLabel}`,
      );
      labels = Array.from(
        { length: 12 },
        (_, m) => `${monthNames[m]} - ${carTypeLabel}`,
      );

      for (let m = 0; m < 12; m++) {
        const key = `${now.getFullYear()}-${String(m + 1).padStart(2, "0")}`;

        let monthRevenue = 0;
        let monthExpenses = 0;
        let monthBookings = 0;
        let unpaidCount = 0;
        let dueBalance = 0;

        filteredAnalytics.forEach(([_, car]) => {
          if (!car.bookings) return;

          car.bookings.forEach((booking) => {
            if (booking.endDate.startsWith(key)) {
              const paidAmount = booking.totalPaid || 0;

              monthRevenue += paidAmount;
              monthBookings++;

              if (!booking.paid) {
                // unpaid booking
                unpaidCount++;
                dueBalance += booking.balanceDue; // sum of remaining balance
              }

              const matchUnit = unitData.find(
                (u) =>
                  u.plateNo.toLowerCase() === booking.plateNo?.toLowerCase(),
              );
              const ownerShare = matchUnit?.ownerShare ?? 0;
              monthExpenses +=
                ownerShare <= 1 ? paidAmount * ownerShare : ownerShare;
            }
          });
        });

        revenueData.push(monthRevenue);
        expensesData.push(monthExpenses);
        profitData.push(monthRevenue - monthExpenses);
        bookingsData.push(monthBookings);
        unpaidBookingsData.push(unpaidCount);
        dueBalancesData.push(dueBalance);
      }
    }

    // MONTH VIEW
    else if (summaryTimeRange === "month") {
      const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      ).getDate();

      for (let d = 1; d <= daysInMonth; d++) {
        const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
          2,
          "0",
        )}-${String(d).padStart(2, "0")}`;

        labels.push(`${monthNames[now.getMonth()]} ${d}`);

        let dayRevenue = 0;
        let dayExpenses = 0;
        let dayBookings = 0;
        let unpaidCount = 0;
        let dueBalance = 0;

        filteredAnalytics.forEach(([_, car]) => {
          if (!car.bookings) return;

          car.bookings.forEach((booking) => {
            if (booking.endDate.startsWith(key)) {
              const paidAmount = booking.totalPaid || 0;

              dayRevenue += paidAmount;
              dayBookings++;

              if (!booking.paid) {
                unpaidCount++;
                dueBalance += booking.balanceDue;
              }

              const matchUnit = unitData.find(
                (u) =>
                  u.plateNo.toLowerCase() === booking.plateNo?.toLowerCase(),
              );
              const ownerShare = matchUnit?.ownerShare ?? 0;
              dayExpenses +=
                ownerShare <= 1 ? paidAmount * ownerShare : ownerShare;
            }
          });
        });

        revenueData.push(dayRevenue);
        expensesData.push(dayExpenses);
        profitData.push(dayRevenue - dayExpenses);
        bookingsData.push(dayBookings);
        unpaidBookingsData.push(unpaidCount);
        dueBalancesData.push(dueBalance);
      }
    }

    // WEEK VIEW
    else if (summaryTimeRange === "week") {
      labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - ((today.getDay() + 6) % 7));

      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = d.toISOString().slice(0, 10);

        let wRevenue = 0;
        let wExpenses = 0;
        let wBookings = 0;
        let unpaidCount = 0;
        let dueBalance = 0;

        filteredAnalytics.forEach(([_, car]) => {
          if (!car.bookings) return;

          car.bookings.forEach((booking) => {
            if (booking.endDate.startsWith(key)) {
              const paidAmount = booking.totalPaid || 0;

              wRevenue += paidAmount;
              wBookings++;

              if (!booking.paid) {
                unpaidCount++;
                dueBalance += booking.balanceDue;
              }

              const matchUnit = unitData.find(
                (u) =>
                  u.plateNo.toLowerCase() === booking.plateNo?.toLowerCase(),
              );
              const ownerShare = matchUnit?.ownerShare ?? 0;
              wExpenses +=
                ownerShare <= 1 ? paidAmount * ownerShare : ownerShare;
            }
          });
        });

        revenueData.push(wRevenue);
        expensesData.push(wExpenses);
        profitData.push(wRevenue - wExpenses);
        bookingsData.push(wBookings);
        unpaidBookingsData.push(unpaidCount);
        dueBalancesData.push(dueBalance);
      }
    }

    // YESTERDAY VIEW
    else if (summaryTimeRange === "yesterday") {
      labels = ["Yesterday"];

      let rev = 0;
      let exp = 0;
      let book = 0;
      let unpaid = 0;
      let due = 0;

      filteredAnalytics.forEach(([_, car]) => {
        if (!car.bookings) return;

        car.bookings.forEach((booking) => {
          if (booking.isYesterday) {
            const paidAmount = booking.totalPaid || 0;

            rev += paidAmount;
            book++;

            if (!booking.paid) {
              unpaid++;
              due += booking.balanceDue;
            }

            const matchUnit = unitData.find(
              (u) => u.plateNo.toLowerCase() === booking.plateNo?.toLowerCase(),
            );
            const ownerShare = matchUnit?.ownerShare ?? 0;
            exp += ownerShare <= 1 ? paidAmount * ownerShare : ownerShare;
          }
        });
      });

      revenueData = [rev];
      expensesData = [exp];
      profitData = [rev - exp];
      bookingsData = [book];
      unpaidBookingsData = [unpaid];
      dueBalancesData = [due];
    }

    // CUSTOM DATE RANGE
    else if (summaryTimeRange === "custom") {
      if (!customStartDate || !customEndDate) return { labels, datasets: [] };

      const start = new Date(customStartDate);
      const end = new Date(customEndDate);

      const carMap = {
        revenue: [],
        expenses: [],
        profit: [],
        bookings: [],
        unpaidBookings: [],
        dueBalances: [],
      };

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
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
        labels.push(`${monthNames[d.getMonth()]} ${d.getDate()}`);

        let rev = 0;
        let exp = 0;
        let book = 0;
        let unpaid = 0;
        let due = 0;

        let topCar = null;
        let topRevenue = 0;

        filteredAnalytics.forEach(([_, car]) => {
          if (!car.bookings) return;

          car.bookings.forEach((booking) => {
            if (booking.endDate.startsWith(key)) {
              const paidAmount = booking.totalPaid || 0;

              rev += paidAmount;
              book++;

              if (!booking.paid) {
                unpaid++;
                due += booking.balanceDue;
              }

              const matchUnit = unitData.find(
                (u) =>
                  u.plateNo.toLowerCase() === booking.plateNo?.toLowerCase(),
              );
              const ownerShare = matchUnit?.ownerShare ?? 0;
              exp += ownerShare <= 1 ? paidAmount * ownerShare : ownerShare;

              if (paidAmount > topRevenue) {
                topRevenue = paidAmount;
                topCar = { plateNo: booking.plateNo, carName: booking.carName };
              }
            }
          });
        });

        revenueData.push(rev);
        expensesData.push(exp);
        profitData.push(rev - exp);
        bookingsData.push(book);
        unpaidBookingsData.push(unpaid);
        dueBalancesData.push(due);

        carMap.revenue.push(topCar);
        carMap.expenses.push(topCar);
        carMap.profit.push(topCar);
        carMap.bookings.push(topCar);
        carMap.unpaidBookings.push(topCar);
        carMap.dueBalances.push(topCar);
      }

      revenueData.carMap = carMap.revenue;
      expensesData.carMap = carMap.expenses;
      profitData.carMap = carMap.profit;
      bookingsData.carMap = carMap.bookings;
      unpaidBookingsData.carMap = carMap.unpaidBookings;
      dueBalancesData.carMap = carMap.dueBalances;
    }

    // DATASETS RETURN
    let datasets = [];

    if (lineChartMode === "financial") {
      datasets = [
        {
          label: "Revenue",
          data: revenueData,
          borderColor: "#ffc107",
          pointBackgroundColor: "#ffc107",
          pointBorderColor: "#ffc107",
          pointRadius: showPoints ? 4 : 0,
          pointHoverRadius: showPoints ? 6 : 0,
          fill: true,
          tension: 0.4,
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );
            gradient.addColorStop(0, "rgba(255, 193, 7, 0.40)");
            gradient.addColorStop(1, "rgba(255, 193, 7, 0.00)");
            return gradient;
          },
        },
        {
          label: "Expenses",
          data: expensesData,
          borderColor: "#dc3545",
          pointBackgroundColor: "#dc3545",
          pointBorderColor: "#dc3545",
          pointRadius: showPoints ? 4 : 0,
          pointHoverRadius: showPoints ? 6 : 0,
          fill: true,
          tension: 0.4,
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );
            gradient.addColorStop(0, "rgba(220, 53, 69, 0.40)");
            gradient.addColorStop(1, "rgba(220, 53, 69, 0.00)");
            return gradient;
          },
        },
        {
          label: "Profit",
          data: profitData,
          borderColor: "#28a745",
          pointBackgroundColor: "#28a745",
          pointBorderColor: "#28a745",
          pointRadius: showPoints ? 4 : 0,
          pointHoverRadius: showPoints ? 6 : 0,
          fill: true,
          tension: 0.4,
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );
            gradient.addColorStop(0, "rgba(40, 167, 69, 0.40)");
            gradient.addColorStop(1, "rgba(40, 167, 69, 0.00)");
            return gradient;
          },
        },
      ];
    }

    if (lineChartMode === "bookings") {
      datasets = [
        {
          label: "Bookings",
          data: bookingsData,
          borderColor: "#0d6efd",
          pointBackgroundColor: "#0d6efd",
          pointBorderColor: "#0d6efd",
          pointRadius: showPoints ? 4 : 0,
          pointHoverRadius: showPoints ? 6 : 0,
          tension: 0.4,
          fill: true,
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );
            gradient.addColorStop(0, "rgba(13, 110, 253, 0.40)");
            gradient.addColorStop(1, "rgba(13, 110, 253, 0.00)");
            return gradient;
          },
        },
        {
          label: "Unpaid Bookings",
          data: unpaidBookingsData,
          borderColor: "#fd7e14",
          pointBackgroundColor: "#fd7e14",
          pointBorderColor: "#fd7e14",
          pointRadius: showPoints ? 4 : 0,
          pointHoverRadius: showPoints ? 6 : 0,
          tension: 0.4,
          fill: true,
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );
            gradient.addColorStop(0, "rgba(253, 126, 20, 0.40)");
            gradient.addColorStop(1, "rgba(253, 126, 20, 0.00)");
            return gradient;
          },
        },
        {
          label: "Due Balances",
          data: dueBalancesData,
          borderColor: "#dc3545",
          pointBackgroundColor: "#dc3545",
          pointBorderColor: "#dc3545",
          pointRadius: showPoints ? 4 : 0,
          pointHoverRadius: showPoints ? 6 : 0,
          tension: 0.4,
          fill: true,
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );
            gradient.addColorStop(0, "rgba(220, 53, 69, 0.40)");
            gradient.addColorStop(1, "rgba(220, 53, 69, 0.00)");
            return gradient;
          },
        },
      ];
    }

    return { labels, datasets };
  }, [
    analyticsData,
    summaryCarType,
    summaryTimeRange,
    unitData,
    lineChartMode,
    showPoints,
  ]);

  const barChartData = useMemo(() => {
    const datasets = lineChartData.datasets.map((dataset) => {
      const { backgroundColor, ...rest } = dataset;
      return rest;
    });

    return {
      labels: lineChartData.labels,
      datasets,
    };
  }, [lineChartData]);

  const centerTextPlugin = {
    id: "centerText",
    beforeDraw(chart) {
      const {
        ctx,
        chartArea: { width, height, left, top },
      } = chart;
      ctx.save();

      const text = getCenterText(summaryTimeRange);

      ctx.font = "bold 16px Arial";
      ctx.fillStyle = "#333";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const centerX = left + width / 2;
      const centerY = top + height / 2;

      const lines = text.split("\n");
      lines.forEach((line, i) => {
        ctx.fillText(line, centerX, centerY + i * 18 - (lines.length - 1) * 9);
      });

      ctx.restore();
    },
  };

  const pieChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            boxWidth: 14,
            padding: 10,
            generateLabels: (chart) => {
              if (pieChartCategory === "referral") {
                return chart.data.labels.map((label, i) => {
                  const bgColor = chart.data.datasets[0].backgroundColor[i];
                  return {
                    text: label,
                    fillStyle: bgColor.replace(
                      /hsl\(([^)]+)\)/,
                      "hsla($1,0.2)",
                    ),
                    strokeStyle: bgColor,
                    lineWidth: 2,
                    hidden: chart.getDatasetMeta(0).data[i].hidden,
                    index: i,
                  };
                });
              }

              return chart.data.datasets.map((dataset, datasetIndex) => {
                // ===== Revenue / Expense (ONLY MOP + POP / POE) =====
                if (
                  pieChartCategory === "revenue" ||
                  pieChartCategory === "expense"
                ) {
                  const bgColor = Array.isArray(dataset.backgroundColor)
                    ? dataset.backgroundColor[0]
                    : dataset.backgroundColor;

                  return {
                    text: dataset.label, // "Revenue MOP", "Revenue POP", "Expense MOP", "Expense POE"
                    fillStyle: bgColor.replace(
                      /hsl\(([^)]+)\)/,
                      "hsla($1,0.2)",
                    ),
                    strokeStyle: bgColor,
                    lineWidth: 2,
                    hidden: chart.getDatasetMeta(datasetIndex).hidden,
                    index: datasetIndex,
                  };
                }

                let fillStyle = "#ccc";
                let strokeStyle = "#000";

                if (dataset.label === "Profit") {
                  fillStyle = "rgba(40,167,69,0.2)";
                  strokeStyle = "#28a745";
                } else if (dataset.label === "Revenue") {
                  fillStyle = "rgba(255,193,7,0.2)";
                  strokeStyle = "#ffc107";
                } else if (dataset.label === "Expense") {
                  fillStyle = "rgba(220,53,69,0.2)";
                  strokeStyle = "#dc3545";
                } else if (dataset.label === "Bookings") {
                  fillStyle = "rgba(13,110,253,0.2)";
                  strokeStyle = "#0d6efd";
                } else if (dataset.label === "Unpaid Bookings") {
                  fillStyle = "rgba(234,88,12,0.2)";
                  strokeStyle = "#ea580c";
                } else if (dataset.label === "Due Balances") {
                  fillStyle = "rgba(220,53,69,0.2)";
                  strokeStyle = "#dc3545";
                }

                return {
                  text: dataset.label,
                  fillStyle,
                  strokeStyle,
                  lineWidth: 2,
                  hidden: chart.getDatasetMeta(datasetIndex).hidden,
                  index: datasetIndex,
                };
              });
            },
          },

          onClick: (e, legendItem, legend) => {
            const chart = legend.chart;

            if (pieChartCategory === "referral") {
              const meta = chart.getDatasetMeta(0);
              meta.data[legendItem.index].hidden =
                !meta.data[legendItem.index].hidden;
            } else {
              const meta = chart.getDatasetMeta(legendItem.index);
              meta.hidden =
                meta.hidden === null
                  ? !chart.data.datasets[legendItem.index].hidden
                  : null;
            }

            chart.update();
          },
        },

        tooltip: {
          mode: "nearest",
          intersect: true,
          backgroundColor: (context) => {
            const label = context.tooltipItems?.[0]?.dataset?.label || "";
            if (label === "Profit") return "#dcfada";
            if (label === "Revenue") return "#f8ebda";
            if (label === "Expense") return "#f8d7da";
            if (label === "Bookings") return "#dae7ff";
            if (label === "Unpaid") return "#fff3e0";
            if (label === "Due") return "#f8d7da";
            return "#ffffff";
          },
          titleColor: "#000",
          bodyColor: "#000",
          borderColor: "#000",
          borderWidth: 0.5,
          padding: 6,
          cornerRadius: 8,
          displayColors: false,

          callbacks: {
            title(context) {
              const dataset = context[0]?.dataset;
              const item = context[0];

              if (dataset?.label === "No Data") {
                return "No Data";
              }

              if (pieChartCategory === "referral") {
                return item.label || "";
              }

              if (dataset.sliceLabels?.[context[0].dataIndex]) {
                return dataset.sliceLabels[context[0].dataIndex];
              }

              return dataset.label || "";
            },

            label(context) {
              const dataset = context.dataset;

              if (dataset.label === "No Data") {
                return "No Data";
              }

              const value = context.raw || 0;
              const total = dataset.data.reduce((sum, v) => sum + (v || 0), 0);
              const percentage =
                total > 0 ? ((value / total) * 100).toFixed(1) : 0;

              let labelText = dataset.label;

              if (dataset.label === "Due Balances") labelText = "Due";
              if (dataset.label === "Unpaid Bookings") labelText = "Unpaid";
              if (dataset.label === "Bookings") labelText = "Bookings";

              if (
                ["Profit", "Revenue", "Expense", "Due"].includes(labelText) ||
                dataset.label?.includes("MOP") ||
                dataset.label?.includes("POP") ||
                dataset.label?.includes("POE")
              ) {
                return `${labelText}: ${formatPeso(value)} (${percentage}%)`;
              }

              return `${labelText}: ${value} (${percentage}%)`;
            },
          },
        },

        datalabels: {
          display: showDataLabels,
          color: "#333",
          font: { weight: "bold" },
          formatter(value, context) {
            if (!value) return "";

            const datasetLabel = context.dataset.label;
            if (["Bookings", "Unpaid", "Due"].includes(datasetLabel)) {
              return value;
            }

            return formatPeso(value);
          },
        },
      },
    }),
    [showDataLabels, pieChartCategory],
  );

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 30,
        bottom: 10,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: { color: "#333", boxWidth: 15 },
      },
      tooltip: {
        mode: "nearest",
        intersect: true,
        backgroundColor: (context) => {
          const label = context.tooltipItems?.[0]?.dataset?.label || "";
          if (label === "Profit") return "#dcfada"; // light green
          if (label === "Revenue") return "#f8ebda"; // light yellow
          if (label === "Expenses") return "#f8d7da"; // light red
          if (label === "Bookings") return "#dae7ff";

          return "#ffffff";
        },
        titleColor: "#000",
        bodyColor: "#000",
        borderColor: "#000",
        borderWidth: 0.5,
        padding: 6,
        cornerRadius: 8,
        displayColors: false,

        callbacks: {
          title: function (context) {
            const label = context[0].label; // e.g. "Oct - SEDAN"
            const dataset = context[0].dataset;
            const index = context[0].dataIndex;
            const topCar = dataset.data?.carMap?.[index];

            if (topCar) {
              return `${topCar.carName} (${topCar.plateNo})\n${label}`;
            }

            return label;
          },

          label: function (context) {
            const datasetLabel = context.dataset.label;
            const value = context.raw || 0;
            const dataset = context.dataset;
            const index = context.dataIndex;

            const plateNo = dataset.plateNos
              ? dataset.plateNos[index]
              : context.label;
            const car = analyticsData?.[plateNo];
            const carName = car?.carName || "Unknown Car";
            const pesoValue = formatPeso(value);

            let lines = [];
            if (car) {
              lines.push(`${carName} (${plateNo})`);
            }
            if (
              datasetLabel === "Bookings" ||
              datasetLabel === "Unpaid Bookings"
            ) {
              return `${datasetLabel}: ${value}`;
            } else {
              return `${datasetLabel}: ${formatPeso(value)}`;
            }

            return lines;
          },
        },
      },

      datalabels: {
        display: showLabels,
        color: "#333",
        anchor: "end",
        align: "top",
        font: { weight: "bold", size: 11 },
        formatter: (value, context) => {
          const datasetLabel = context.dataset.label;
          if (datasetLabel === "Bookings") {
            return value; // no peso symbol
          }
          return formatPeso(Number(value || 0));
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#555" } },
      y: {
        beginAtZero: true,
        ticks: { color: "#555", callback: (value) => formatPeso(value) },
      },
    },
    elements: {
      line: { tension: 0.4 },
      point: { radius: 3 },
    },
    animation: { duration: 400 },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 30,
        bottom: 10,
      },
    },

    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          boxWidth: 14,
          padding: 10,
          color: "#333",
          generateLabels: (chart) => {
            return chart.data.datasets.map((dataset, i) => {
              let fillStyle, strokeStyle;
              if (dataset.label === "Profit") {
                fillStyle = "rgba(40, 167, 69, 0.2)";
                strokeStyle = "#28a745";
              } else if (dataset.label === "Revenue") {
                fillStyle = "rgba(255, 193, 7, 0.2)";
                strokeStyle = "#ffc107";
              } else if (dataset.label === "Expenses") {
                fillStyle = "rgba(220, 53, 69, 0.2)";
                strokeStyle = "#dc3545";
              } else if (dataset.label === "Bookings") {
                fillStyle = "rgba(13, 110, 253, 0.2)";
                strokeStyle = "#0d6efd";
              } else if (dataset.label === "Unpaid Bookings") {
                fillStyle = "rgba(234, 88, 12, 0.2)";
                strokeStyle = "#ea580c";
              } else if (dataset.label === "Due Balances") {
                fillStyle = "rgba(220, 53, 69, 0.2)";
                strokeStyle = "#dc3545";
              } else {
                fillStyle = "#ccc";
                strokeStyle = "#000";
              }
              return {
                text: dataset.label,
                fillStyle,
                strokeStyle,
                lineWidth: 2,
                hidden: chart.getDatasetMeta(i).hidden,
                index: i,
              };
            });
          },
        },
        onClick: (e, legendItem, legend) => {
          const index = legendItem.index;
          const chart = legend.chart;
          const meta = chart.getDatasetMeta(index);
          meta.hidden =
            meta.hidden === null ? !chart.data.datasets[index].hidden : null;
          chart.update();
        },
      },

      tooltip: {
        mode: "nearest",
        intersect: true,
        backgroundColor: (context) => {
          const label = context.tooltipItems?.[0]?.dataset?.label || "";
          if (label === "Profit") return "#dcfada";
          if (label === "Revenue") return "#f8ebda";
          if (label === "Expenses") return "#f8d7da";
          if (label === "Bookings") return "#dae7ff";

          return "#ffffff";
        },
        titleColor: "#000",
        bodyColor: "#000",
        borderColor: "#000",
        borderWidth: 0.5,
        padding: 6,
        cornerRadius: 8,
        displayColors: false,

        callbacks: {
          title: function (context) {
            const label = context[0].label; // e.g. "Oct - SEDAN"
            const dataset = context[0].dataset;
            const index = context[0].dataIndex;
            const topCar = dataset.data?.carMap?.[index];

            if (topCar) {
              return `${topCar.carName} (${topCar.plateNo})\n${label}`;
            }

            return label;
          },

          label: function (context) {
            const datasetLabel = context.dataset.label;
            const value = context.raw || 0;
            const dataset = context.dataset;
            const index = context.dataIndex;

            const plateNo = dataset.plateNos
              ? dataset.plateNos[index]
              : context.label;
            const car = analyticsData?.[plateNo];
            const carName = car?.carName || "Unknown Car";
            const pesoValue = formatPeso(value);

            let lines = [];
            if (car) {
              lines.push(`${carName} (${plateNo})`);
            }
            if (
              datasetLabel === "Bookings" ||
              datasetLabel === "Unpaid Bookings"
            ) {
              return `${datasetLabel}: ${value}`;
            } else {
              return `${datasetLabel}: ${formatPeso(value)}`;
            }

            return lines;
          },
        },
      },

      datalabels: {
        display: showLabels,
        color: "#333",
        anchor: "end",
        align: "top",
        font: { weight: "bold", size: 11 },
        formatter: (value, context) => {
          const datasetLabel = context.dataset.label;
          if (datasetLabel === "Bookings") {
            return value; // no peso symbol
          }
          return formatPeso(Number(value || 0));
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#555" } },
      y: {
        beginAtZero: true,
        ticks: { color: "#555", callback: (value) => formatPeso(value) },
      },
    },
    elements: {
      bar: {
        backgroundColor: (context) => {
          const datasetIndex = context.datasetIndex;
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom,
          );
          if (lineChartMode === "financial") {
            if (datasetIndex === 0) {
              gradient.addColorStop(0, "rgba(255, 193, 7, 1)");
              gradient.addColorStop(1, "rgba(255, 193, 7, 0.30)");
            } else if (datasetIndex === 1) {
              gradient.addColorStop(0, "rgba(220, 53, 69, 1)");
              gradient.addColorStop(1, "rgba(220, 53, 69, 0.30)");
            } else if (datasetIndex === 2) {
              gradient.addColorStop(0, "rgba(40, 167, 69, 1)");
              gradient.addColorStop(1, "rgba(40, 167, 69, 0.30)");
            }
          } else {
            if (datasetIndex === 0) {
              gradient.addColorStop(0, "rgba(13, 110, 253, 1)");
              gradient.addColorStop(1, "rgba(13, 110, 253, 0.30)");
            } else if (datasetIndex === 1) {
              gradient.addColorStop(0, "rgba(253, 126, 20, 1)");
              gradient.addColorStop(1, "rgba(253, 126, 20, 0.30)");
            } else if (datasetIndex === 2) {
              gradient.addColorStop(0, "rgba(220, 53, 69, 1)");
              gradient.addColorStop(1, "rgba(220, 53, 69, 0.30)");
            }
          }
          return gradient;
        },

        borderRadius: 4,
        barThickness: "flex",
        maxBarThickness: 40,
      },
    },

    animation: { duration: 400 },
  };

  return (
    <div className="analytics-section">
      <h2 className="analytics-title">Analytics</h2>

      <div className="analytics-summary-filters">
        <div className="analytics-summary-filter-group">
          <label className="analytics-summary-label">Car Type</label>
          <select
            className="analytics-summary-select"
            value={summaryCarType}
            onChange={(e) => setSummaryCarType(e.target.value)}
          >
            <option value="ALL">ALL</option>
            <option value="SEDAN">SEDAN</option>
            <option value="SUV">SUV</option>
            <option value="MPV">MPV</option>
            <option value="VAN">VAN</option>
            <option value="PICKUP">PICKUP</option>
          </select>
        </div>

        <div className="analytics-summary-filter-group">
          <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <label
                className="analytics-summary-label"
                style={{ margin: "0 0 5px 0" }}
              >
                Time Range
              </label>

              <select
                className="analytics-summary-select"
                value={summaryTimeRange}
                onChange={(e) => setSummaryTimeRange(e.target.value)}
              >
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            {summaryTimeRange === "custom" && (
              <>
                <span
                  style={{ fontSize: "50px", color: "var(--accent-color)" }}
                >
                  |
                </span>
                <div style={{ display: "flex", gap: "10px" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <label
                      className="analytics-summary-label"
                      style={{ margin: "0 0 5px 0" }}
                    >
                      Start Date
                    </label>

                    <input
                      type="date"
                      defaultValue={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="analytics-summary-input"
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <label
                      className="analytics-summary-label"
                      style={{ margin: "0 0 5px 0" }}
                    >
                      End Date
                    </label>

                    <input
                      type="date"
                      defaultValue={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="analytics-summary-input"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {(subSection === "overview" || subSection === "graphs") && (
        <div className="analytics-summary-section">
          <div className="analytics-summary-content">
            {/* Pie Chart Left */}
            <div className="analytics-piechart-container">
              <div className="analytics-datalabel-toggle">
                <button
                  onClick={() => setShowDataLabels((prev) => !prev)}
                  className="datalabel-toggle-button"
                >
                  {showDataLabels ? "Hide Labels" : "Show Labels"}
                </button>
                <button
                  onClick={() =>
                    setPieChartCategory(
                      pieChartCategory === "financial"
                        ? "bookings"
                        : "financial",
                    )
                  }
                  className="datalabel-toggle-button"
                >
                  {pieChartCategory === "financial"
                    ? "Show Bookings"
                    : "Show Financial"}
                </button>
                <select
                  value={pieChartCategory}
                  onChange={(e) => setPieChartCategory(e.target.value)}
                >
                  <option value="referral">Referral</option>
                  <option value="revenue">Revenue</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <p
                style={{
                  color: "var(--accent-color)",
                  textAlign: "center",
                  margin: "20px 0",
                  fontWeight: "900",
                  fontFamily: "Montserrat, sans-serif",
                  textTransform: "uppercase",
                }}
              >
                ( {summaryCarType} ){" "}
                {pieChartCategory === "financial"
                  ? "Financial Overview"
                  : pieChartCategory === "bookings"
                    ? "Bookings Overview"
                    : pieChartCategory === "referral"
                      ? "Referral Sources"
                      : pieChartCategory === "revenue"
                        ? "Revenue Breakdown (MOP + POP)"
                        : pieChartCategory === "expense"
                          ? "Expense Breakdown (MOP + POE)"
                          : ""}
              </p>

              <Doughnut
                key={`${summaryTimeRange}-${customStartDate}-${customEndDate}`}
                data={pieChartData}
                options={pieChartOptions}
                plugins={[centerTextPlugin]}
              />
            </div>

            {/* Summary Values Right */}
            <div className="analytics-summary-values">
              <div className="summary-row-top">
                <div className="summary-box profit">
                  <div className="box-content">
                    <p className="analytics-label">PROFIT</p>
                    <p className="analytics-value">{formatPeso(profit)}</p>
                    <p className="analytics-subtitle">Net Gain</p>
                  </div>
                  <div className="box-icon">
                    <img src="/assets/profit.png" alt="Profit" />
                  </div>
                </div>

                <div className="summary-box revenue">
                  <div className="box-content">
                    <p className="analytics-label">REVENUE</p>
                    <p className="analytics-value">{formatPeso(revenue)}</p>
                    <p className="analytics-subtitle">Total Income</p>
                  </div>
                  <div className="box-icon">
                    <img src="/assets/revenue.png" alt="Revenue" />
                  </div>
                </div>

                <div className="summary-box expenses">
                  <div className="box-content">
                    <p className="analytics-label">EXPENSES</p>
                    <p className="analytics-value">{formatPeso(expenses)}</p>
                    <p className="analytics-subtitle">Costs Incurred</p>
                  </div>
                  <div className="box-icon">
                    <img src="/assets/expense.png" alt="Expenses" />
                  </div>
                </div>
              </div>
              <div className="summary-row-bottom">
                <div className="summary-box bookings">
                  <div className="box-content">
                    <p className="analytics-label">BOOKINGS</p>
                    <p className="analytics-value">{bookings}</p>
                    <p className="analytics-subtitle">Total Rentals</p>
                  </div>
                  <div className="box-icon">
                    <img src="/assets/bookings.png" alt="Bookings" />
                  </div>
                </div>

                <div className="summary-box unpaid">
                  <div className="box-content">
                    <p className="analytics-label">UNPAID BOOKINGS</p>
                    <p className="analytics-value">{unpaidBookingsCount}</p>
                    <p className="analytics-subtitle">Pending Payments</p>
                  </div>
                  <div className="box-icon">
                    <img
                      src="/assets/unpaidBookings.png"
                      alt="Unpaid Bookings"
                    />
                  </div>
                </div>

                <div className="summary-box due">
                  <div className="box-content">
                    <p className="analytics-label">DUE BALANCES</p>
                    <p className="analytics-value">
                      {formatPeso(unpaidBookingsSum)}
                    </p>
                    <p className="analytics-subtitle">Outstanding</p>
                  </div>
                  <div className="box-icon">
                    <img src="/assets/dueBalance.png" alt="Due Balances" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="analytics-linechart-container">
            <div
              className="analytics-linechart-controls"
              style={{ display: "flex", gap: "10px", marginBottom: "10px" }}
            >
              <button
                onClick={() =>
                  setLineChartMode(
                    lineChartMode === "financial" ? "bookings" : "financial",
                  )
                }
                className="chart-toggle-btn"
              >
                {lineChartMode === "financial"
                  ? "Show Bookings"
                  : "Show Financial"}
              </button>
              <button
                onClick={() =>
                  setChartType(chartType === "line" ? "bar" : "line")
                }
                className="chart-toggle-btn"
              >
                {chartType === "line"
                  ? "Switch to Bar Chart"
                  : "Switch to Line Chart"}
              </button>
              <button
                onClick={() => setShowLabels((prev) => !prev)}
                className="chart-toggle-btn"
              >
                {showLabels ? "Hide Labels" : "Show Labels"}
              </button>

              <button
                onClick={() => setShowPoints((prev) => !prev)}
                className="chart-toggle-btn"
              >
                {showPoints ? "Hide Points" : "Show Points"}
              </button>
            </div>
            <p
              style={{
                color: "var(--accent-color)",
                textAlign: "center",
                margin: "20px 0 20px 0",
                fontWeight: "900",
                fontFamily: "Montserrat, sans-serif",
                textTransform: "uppercase",
              }}
            >
              {lineChartMode === "financial"
                ? `( ${summaryCarType} ) Financial Overview`
                : `( ${summaryCarType} ) Bookings Overview`}
            </p>

            {chartType === "bar" ? (
              <Bar data={barChartData} options={barChartOptions} />
            ) : (
              <Line data={lineChartData} options={lineChartOptions} />
            )}
          </div>
        </div>
      )}

      {/* Data Container (Side-by-Side Layout) */}
      <div className="data-container">
        {/* Sales Graph */}

        {(subSection === "overview" || subSection === "data") && (
          <div>
            <div className="car-status-table-wrapper">
              {/* Left Panel: Controls and Summary Boxes */}
              <div className="table-left-panel">
                <div className="scroll-mode-toggle">
                  <h2>DATA</h2>
                  <div className="toggle-button">
                    <button
                      className={scrollMetric === "bookings" ? "active" : ""}
                      onClick={() => setScrollMetric("bookings")}
                    >
                      Bookings
                    </button>
                    <button
                      className={scrollMetric === "financial" ? "active" : ""}
                      onClick={() => setScrollMetric("financial")}
                    >
                      Financial
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Search car name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="scroll-search-input"
                  />
                </div>

                {/* Summary Boxes Row */}
                <div className="summary-boxes-row-table">
                  {scrollMetric === "financial" ? (
                    <>
                      <div className="summary-box-table revenue-table">
                        <div className="box-content-table">
                          <p className="analytics-label-table">Revenue</p>
                          <p className="analytics-value-table">
                            {formatPeso(summaryData.revenue)}
                          </p>
                        </div>
                        <div className="box-icon-table">
                          <img src="/assets/revenue.png" alt="Revenue" />
                        </div>
                      </div>

                      <div className="summary-box-table expenses-table">
                        <div className="box-content-table">
                          <p className="analytics-label-table">Expenses</p>
                          <p className="analytics-value-table">
                            {formatPeso(summaryData.expenses)}
                          </p>
                        </div>
                        <div className="box-icon-table">
                          <img src="/assets/expense.png" alt="Expenses" />
                        </div>
                      </div>

                      <div className="summary-box-table profit-table">
                        <div className="box-content-table">
                          <p className="analytics-label-table">Profit</p>
                          <p className="analytics-value-table">
                            {formatPeso(summaryData.profit)}
                          </p>
                        </div>
                        <div className="box-icon-table">
                          <img src="/assets/profit.png" alt="Profit" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="summary-box-table bookings-table">
                        <div className="box-content-table">
                          <p className="analytics-label-table">Bookings</p>
                          <p className="analytics-value-table">{bookings}</p>
                        </div>
                        <div className="box-icon-table">
                          <img src="/assets/bookings.png" alt="Bookings" />
                        </div>
                      </div>

                      <div className="summary-box-table unpaid-table">
                        <div className="box-content-table">
                          <p className="analytics-label-table">
                            Unpaid Bookings
                          </p>
                          <p className="analytics-value-table">
                            {unpaidBookingsCount}
                          </p>
                        </div>
                        <div className="box-icon-table">
                          <img
                            src="/assets/unpaidBookings.png"
                            alt="Unpaid Bookings"
                          />
                        </div>
                      </div>

                      <div className="summary-box-table due-table">
                        <div className="box-content-table">
                          <p className="analytics-label-table">Due Balances</p>
                          <p className="analytics-value-table">
                            {formatPeso(unpaidBookingsSum)}
                          </p>
                        </div>
                        <div className="box-icon-table">
                          <img
                            src="/assets/dueBalance.png"
                            alt="Due Balances"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right Panel: Table */}
              <div className="table-scrollable-container">
                <table className={`car-status-table sorted-${sortKey}`}>
                  {/* Existing table content */}
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th
                        className={`${
                          sortKey === "model"
                            ? `active-sort model ${sortDirection}`
                            : ""
                        }`}
                        onClick={() => handleSort("model")}
                      >
                        Name <span className="arrow"></span>
                      </th>
                      {scrollMetric === "bookings" && (
                        <>
                          <th
                            className={`${
                              sortKey === "timesRented"
                                ? `active-sort timesRented ${sortDirection}`
                                : ""
                            }`}
                            onClick={() => handleSort("timesRented")}
                          >
                            Bookings <span className="arrow"></span>
                          </th>
                          <th
                            className={`${
                              sortKey === "unpaidCount"
                                ? `active-sort unpaidCount ${sortDirection}`
                                : ""
                            }`}
                            onClick={() => handleSort("unpaidCount")}
                          >
                            Unpaid <span className="arrow"></span>
                          </th>
                          <th
                            className={`${
                              sortKey === "dueBalances"
                                ? `active-sort dueBalances ${sortDirection}`
                                : ""
                            }`}
                            onClick={() => handleSort("dueBalances")}
                          >
                            Due Balances <span className="arrow"></span>
                          </th>
                        </>
                      )}
                      {scrollMetric === "financial" && (
                        <>
                          <th
                            className={`revenue-col ${
                              sortKey === "revenue"
                                ? `active-sort revenue ${sortDirection}`
                                : ""
                            }`}
                            onClick={() => handleSort("revenue")}
                          >
                            Revenue <span className="arrow"></span>
                          </th>
                          <th
                            className={`expenses-col ${
                              sortKey === "expenses"
                                ? `active-sort expenses ${sortDirection}`
                                : ""
                            }`}
                            onClick={() => handleSort("expenses")}
                          >
                            Expenses <span className="arrow"></span>
                          </th>
                          <th
                            className={`profit-col ${
                              sortKey === "profit"
                                ? `active-sort profit ${sortDirection}`
                                : ""
                            }`}
                            onClick={() => handleSort("profit")}
                          >
                            Profit <span className="arrow"></span>
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {scrollableData.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="scroll-content-no-data-message"
                        >
                          {searchQuery.trim() !== ""
                            ? `No units found matching "${searchQuery}".`
                            : scrollCarType === "ALL"
                              ? `No data available for ${
                                  scrollMetric === "sales" ? "sales" : "rentals"
                                } yet.`
                              : `No ${scrollCarType} units rented ${
                                  scrollTimeRange === "yesterday"
                                    ? "Yesterday"
                                    : scrollTimeRange === "week"
                                      ? "This Week"
                                      : scrollTimeRange === "month"
                                        ? "This Month"
                                        : "This Year"
                                }`}
                        </td>
                      </tr>
                    ) : (
                      scrollableData.map((car, index) => {
                        const unpaidBookings = car.bookings.filter(
                          (b) => b.paid === false,
                        );
                        const unpaidCount = unpaidBookings.length;
                        const dueBalances = unpaidBookings.reduce(
                          (sum, b) => sum + (b.balanceDue || 0),
                          0,
                        );

                        return (
                          <tr
                            key={index}
                            className="table-row clickable-row"
                            onClick={() => {
                              setSelectedUnitId(car.unitId);
                              setSelectedUnitBookings(car.bookings);
                              setShowUnitDetailsOverlay(true);
                            }}
                          >
                            {/* <td className="table-cell image-cell">
                          <img
                            src={car.unitImage || "/images/default.png"}
                            alt={car.model}
                            className="table-image"
                            onError={(e) =>
                              (e.target.src = "/images/default.png")
                            }
                          />
                        </td> */}

                            <td className="table-cell image-cell">
                              {(() => {
                                if (!car) return null;

                                // Try car.imageId, then match by name, then match by plateNo, finally fallback to plateNo_main
                                const imageId =
                                  car.imageId ||
                                  unitData.find((u) => u.name === car.carName)
                                    ?.imageId ||
                                  unitData.find(
                                    (u) => u.plateNo === car.plateNo,
                                  )?.imageId ||
                                  `${car.plateNo}_main`;

                                const image = fetchedImages[imageId];

                                return (
                                  <img
                                    src={image?.base64 || "/images/default.png"}
                                    alt={car.carName || car.model}
                                    className="unit-table-image"
                                    key={image?.updatedAt}
                                    onError={(e) =>
                                      (e.target.src = "/images/default.png")
                                    }
                                  />
                                );
                              })()}
                            </td>

                            <td className="table-cell name-cell">
                              {car.model}
                              <br />({car.plateNo})
                            </td>
                            {scrollMetric === "bookings" && (
                              <>
                                <td className="table-cell bookings-cell">
                                  {car.timesRented}
                                </td>
                                <td className="table-cell unpaid-cell">
                                  {car.unpaidCount}
                                </td>
                                <td className="table-cell due-cell">
                                  {formatPeso(car.dueBalances)}
                                </td>
                              </>
                            )}
                            {scrollMetric === "financial" && (
                              <>
                                <td className="table-cell revenue-cell">
                                  {formatPeso(car.revenue)}
                                </td>
                                <td className="table-cell expenses-cell">
                                  {formatPeso(car.expenses)}
                                </td>
                                <td className="table-cell profit-cell">
                                  {formatPeso(car.profit)}
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {(subSection === "overview" || subSection === "partners") && (
          <div className="affiliation-table-wrapper">
            {/* MODE TOGGLE BUTTONS AND SUMMARY BOXES */}
            <div className="affiliation-header-row">
              <div className="affiliation-toggle">
                <h2>AFFILIATIONS</h2>
                <div className="button-row">
                  <button
                    className={affTableMode === "partners" ? "active" : ""}
                    onClick={() => {
                      setAffTableMode("partners");
                      setSelectedPartnerId(null);
                      setActiveColumn(null); // Reset active column on tab switch
                    }}
                  >
                    Partners
                  </button>

                  <button
                    className={affTableMode === "units" ? "active" : ""}
                    onClick={() => {
                      setAffTableMode("units");
                      setActiveColumn(null); // Reset active column on tab switch
                    }}
                  >
                    Units
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Name, Car, or Plate No..."
                  value={affSearchQuery}
                  onChange={(e) => setAffSearchQuery(e.target.value)}
                  className="aff-search-input"
                />
              </div>

              {/* AFFILIATION SUMMARY BOXES */}
              <div className="affiliation-summary-boxes">
                <div className="affiliation-summary-box total-revenue-aff">
                  <div className="box-content-table">
                    <p className="analytics-label-table">
                      Total Revenue (Tie-Ups)
                    </p>
                    <p className="analytics-value-table">
                      {formatPeso(affiliationSummaryData.totalRevenue)}
                    </p>
                  </div>
                  <div className="box-icon-table">
                    <img src="/assets/revenue.png" alt="Revenue" />
                  </div>
                </div>

                <div className="affiliation-summary-box partners-share-aff">
                  <div className="box-content-table">
                    <p className="analytics-label-table">Partner's Share</p>
                    <p className="analytics-value-table">
                      {formatPeso(affiliationSummaryData.totalPartnerShare)}
                    </p>
                  </div>
                  <div className="box-icon-table">
                    <img src="/assets/expense.png" alt="Partner's Share" />
                  </div>
                </div>

                <div className="affiliation-summary-box company-share-aff">
                  <div className="box-content-table">
                    <p className="analytics-label-table">Company's Share</p>
                    <p className="analytics-value-table">
                      {formatPeso(affiliationSummaryData.totalCompanyShare)}
                    </p>
                  </div>
                  <div className="box-icon-table">
                    <img src="/assets/profit.png" alt="Company's Share" />
                  </div>
                </div>
              </div>
            </div>

            <div className="affiliation-table-scrollable-container">
              {affTableMode === "partners" && (
                <table
                  className={`affiliation-table ${
                    activeColumn ? `active-${activeColumn}` : ""
                  }`}
                >
                  <thead>
                    <tr>
                      <th
                        onClick={() => handleAffSort("partnerName")}
                        className={
                          affSortKey === "partnerName"
                            ? `active-sort partnerName ${affSortDirection}`
                            : ""
                        }
                      >
                        Partner <span className="arrow"></span>
                      </th>
                      <th
                        onClick={() => handleAffSort("unitsOwned")}
                        className={
                          affSortKey === "unitsOwned"
                            ? `active-sort unitsOwned ${affSortDirection}`
                            : ""
                        }
                      >
                        Units Owned <span className="arrow"></span>
                      </th>
                      <th
                        onClick={() => handleAffSort("totalBookings")}
                        className={
                          affSortKey === "totalBookings"
                            ? `active-sort totalBookings ${affSortDirection}`
                            : ""
                        }
                      >
                        Bookings <span className="arrow"></span>
                      </th>
                      <th
                        onClick={() => handleAffSort("totalRevenue")}
                        className={
                          affSortKey === "totalRevenue"
                            ? `active-sort totalRevenue ${affSortDirection}`
                            : ""
                        }
                      >
                        Total Revenue <span className="arrow"></span>
                      </th>
                      <th
                        onClick={() => handleAffSort("ownerShareTotal")}
                        className={
                          affSortKey === "ownerShareTotal"
                            ? `active-sort ownerShareTotal ${affSortDirection}`
                            : ""
                        }
                      >
                        Owner Share <span className="arrow"></span>
                      </th>
                      <th
                        onClick={() => handleAffSort("companyShareTotal")}
                        className={
                          affSortKey === "companyShareTotal"
                            ? `active-sort companyShareTotal ${affSortDirection}`
                            : ""
                        }
                      >
                        Company Share <span className="arrow"></span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPartners.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="aff-no-data">
                          {affSearchQuery.trim()
                            ? `No partners found matching "${affSearchQuery}".`
                            : "No data available for rentals yet."}
                        </td>
                      </tr>
                    ) : (
                      filteredPartners.map((partner) => (
                        <tr
                          key={partner.partnerId}
                          className="affiliation-row-aff"
                          onClick={() => {}}
                        >
                          <td>{partner.partnerName}</td>
                          <td>{partner.cars.length}</td>
                          <td>{partner.totalBookings}</td>
                          <td>{formatPeso(partner.totalRevenue)}</td>
                          <td>{formatPeso(partner.ownerShareTotal)}</td>
                          <td>{formatPeso(partner.companyShareTotal)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {affTableMode === "units" && (
                <table
                  className={`affiliation-table affiliation-table-units ${
                    activeColumn ? `active-${activeColumn}` : ""
                  }`}
                >
                  <thead>
                    <tr>
                      <th>Car Image</th>
                      <th
                        onClick={() => handleAffSort("carName")}
                        className={
                          affSortKey === "carName"
                            ? `active-sort carName ${affSortDirection}`
                            : ""
                        }
                      >
                        Car Name <span className="arrow"></span>
                      </th>
                      <th
                        onClick={() => handleAffSort("bookingsCount")}
                        className={
                          affSortKey === "bookingsCount"
                            ? `active-sort bookingsCount ${affSortDirection}`
                            : ""
                        }
                      >
                        Bookings <span className="arrow"></span>
                      </th>
                      <th
                        onClick={() => handleAffSort("ownerName")}
                        className={
                          affSortKey === "ownerName"
                            ? `active-sort ownerName ${affSortDirection}`
                            : ""
                        }
                      >
                        Owner <span className="arrow"></span>
                      </th>
                      <th
                        onClick={() => handleAffSort("revenue")}
                        className={
                          affSortKey === "revenue"
                            ? `active-sort revenue ${affSortDirection}`
                            : ""
                        }
                      >
                        Total Revenue <span className="arrow"></span>
                      </th>
                      <th
                        onClick={() => handleAffSort("ownerShare")}
                        className={
                          affSortKey === "ownerShare"
                            ? `active-sort ownerShare ${affSortDirection}`
                            : ""
                        }
                      >
                        Owner Share <span className="arrow"></span>
                      </th>
                      <th
                        onClick={() => handleAffSort("companyShare")}
                        className={
                          affSortKey === "companyShare"
                            ? `active-sort companyShare ${affSortDirection}`
                            : ""
                        }
                      >
                        Company Share <span className="arrow"></span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnits.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="aff-no-data">
                          {affSearchQuery.trim()
                            ? `No units found matching "${affSearchQuery}".`
                            : "No data available for rentals yet."}
                        </td>
                      </tr>
                    ) : (
                      filteredUnits.map((car, index) => (
                        <tr
                          key={`${car.plateNo}-${index}`}
                          className="affiliation-row-aff"
                        >
                          <td>
                            <img
                              src={
                                fetchedImages[car.imageId]?.base64 ||
                                "/images/default.png"
                              }
                              alt={car.carName}
                              className="table-image-aff"
                              key={fetchedImages[car.imageId]?.updatedAt}
                            />
                          </td>
                          <td>
                            {car.carName}
                            <br />({car.plateNo})
                          </td>
                          <td>{car.bookingsCount}</td>
                          <td>{car.ownerName}</td>
                          <td>{formatPeso(car.revenue)}</td>
                          <td>{formatPeso(car.ownerShare)}</td>
                          <td>{formatPeso(car.companyShare)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {(subSection === "overview" || subSection === "calendar") && (
        <div
          className={`calendar-container ${subSection === "calendar" ? "single-calendar" : ""}`}
        >
          <h3 className="calendar-title">
            Monthly Report <br /> (
            {calendarViewMode === "ALL"
              ? "All Units"
              : (() => {
                  const selectedUnit = carUnitOptions.find(
                    (unit) => unit.unitId === calendarViewMode,
                  );
                  return selectedUnit
                    ? `${selectedUnit.label} - ${selectedUnit.plateNo}`
                    : "Unknown";
                })()}
            )
          </h3>

          <div className="calendar-tab-switcher">
            <select
              id="calendar-unit-select"
              value={calendarViewMode}
              onChange={(e) => setCalendarViewMode(e.target.value)}
              className="calendar-tab-select"
            >
              <option value="ALL">All Units</option>
              {carUnitOptions.map((unit) => (
                <option key={unit.unitId} value={unit.unitId}>
                  {unit.label} - {unit.plateNo}
                </option>
              ))}
            </select>

            <select
              id="calendar-status-filter"
              value={calendarStatusFilter}
              onChange={(e) => setCalendarStatusFilter(e.target.value)}
              className="calendar-tab-select"
            >
              <option value="ALL">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="ACTIVE_PENDING">Active & Pending</option>
              <option value="ACTIVE_COMPLETED">Active & Completed</option>
              <option value="PENDING_COMPLETED">Pending & Completed</option>
            </select>
          </div>

          <div className="calendar-controls">
            <button
              onClick={() => {
                if (calendarViewMode === "ALL") return;

                const selectedUnit = carUnitOptions.find(
                  (u) => u.unitId === calendarViewMode,
                );

                const calendarApi = calendarRef.current.getApi();
                const visibleDate = calendarApi.view.currentStart;

                generateFilledCalendar(
                  `${selectedUnit.label} - ${selectedUnit.plateNo}`,
                  filteredCalendarEvents,
                  visibleDate,
                );
              }}
              disabled={calendarViewMode === "ALL"}
              className="print-calendar-btn"
            >
              Print Calendar
            </button>
          </div>

          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin]}
            initialView="dayGridMonth"
            height={600}
            headerToolbar={{
              left: "prev,today next",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={filteredCalendarEvents}
            eventClick={(info) => {
              const fullData = info.event.extendedProps?.fullData;

              const isAutoVacant =
                fullData &&
                Object.keys(fullData).length === 1 &&
                fullData.unitId;

              if (isAutoVacant) {
                info.jsEvent.preventDefault();
                return;
              }

              setSelectedCalendarBooking(fullData);
              setShowCalendarEventsOverlay(true);
            }}
            eventDidMount={(info) => {
              const fullData = info.event.extendedProps?.fullData;
              const isAutoVacant =
                fullData &&
                Object.keys(fullData).length === 1 &&
                fullData.unitId;

              if (isAutoVacant) {
                info.el.style.cursor = "not-allowed";
                info.el.title = "This day was automatically marked as vacant";
              }
            }}
          />
        </div>
      )}

      {showUnitDetailsOverlay && selectedUnitId !== null && (
        <div className="unit-details-overlay">
          <div className="unit-details-content">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowUnitDetailsOverlay(false)}
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

            <div className="unit-header">
              <h3>{selectedUnitBookings[0]?.carName || "UNIT"}</h3>
              <p>{selectedUnitBookings[0]?.plateNo}</p>
            </div>

            <div className="unit-table-container">
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: "10px",
                }}
              >
                <input
                  type="text"
                  placeholder="Search renter name, location, or dates..."
                  value={unitSearchQuery}
                  onChange={(e) => setUnitSearchQuery(e.target.value)}
                  className="details-search-input"
                />
              </div>
              <table
                className={`unit-details-table ${
                  unitSortKey ? `sorted-${unitSortKey}` : ""
                }`}
              >
                <thead>
                  <tr>
                    <th>Image</th>
                    <th
                      className={`${
                        unitSortKey === "startDate"
                          ? `active-sort startDate ${unitSortDirection}`
                          : ""
                      }`}
                      onClick={() => handleUnitSort("startDate")}
                    >
                      Start & End Date <span className="arrow"></span>
                    </th>
                    <th
                      className={`${
                        unitSortKey === "billedDays"
                          ? `active-sort billedDays ${unitSortDirection}`
                          : ""
                      }`}
                      onClick={() => handleUnitSort("billedDays")}
                    >
                      Days Rented <span className="arrow"></span>
                    </th>
                    <th
                      className={`${
                        unitSortKey === "firstName"
                          ? `active-sort firstName ${unitSortDirection}`
                          : ""
                      }`}
                      onClick={() => handleUnitSort("firstName")}
                    >
                      Renter Name <span className="arrow"></span>
                    </th>
                    <th
                      className={`${
                        unitSortKey === "location"
                          ? `active-sort location ${unitSortDirection}`
                          : ""
                      }`}
                      onClick={() => handleUnitSort("location")}
                    >
                      Location <span className="arrow"></span>
                    </th>
                    <th
                      className={`${
                        unitSortKey === "totalPrice"
                          ? `active-sort totalPrice ${unitSortDirection}`
                          : ""
                      }`}
                      onClick={() => handleUnitSort("totalPrice")}
                    >
                      Total Price <span className="arrow"></span>
                    </th>
                    <th
                      className={`${
                        unitSortKey === "totalPaid"
                          ? `active-sort totalPaid ${unitSortDirection}`
                          : ""
                      }`}
                      onClick={() => handleUnitSort("totalPaid")}
                    >
                      Total Paid <span className="arrow"></span>
                    </th>
                    <th
                      className={`${
                        unitSortKey === "balanceDue"
                          ? `active-sort balanceDue ${unitSortDirection}`
                          : ""
                      }`}
                      onClick={() => handleUnitSort("balanceDue")}
                    >
                      Due Balance <span className="arrow"></span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const sortedBookings = [...selectedUnitBookings].sort(
                      (a, b) => {
                        if (!unitSortKey) return 0;
                        let valA, valB;
                        switch (unitSortKey) {
                          case "startDate":
                            valA = new Date(a.startTimestamp?.seconds * 1000);
                            valB = new Date(b.startTimestamp?.seconds * 1000);
                            break;
                          case "billedDays":
                            valA = a.billedDays;
                            valB = b.billedDays;
                            break;
                          case "firstName":
                            valA = a.firstName.toLowerCase();
                            valB = b.firstName.toLowerCase();
                            break;
                          case "location":
                            valA = a.location.toLowerCase();
                            valB = b.location.toLowerCase();
                            break;
                          case "totalPrice":
                            valA = (a.totalPaid || 0) + (a.balanceDue || 0);
                            valB = (b.totalPaid || 0) + (b.balanceDue || 0);
                            break;
                          case "totalPaid":
                            valA = a.totalPaid || 0;
                            valB = b.totalPaid || 0;
                            break;
                          case "balanceDue":
                            valA = a.balanceDue || 0;
                            valB = b.balanceDue || 0;
                            break;
                          default:
                            return 0;
                        }
                        if (unitSortDirection === "asc") {
                          return valA > valB ? 1 : valA < valB ? -1 : 0;
                        } else {
                          return valA < valB ? 1 : valA > valB ? -1 : 0;
                        }
                      },
                    );

                    const filteredBookings = sortedBookings.filter(
                      (booking) => {
                        const query = unitSearchQuery.toLowerCase().trim();
                        if (!query) return true;
                        const renterName =
                          `${booking.firstName} ${booking.surname}`.toLowerCase();
                        const location = booking.location.toLowerCase();
                        const startDate = formatTimestamp(
                          booking.startTimestamp,
                        ).toLowerCase();
                        const endDate = formatEndDate(
                          booking.endDate,
                        ).toLowerCase();
                        return (
                          renterName.includes(query) ||
                          location.includes(query) ||
                          startDate.includes(query) ||
                          endDate.includes(query)
                        );
                      },
                    );

                    if (selectedUnitBookings.length === 0) {
                      return (
                        <tr>
                          <td colSpan="8" className="unit-no-data">
                            No data available for rentals yet.
                          </td>
                        </tr>
                      );
                    }

                    if (
                      filteredBookings.length === 0 &&
                      unitSearchQuery.trim() !== ""
                    ) {
                      return (
                        <tr>
                          <td colSpan="8" className="unit-no-data">
                            No units found matching "{unitSearchQuery}".
                          </td>
                        </tr>
                      );
                    }

                    return filteredBookings.map((booking, idx) => (
                      <tr
                        key={idx}
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetailsOverlay(true);
                        }}
                      >
                        <td>
                          {(() => {
                            if (!booking) return null;

                            // Try booking.imageId, then match unit by name, finally fallback to plateNo_main
                            const imageId =
                              booking.imageId ||
                              unitData.find((u) => u.name === booking.carName)
                                ?.imageId ||
                              `${booking.plateNo}_main`;

                            const image = fetchedImages[imageId];

                            return (
                              <img
                                src={image?.base64 || "/images/default.png"}
                                alt={booking.carName}
                                className="unit-table-image"
                                key={image?.updatedAt}
                                onError={(e) =>
                                  (e.target.src = "/images/default.png")
                                }
                              />
                            );
                          })()}
                        </td>

                        <td>
                          {formatTimestamp(booking.startTimestamp)} to{" "}
                          {formatEndDate(booking.endDate)}
                        </td>
                        <td>{booking.billedDays}</td>
                        <td>
                          {booking.firstName} {booking.surname}
                        </td>
                        <td>{booking.location}</td>
                        <td>
                          {formatPeso(
                            (booking.totalPaid || 0) +
                              (booking.balanceDue || 0),
                          )}
                        </td>
                        <td>{formatPeso(booking.totalPaid || 0)}</td>
                        <td>{formatPeso(booking.balanceDue || 0)}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
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

      {showCalendarEventsOverlay && selectedCalendarBooking && (
        <div className="admin-booking-confirm-overlay">
          <div className="admin-booking-confirm-container">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowCalendarEventsOverlay(false)}
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
                      {selectedCalendarBooking.carName}
                    </span>
                  </div>

                  <div className="confirm-row">
                    <strong className="confirm-label">Drive Type:</strong>
                    <span className="confirm-value">
                      {selectedCalendarBooking.drivingOption}
                    </span>
                  </div>

                  {selectedCalendarBooking.drivingOption === "With Driver" &&
                    selectedCalendarBooking.assignedDriver && (
                      <div className="confirm-row">
                        <strong className="confirm-label">
                          Assigned Driver:
                        </strong>
                        <span className="confirm-value">
                          {selectedCalendarBooking.assignedDriver}
                        </span>
                      </div>
                    )}

                  <div className="confirm-row">
                    <strong className="confirm-label">Drop-off Type:</strong>
                    <span className="confirm-value">
                      {selectedCalendarBooking.pickupOption}
                    </span>
                  </div>

                  {selectedCalendarBooking.pickupOption === "Drop-off" &&
                    selectedCalendarBooking.dropoffLocation && (
                      <div className="confirm-row">
                        <strong className="confirm-label">
                          Drop-off Location:
                        </strong>
                        <span className="confirm-value">
                          {selectedCalendarBooking.dropoffLocation}
                        </span>
                      </div>
                    )}

                  <div className="confirm-row">
                    <strong className="confirm-label">Rental Period:</strong>
                    <span className="confirm-value">
                      {formatDateTime(
                        selectedCalendarBooking.startTimestamp?.toDate?.() ||
                          new Date(
                            `${selectedCalendarBooking.startDate}T${selectedCalendarBooking.startTime}`,
                          ),
                      )}
                      <br />
                      to <br />
                      {formatDateTime(
                        selectedCalendarBooking.endTimestamp?.toDate?.() ||
                          new Date(
                            `${selectedCalendarBooking.endDate}T${selectedCalendarBooking.endTime}`,
                          ),
                      )}
                    </span>
                  </div>

                  <div className="confirm-row">
                    <strong className="confirm-label">Travel Location:</strong>
                    <span className="confirm-value">
                      {selectedCalendarBooking.location}
                    </span>
                  </div>

                  <div className="confirm-row">
                    <strong className="confirm-label">Purpose:</strong>
                    <span className="confirm-value">
                      {selectedCalendarBooking.purpose}
                    </span>
                  </div>

                  <div className="confirm-row">
                    <strong className="confirm-label">Referral Source:</strong>
                    <span className="confirm-value">
                      {selectedCalendarBooking.referralSource ||
                        "Not specified"}
                    </span>
                  </div>

                  <div className="confirm-row">
                    <strong className="confirm-label">
                      Additional Message:
                    </strong>
                    <span className="confirm-value">
                      {selectedCalendarBooking.additionalMessage}
                    </span>
                  </div>

                  {selectedCalendarBooking?.paymentEntries?.length > 0 && (
                    <div className="confirm-row">
                      <strong className="confirm-label">Payments:</strong>
                      <span className="confirm-value">
                        {selectedCalendarBooking.paymentEntries.map(
                          (entry, index) => (
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
                          ),
                        )}
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
                    {selectedCalendarBooking.firstName}{" "}
                    {selectedCalendarBooking.middleName}{" "}
                    {selectedCalendarBooking.surname}
                  </span>
                </div>

                <div className="confirm-row">
                  <strong className="confirm-label">Contact:</strong>
                  <span className="confirm-value">
                    {selectedCalendarBooking.contact}
                  </span>
                </div>

                <div className="confirm-row">
                  <strong className="confirm-label">Email:</strong>
                  <span className="confirm-value">
                    {selectedCalendarBooking.email}
                  </span>
                </div>

                <div className="confirm-row">
                  <strong className="confirm-label">Occupation:</strong>
                  <span className="confirm-value">
                    {selectedCalendarBooking.occupation}
                  </span>
                </div>

                <div className="confirm-row">
                  <strong className="confirm-label">Current Address:</strong>
                  <span className="confirm-value">
                    {selectedCalendarBooking.address}
                  </span>
                </div>

                <h4 className="confirm-subtitle">DRIVER'S LICENSE</h4>
                <div className="admin-confirm-image-container">
                  {selectedCalendarBooking.driverLicense ? (
                    <img
                      src={selectedCalendarBooking.driverLicense}
                      alt="Driver's License"
                      className="admin-confirm-id-preview"
                      onClick={() => {
                        setModalImage(selectedCalendarBooking.driverLicense);
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
                          {selectedCalendarBooking.carName}
                        </span>
                        ):
                      </strong>

                      <span className="summary-value">
                        (₱
                        {selectedCalendarBooking.discountedRate.toLocaleString()}{" "}
                        x {selectedCalendarBooking.billedDays} Day
                        {selectedCalendarBooking.billedDays > 1 ? "s" : ""}) ₱
                        {(
                          selectedCalendarBooking.discountedRate *
                          selectedCalendarBooking.billedDays
                        ).toLocaleString()}
                      </span>
                    </li>
                    <li>
                      <strong className="summary-label">
                        (
                        <span style={{ color: "#28a745" }}>
                          {selectedCalendarBooking.drivingOption}
                        </span>
                        ):
                      </strong>

                      <span className="summary-value">
                        {selectedCalendarBooking.drivingPrice > 0 ? (
                          <>
                            (₱
                            {selectedCalendarBooking.drivingPrice.toLocaleString()}{" "}
                            x {selectedCalendarBooking.billedDays} Day
                            {selectedCalendarBooking.billedDays > 1 ? "s" : ""})
                            ₱
                            {(
                              selectedCalendarBooking.drivingPrice *
                              selectedCalendarBooking.billedDays
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
                          {selectedCalendarBooking.pickupOption}
                        </span>
                        ):
                      </strong>
                      <span className="summary-value">
                        ₱{selectedCalendarBooking.pickupPrice.toLocaleString()}
                      </span>
                    </li>
                    <li>
                      <strong className="summary-label">
                        Rental Duration:
                      </strong>
                      <span className="summary-value">
                        ({selectedCalendarBooking.billedDays} Day /{" "}
                        {selectedCalendarBooking.rentalDuration
                          .isFlatRateSameDay ? (
                          <>
                            for{" "}
                            <span style={{ color: "#dc3545" }}>
                              {Math.floor(
                                selectedCalendarBooking.rentalDuration
                                  .actualSeconds / 3600,
                              )}
                              {Math.floor(
                                selectedCalendarBooking.rentalDuration
                                  .actualSeconds / 3600,
                              ) === 1
                                ? "hr"
                                : "hrs"}
                            </span>{" "}
                            only
                          </>
                        ) : (
                          `${24 * selectedCalendarBooking.billedDays} hrs`
                        )}
                        )
                        <br />
                        {selectedCalendarBooking.rentalDuration.extraHours >
                          0 && (
                          <>
                            (
                            <span style={{ color: "#dc3545" }}>
                              +
                              {
                                selectedCalendarBooking.rentalDuration
                                  .extraHours
                              }{" "}
                              {selectedCalendarBooking.rentalDuration
                                .extraHours === 1
                                ? "hr"
                                : "hrs"}{" "}
                              | ₱
                              {(
                                selectedCalendarBooking.extraHourCharge || 0
                              ).toLocaleString()}
                            </span>
                            )
                          </>
                        )}
                      </span>
                    </li>

                    {(() => {
                      const discountValue = Number(
                        selectedCalendarBooking.discountValue || 0,
                      );
                      const discountType =
                        selectedCalendarBooking.discountType || "peso";

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
                        selectedCalendarBooking.paymentEntries &&
                        selectedCalendarBooking.paymentEntries.length > 0
                      ) {
                        return selectedCalendarBooking.paymentEntries.map(
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
                      selectedCalendarBooking.discountValue || 0,
                    );
                    const discountType =
                      selectedCalendarBooking.discountType || "peso";
                    const rawTotal =
                      selectedCalendarBooking.billedDays *
                        selectedCalendarBooking.discountedRate +
                      selectedCalendarBooking.billedDays *
                        selectedCalendarBooking.drivingPrice +
                      selectedCalendarBooking.extraHourCharge +
                      selectedCalendarBooking.pickupPrice;
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
                      selectedCalendarBooking.discountValue || 0,
                    );
                    const discountType =
                      selectedCalendarBooking.discountType || "peso";
                    const rawTotal =
                      selectedCalendarBooking.billedDays *
                        selectedCalendarBooking.discountedRate +
                      selectedCalendarBooking.billedDays *
                        selectedCalendarBooking.drivingPrice +
                      selectedCalendarBooking.extraHourCharge +
                      selectedCalendarBooking.pickupPrice;
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
                      selectedCalendarBooking.paymentEntries || []
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
                                selectedCalendarBooking.balanceDue === 0
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
                                Number(selectedCalendarBooking.balanceDue) === 0
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
                  onClick={() => setShowCalendarEventsOverlay(false)}
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
            src={modalImage}
            alt="Full License"
            className="admin-full-image-view"
          />
        </div>
      )}
    </div>
  );
};

export default AnalyticsSection;
