"use client";
//FinancialReports.js
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useUser } from "../lib/UserContext";
import "./FinancialReports.css";
import XLSX from "xlsx-js-style";
import {
  MdWarning,
  MdDownload,
  MdRefresh,
  MdDelete,
  MdCalendarToday,
  MdAnalytics,
} from "react-icons/md";

import { createPortal } from "react-dom";

const FinancialReports = () => {
  const {
    unitData,
    allUnitData,
    paymentEntries,
    autoFillTrigger,
    cancelTrigger,

    hasServerChange,
    setHasServerChange,
    serverChangeCounter,
    saveFinancialReport,
    loadFinancialReport,

    mopTypes,
    popTypesRevenue,
    popTypesExpense,
    revenueGrid,
    setRevenueGrid,
    expenseGrid,
    setExpenseGrid,
    activeBookings,
    completedBookingsAnalytics,
  } = useUser();

  const [showFinancialWarning, setShowFinancialWarning] = useState(false);
  const [financialWarningMessage, setFinancialWarningMessage] = useState("");

  const [activeTab, setActiveTab] = useState("revenue");
  const [zoomLevel, setZoomLevel] = useState(100);
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0–11

  const [showMonthYearDropdown, setShowMonthYearDropdown] = useState(false);
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const [savingStatus, setSavingStatus] = useState(false); // true = saving, false = idle
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isSynced, setIsSynced] = useState(true);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(currentMonth);

  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);

  const [isTabLoading, setIsTabLoading] = useState(false);

  const currentTabRef = useRef(activeTab);

  // Local Storage Keys
  const LOCAL_STORAGE_KEY = "emnlcarrental_financial_reports";

  // Local Storage Helpers

  const saveToLocalStorage = (tab, year, data) => {
    try {
      const key = `${LOCAL_STORAGE_KEY}_${tab}_${year}`;

      // For revenue/expense tabs, save only that tab's data
      let dataToSave;
      if (tab === "revenue" && data.revenue) {
        dataToSave = data.revenue;
      } else if (tab === "expense" && data.expense) {
        dataToSave = data.expense;
      } else {
        // For transaction tab or direct data, save as-is
        dataToSave = data;
      }

      localStorage.setItem(key, JSON.stringify(dataToSave));

      // Read back and parse to show as object
      const savedData = localStorage.getItem(key);
      console.log(`💾 Saved ${tab}/${year} to localStorage`);
      console.log(`📦 DATA in Local Storage, "${key}":`, JSON.parse(savedData));
    } catch (error) {
      console.error("❌ Error saving to localStorage:", error);
    }
  };

  const loadFromLocalStorage = (tab, year) => {
    try {
      const key = `${LOCAL_STORAGE_KEY}_${tab}_${year}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("❌ Error loading from localStorage:", error);
      return null;
    }
  };

  const clearLocalStorage = (tab, year) => {
    try {
      const key = `${LOCAL_STORAGE_KEY}_${tab}_${year}`;
      localStorage.removeItem(key);
      console.log(`🗑️ Cleared ${tab}/${year} from localStorage`);
    } catch (error) {
      console.error("❌ Error clearing localStorage:", error);
    }
  };

  // Check if data has actual content
  const hasActualData = (data) => {
    return Object.values(data || {}).some((month) =>
      Object.values(month || {}).some(
        (cells) => Array.isArray(cells) && cells.some((cell) => cell !== ""),
      ),
    );
  };

  // // Function to save ALL pending localStorage data to Firestore

  const saveAllPendingToFirestore = async () => {
    setSavingStatus(true);
    const pendingKeys = [];
    const savedYears = new Set(); // Track which years were saved
    const savedTabs = new Set(); // Track which tabs were saved

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(LOCAL_STORAGE_KEY)) {
        pendingKeys.push(key);

        // Extract tab and year from key
        const parts = key.replace(LOCAL_STORAGE_KEY + "_", "").split("_");
        if (parts.length >= 2) {
          savedTabs.add(parts[0]);
          savedYears.add(parseInt(parts[1]));
        }
      }
    }

    console.log(
      `📤 Found ${pendingKeys.length} pending items to save to Database`,
    );
    console.log(`📋 Tabs to refresh: ${[...savedTabs].join(", ")}`);
    console.log(`📅 Years to refresh: ${[...savedYears].join(", ")}`);

    for (const key of pendingKeys) {
      try {
        const data = JSON.parse(localStorage.getItem(key));

        // SKIP if no actual data
        if (!hasActualData(data)) {
          console.log(`⏭️ Skipping ${key} - no data`);
          const parts = key.replace(LOCAL_STORAGE_KEY + "_", "").split("_");
          clearLocalStorage(parts[0], parseInt(parts[1]));
          continue;
        }

        const parts = key.replace(LOCAL_STORAGE_KEY + "_", "").split("_");
        const tab = parts[0];
        const year = parseInt(parts[1]);

        console.log(`📤 Saving ${tab}/${year} to Database...`);
        await saveFinancialReport(tab, data, year);
        clearLocalStorage(tab, year);
      } catch (error) {
        console.error(`❌ Error saving ${key} to Database:`, error);
      }
    }

    // Reload ALL saved tabs and years (not just activeTab/currentYear)
    console.log("🔄 Reloading all saved data from Database...");

    // Reload current active tab/year first
    const currentResult = await loadFinancialReport(activeTab, currentYear);
    const currentFreshData = currentResult.gridData || createBlankGrid();

    if (activeTab === "revenue") {
      setRevenueGrid((prev) => ({
        ...prev,
        [currentYear]: currentFreshData,
      }));
    } else {
      setExpenseGrid((prev) => ({
        ...prev,
        [currentYear]: currentFreshData,
      }));
    }
    setGridData(currentFreshData);
    lastSavedGridRef.current = currentFreshData;

    // Reload all other saved years and tabs
    for (const year of savedYears) {
      if (year === currentYear) continue; // Already reloaded

      if (savedTabs.has("revenue")) {
        const revenueResult = await loadFinancialReport("revenue", year);
        setRevenueGrid((prev) => ({
          ...prev,
          [year]: revenueResult.gridData || {},
        }));
      }

      if (savedTabs.has("expense")) {
        const expenseResult = await loadFinancialReport("expense", year);
        setExpenseGrid((prev) => ({
          ...prev,
          [year]: expenseResult.gridData || {},
        }));
      }
    }

    setLastSavedAt(new Date());
    setIsSynced(true);
    setHasServerChange(false);
    setSavingStatus(false);

    console.log("✅ All data saved and reloaded from Database!");
  };

  const [isSavingAuto, setIsSavingAuto] = useState(false);

  const lastSavedGridRef = useRef(null);

  const prevGridDataRef = useRef(null); // Track previous gridData
  const isFirstRenderRef = useRef(true); // Skip first render

  const [gridData, setGridData] = useState({});
  const yearDataLoadedRef = useRef({});
  const [yearDataLoaded, setYearDataLoaded] = useState({});
  const [showAllMonths, setShowAllMonths] = useState(false);

  const [selectedRowToDelete, setSelectedRowToDelete] = useState(0);
  const [selectedColToDelete, setSelectedColToDelete] = useState(0);

  const [selectedRows, setSelectedRows] = useState([]);

    useEffect(() => {
    setSelectedRows([]);
  }, [selectedMonthIndex, activeTab, currentYear]);

  const [sortColumn, setSortColumn] = useState("date");

  const [showDetailsOverlay, setShowDetailsOverlay] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  const [sortMode, setSortMode] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");

  const months = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ];

  const monthYearButtonRef = useRef(null);

  const headerColor = activeTab === "revenue" ? "#28a745" : "#dc3545";
  const background =
    activeTab === "revenue"
      ? "#28a74514"
      : activeTab === "expense"
        ? "#dc354514"
        : "#FF8C0014";
  const borderColor = activeTab === "revenue" ? "#28a745" : "#dc3545";

  const justSaved = useRef(false);
  const isHydratingRef = useRef(true);

  const [hideCancelAnimation, setHideCancelAnimation] = useState(false);

  const [processingBooking, setProcessingBooking] = useState({
    isProcessing: false,
    message: "",
    textClass: "submitting-text-red",
  });

  const [actionOverlay, setActionOverlay] = useState({
    isVisible: false,
    message: "",
    type: "warning", // "warning" for red, "success" for green
  });

  const [showManualLoadConfirm, setShowManualLoadConfirm] = useState(false);
  const [showManualLoadMenu, setShowManualLoadMenu] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteFirestoreConfirm, setShowDeleteFirestoreConfirm] =
    useState(false);

  const [manualLoadOption, setManualLoadOption] = useState(null); // "month", "year", "allyears"

  const [showSettings, setShowSettings] = useState(false);
  //SCROLL RELATED
  const scrollYRef = useRef(0);

  //OVERLAY STOP BACKGROUND CLICK AND SCROLL
  useEffect(() => {
    const handleClickOrScroll = (e) => {
      if (!showManualLoadConfirm) {
        setShowSettings(false);
      }
    };

    const preventTouch = (e) => {
      if (showManualLoadConfirm) {
        e.preventDefault();
      }
    };

    document.addEventListener("mousedown", handleClickOrScroll);
    document.addEventListener("scroll", handleClickOrScroll);
    document.addEventListener("touchmove", preventTouch, { passive: false });

    if (showManualLoadConfirm) {
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
  }, [showManualLoadConfirm]);

  useEffect(() => {
    if (serverChangeCounter > 0 && !justSaved.current) {
      setHasServerChange(true);
    }
  }, [serverChangeCounter]);

  useEffect(() => {
    if (!currentYear) return;

    const loadBothTabs = async () => {
      isHydratingRef.current = true;
      currentTabRef.current = activeTab;
      setIsTabLoading(true);

      try {
        // Fetch BOTH tabs fresh from Firestore
        const revenueData = await loadFinancialReport("revenue", currentYear);
        const expenseData = await loadFinancialReport("expense", currentYear);

        const newRevenueData = revenueData.gridData || {};
        const newExpenseData = expenseData.gridData || {};

        // Load localStorage data FIRST
        const localRevenueData = loadFromLocalStorage("revenue", currentYear);
        const localExpenseData = loadFromLocalStorage("expense", currentYear);

        // Merge localStorage with Firestore (localStorage wins)
        const mergedRevenue = mergeData(newRevenueData, localRevenueData);
        const mergedExpense = mergeData(newExpenseData, localExpenseData);

        // Update state with MERGED data
        setRevenueGrid((prev) => ({
          ...prev,
          [currentYear]: mergedRevenue,
        }));
        setExpenseGrid((prev) => ({
          ...prev,
          [currentYear]: mergedExpense,
        }));

        // Set gridData based on current tab
        if (activeTab === "revenue") {
          setGridData(mergedRevenue);
          lastSavedGridRef.current = mergedRevenue;
        } else if (activeTab === "expense") {
          setGridData(mergedExpense);
          lastSavedGridRef.current = mergedExpense;
        } else {
          // Transaction tab: load ALL transactions from localStorage (all years, all months)
          const allYears = yearOptions;

          const allTransactions = {
            revenue: [],
            expense: [],
          };

          // Load all years from localStorage
          allYears.forEach((year) => {
            const yearRevenueData = loadFromLocalStorage("revenue", year);
            const yearExpenseData = loadFromLocalStorage("expense", year);

            // Process revenue data
            if (yearRevenueData) {
              Object.keys(yearRevenueData).forEach((monthIndex) => {
                const monthData = yearRevenueData[monthIndex];
                Object.keys(monthData).forEach((rowKey) => {
                  const row = monthData[rowKey];
                  if (Array.isArray(row) && row.some((cell) => cell !== "")) {
                    allTransactions.revenue.push({
                      year,
                      month: parseInt(monthIndex),
                      rowKey,
                      data: row,
                    });
                  }
                });
              });
            }

            // Process expense data
            if (yearExpenseData) {
              Object.keys(yearExpenseData).forEach((monthIndex) => {
                const monthData = yearExpenseData[monthIndex];
                Object.keys(monthData).forEach((rowKey) => {
                  const row = monthData[rowKey];
                  if (Array.isArray(row) && row.some((cell) => cell !== "")) {
                    allTransactions.expense.push({
                      year,
                      month: parseInt(monthIndex),
                      rowKey,
                      data: row,
                    });
                  }
                });
              });
            }
          });

          // Sort by year and month
          allTransactions.revenue.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
          });
          allTransactions.expense.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
          });

          console.log("📊 ALL TRANSACTIONS LOADED:", allTransactions);

          setGridData({
            revenue: allTransactions.revenue,
            expense: allTransactions.expense,
          });
        }
      } finally {
        isHydratingRef.current = false;
        setIsTabLoading(false);
      }
    };

    // Helper function to merge Firestore + localStorage
    const mergeData = (firestoreData, localData) => {
      const merged = { ...firestoreData };
      if (localData) {
        Object.keys(localData).forEach((monthIndex) => {
          const localMonth = localData[monthIndex] || {};
          const firestoreMonth = firestoreData[monthIndex] || {};
          merged[monthIndex] = { ...firestoreMonth };
          Object.keys(localMonth).forEach((rowKey) => {
            merged[monthIndex][rowKey] = localMonth[rowKey];
          });
        });
      }
      return merged;
    };

    loadBothTabs();
  }, [currentYear, activeTab]);

  useEffect(() => {
    if (
      !autoSaveEnabled ||
      Object.keys(gridData).length === 0 ||
      isSavingAuto
      // isSavingAuto ||
      // JSON.stringify(gridData) === JSON.stringify(lastSavedGridRef.current)
    )
      return;

    lastSavedGridRef.current = gridData;
    setIsSavingAuto(true);

    (async () => {
      try {
        setSavingStatus(true);

        // Update the year-specific state before saving
        if (activeTab === "revenue") {
          setRevenueGrid((prev) => ({
            ...prev,
            [currentYear]: gridData,
          }));
        } else {
          setExpenseGrid((prev) => ({
            ...prev,
            [currentYear]: gridData,
          }));
        }

        await saveFinancialReport(activeTab, gridData, currentYear);

        const now = new Date();
        setLastSavedAt(now);
        setIsSynced(true);
        setHasServerChange(false);
        justSaved.current = true;
        setTimeout(() => (justSaved.current = false), 1000);
      } finally {
        setSavingStatus(false);
        setIsSavingAuto(false);
      }
    })();
  }, [gridData, activeTab, autoSaveEnabled, isSavingAuto, currentYear]);

  // Auto-save to localStorage when gridData changes
  useEffect(() => {
    if (!gridData || Object.keys(gridData).length === 0) return;

    // Skip during initial hydration
    if (isHydratingRef.current) return;

    // DO NOT save for transaction tab - it only reads revenue/expense
    if (activeTab === "transaction") return;

    saveToLocalStorage(activeTab, currentYear, gridData);
  }, [gridData, activeTab, currentYear]);

  // // Auto-save to localStorage when gridData changes
  // useEffect(() => {
  //   if (!gridData || Object.keys(gridData).length === 0) return;

  //   // Skip during initial hydration
  //   if (isHydratingRef.current) return;

  //   saveToLocalStorage(activeTab, currentYear, gridData);

  // }, [gridData, activeTab, currentYear]);

  // DEBUG: Single clean logging to track tab switching and data persistence
  const lastLogRef = useRef(null);

  useEffect(() => {
    const logKey = `${activeTab}-${currentYear}`;

    // Skip if already logged this state
    if (lastLogRef.current === logKey) return;
    lastLogRef.current = logKey;

    console.log("═".repeat(30));
    console.log(`🔄 TAB: ${activeTab.toUpperCase()} | YEAR: ${currentYear}`);
    console.log("═".repeat(30));

    // Check REVENUE tab data
    const revenueData = revenueGrid[currentYear];
    if (revenueData) {
      const feb = revenueData["1"];
      const hasFebData =
        feb &&
        Object.keys(feb).some(
          (k) => Array.isArray(feb[k]) && feb[k].some((cell) => cell !== ""),
        );
      console.log(`📊 REVENUE: ${hasFebData ? "HAS DATA" : "empty/blank"}`);
    } else {
      console.log(`📊 REVENUE: not loaded`);
    }

    // Check EXPENSE tab data
    const expenseData = expenseGrid[currentYear];
    if (expenseData) {
      const feb = expenseData["1"];
      const hasFebData =
        feb &&
        Object.keys(feb).some(
          (k) => Array.isArray(feb[k]) && feb[k].some((cell) => cell !== ""),
        );
      console.log(`💸 EXPENSE: ${hasFebData ? "HAS DATA" : "empty/blank"}`);
    } else {
      console.log(`💸 EXPENSE: not loaded`);
    }

    // Check CURRENT view
    const currentFeb = gridData["1"];
    if (currentFeb) {
      const hasCurrentData = Object.keys(currentFeb).some(
        (k) =>
          Array.isArray(currentFeb[k]) &&
          currentFeb[k].some((cell) => cell !== ""),
      );
      console.log(
        `📱 CURRENT (${activeTab}): ${hasCurrentData ? "HAS DATA" : "empty/blank"}`,
      );
    } else {
      console.log(`📱 CURRENT (${activeTab}): no feb data`);
    }

    console.log("═".repeat(30));
  }, [activeTab, currentYear, revenueGrid, expenseGrid, gridData]);

  const formatDateTime = (dateObj) => {
    if (!dateObj) return "No Saved Data Yet";
    return dateObj.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    // Skip first render
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      prevGridDataRef.current = gridData;
      return;
    }

    // Skip if gridData became empty (tab switch scenario)
    const prevGridData = prevGridDataRef.current;
    if (
      prevGridData &&
      Object.keys(prevGridData).length > 0 &&
      Object.keys(gridData).length === 0
    ) {
      return;
    }

    // Normal sync - use functional updates to ensure consistency
    if (activeTab === "revenue") {
      setRevenueGrid((prev) => {
        const updated = { ...prev, [currentYear]: gridData };

        return updated;
      });
    } else {
      setExpenseGrid((prev) => {
        const updated = { ...prev, [currentYear]: gridData };

        return updated;
      });
    }

    // Update previous gridData
    prevGridDataRef.current = gridData;
  }, [gridData, activeTab, currentYear]);

  const createBlankGrid = () => {
    const blank = {};
    for (let i = 0; i < 12; i++) {
      blank[i] = {
        Row_0: ["", "", "", "", ""],
        Row_1: ["", "", "", "", ""],
        Row_2: ["", "", "", "", ""],
        Row_3: ["", "", "", "", ""],
        Row_4: ["", "", "", "", ""],
      };
    }
    return blank;
  };

  useEffect(() => {
    if (!gridData) return;

    // DO NOT auto-create grid during transient resets
    if (
      Object.keys(gridData).length === 0 &&
      lastSavedGridRef.current &&
      Object.keys(lastSavedGridRef.current).length > 0
    ) {
      return;
    }

    if (Object.keys(gridData).length === 0) {
      setGridData(createBlankGrid());
    }
  }, [gridData]);

  // Show all months when zooming out
  useEffect(() => {
    if (zoomLevel < 100) {
      setShowAllMonths(true);
    } else {
      setShowAllMonths(false);
    }
  }, [zoomLevel]);

  const handleManualSave = async () => {
    try {
      setSavingStatus(true);
      // await saveFinancialReport(activeTab, gridData);
      await saveFinancialReport(activeTab, gridData, currentYear);

      const now = new Date();
      setLastSavedAt(now);
      setIsSynced(true);
      setHasServerChange(false);

      justSaved.current = true; // Set flag to skip next counter increment
      setTimeout(() => (justSaved.current = false), 1000); // Reset after 1 second
    } finally {
      setSavingStatus(false);
    }
  };

  const handleManualLoad = () => {
    setShowManualLoadConfirm(true);
  };

  // const performManualLoad = async () => {
  //   try {
  //     setShowManualLoadConfirm(false);
  //     setSavingStatus(true);

  //     // const { gridData, updatedAt } = await loadFinancialReport(activeTab);

  //     const { gridData, updatedAt } = await loadFinancialReport(
  //       activeTab,
  //       currentYear,
  //     );

  //     setGridData(gridData);
  //     setLastSavedAt(updatedAt ? new Date(updatedAt.toMillis()) : null);

  //     setIsSynced(true);
  //     setHasServerChange(false);
  //     // optional: reset server indicator text, or other UI-only flags
  //   } catch (err) {
  //     console.error("❌ Error during manual load:", err);
  //   } finally {
  //     setSavingStatus(false);
  //   }
  // };

  // Load only the current month
  const performManualLoadMonth = async () => {
    try {
      setSavingStatus(true);

      const { gridData, updatedAt } = await loadFinancialReport(
        activeTab,
        currentYear,
      );

      // Get blank grid structure
      const blankGrid = createBlankGrid();

      // Merge: only keep current month data from Firestore, rest blank
      const monthOnlyData = { ...blankGrid };
      if (gridData && gridData[selectedMonthIndex]) {
        monthOnlyData[selectedMonthIndex] = gridData[selectedMonthIndex];
      }

      setGridData(monthOnlyData);
      if (activeTab === "revenue") {
        setRevenueGrid((prev) => ({
          ...prev,
          [currentYear]: {
            ...prev[currentYear],
            [selectedMonthIndex]:
              monthOnlyData[selectedMonthIndex] ||
              blankGrid[selectedMonthIndex],
          },
        }));
      } else {
        setExpenseGrid((prev) => ({
          ...prev,
          [currentYear]: {
            ...prev[currentYear],
            [selectedMonthIndex]:
              monthOnlyData[selectedMonthIndex] ||
              blankGrid[selectedMonthIndex],
          },
        }));
      }

      setLastSavedAt(updatedAt ? new Date(updatedAt.toMillis()) : null);
      setIsSynced(true);
      setHasServerChange(false);
    } catch (err) {
      console.error("❌ Error loading month:", err);
    } finally {
      setSavingStatus(false);
    }
  };

  // Load entire year
  const performManualLoadYear = async () => {
    try {
      setSavingStatus(true);

      const { gridData, updatedAt } = await loadFinancialReport(
        activeTab,
        currentYear,
      );

      const freshData = gridData || createBlankGrid();

      setGridData(freshData);
      if (activeTab === "revenue") {
        setRevenueGrid((prev) => ({ ...prev, [currentYear]: freshData }));
      } else {
        setExpenseGrid((prev) => ({ ...prev, [currentYear]: freshData }));
      }

      setLastSavedAt(updatedAt ? new Date(updatedAt.toMillis()) : null);
      setIsSynced(true);
      setHasServerChange(false);
    } catch (err) {
      console.error("❌ Error loading year:", err);
    } finally {
      setSavingStatus(false);
    }
  };

  // Load all years for current tab
  const performManualLoadAllYears = async () => {
    try {
      setSavingStatus(true);

      for (const year of yearOptions) {
        const { gridData } = await loadFinancialReport(activeTab, year);

        if (activeTab === "revenue") {
          setRevenueGrid((prev) => ({
            ...prev,
            [year]: gridData || {},
          }));
        } else {
          setExpenseGrid((prev) => ({
            ...prev,
            [year]: gridData || {},
          }));
        }
      }

      // Also reload current view
      const { gridData, updatedAt } = await loadFinancialReport(
        activeTab,
        currentYear,
      );
      setGridData(gridData || createBlankGrid());
      setLastSavedAt(updatedAt ? new Date(updatedAt.toMillis()) : null);

      setIsSynced(true);
      setHasServerChange(false);
    } catch (err) {
      console.error("❌ Error loading all years:", err);
    } finally {
      setSavingStatus(false);
    }
  };

  const applySorting = (monthIndex) => {
    setGridData((prev) => {
      const updated = { ...prev };
      updated[monthIndex] = cleanAndReorderRows(prev[monthIndex] || {});
      return updated;
    });
  };

  // Handles typing in cells
  const handleCellChange = (monthIndex, rowIndex, colIndex, value) => {
    let newValue = value;

    // AMOUNT COLUMN
    if (colIndex === 1) {
      const numeric = value.replace(/[^0-9.]/g, "");
      newValue = `₱${numeric}`;
    }

    // DATE COLUMN
    if (colIndex === 4) {
      newValue = value;
    }

    setGridData((prev) => {
      const updated = { ...prev };

      // Ensure month exists
      if (!updated[monthIndex] || typeof updated[monthIndex] !== "object") {
        updated[monthIndex] = {};
      }

      // Safe row key creation with null check
      const numericIndex = rowIndex
        ? typeof rowIndex === "string" && rowIndex.startsWith("Row_")
          ? parseInt(rowIndex.replace("Row_", ""))
          : parseInt(rowIndex)
        : 0;
      const rowKey = `Row_${numericIndex}`;

      // Get current row or create new one
      const currentRow = updated[monthIndex][rowKey]
        ? [...updated[monthIndex][rowKey]]
        : ["", "", "", "", ""];

      // Metadata
      const meta = {
        _sourceType: updated[monthIndex][rowKey]?._sourceType || "manual",
        _bookingId: updated[monthIndex][rowKey]?._bookingId || null,
        _isAutoFill: updated[monthIndex][rowKey]?._isAutoFill || false,
        _entryIndex: updated[monthIndex][rowKey]?._entryIndex ?? null,
        _manualId:
          updated[monthIndex][rowKey]?._manualId ||
          `manual-${crypto.randomUUID()}`,
      };

      if (meta._sourceType === "manual") {
        meta._bookingId = null;
        meta._isAutoFill = false;
        meta._entryIndex = null;
      }

      // Apply change
      currentRow[colIndex] = newValue;

      // Reattach metadata
      Object.assign(currentRow, meta);

      // Put row back
      updated[monthIndex][rowKey] = currentRow;

      return updated;
    });

    setIsSynced(false);

    if (colIndex === 4) {
      setTimeout(() => applySorting(monthIndex), 0);
    }
  };

  const cleanAndReorderRows = (rows) => {
    if (!rows || typeof rows !== "object") return {};

    // Convert object to array for processing
    const rowsArray = Object.keys(rows).map((key) => ({
      key,
      data: rows[key],
    }));

    const filledRows = [];
    const emptyRows = [];

    rowsArray.forEach(({ data }) => {
      if (!data || !Array.isArray(data)) return;
      if (data.some((c) => c !== "" && c !== null && c !== undefined)) {
        filledRows.push(data);
      } else {
        emptyRows.push(data);
      }
    });

    // Sort filled rows by date
    filledRows.sort((a, b) => {
      const da = new Date(a[4] || "").getTime();
      const db = new Date(b[4] || "").getTime();
      return sortDirection === "asc" ? da - db : db - da;
    });

    // Reconstruct as object
    const result = {};
    filledRows.forEach((row, idx) => {
      result[`Row_${idx}`] = row;
    });
    emptyRows.forEach((row, idx) => {
      result[`Row_${filledRows.length + idx}`] = row;
    });

    // Ensure we have 5 rows
    for (let i = 0; i < 5; i++) {
      if (!result[`Row_${i}`]) {
        result[`Row_${i}`] = ["", "", "", "", ""];
      }
    }

    return result;
  };

  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    const fileName = `EMNL Financial Report ${currentYear}.xlsx`;

    const formatExportDate = (val) => {
      if (!val) return "";
      const d = new Date(val);
      if (isNaN(d)) return val;

      let mm = String(d.getMonth() + 1).padStart(2, "0");
      let dd = String(d.getDate()).padStart(2, "0");
      let yyyy = d.getFullYear();

      let hr = d.getHours();
      let min = String(d.getMinutes()).padStart(2, "0");
      let ampm = hr >= 12 ? "PM" : "AM";
      hr = hr % 12 || 12;

      return `${mm}/${dd}/${yyyy} | ${hr}:${min} ${ampm}`;
    };

    // Colors for REVENUE sheet
    const REVENUE_COLORS = {
      TITLE_BG: "28A745",
      UNIT_HDR: "A8E6CF",
      AMOUNT_HDR: "B3E5FC",
      MOP_HDR: "B3E5FC",
      POP_HDR: "F8BBD0",
      DATE_HDR: "FFE0B2",

      UNIT_ROW: "DFF7EE",
      AMOUNT_ROW: "E3F6FE",
      MOP_ROW: "EEE9F7",
      POP_ROW: "FDE6EE",
      DATE_ROW: "FFF3E0",
    };

    // Colors for EXPENSE sheet
    const EXPENSE_COLORS = {
      ...REVENUE_COLORS,
      TITLE_BG: "DC3545",
    };

    const monthNames = [
      "JANUARY",
      "FEBRUARY",
      "MARCH",
      "APRIL",
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER",
      "NOVEMBER",
      "DECEMBER",
    ];

    const COLUMNS_PER_BLOCK = 5;
    const GAP_COLS = 2;
    const BLOCK_COLS = COLUMNS_PER_BLOCK + GAP_COLS;
    const MONTHS_PER_ROW = 3;
    const BLOCK_ROWS = 10;

    const borderFull = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    };

    const leftBorder = { left: { style: "thin", color: { rgb: "000000" } } };
    const rightBorder = { right: { style: "thin", color: { rgb: "000000" } } };
    const bottomBorder = {
      bottom: { style: "thin", color: { rgb: "000000" } },
    };

    // REUSABLE SHEET GENERATOR
    function generateSheet(gridData, sheetName, COLORS, isExpense = false) {
      const ws = {};
      ws["!merges"] = [];

      let maxRowUsed = 0;

      for (let m = 0; m < 12; m++) {
        const month = monthNames[m];
        const monthRows = Array.isArray(gridData[m]) ? gridData[m] : [];

        const startCol = (m % MONTHS_PER_ROW) * BLOCK_COLS;
        const startRow = Math.floor(m / MONTHS_PER_ROW) * BLOCK_ROWS;

        // MONTH TITLE
        ws["!merges"].push({
          s: { r: startRow, c: startCol },
          e: { r: startRow, c: startCol + 4 },
        });

        for (let col = startCol; col <= startCol + 4; col++) {
          ws[XLSX.utils.encode_cell({ r: startRow, c: col })] = {
            v: col === startCol ? `${month} ${currentYear}` : "",
            t: "s",
            s: {
              fill: { fgColor: { rgb: COLORS.TITLE_BG } },
              font: {
                name: "Arial Black",
                bold: true,
                sz: 14,
                color: { rgb: "FFFFFFFF" },
              },
              alignment: { horizontal: "center", vertical: "center" },
              border: borderFull,
            },
          };
        }

        // HEADERS
        const headers = isExpense
          ? ["UNIT", "AMOUNT", "MOP", "POE", "DATE"]
          : ["UNIT", "AMOUNT", "MOP", "POP", "DATE"];

        const headerBGs = [
          COLORS.UNIT_HDR,
          COLORS.AMOUNT_HDR,
          COLORS.MOP_HDR,
          COLORS.POP_HDR,
          COLORS.DATE_HDR,
        ];

        for (let i = 0; i < 5; i++) {
          ws[XLSX.utils.encode_cell({ r: startRow + 1, c: startCol + i })] = {
            v: headers[i],
            t: "s",
            s: {
              fill: { fgColor: { rgb: headerBGs[i] } },
              font: { name: "Arial", bold: true, sz: 11 },
              alignment: { horizontal: "center" },
              border: borderFull,
            },
          };
        }

        const rowsToShow = Math.max(monthRows.length, 5);

        for (let r = 0; r < rowsToShow; r++) {
          const raw = monthRows[r] || ["", "", "", "", ""];

          const formattedRow = [
            raw[0] ?? "",
            raw[1] ?? "",
            raw[2] ?? "",
            raw[3] ?? "",
            formatExportDate(raw[4]),
          ];

          const isColored = r % 2 === 0;
          const rowBGs = isColored
            ? [
                COLORS.UNIT_ROW,
                COLORS.AMOUNT_ROW,
                COLORS.MOP_ROW,
                COLORS.POP_ROW,
                COLORS.DATE_ROW,
              ]
            : [null, null, null, null, null];

          for (let c = 0; c < 5; c++) {
            const rr = startRow + 2 + r;
            const cc = startCol + c;

            const cellStyle = {
              font: { name: "Calibri", bold: true, sz: 11 },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                ...(c === 0 ? leftBorder : {}),
                ...rightBorder,
                ...(r === rowsToShow - 1 ? bottomBorder : {}),
              },
              ...(rowBGs[c] ? { fill: { fgColor: { rgb: rowBGs[c] } } } : {}),
            };

            const ref = XLSX.utils.encode_cell({ r: rr, c: cc });

            // AMOUNT column (#1)
            if (c === 1) {
              const cleaned = Number(raw[1]?.toString().replace(/[₱,]/g, ""));
              if (!raw[1]) {
                ws[ref] = { v: "", t: "s", s: cellStyle };
              } else {
                ws[ref] = {
                  v: cleaned,
                  t: "n",
                  z: '"₱"* #,##0.00;[Red]"₱"* (#,##0.00)',
                  s: {
                    ...cellStyle,
                    alignment: { horizontal: "right", vertical: "center" },
                  },
                };
              }
            } else {
              ws[ref] = { v: formattedRow[c], t: "s", s: cellStyle };
            }

            maxRowUsed = Math.max(maxRowUsed, rr);
          }
        }
      }

      // Column widths
      const totalCols = MONTHS_PER_ROW * BLOCK_COLS;
      ws["!cols"] = Array(totalCols).fill({ wch: 2 });

      for (let b = 0; b < MONTHS_PER_ROW; b++) {
        const base = b * BLOCK_COLS;
        ws["!cols"][base + 0] = { wch: 20 };
        ws["!cols"][base + 1] = { wch: 18 };
        ws["!cols"][base + 2] = { wch: 14 };
        ws["!cols"][base + 3] = { wch: 20 };
        ws["!cols"][base + 4] = { wch: 22 };
      }

      ws["!ref"] = XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: maxRowUsed + 2, c: totalCols - 1 },
      });

      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    // CREATE BOTH SHEETS
    generateSheet(revenueGrid, `REVENUE ${currentYear}`, REVENUE_COLORS, false);
    generateSheet(expenseGrid, `EXPENSE ${currentYear}`, EXPENSE_COLORS, true);

    XLSX.writeFile(wb, fileName);
  };

  // const handleResetGrid = () => {
  //   const blankGrid = createBlankGrid();
  //   setGridData(blankGrid);
  //   if (activeTab === "revenue") {
  //     setRevenueGrid(blankGrid);
  //   } else {
  //     setExpenseGrid(blankGrid);
  //   }
  //   setIsSynced(false);
  // };

  const handleResetGrid = () => {
    // Step 1: Clear ONLY the selected month from localStorage
    const currentLocalStorage =
      loadFromLocalStorage(activeTab, currentYear) || {};
    delete currentLocalStorage[selectedMonthIndex]; // Use selectedMonthIndex
    saveToLocalStorage(activeTab, currentYear, currentLocalStorage);

    // Step 2: Get blank month data using createBlankGrid() structure
    const blankGrid = createBlankGrid();
    const blankMonthData =
      blankGrid[selectedMonthIndex] ||
      Array(5)
        .fill(null)
        .map(() => Array(5).fill(""));

    // Step 3: Update state - only reset the selected month, keep other months
    if (activeTab === "revenue") {
      setRevenueGrid((prev) => {
        const updated = { ...prev };
        // Ensure the year exists
        if (!updated[currentYear]) {
          updated[currentYear] = {};
        }
        updated[currentYear][selectedMonthIndex] = blankMonthData;
        return updated;
      });
    } else {
      setExpenseGrid((prev) => {
        const updated = { ...prev };
        // Ensure the year exists
        if (!updated[currentYear]) {
          updated[currentYear] = {};
        }
        updated[currentYear][selectedMonthIndex] = blankMonthData;
        return updated;
      });
    }

    // Step 4: Update gridData to show the reset month
    setGridData((prev) => {
      const updated = { ...prev };
      updated[selectedMonthIndex] = blankMonthData;
      return updated;
    });

    setIsSynced(false);
  };

  // Autofill payments when context changes
// Autofill payments when context changes
useEffect(() => {
  // Skip if no payment entries
  if (!paymentEntries || Object.keys(paymentEntries).length === 0) return;

  // CASE 1: Handle booking cancellation cleanup
  if (cancelTrigger) {
    setRevenueGrid((prev) => {
      const currentYearData = prev[currentYear] || {};
      const newGrid = JSON.parse(JSON.stringify(currentYearData));

      Object.keys(newGrid).forEach((mIndex) => {
        if (Array.isArray(newGrid[mIndex])) {
          newGrid[mIndex] = newGrid[mIndex].filter(
            (row) => !(row?._isAutoFill && row._bookingId === String(cancelTrigger)),
          );
          while (newGrid[mIndex].length < 5) {
            newGrid[mIndex].push(Array(5).fill(""));
          }
        }
      });

      return { ...prev, [currentYear]: newGrid };
    });

    if (activeTab === "revenue") {
      setGridData((prev) => {
        const newGrid = JSON.parse(JSON.stringify(prev));
        Object.keys(newGrid).forEach((mIndex) => {
          if (Array.isArray(newGrid[mIndex])) {
            newGrid[mIndex] = newGrid[mIndex].filter(
              (row) => !(row?._isAutoFill && row._bookingId === String(cancelTrigger)),
            );
            while (newGrid[mIndex].length < 5) {
              newGrid[mIndex].push(Array(5).fill(""));
            }
          }
        });
        return newGrid;
      });
    }
    return;
  }

  // CASE 2: Handle normal autofill - ONLY run when autoFillTrigger is true
  if (!autoFillTrigger) return;

  console.log("🟢 AUTOFILL TRIGGERED with paymentEntries:", paymentEntries);

  setRevenueGrid((prevRevenueGrid) => {
    const currentYearData = prevRevenueGrid[currentYear] || {};
    const newGrid = JSON.parse(JSON.stringify(currentYearData));

    // Ensure all months exist as arrays
    months.forEach((_, i) => {
      if (!Array.isArray(newGrid[i])) {
        newGrid[i] = Array(5).fill().map(() => Array(5).fill(""));
      }
    });

    const validKeys = new Set();

    Object.entries(paymentEntries).forEach(([bookingId, entries]) => {
      if (!Array.isArray(entries)) return;

      entries.forEach((entry, entryIndex) => {
        if (!entry?.date) return;

        const date = new Date(entry.date);
        if (isNaN(date.getTime())) return;

        const monthIndex = date.getMonth();

        if (!Array.isArray(newGrid[monthIndex])) {
          newGrid[monthIndex] = Array(5).fill().map(() => Array(5).fill(""));
        }

        const formattedAmount = entry.amount != null
          ? `₱${Number(entry.amount).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : "₱0.00";

        const rowArray = [
          entry.carName || "",
          formattedAmount,
          entry.mop || "",
          entry.pop || "",
          entry.date || "",
        ];
        rowArray._isAutoFill = true;
        rowArray._bookingId = String(bookingId);
        rowArray._entryIndex = entryIndex;

        validKeys.add(`${bookingId}-${entryIndex}`);

        const existingIndex = newGrid[monthIndex].findIndex(
          (r) => r?._isAutoFill && r._bookingId === String(bookingId) && r._entryIndex === entryIndex,
        );

        if (existingIndex !== -1) {
          newGrid[monthIndex][existingIndex] = rowArray;
        } else {
          const emptyIndex = newGrid[monthIndex].findIndex(
            (r) => Array.isArray(r) && r.every((c) => c === ""),
          );
          if (emptyIndex !== -1) {
            newGrid[monthIndex][emptyIndex] = rowArray;
          } else {
            newGrid[monthIndex].push(rowArray);
          }
        }

        while (newGrid[monthIndex].length < 5) {
          newGrid[monthIndex].push(Array(5).fill(""));
        }
      });
    });

    // Cleanup stale autofill rows
    Object.keys(newGrid).forEach((mIndex) => {
      if (!Array.isArray(newGrid[mIndex])) return;
      
      newGrid[mIndex] = newGrid[mIndex].filter((row) => {
        if (row?._isAutoFill) {
          return validKeys.has(`${row._bookingId}-${row._entryIndex}`);
        }
        return true;
      });

      while (newGrid[mIndex].length < 5) {
        newGrid[mIndex].push(Array(5).fill(""));
      }
    });

    console.log("🟢 UPDATED revenueGrid for year", currentYear, ":", newGrid);
    return { ...prevRevenueGrid, [currentYear]: newGrid };
  });

  // Update gridData for display if on revenue tab
  if (activeTab === "revenue") {
    setGridData((prev) => {
      const newGrid = JSON.parse(JSON.stringify(prev));
      
      months.forEach((_, i) => {
        if (!Array.isArray(newGrid[i])) {
          newGrid[i] = Array(5).fill().map(() => Array(5).fill(""));
        }
      });

      const validKeys = new Set();

      Object.entries(paymentEntries).forEach(([bookingId, entries]) => {
        if (!Array.isArray(entries)) return;

        entries.forEach((entry, entryIndex) => {
          if (!entry?.date) return;

          const date = new Date(entry.date);
          if (isNaN(date.getTime())) return;

          const monthIndex = date.getMonth();

          if (!Array.isArray(newGrid[monthIndex])) {
            newGrid[monthIndex] = Array(5).fill().map(() => Array(5).fill(""));
          }

          const formattedAmount = entry.amount != null
            ? `₱${Number(entry.amount).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            : "₱0.00";

          const rowArray = [
            entry.carName || "",
            formattedAmount,
            entry.mop || "",
            entry.pop || "",
            entry.date || "",
          ];
          rowArray._isAutoFill = true;
          rowArray._bookingId = String(bookingId);
          rowArray._entryIndex = entryIndex;

          validKeys.add(`${bookingId}-${entryIndex}`);

          const existingIndex = newGrid[monthIndex].findIndex(
            (r) => r?._isAutoFill && r._bookingId === String(bookingId) && r._entryIndex === entryIndex,
          );

          if (existingIndex !== -1) {
            newGrid[monthIndex][existingIndex] = rowArray;
          } else {
            const emptyIndex = newGrid[monthIndex].findIndex(
              (r) => Array.isArray(r) && r.every((c) => c === ""),
            );
            if (emptyIndex !== -1) {
              newGrid[monthIndex][emptyIndex] = rowArray;
            } else {
              newGrid[monthIndex].push(rowArray);
            }
          }

          while (newGrid[monthIndex].length < 5) {
            newGrid[monthIndex].push(Array(5).fill(""));
          }
        });
      });

      console.log("🟢 UPDATED gridData:", newGrid);
      return newGrid;
    });
  }

  setIsSynced(false);
}, [autoFillTrigger, cancelTrigger, paymentEntries, activeTab, currentYear]);




  // DEBUG: Track ALL tabs data on every change
  useEffect(() => {
    // Show REVENUE tab data for current month
    const revenueMonthData = revenueGrid[currentYear];
    if (revenueMonthData) {
      const febRevenue = revenueMonthData["1"]; // February (index 1)
      if (febRevenue) {
      } else {
      }
    } else {
    }

    // Show EXPENSE tab data for current month
    const expenseMonthData = expenseGrid[currentYear];
    if (expenseMonthData) {
      const febExpense = expenseMonthData["1"]; // February (index 1)
      if (febExpense) {
      } else {
      }
    } else {
    }

    // Show CURRENT view gridData
    if (gridData && Object.keys(gridData).length > 0) {
      const currentMonthData = gridData["1"];
      if (currentMonthData) {
      } else {
      }
    } else {
    }
  }, [gridData, activeTab, currentYear, revenueGrid, expenseGrid]);

  // Format properly on blur
  const handleAmountBlur = (monthIndex, rowIndex, colIndex, value) => {
    const numeric = value.replace(/[^0-9.]/g, "");
    const number = parseFloat(numeric);

    const formatted =
      !isNaN(number) && numeric !== ""
        ? `₱${number.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : "₱0.00";

    setGridData((prev) => {
      const monthData = prev[monthIndex] || {};
      const rowKey =
        typeof rowIndex === "string" && rowIndex.startsWith("Row_")
          ? rowIndex
          : `Row_${rowIndex}`;
      const currentRow = monthData[rowKey] || ["", "", "", "", ""];
      const updatedRow = currentRow.map((cell, c) =>
        c === colIndex ? value : cell,
      );

      return {
        ...prev,
        [monthIndex]: {
          ...monthData,
          [rowKey]: updatedRow,
        },
      };
    });
  };

  // When user focuses on amount field
  const handleAmountFocus = (monthIndex, rowIndex, colIndex, value) => {
    if (value === "₱0.00") {
      setGridData((prev) => {
        const monthData = prev[monthIndex] || {};
        const rowKey =
          typeof rowIndex === "string" && rowIndex.startsWith("Row_")
            ? rowIndex
            : `Row_${rowIndex}`;
        const currentRow = monthData[rowKey] || ["", "", "", "", ""];
        const updatedRow = currentRow.map((cell, c) =>
          c === colIndex ? "₱" : cell,
        );

        return {
          ...prev,
          [monthIndex]: {
            ...monthData,
            [rowKey]: updatedRow,
          },
        };
      });
    }
  };

  // const addRow = (monthIndex) => {
  //   setGridData((prev) => {
  //     const updated = { ...prev };
  //     const monthRows = [...(updated[monthIndex] || [])];

  //     // Add 3 new empty rows
  //     for (let i = 0; i < 3; i++) {
  //       monthRows.push(Array(5).fill(""));
  //     }

  //     // Limit to max 50 rows
  //     if (monthRows.length > 50) {
  //       alert("Maximum of 50 rows per month reached.");
  //       return prev;
  //     }

  //     updated[monthIndex] = monthRows;
  //     return updated;
  //   });
  // };

  const addRow = (monthIndex) => {
    console.log("=== addRow FUNCTION ENTERED ===");
    console.log("monthIndex:", monthIndex);
    console.log("BEFORE update - gridData[monthIndex]:", gridData[monthIndex]);

    setGridData((prev) => {
      console.log("=== INSIDE setGridData ===");
      console.log("prev[monthIndex]:", prev[monthIndex]);

      const updated = { ...prev };
      const monthRows = { ...updated[monthIndex] };

      const existingNumericKeys = Object.keys(monthRows)
        .filter((key) => key.startsWith("Row_"))
        .map((key) => Number(key.replace("Row_", "")));

      console.log("existingNumericKeys:", existingNumericKeys);

      const nextKeyNum =
        existingNumericKeys.length > 0
          ? Math.max(...existingNumericKeys) + 1
          : 0;
      const nextKey = `Row_${nextKeyNum}`;

      console.log("➕ Adding new row at key:", nextKey);

      monthRows[nextKey] = Array(5).fill("");
      console.log("✅ monthRows AFTER adding:", monthRows);

      updated[monthIndex] = monthRows;
      console.log("✅ updated[monthIndex] AFTER:", updated[monthIndex]);

      return updated;
    });
  };

  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 200));
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 25));
  const resetZoom = () => {
    setZoomLevel(100);
    setShowAllMonths(false);
  };

  const toggleShowAll = () => setShowAllMonths((prev) => !prev);

  // Determine which months to display
  const visibleMonths = showAllMonths ? months : [months[selectedMonthIndex]];

  const goToPrevMonth = () => {
    setSelectedMonthIndex((prev) => {
      if (prev === 0) {
        setCurrentYear((year) => year - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const goToNextMonth = () => {
    setSelectedMonthIndex((prev) => {
      if (prev === 11) {
        setCurrentYear((year) => year + 1);
        return 0;
      }
      return prev + 1;
    });
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

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const closeFinancialWarning = () => {
    setShowFinancialWarning(false);
    setFinancialWarningMessage("");
  };

  // Add this near the top of FinancialReports.js, after the imports
  const ensureArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "object" && value !== null) {
      return Object.values(value);
    }
    return Array(5).fill("");
  };

  const MonthYearDropdown = () => {
    if (typeof document === "undefined") return null;

    const [position, setPosition] = useState(null); // Start with null

    useEffect(() => {
      const updatePosition = () => {
        const buttonRect = monthYearButtonRef.current?.getBoundingClientRect();
        if (buttonRect) {
          setPosition({
            top: buttonRect.top + window.scrollY + 40,
            left: buttonRect.left + buttonRect.width / 2,
          });
        }
      };

      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition);

      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition);
      };
    }, []);

    // Don't render anything until position is calculated
    if (!position) return null;

    return createPortal(
      <>
        {/* Backdrop */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9998,
          }}
          onClick={() => setShowMonthYearDropdown(false)}
        />

        {/* Dropdown - Now has correct position from the start */}
        <div
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            transform: "translateX(-50%)",
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 9999,
            padding: "10px",
            minWidth: "200px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Month grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "5px",
              marginBottom: "10px",
            }}
          >
            {months.map((month, idx) => (
              <button
                key={month}
                onClick={() => {
                  setSelectedMonthIndex(idx);
                  setShowMonthYearDropdown(false);
                }}
                style={{
                  padding: "6px 4px",
                  fontSize: "0.7rem",
                  fontWeight: idx === selectedMonthIndex ? "bold" : "normal",
                  backgroundColor:
                    idx === selectedMonthIndex ? "#28a745" : "transparent",
                  color: idx === selectedMonthIndex ? "white" : "black",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {month.substring(0, 3)}
              </button>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #eee", paddingTop: "10px" }}>
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              style={{
                width: "100%",
                padding: "6px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowMonthYearDropdown(false)}
            style={{
              width: "100%",
              marginTop: "10px",
              padding: "6px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </>,
      document.body,
    );
  };

  return (
    <div className="financial-reports">
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

      {showManualLoadConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3 className="confirm-header">
              {manualLoadOption === "month"
                ? `Load ${months[selectedMonthIndex]} ${currentYear} (${activeTab})?`
                : `Load YEAR ${currentYear} (${activeTab})?`}
            </h3>
            <p className="confirm-text">
              {manualLoadOption === "month"
                ? `This will replace ${months[selectedMonthIndex]} ${currentYear} (${activeTab}) with data from Database.`
                : `This will replace YEAR ${currentYear} (${activeTab}) with data from Database.`}
            </p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={async () => {
                  setShowManualLoadConfirm(false);

                  setProcessingBooking({
                    isProcessing: true,
                    message: "Loading from Database...",
                    textClass: "submitting-text",
                  });

                  try {
                    if (manualLoadOption === "month") {
                      await performManualLoadMonth();
                    } else {
                      await performManualLoadYear();
                    }

                    setActionOverlay({
                      isVisible: true,
                      type: "success",
                      message: "Loaded from Database.",
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
                    }, 2500);
                  } catch (err) {
                    console.error("❌ Manual load failed:", err);
                    setActionOverlay({
                      isVisible: true,
                      type: "error",
                      message: "Failed to load from Database.",
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
                    }, 2500);
                  } finally {
                    setProcessingBooking({
                      isProcessing: false,
                      message: "",
                      textClass: "submitting-text",
                    });
                  }
                }}
              >
                Yes, Load
              </button>
              <button
                className="confirm-btn cancel"
                onClick={() => setShowManualLoadConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3 className="confirm-header">Reset Grid?</h3>
            <p className="confirm-text">
              This will clear all data in {months[selectedMonthIndex]}{" "}
              {currentYear}. Continue?
            </p>

            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={async () => {
                  setShowResetConfirm(false);
                  handleResetGrid();
                  setActionOverlay({
                    isVisible: true,
                    type: "warning",
                    message: "Grid reset successfully.",
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
                  }, 2500);
                }}
              >
                Yes, Reset
              </button>
              <button
                className="confirm-btn cancel"
                onClick={() => setShowResetConfirm(false)}
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
            <h3 className="confirm-header">Delete Selected Rows?</h3>
            <p className="confirm-text">
              This will delete <strong>{selectedRows.length}</strong> selected
              row(s) in {months[selectedMonthIndex]} {currentYear}. For rows
              1-5, only the data will be cleared. For rows 6 and above, the
              entire row will be removed. Continue?
            </p>

            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  setShowDeleteConfirm(false);

                  setGridData((prev) => {
                    const newGrid = { ...prev };

                    // Ensure month exists
                    if (!newGrid[selectedMonthIndex]) {
                      newGrid[selectedMonthIndex] = {};
                    }

                    const monthRows = { ...newGrid[selectedMonthIndex] };

                    // For Row_0 to Row_4: only clear data, keep the row
                    // For Row_5+: actually delete the row entirely
                    selectedRows.forEach((r) => {
                      const rowNum = parseInt(r.replace("Row_", ""), 10);

                      if (rowNum < 5) {
                        // First 5 rows: only clear the data, keep the row
                        monthRows[r] = Array(5).fill("");
                      } else {
                        // Row_5 and above: delete the entire row
                        delete monthRows[r];
                      }
                    });

                    newGrid[selectedMonthIndex] = monthRows;

                    return newGrid;
                  });

                  setSelectedRows([]);

                  setActionOverlay({
                    isVisible: true,
                    type: "warning",
                    message: `${selectedRows.length} row(s) deleted successfully.`,
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
                  }, 2500);
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

      {showDeleteFirestoreConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3 className="confirm-header">Delete to Database?</h3>
            <p className="confirm-text">
              This will permanently delete{" "}
              <strong>{selectedRows.length}</strong> selected row(s):{" "}
              <strong>{selectedRows.join(", ")}</strong> from the{" "}
              <strong>{activeTab}</strong> tab in {months[selectedMonthIndex]}{" "}
              {currentYear}. This action cannot be undone. Continue?
            </p>

            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={async () => {
                  setShowDeleteFirestoreConfirm(false);

                  setSavingStatus(true);

                  try {
                    // Get the current grid data
                    const currentGrid = gridData[selectedMonthIndex] || {};
                    const rowsToDelete = selectedRows;

                    // Create a new grid without the deleted rows
                    const updatedGrid = { ...currentGrid };

                    // Remove the selected rows from the grid
                    rowsToDelete.forEach((rowKey) => {
                      delete updatedGrid[rowKey];
                    });

                    // Create the data object to save - need to include ALL months, not just the current one
const dataToSave = { ...gridData };
dataToSave[selectedMonthIndex] = updatedGrid;

// Save to Firestore
console.log(
  "🗑️ Deleting rows from Firestore:",
  rowsToDelete,
);
await saveFinancialReport(
  activeTab,
  dataToSave,
  currentYear,
);


                    // Also update local state
                    setGridData((prev) => {
                      const newGrid = { ...prev };
                      newGrid[selectedMonthIndex] = updatedGrid;
                      return newGrid;
                    });

                    setSelectedRows([]);

                    setActionOverlay({
                      isVisible: true,
                      type: "warning",
                      message: `${rowsToDelete.length} row(s) deleted from database successfully.`,
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
                    }, 2500);
                  } catch (error) {
                    console.error("❌ Error deleting from Firestore:", error);
                    setActionOverlay({
                      isVisible: true,
                      type: "warning",
                      message: "Error deleting rows from database.",
                    });
                  } finally {
                    setSavingStatus(false);
                  }
                }}
              >
                Yes, Delete to DB
              </button>
              <button
                className="confirm-btn cancel"
                onClick={() => setShowDeleteFirestoreConfirm(false)}
              >
                Cancel
              </button>
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

      {/* ================= Financial Warning Overlay ================= */}
      {showFinancialWarning && (
        <div className="warning-overlay" onClick={closeFinancialWarning}>
          <div
            className="warning-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="warning-icon">
              <MdWarning size={32} />
            </div>
            <h3>Attention!</h3>
            <p>{financialWarningMessage}</p>
            <button className="warning-btn" onClick={closeFinancialWarning}>
              OK
            </button>
          </div>
        </div>
      )}

      <h2>Financial Reports</h2>

      {/* Tab Switcher */}
      <div className="tab-switcher">
        <div className={`tab-container ${activeTab}`}>
          <button
            data-type="revenue"
            className={`tab-button ${activeTab === "revenue" ? "active" : ""}`}
            disabled={isTabLoading}
            style={{
              opacity: isTabLoading ? 0.5 : 1,
              cursor: isTabLoading ? "not-allowed" : "pointer",
            }}
            onClick={() => {
              if (activeTab === "expense") setExpenseGrid(gridData);
              setActiveTab("revenue");
            }}
          >
            REVENUE
          </button>

          <button
            data-type="expense"
            className={`tab-button ${activeTab === "expense" ? "active" : ""}`}
            disabled={isTabLoading}
            style={{
              opacity: isTabLoading ? 0.5 : 1,
              cursor: isTabLoading ? "not-allowed" : "pointer",
            }}
            onClick={() => {
              if (activeTab === "revenue") setRevenueGrid(gridData);
              setActiveTab("expense");
            }}
          >
            EXPENSE
          </button>

          <button
            data-type="transaction"
            className={`tab-button ${activeTab === "transaction" ? "active" : ""}`}
            disabled={isTabLoading}
            style={{
              opacity: isTabLoading ? 0.5 : 1,
              cursor: isTabLoading ? "not-allowed" : "pointer",
            }}
            onClick={() => {
              if (activeTab === "revenue") setRevenueGrid(gridData);
              if (activeTab === "expense") setExpenseGrid(gridData);
              setActiveTab("transaction");
            }}
          >
            TRANSACTION
          </button>
        </div>
      </div>

      {activeTab !== "transaction" && (
        <>
          <div className="toolbar" style={{ backgroundColor: background }}>
            {/* GROUP 1 — LEFT SIDE (2×2 grid) */}
            <div className="toolbar-group group-left">
              <div className="g1-item">
                {/* Auto Save */}
                <div
                  className="auto-save-toggle"
                  onClick={() => setAutoSaveEnabled((prev) => !prev)}
                >
                  <label className="ios-switch">
                    <input
                      type="checkbox"
                      checked={autoSaveEnabled}
                      onChange={() => setAutoSaveEnabled((prev) => !prev)}
                    />
                    <span className="slider"></span>
                  </label>
                  <span className="auto-label">Auto-Save</span>
                </div>
              </div>

              <div className="g1-item-ml">
                <div
                  className="manual-load-dropdown"
                  style={{ position: "relative" }}
                >
                  <button
                    onClick={() => setShowManualLoadMenu(!showManualLoadMenu)}
                  >
                    Manual Load ▾
                  </button>
                  {showManualLoadMenu && (
                    <div className="manual-load-options">
                      <button
                        className="mlo-buttons"
                        onClick={() => {
                          setShowManualLoadMenu(false);
                          setManualLoadOption("month");
                          setShowManualLoadConfirm(true);
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <MdCalendarToday /> {months[selectedMonthIndex]}{" "}
                          {currentYear}
                        </span>
                      </button>
                      <button
                        className="mlo-buttons"
                        onClick={() => {
                          setShowManualLoadMenu(false);
                          setManualLoadOption("year");
                          setShowManualLoadConfirm(true);
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <MdAnalytics /> YEAR {currentYear}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="g1-item-sm">
                <button onClick={toggleShowAll}>
                  {showAllMonths ? "Show Current Only" : "Show All Months"}
                </button>
              </div>

              <div className="g1-item-sort">
                <button
                  className="sort-select"
                  onClick={() => {
                    setSortMode("date");
                    setSortDirection((prev) =>
                      prev === "asc" ? "desc" : "asc",
                    );
                  }}
                >
                  Sort (
                  {sortDirection === "asc"
                    ? "Oldest → Newest"
                    : "Newest → Oldest"}
                  )
                </button>
              </div>
            </div>

            {/* GROUP 2 — RIGHT SIDE (Zoom controls + Export) */}
            <div className="toolbar-group group-right-container">
              {/* Column 1: Zoom controls */}
              <div className="group-right zoom-block">
                <div className="zoom-row">
                  <button onClick={zoomIn} className="zoom-in">
                    <img src="/assets/zoomIn.png" alt="Zoom In" />
                  </button>

                  <button onClick={zoomOut} className="zoom-out">
                    <img src="/assets/zoomOut.png" alt="Zoom Out" />
                  </button>

                  <button onClick={resetZoom} className="zoom-reset">
                    <img src="/assets/zoomReset.png" alt="Reset Zoom" />
                  </button>
                </div>

                <div className="zoom-label">Zoom: {zoomLevel}%</div>
              </div>

              {/* Column 2: Export Button */}
              <div className="group-right export-block">
                <button className="export-btn" onClick={handleExport}>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                    }}
                  >
                    <MdDownload /> Export
                  </span>
                </button>
                <button
                  className="reset-btn"
                  onClick={() => setShowResetConfirm(true)}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                    }}
                  >
                    <MdRefresh /> Reset Grid
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Spreadsheet Grid */}
          <div
            className="spreadsheet-container"
            style={{ zoom: `${zoomLevel}%` }}
          >
            <div className={`months-grid ${showAllMonths ? "all-months" : ""}`}>
              {visibleMonths.map((month, index) => {
                const monthIndex = months.indexOf(month);

                // Get current month's rows as object
                let entries = gridData[monthIndex] || {};

                // Ensure it's an object and sort rows by Row_0 → Row_4 order
                if (typeof entries !== "object" || entries === null) {
                  entries = {};
                }

                // // Explicitly sort rows by key to guarantee order
                // const rowKeys = ["Row_0", "Row_1", "Row_2", "Row_3", "Row_4"];
                // Dynamically get all row keys and sort them numerically
                const rowKeys = Object.keys(entries)
                  .filter((key) => key.startsWith("Row_"))
                  .sort((a, b) => {
                    const numA = parseInt(a.replace("Row_", ""), 10);
                    const numB = parseInt(b.replace("Row_", ""), 10);
                    return numA - numB;
                  });

                const sortedEntries = rowKeys
                  .map((key) => ({ key, row: entries[key] }))
                  .filter((item) => item.row !== undefined);

                // Apply sorting to the sorted entries
                if (sortMode === "date") {
                  sortedEntries.sort((a, b) => {
                    const da = new Date(a.row[4] || "").getTime();
                    const db = new Date(b.row[4] || "").getTime();
                    return sortDirection === "asc" ? da - db : db - da;
                  });
                }

                return (
                  <div
                    key={monthIndex}
                    className={`month-section ${
                      monthIndex === currentMonth ? "current" : ""
                    }`}
                  >
                    <div className="grid-container">
                      <div
                        className={`month-header ${!isSynced ? "unsaved" : ""}`}
                        style={{
                          backgroundColor: headerColor,
                          color: "#fff",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        {/* Top row: status + save button */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "0.85rem",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <div
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                backgroundColor: isSynced
                                  ? "#04ee3bff"
                                  : "#ffa4aeff",
                              }}
                            ></div>
                            <span>
                              {isSynced ? "Up to Date" : "Unsaved Changes"}
                            </span>
                          </div>

                          {/* Save icon / spinner */}
                          <div
                            style={{
                              position: "relative",
                              width: 70,
                              height: 50,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                            }}
                          >
                            {savingStatus ? (
                              <div
                                className="spinner"
                                style={{ position: "absolute" }}
                              />
                            ) : (
                              <div
                                className="save-pill"
                                onClick={saveAllPendingToFirestore}
                                style={{
                                  opacity: autoSaveEnabled
                                    ? 0.4
                                    : isSynced
                                      ? 0.7
                                      : 1,
                                  pointerEvents: autoSaveEnabled
                                    ? "none"
                                    : "auto",
                                  position: "absolute",
                                }}
                              >
                                <img
                                  src="/assets/saveToCloud.png"
                                  alt="Save"
                                  className="save-icon"
                                />
                                <span className="save-text">Save</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom row: prev/next buttons + big centered month + year */}

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "10px",
                            width: "100%",
                            maxWidth: "350px",
                            margin: "0 auto",
                            position: "relative",
                          }}
                        >
                          <button
                            onClick={goToPrevMonth}
                            className="month-toggle"
                            style={{
                              visibility: showAllMonths ? "hidden" : "visible",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              opacity: 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src="/assets/prv-btn.png"
                              alt="Previous"
                              style={{ width: "20px", height: "30px" }}
                            />
                          </button>

                          <div
                            ref={monthYearButtonRef}
                            onClick={() => {
    if (!showAllMonths) {
      setShowMonthYearDropdown(!showMonthYearDropdown);
    }
  }}
                            style={{
                              letterSpacing: "0.5px",
                              fontWeight: "bolder",
                              fontSize: "1.5rem",
                              textAlign: "center",
                              flex: "0 0 auto",
                              minWidth: "180px",
                              cursor: showAllMonths ? "default" : "pointer",
                              padding: "5px 10px",
                              borderRadius: "5px",
                              userSelect: "none",
                              WebkitUserSelect: "none",
                              backgroundColor: showMonthYearDropdown
                                ? "var(--accent-color)"
                                : "transparent",
                            }}
                          >
                            {months[monthIndex].toUpperCase()} {currentYear}
                          </div>



                          <button
                            onClick={goToNextMonth}
                            className="month-toggle"
                            style={{
                              visibility: showAllMonths ? "hidden" : "visible",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              opacity: 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src="/assets/nxt-btn.png"
                              alt="Next"
                              style={{ width: "20px", height: "30px" }}
                            />
                          </button>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontWeight: "600",
                            fontSize: "1.2rem",
                            marginTop: "2px",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {/* New indicator on the left */}
                          <div
                            style={{
                              fontSize: "0.75rem",
                              opacity: 0.8,
                              color: "#ffc5ccff",
                              textAlign: "left",
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            {hasServerChange
                              ? "⚠️ Recent changes in Database. Click Manual Load."
                              : ""}
                          </div>

                          {/* Last Saved on the right */}
                          <div
                            style={{
                              fontSize: "0.75rem",
                              opacity: 0.8,
                              textAlign: "right",
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            Last Saved: {formatDateTime(lastSavedAt)}
                          </div>
                        </div>
                      </div>

                      <div className="grid-wrapper">
                        {/* Fixed Labels Header */}
                        <div
                          className="grid-header-row"
                          style={{ borderBottom: `2px solid ${borderColor}` }}
                        >
                          <div className="grid-header-cell row-number-header">
                            <input
                              type="checkbox"
                                                            checked={
                                sortedEntries.length > 0 &&
                                sortedEntries.every((item) =>
                                  selectedRows.includes(`${monthIndex}-${item.key}`),
                                )
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  // Select all visible rows for this month
                                  const allRowKeys = sortedEntries.map(
                                    (item) => `${monthIndex}-${item.key}`,
                                  );
                                  setSelectedRows((prev) => [
                                    ...new Set([...prev, ...allRowKeys]),
                                  ]);
                                } else {
                                  // Deselect all visible rows for this month
                                  const allRowKeys = sortedEntries.map(
                                    (item) => `${monthIndex}-${item.key}`,
                                  );
                                  setSelectedRows((prev) =>
                                    prev.filter(
                                      (key) => !allRowKeys.includes(key),
                                    ),
                                  );
                                }
                              }}

                              // checked={
                              //   sortedEntries.length > 0 &&
                              //   sortedEntries.every((item) =>
                              //     selectedRows.includes(item.key),
                              //   )
                              // }
                              // onChange={(e) => {
                              //   if (e.target.checked) {
                              //     // Select all visible rows
                              //     const allRowKeys = sortedEntries.map(
                              //       (item) => item.key,
                              //     );
                              //     setSelectedRows((prev) => [
                              //       ...new Set([...prev, ...allRowKeys]),
                              //     ]);
                              //   } else {
                              //     // Deselect all visible rows
                              //     const allRowKeys = sortedEntries.map(
                              //       (item) => item.key,
                              //     );
                              //     setSelectedRows((prev) =>
                              //       prev.filter(
                              //         (key) => !allRowKeys.includes(key),
                              //       ),
                              //     );
                              //   }
                              // }}
                              style={{ cursor: "pointer" }}
                            />
                          </div>

                          <div className="grid-header-cell">UNIT</div>
                          <div className="grid-header-cell">AMOUNT</div>
                          <div className="grid-header-cell">MOP</div>
                          <div className="grid-header-cell">
                            {activeTab === "revenue" ? "POP" : "POE"}
                          </div>

                          <div className="grid-header-cell">DATE</div>
                        </div>

                        {/* Scrollable Grid */}
                        {isTabLoading ? (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              height: "200px",
                            }}
                          >
                            <div
                              className="spinner"
                              style={{
                                width: "40px",
                                height: "40px",
                                border: "4px solid #ccc",
                                borderTop: `4px solid ${activeTab === "revenue" ? "#28a745" : "#dc3545"}`,
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
                          <div
                            className="grid-scrollable"
                            style={{ backgroundColor: background }}
                          >
                            {sortedEntries.map((item, sortedIndex) => {
                              const row = item.row;
                              const originalIndex = item.originalIndex;

                              return (
                                <div
                                  key={`${monthIndex}-${item.key}`}
                                                                    className={`grid-row ${selectedRows.includes(`${monthIndex}-${item.key}`) ? "selected" : ""}`}

                                  style={{
                                    cursor: row._isAutoFill
                                      ? "pointer"
                                      : "default",
                                  }}
                                  onClick={() => {
                                    if (row._isAutoFill) {
                                      // Find in activeBookings (array)
                                      let booking = activeBookings.find(
                                        (b) => b.id === row._bookingId,
                                      );

                                      // If not found, search in completedBookingsAnalytics (object)
                                      if (!booking) {
                                        for (const plateNo in completedBookingsAnalytics) {
                                          for (const key in completedBookingsAnalytics[
                                            plateNo
                                          ]) {
                                            if (
                                              [
                                                "carName",
                                                "carType",
                                                "unitImage",
                                              ].includes(key)
                                            )
                                              continue;
                                            const dateData =
                                              completedBookingsAnalytics[
                                                plateNo
                                              ][key];
                                            if (dateData.bookings) {
                                              booking = dateData.bookings.find(
                                                (b) => b.id === row._bookingId,
                                              );
                                              if (booking) {
                                                break;
                                              }
                                            }
                                          }
                                          if (booking) break;
                                        }
                                      }

                                      if (booking) {
                                        setSelectedBooking(booking);
                                        setShowDetailsOverlay(true);
                                      } else {
                                      }
                                    }
                                  }}
                                >
                                  <div className="grid-cell row-number-cell">
                                    <input
                                      type="checkbox"
                                                                            checked={selectedRows.includes(`${monthIndex}-${item.key}`)}

                                      disabled={row._isAutoFill === true}
                                      style={
                                        row._isAutoFill
                                          ? {
                                              cursor: "not-allowed",
                                              opacity: 1,
                                              pointerEvents: "none",
                                            }
                                          : {}
                                      }
                                                                            onChange={(e) => {
                                        const rowKey = `${monthIndex}-${item.key}`;
                                        setSelectedRows((prev) =>
                                          e.target.checked
                                            ? [...prev, rowKey]
                                            : prev.filter(
                                                (i) => i !== rowKey,
                                              ),
                                        );
                                      }}

                                    />
                                    <span>{sortedIndex + 1}</span>
                                  </div>

                                  {Array.isArray(row) ? (
                                    row.map((cell, colIndex) => {
                                      // 0 = UNIT, 1 = AMOUNT, 2 = MOP, 3 = POP, 4 = DATE
                                      const isAutoFill =
                                        row._isAutoFill === true;

                                      // UNIT column (dropdown from unitData)
                                      if (colIndex === 0) {
                                        return (
                                          <select
                                            key={colIndex}
                                            value={cell}
                                            disabled={isAutoFill}
                                            style={
                                              isAutoFill
                                                ? {
                                                    opacity: 1,
                                                    cursor: "not-allowed",
                                                    pointerEvents: "none",
                                                  }
                                                : {}
                                            }
                                            onChange={(e) =>
                                              handleCellChange(
                                                monthIndex,
                                                item.key,
                                                colIndex,
                                                e.target.value,
                                              )
                                            }
                                            className="grid-cell"
                                          >
                                            <option value="">
                                              Select Unit
                                            </option>
                                            {allUnitData.map((unit) => (
                                              <option
                                                key={unit.id}
                                                value={unit.name}
                                              >
                                                {unit.name}
                                              </option>
                                            ))}
                                            <option value="Person">
                                              Person
                                            </option>
                                            <option value="Organization">
                                              Organization
                                            </option>
                                          </select>
                                        );
                                      }

                                      // MOP column (dropdown)
                                      if (colIndex === 2) {
                                        return (
                                          <select
                                            key={colIndex}
                                            value={cell}
                                            onChange={(e) =>
                                              handleCellChange(
                                                monthIndex,
                                                item.key,
                                                colIndex,
                                                e.target.value,
                                              )
                                            }
                                            className="grid-cell"
                                            disabled={isAutoFill}
                                            style={
                                              isAutoFill
                                                ? {
                                                    opacity: 1,
                                                    cursor: "not-allowed",
                                                    pointerEvents: "none",
                                                  }
                                                : {}
                                            }
                                          >
                                            <option value="">Select MOP</option>
                                            {mopTypes.map((type) => (
                                              <option key={type} value={type}>
                                                {type}
                                              </option>
                                            ))}
                                          </select>
                                        );
                                      }

                                      // POP column (dropdown)
                                      else if (colIndex === 3) {
                                        const isRevenue =
                                          activeTab === "revenue";
                                        const label = isRevenue ? "POP" : "POE";

                                        const options = isRevenue
                                          ? popTypesRevenue
                                          : popTypesExpense;

                                        return (
                                          <select
                                            key={colIndex}
                                            value={cell}
                                            onChange={(e) =>
                                              handleCellChange(
                                                monthIndex,
                                                item.key,
                                                colIndex,
                                                e.target.value,
                                              )
                                            }
                                            className="grid-cell"
                                            disabled={isAutoFill}
                                            style={
                                              isAutoFill
                                                ? {
                                                    opacity: 1,
                                                    cursor: "not-allowed",
                                                    pointerEvents: "none",
                                                  }
                                                : {}
                                            }
                                          >
                                            <option value="">{`Select ${label}`}</option>
                                            {options.map((opt) => (
                                              <option key={opt} value={opt}>
                                                {opt}
                                              </option>
                                            ))}
                                          </select>
                                        );
                                      }

                                      // DATE column
                                      else if (colIndex === 4) {
                                        return (
                                          <input
                                            key={colIndex}
                                            type="datetime-local"
                                            className="grid-cell"
                                            value={(() => {
                                              if (!cell) return "";
                                              const parsed = new Date(cell);
                                              if (isNaN(parsed.getTime()))
                                                return "";
                                              const offset =
                                                parsed.getTimezoneOffset();
                                              const localDate = new Date(
                                                parsed.getTime() -
                                                  offset * 60000,
                                              );
                                              return localDate
                                                .toISOString()
                                                .slice(0, 16);
                                            })()}
                                            onChange={(e) =>
                                              handleCellChange(
                                                monthIndex,
                                                item.key,
                                                colIndex,
                                                e.target.value,
                                              )
                                            }
                                            onBlur={() =>
                                              applySorting(monthIndex)
                                            }
                                            disabled={isAutoFill}
                                            style={
                                              isAutoFill
                                                ? {
                                                    opacity: 1,
                                                    cursor: "not-allowed",
                                                    pointerEvents: "none",
                                                  }
                                                : {}
                                            }
                                          />
                                        );
                                      }

                                      // UNIT or AMOUNT columns
                                      else {
                                        if (colIndex === 1) {
                                          // AMOUNT INPUT — number-only while typing, format on blur
                                          return (
                                            <input
                                              key={colIndex}
                                              type="text"
                                              value={cell || "₱0.00"}
                                              onChange={(e) =>
                                                handleCellChange(
                                                  monthIndex,
                                                  item.key,
                                                  colIndex,
                                                  e.target.value,
                                                )
                                              }
                                              onFocus={(e) =>
                                                handleAmountFocus(
                                                  monthIndex,
                                                  item.key,
                                                  colIndex,
                                                  e.target.value,
                                                )
                                              }
                                              onBlur={(e) =>
                                                handleAmountBlur(
                                                  monthIndex,
                                                  item.key,
                                                  colIndex,
                                                  e.target.value,
                                                )
                                              }
                                              className="grid-cell text-right"
                                              placeholder="₱0.00"
                                              disabled={isAutoFill}
                                              style={
                                                isAutoFill
                                                  ? {
                                                      opacity: 1,
                                                      cursor: "not-allowed",
                                                      pointerEvents: "none",
                                                    }
                                                  : {}
                                              }
                                            />
                                          );
                                        } else {
                                          // UNIT INPUT
                                          return (
                                            <input
                                              key={colIndex}
                                              type="text"
                                              value={cell}
                                              onChange={(e) =>
                                                handleCellChange(
                                                  monthIndex,
                                                  item.key,
                                                  colIndex,
                                                  e.target.value,
                                                )
                                              }
                                              className="grid-cell"
                                              placeholder={`Cell ${parseInt(item.key.replace("Row_", "")) + 1}-${colIndex + 1}`}
                                              disabled={isAutoFill}
                                              style={
                                                row._isAutoFill
                                                  ? {
                                                      cursor: "not-allowed",
                                                      opacity: 1,
                                                      pointerEvents: "none",
                                                    }
                                                  : {}
                                              }
                                            />
                                          );
                                        }
                                      }
                                    })
                                  ) : (
                                    <div className="empty-row">No data</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

{!showAllMonths && (
                      <div className="grid-controls">
                        <button
                          onClick={() => {
                            console.log(
                              "🎯 Button clicked - monthIndex:",
                              monthIndex,
                              "activeTab:",
                              activeTab,
                            );
                            addRow(monthIndex);
                          }}
                          style={{
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          + Row
                        </button>

                        <button
                          onClick={() => {
                            if (selectedRows.length === 0) {
                              setFinancialWarningMessage(
                                "No rows selected. Please select at least one row to proceed.",
                              );
                              setShowFinancialWarning(true);
                              return;
                            }

                            setShowDeleteConfirm(true);
                          }}
                          style={{
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "5px",
                            }}
                          >
                            <MdDelete /> Delete Rows
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            if (selectedRows.length === 0) {
                              setFinancialWarningMessage(
                                "No rows selected. Please select at least one row to delete from database.",
                              );
                              setShowFinancialWarning(true);
                              return;
                            }

                            // Show confirmation for Firestore deletion
                            setShowDeleteFirestoreConfirm(true);
                          }}
                          style={{
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            marginLeft: "10px",
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "5px",
                            }}
                          >
                            <MdDelete /> Delete from Database
                          </span>
                        </button>
                      </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Transaction Flow Report Table */}
      {activeTab === "transaction" && (
        <div className="transaction-report">
          <h3>Transaction Flow Report</h3>
          <div className="transaction-scroll-container">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th
                    onClick={() => handleSort("date")}
                    style={{ cursor: "pointer" }}
                    className={sortColumn === "date" ? "active" : ""}
                  >
                    Date{" "}
                    {sortColumn === "date"
                      ? sortDirection === "asc"
                        ? "▲"
                        : "▼"
                      : "▼"}
                  </th>
                  <th>MOP</th>
                  <th
                    onClick={() => handleSort("type")}
                    style={{ cursor: "pointer" }}
                    className={sortColumn === "type" ? "active" : ""}
                  >
                    Type{" "}
                    {sortColumn === "type"
                      ? sortDirection === "asc"
                        ? "▲"
                        : "▼"
                      : "▼"}
                  </th>
                  <th>Amount</th>
                  <th>Unit</th>
                  <th>Description</th>
                </tr>
              </thead>

              {/* <tbody>
                {isTabLoading ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{ textAlign: "center", padding: "40px" }}
                    >
                      <div
                        className="spinner"
                        style={{
                          width: "40px",
                          height: "40px",
                          border: "4px solid #ccc",
                          borderTop: `4px solid #FF8C00`,
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                          margin: "0 auto",
                        }}
                      />
                      <style>{`
                        @keyframes spin {
                          to { transform: rotate(360deg); }
                        }
                      `}</style>
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const transactions = [];

                    // For transaction tab, use gridData (which has all localStorage data)
                    // gridData.revenue and gridData.expense are arrays of transaction objects
                    if (activeTab === "transaction" && gridData.revenue) {
                      // gridData.revenue is already an array of {year, month, rowKey, data}
                      gridData.revenue.forEach((tx) => {
                        transactions.push({
                          date: tx.data[4] || "",
                          mop: tx.data[2] || "",
                          type: "Revenue",
                          amount: tx.data[1] || "",
                          unit: tx.data[0] || "",
                          description:
                            tx.data[3] ||
                            "" +
                              (tx.data._isAutoFill
                                ? ` (${tx.data[0] || "Unknown"})`
                                : ""),
                        });
                      });
                    } else {
                      // Original logic for non-transaction tabs
                      Object.values(revenueGrid).forEach((monthRows) => {
                        Object.values(monthRows).forEach((row) => {
                          if (
                            row &&
                            Array.isArray(row) &&
                            row.some((cell) => cell !== "")
                          ) {
                            transactions.push({
                              date: row[4] || "",
                              mop: row[2] || "",
                              type: "Revenue",
                              description:
                                row[3] ||
                                "" +
                                  (row._isAutoFill
                                    ? ` (${row[0] || "Unknown"})`
                                    : ""),
                              amount: row[1] || "",
                            });
                          }
                        });
                      });
                    }

                    // Collect from expense grid
                    if (activeTab === "transaction" && gridData.expense) {
                      // gridData.expense is already an array of {year, month, rowKey, data}
                      gridData.expense.forEach((tx) => {
                        transactions.push({
                          date: tx.data[4] || "",
                          mop: tx.data[2] || "",
                          type: "Expense",
                          amount: tx.data[1] || "",
                          unit: tx.data[0] || "",
                          description:
                            tx.data[3] ||
                            "" +
                              (tx.data._isAutoFill
                                ? ` (${tx.data[0] || "Unknown"})`
                                : ""),
                        });
                      });
                    } else {
                      // Original logic for non-transaction tabs
                      Object.values(expenseGrid).forEach((monthRows) => {
                        Object.values(monthRows).forEach((row) => {
                          if (
                            row &&
                            Array.isArray(row) &&
                            row.some((cell) => cell !== "")
                          ) {
                            transactions.push({
                              date: row[4] || "",
                              mop: row[2] || "",
                              type: "Expense",
                              description:
                                row[3] ||
                                "" +
                                  (row._isAutoFill
                                    ? ` (${row[0] || "Unknown"})`
                                    : ""),
                              amount: row[1] || "",
                            });
                          }
                        });
                      });
                    }

                    // Helper to format date
                    const formatDate = (dateStr) => {
                      if (!dateStr) return "No Date";
                      const d = new Date(dateStr);
                      if (isNaN(d.getTime())) return dateStr;
                      return d.toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      });
                    };

                    const sortedTransactions = [...transactions].sort(
                      (a, b) => {
                        const hasDateA =
                          a.date && !isNaN(new Date(a.date).getTime());
                        const hasDateB =
                          b.date && !isNaN(new Date(b.date).getTime());

                        if (hasDateA && !hasDateB) return -1;
                        if (!hasDateA && hasDateB) return 1;
                        if (!hasDateA && !hasDateB) return 0;

                        let valA, valB;
                        if (sortColumn === "date") {
                          valA = new Date(a.date).getTime();
                          valB = new Date(b.date).getTime();
                        } else if (sortColumn === "type") {
                          valA = a.type;
                          valB = b.type;
                        }

                        if (sortDirection === "asc") {
                          if (valA < valB) return -1;
                          if (valA > valB) return 1;
                          // Equal, secondary sort
                          if (sortColumn === "date") {
                            return a.type < b.type
                              ? -1
                              : a.type > b.type
                                ? 1
                                : 0;
                          } else {
                            const dateA = new Date(a.date).getTime();
                            const dateB = new Date(b.date).getTime();
                            return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
                          }
                        } else {
                          if (valA > valB) return -1;
                          if (valA < valB) return 1;
                          // Equal, secondary sort
                          if (sortColumn === "date") {
                            return a.type > b.type
                              ? -1
                              : a.type < b.type
                                ? 1
                                : 0;
                          } else {
                            const dateA = new Date(a.date).getTime();
                            const dateB = new Date(b.date).getTime();
                            return dateA > dateB ? -1 : dateA < dateB ? 1 : 0;
                          }
                        }
                      },
                    );

                    return sortedTransactions.map((txn, index) => (
                      <tr
                        key={`txn-${index}`}
                        className={txn.type.toLowerCase()}
                      >
                        <td>{formatDate(txn.date)}</td>
                        <td>{txn.mop || "No MOP"}</td>
                        <td>{txn.type}</td>
                        <td>{txn.amount || "No Amount"}</td>
                        <td>{txn.unit || "-"}</td>
                        <td>{txn.description || "No Description"}</td>
                      </tr>
                    ));
                  })()
                )}
              </tbody> */}

              <tbody>
                {isTabLoading ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{ textAlign: "center", padding: "40px" }}
                    >
                      <div
                        className="spinner"
                        style={{
                          width: "40px",
                          height: "40px",
                          border: "4px solid #ccc",
                          borderTop: `4px solid #FF8C00`,
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                          margin: "0 auto",
                        }}
                      />
                      <style>{`
                        @keyframes spin {
                          to { transform: rotate(360deg); }
                        }
                      `}</style>
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const transactions = [];

                    // For transaction tab, use gridData (which has all localStorage data)
                    // gridData.revenue and gridData.expense are arrays of transaction objects
                    if (activeTab === "transaction" && gridData.revenue) {
                      // gridData.revenue is already an array of {year, month, rowKey, data}
                      gridData.revenue.forEach((tx) => {
                        transactions.push({
                          date: tx.data[4] || "",
                          mop: tx.data[2] || "",
                          type: "Revenue",
                          amount: tx.data[1] || "",
                          unit: tx.data[0] || "",
                          description:
                            tx.data[3] ||
                            "" +
                              (tx.data._isAutoFill
                                ? ` (${tx.data[0] || "Unknown"})`
                                : ""),
                        });
                      });
                    } else {
                      // Original logic for non-transaction tabs
                      Object.values(revenueGrid).forEach((monthRows) => {
                        Object.values(monthRows).forEach((row) => {
                          if (
                            row &&
                            Array.isArray(row) &&
                            row.some((cell) => cell !== "")
                          ) {
                            transactions.push({
                              date: row[4] || "",
                              mop: row[2] || "",
                              type: "Revenue",
                              description:
                                row[3] ||
                                "" +
                                  (row._isAutoFill
                                    ? ` (${row[0] || "Unknown"})`
                                    : ""),
                              amount: row[1] || "",
                            });
                          }
                        });
                      });
                    }

                    // Collect from expense grid
                    if (activeTab === "transaction" && gridData.expense) {
                      // gridData.expense is already an array of {year, month, rowKey, data}
                      gridData.expense.forEach((tx) => {
                        transactions.push({
                          date: tx.data[4] || "",
                          mop: tx.data[2] || "",
                          type: "Expense",
                          amount: tx.data[1] || "",
                          unit: tx.data[0] || "",
                          description:
                            tx.data[3] ||
                            "" +
                              (tx.data._isAutoFill
                                ? ` (${tx.data[0] || "Unknown"})`
                                : ""),
                        });
                      });
                    } else {
                      // Original logic for non-transaction tabs
                      Object.values(expenseGrid).forEach((monthRows) => {
                        Object.values(monthRows).forEach((row) => {
                          if (
                            row &&
                            Array.isArray(row) &&
                            row.some((cell) => cell !== "")
                          ) {
                            transactions.push({
                              date: row[4] || "",
                              mop: row[2] || "",
                              type: "Expense",
                              description:
                                row[3] ||
                                "" +
                                  (row._isAutoFill
                                    ? ` (${row[0] || "Unknown"})`
                                    : ""),
                              amount: row[1] || "",
                            });
                          }
                        });
                      });
                    }

                    // Helper to format date
                    const formatDate = (dateStr) => {
                      if (!dateStr) return "No Date";
                      const d = new Date(dateStr);
                      if (isNaN(d.getTime())) return dateStr;
                      return d.toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      });
                    };

                    // Check if transactions is empty
                    if (transactions.length === 0) {
                      return (
                        <tr>
                          <td
                            colSpan="6"
                            style={{
                              textAlign: "center",
                              padding: "40px",
                              color: "#666",
                            }}
                          >
                            <p style={{ marginBottom: "10px" }}>
                              No transactions found
                            </p>
                            <p style={{ fontSize: "14px", color: "#999" }}>
                              Add revenue or expense entries to see them here
                            </p>
                          </td>
                        </tr>
                      );
                    }

                    const sortedTransactions = [...transactions].sort(
                      (a, b) => {
                        const hasDateA =
                          a.date && !isNaN(new Date(a.date).getTime());
                        const hasDateB =
                          b.date && !isNaN(new Date(b.date).getTime());

                        if (hasDateA && !hasDateB) return -1;
                        if (!hasDateA && hasDateB) return 1;
                        if (!hasDateA && !hasDateB) return 0;

                        let valA, valB;
                        if (sortColumn === "date") {
                          valA = new Date(a.date).getTime();
                          valB = new Date(b.date).getTime();
                        } else if (sortColumn === "type") {
                          valA = a.type;
                          valB = b.type;
                        }

                        if (sortDirection === "asc") {
                          if (valA < valB) return -1;
                          if (valA > valB) return 1;
                          // Equal, secondary sort
                          if (sortColumn === "date") {
                            return a.type < b.type
                              ? -1
                              : a.type > b.type
                                ? 1
                                : 0;
                          } else {
                            const dateA = new Date(a.date).getTime();
                            const dateB = new Date(b.date).getTime();
                            return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
                          }
                        } else {
                          if (valA > valB) return -1;
                          if (valA < valB) return 1;
                          // Equal, secondary sort
                          if (sortColumn === "date") {
                            return a.type > b.type
                              ? -1
                              : a.type < b.type
                                ? 1
                                : 0;
                          } else {
                            const dateA = new Date(a.date).getTime();
                            const dateB = new Date(b.date).getTime();
                            return dateA > dateB ? -1 : dateA < dateB ? 1 : 0;
                          }
                        }
                      },
                    );

                    return sortedTransactions.map((txn, index) => (
                      <tr
                        key={`txn-${index}`}
                        className={txn.type.toLowerCase()}
                      >
                        <td>{formatDate(txn.date)}</td>
                        <td>{txn.mop || "No MOP"}</td>
                        <td>{txn.type}</td>
                        <td>{txn.amount || "No Amount"}</td>
                        <td>{txn.unit || "-"}</td>
                        <td>{txn.description || "No Description"}</td>
                      </tr>
                    ));
                  })()
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showMonthYearDropdown && <MonthYearDropdown />}
    </div>
  );
};

export default FinancialReports;

// export default React.memo(FinancialReports);

/////////////////////////////////////////////////////////////////////////////////////////////////////////


//   // Autofill payments when context changes
//   useEffect(() => {
//     // CASE 1: Handle booking cancellation cleanup
//     // if (!paymentEntries || Object.keys(paymentEntries).length === 0) return;
//     // Wait for grid data to be loaded before processing autofill
// if (!paymentEntries || Object.keys(paymentEntries).length === 0) return;
// if (isTabLoading) return; // Don't process while data is loading
// if (isHydratingRef.current) return; // Don't process during initial hydration


//     if (cancelTrigger) {
//       try {
//         const deletedBookingId = String(cancelTrigger);

//         // const newGrid =
//         //   structuredClone?.(revenueGrid) ||
//         //   JSON.parse(JSON.stringify(revenueGrid));

//         const currentYearData = revenueGrid[currentYear] || {};
//         const newGrid =
//           structuredClone?.(currentYearData) ||
//           JSON.parse(JSON.stringify(currentYearData));

//         // Debug: show all bookingIds before deletion
//         const beforeIds = [];
//         Object.keys(newGrid).forEach((mIndex) => {
//           newGrid[mIndex].forEach((row) => {
//             if (row?._isAutoFill) beforeIds.push(row._bookingId);
//           });
//         });

//         // Remove only rows matching that bookingId
//         Object.keys(newGrid).forEach((mIndex) => {
//           const beforeCount = newGrid[mIndex].length;

//           newGrid[mIndex] = newGrid[mIndex].filter(
//             (row) => !(row?._isAutoFill && row._bookingId === deletedBookingId),
//           );

//           const afterCount = newGrid[mIndex].length;
//           const removedCount = beforeCount - afterCount;

//           if (removedCount > 0)
//             // keep structure
//             while (newGrid[mIndex].length < 5) {
//               newGrid[mIndex].push(Array(5).fill(""));
//             }
//         });

//         // Debug remaining
//         const remainingIds = [];
//         Object.keys(newGrid).forEach((mIndex) => {
//           newGrid[mIndex].forEach((row) => {
//             if (row?._isAutoFill) remainingIds.push(row._bookingId);
//           });
//         });

//         // setRevenueGrid(newGrid);
//         // if (activeTab === "revenue") {
//         //   setGridData(newGrid);
//         // }

//         // Update ONLY the current year in revenueGrid
//         setRevenueGrid((prev) => ({
//           ...prev,
//           [currentYear]: newGrid,
//         }));
//         if (activeTab === "revenue") {
//           setGridData(newGrid);
//         }
//       } catch (err) {
//         console.error("❌ Error in cancelTrigger handling:", err);
//       }
//       return; // Do not rebuild below
//     }

//     // CASE 2: Handle normal rebuild from autofill trigger
//     if (!autoFillTrigger || !paymentEntries) return;

//     // try {
//     //   const newGrid =
//     //     structuredClone?.(revenueGrid) ||
//     //     JSON.parse(JSON.stringify(revenueGrid));

//     try {
//       // Clone ONLY the current year's data, not the entire revenueGrid
//       const currentYearData = revenueGrid[currentYear] || {};
//       const newGrid =
//         structuredClone?.(currentYearData) ||
//         JSON.parse(JSON.stringify(currentYearData));

//       // Ensure all months exist
//       months.forEach((_, i) => {
//         if (!newGrid[i])
//           newGrid[i] = Array(5)
//             .fill()
//             .map(() => Array(5).fill(""));
//       });

//       const validKeys = new Set();

//       Object.entries(paymentEntries).forEach(([bookingId, entries]) => {
//         if (!Array.isArray(entries)) return;

//         entries.forEach((entry, entryIndex) => {
//           if (!entry?.date) return;

//           // Validate date to prevent invalid Date objects
//           const date = new Date(entry.date);
//           if (isNaN(date.getTime())) {
//             return;
//           }

//           const monthIndex = date.getMonth();

//           const formattedAmount =
//             entry.amount !== undefined && entry.amount !== null
//               ? `₱${Number(entry.amount).toLocaleString("en-PH", {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2,
//                 })}`
//               : "₱0.00";

//           const rowArray = [
//             entry.carName || "",
//             formattedAmount,
//             entry.mop || "",
//             entry.pop || "",
//             entry.date || "",
//           ];

//           rowArray._isAutoFill = true;
//           rowArray._bookingId = String(bookingId);
//           rowArray._entryIndex = entryIndex;

//           validKeys.add(`${bookingId}-${entryIndex}`);

//           const existingIndex = newGrid[monthIndex].findIndex(
//             (r) =>
//               r?._isAutoFill &&
//               r._bookingId === String(bookingId) &&
//               r._entryIndex === entryIndex,
//           );

//           if (existingIndex !== -1) {
//             newGrid[monthIndex][existingIndex] = rowArray;
//           } else {
//             const emptyIndex = newGrid[monthIndex].findIndex(
//               (r) => Array.isArray(r) && r.every((c) => c === ""),
//             );
//             if (emptyIndex !== -1) {
//               newGrid[monthIndex][emptyIndex] = rowArray;
//             } else {
//               newGrid[monthIndex].push(rowArray);
//             }
//           }

//           while (newGrid[monthIndex].length < 5) {
//             newGrid[monthIndex].push(Array(5).fill(""));
//           }
//         });
//       });

//       // Cleanup stale rows
//       Object.keys(newGrid).forEach((mIndex) => {
//         newGrid[mIndex] = newGrid[mIndex].filter((row) => {
//           if (row?._isAutoFill) {
//             const key = `${row._bookingId}-${row._entryIndex}`;
//             return validKeys.has(key);
//           }
//           return true;
//         });

//         while (newGrid[mIndex].length < 5) {
//           newGrid[mIndex].push(Array(5).fill(""));
//         }
//       });

//       // Debug final booking IDs
//       const finalIds = [];
//       Object.keys(newGrid).forEach((mIndex) => {
//         newGrid[mIndex].forEach((row) => {
//           if (row?._isAutoFill) finalIds.push(row._bookingId);
//         });
//       });

//       // setRevenueGrid(newGrid);
//       // if (activeTab === "revenue") {
//       //   setGridData(newGrid);
//       // }
//       // Update ONLY the current year in revenueGrid
//       setRevenueGrid((prev) => ({
//         ...prev,
//         [currentYear]: newGrid,
//       }));
//       if (activeTab === "revenue") {
//         setGridData(newGrid);
//       }

//       setIsSynced(false);
//     } catch (err) {
//       console.error("❌ Error in autofill rebuild:", err);
//     }
// }, [autoFillTrigger, cancelTrigger, paymentEntries, activeTab, currentYear]);
