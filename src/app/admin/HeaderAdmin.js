"use client";
//HeaderAdmin.js
import React, { useState, useEffect, useRef } from "react";

import { useRouter } from "next/navigation";
import { useUser } from "../lib/UserContext";
import "./HeaderAdmin.css";

import { FiMenu, FiUser} from 'react-icons/fi';
import { BiSearch, BiSearchAlt } from 'react-icons/bi';


const Header = ({
  onNavClick,
  onCollapseChange,
  onSubSectionClick,
  activeSubSections,
  activeSection,
}) => {
  const [rentalDropdownOpen, setRentalDropdownOpen] = useState(false);
  const [analyticsDropdownOpen, setAnalyticsDropdownOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);

  const [showAdminDetailsOverlay, setShowAdminDetailsOverlay] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsOverlay, setShowDetailsOverlay] = useState(false);
  const [showBookingDetailsOverlay, setShowBookingDetailsOverlay] =
    useState(false);
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);

  const [newAdminProfilePic, setNewAdminProfilePic] = useState(null);
  const [adminProfilePicFile, setAdminProfilePicFile] = useState(null);
  const fileInputRef = useRef(null);
  const [isSavingAdminProfile, setIsSavingAdminProfile] = useState(false);
  const [showAdminProfileSavedSuccess, setShowAdminProfileSavedSuccess] =
    useState(false);
  const [hideAdminProfileSavedAnimation, setHideAdminProfileSavedAnimation] =
    useState(false);
  const [isResettingAdminProfile, setIsResettingAdminProfile] = useState(false);
  const [showAdminProfileResetSuccess, setShowAdminProfileResetSuccess] =
    useState(false);
  const [hideAdminProfileResetAnimation, setHideAdminProfileResetAnimation] =
    useState(false);
  const [showBackupConfirmDialog, setShowBackupConfirmDialog] = useState(false);
  const [showDownloadConfirmDialog, setShowDownloadConfirmDialog] =
    useState(false);
  const [showResetConfirmDialog, setShowResetConfirmDialog] = useState(false);
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);
  const [showEditAdminConfirmDialog, setShowEditAdminConfirmDialog] =
    useState(false);
  const [adminToEdit, setAdminToEdit] = useState(null);

  // Data Import states
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showImportConfirmDialog, setShowImportConfirmDialog] = useState(false);
  const [importMode, setImportMode] = useState(null); // "merge" or "overwrite"

    // Selected collections for import
  const [selectedCollections, setSelectedCollections] = useState({
    config: true,
    images: true,
    reviews: true,
    terms: true,
    units: true,
    users: true,
  });

// Selected collections for backup
  const [selectedBackupCollections, setSelectedBackupCollections] = useState({
    config: true,
    images: true,
    reviews: true,
    terms: true,
    units: true,
    users: true,
  });

  // Selected collections for download
  const [selectedDownloadCollections, setSelectedDownloadCollections] = useState({
    config: true,
    images: true,
    reviews: true,
    terms: true,
    units: true,
    users: true,
  });

  const [fetchedImages, setFetchedImages] = useState({});

  const [hoveredIcon, setHoveredIcon] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const menuRef = useRef(null);
  const accountRef = useRef(null);
  const searchRef = useRef(null);

  const router = useRouter();
  const {
    user,
    logout,
    theme,
    updateTheme,
    setShowVerifyOverlay,
    sendVerificationEmail,
    adminAccounts,
    userAccounts,
    blockUsers,
    blockedUsers,
    unblockUser,
    confirmBlockUser,
    confirmUnblockUser,
    showBlockUserReason,
    setShowBlockUserReason,
    showUnblockUserConfirm,
    setShowUnblockUserConfirm,
    blockReason,
    setBlockReason,
    userToProcess,
    setUserToProcess,
    unitData,
    updateUnitData,
    completedBookingsAnalytics,
    fetchImageFromFirestore,
    updateAdminProfilePic,
    resetAdminProfilePic,
    createBackup,

    isBackingUp,
    backupProgress,
    isBackupMinimized,
    setIsBackupMinimized,

    isDownloading,
    downloadProgress,
    isDownloadMinimized,
    setIsDownloadMinimized,
    createDownload,

    showBackupSuccess,
    setShowBackupSuccess,
    hideBackupAnimation,
    setHideBackupAnimation,
    showDownloadSuccess,
    setShowDownloadSuccess,
    hideDownloadAnimation,
    setHideDownloadAnimation,

    showActionOverlay,
  } = useUser();

  const [pendingTheme, setPendingTheme] = useState(theme);

  const profilePic = user?.profilePic || "/assets/account.svg";

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const searchInputRef = useRef(null);
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);
  const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);

  const [overlayActiveSection, setOverlayActiveSection] =
    useState("rental-activity");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");

  const [containerHeight, setContainerHeight] = useState(300);

  const [editingUnit, setEditingUnit] = useState(null);
  const [showEditConfirmDialog, setShowEditConfirmDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const [isSavingUnit, setIsSavingUnit] = useState(false);
  const [showSavedSuccess, setShowSavedSuccess] = useState(false);
  const [hideSavedAnimation, setHideSavedAnimation] = useState(false);

  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [isBlockingUser, setIsBlockingUser] = useState(false);
  const [showBlockedSuccess, setShowBlockedSuccess] = useState(false);
  const [hideBlockAnimation, setHideBlockAnimation] = useState(false);
  const [isUnblockingUser, setIsUnblockingUser] = useState(false);
  const [showUnblockedSuccess, setShowUnblockedSuccess] = useState(false);
  const [hideUnblockAnimation, setHideUnblockAnimation] = useState(false);

  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const [showMessengerConfirm, setShowMessengerConfirm] = useState(false);

  const [collapsed, setCollapsed] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOverlay, setIsOverlay] = useState(window.innerWidth <= 1024);

  const [showSettings, setShowSettings] = useState(false);
  //SCROLL RELATED
  const scrollYRef = useRef(0);

  //OVERLAY STOP BACKGROUND CLICK AND SCROLL
  useEffect(() => {
    const handleClickOrScroll = (e) => {
      if (!showProfileOverlay && !showMessengerConfirm) {
        setShowSettings(false);
      }
    };

    const preventTouch = (e) => {
      if (showProfileOverlay || showMessengerConfirm) {
        e.preventDefault();
      }
    };

    document.addEventListener("mousedown", handleClickOrScroll);
    document.addEventListener("scroll", handleClickOrScroll);
    document.addEventListener("touchmove", preventTouch, { passive: false });

    if (showProfileOverlay || showMessengerConfirm) {
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
  }, [showProfileOverlay, showMessengerConfirm]);

  useEffect(() => {
    if (selectedAdmin) {
      const updatedAdmin = adminAccounts.find(
        (admin) => admin.id === selectedAdmin.id,
      );
      if (
        updatedAdmin &&
        updatedAdmin.profilePic !== selectedAdmin.profilePic
      ) {
        setSelectedAdmin(updatedAdmin);
      }
    }
  }, [adminAccounts, selectedAdmin]);

  useEffect(() => {
    const fetchTableImages = async () => {
      if (!unitData || unitData.length === 0) return;

      const imageIds = new Set();

      // Add unit images
      unitData.forEach((unit) => {
        if (unit.imageId) imageIds.add(unit.imageId);
        else if (unit.plateNo) imageIds.add(`${unit.plateNo}_main`);
      });

      // Add completed bookings images
      Object.values(completedBookingsAnalytics).forEach((car) => {
        car.bookings?.forEach((booking) => {
          if (booking.imageId) imageIds.add(booking.imageId);
          else if (booking.plateNo) imageIds.add(`${booking.plateNo}_main`);
        });
      });

      const promises = [...imageIds].map(async (id) => {
        try {
          const image = await fetchImageFromFirestore(id);
          if (image) return { [id]: image };
          return {
            [id]: { base64: "/assets/images/default.png", updatedAt: Date.now() },
          };
        } catch {
          return {
            [id]: { base64: "/assets/images/default.png", updatedAt: Date.now() },
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
  }, [unitData, completedBookingsAnalytics]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const newIsOverlay = window.innerWidth <= 1024;
      setIsOverlay(newIsOverlay);
      if (newIsOverlay) {
        setCollapsed(false);
        onCollapseChange(false);

        setRentalDropdownOpen(false);
        setAnalyticsDropdownOpen(false);
        setSettingsDropdownOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [onCollapseChange]);

  const handleEditUnit = (unit) => {
    setEditingUnit(unit.id);
    setEditFormData({
      name: unit.name,
      price: unit.price,
      extension: unit.extension,
      plateNo: unit.plateNo,
      driverRate: unit.driverRate,
      deliveryFee: unit.deliveryFee,
    });
    setShowEditConfirmDialog(true);
  };

  const handleConfirmEdit = () => {
    setShowEditConfirmDialog(false);
  };

  const handleCancelEdit = () => {
    setEditingUnit(null);
    setEditFormData({});
    setShowEditConfirmDialog(false);
  };

  const handleSaveEdit = async () => {
    try {
      setIsSavingUnit(true);

      await updateUnitData(editingUnit, editFormData);

      setIsSavingUnit(false);
      setEditingUnit(null);
      setEditFormData({});

      setShowSavedSuccess(true);
      setHideSavedAnimation(false);

      setTimeout(() => {
        setHideSavedAnimation(true);
        setTimeout(() => setShowSavedSuccess(false), 400);
      }, 5000);
    } catch (error) {
      console.error("Error updating unit:", error);
      setIsSavingUnit(false);
    }
  };

  const handleSectionChange = (newSection) => {
    if (isTransitioning || overlayActiveSection === newSection) return;

    // Update container height based on section
    const heights = {
      "": 230, // Default menu - 600px
      admin: 400,
      users: 400, // Users tab - medium height (650px)
      blockedUsers: 400, // Blocked users - smaller height (550px)
    };
    setContainerHeight(heights[newSection] || 400);

    // Determine slide direction based on tab order
    const sections = ["", "admin", "users", "blockedUsers"];
    const currentIndex = sections.indexOf(overlayActiveSection);
    const newIndex = sections.indexOf(newSection);

    setSlideDirection(newIndex > currentIndex ? "left" : "right");
    setIsTransitioning(true);

    setTimeout(() => {
      setOverlayActiveSection(newSection);
      setTimeout(() => {
        setIsTransitioning(false);
        setSlideDirection("");
      }, 300);
    }, 50);
  };

  // THEME LISTENER
  useEffect(() => {
    setPendingTheme(theme);
  }, [theme]);

  // Save to Firestore through UserContext
  const handleSaveTheme = async () => {
    await updateTheme(pendingTheme);
    setShowSettingsOverlay(false);
  };

  // CANCEL SAVE THEME
  const handleCancel = () => {
    setPendingTheme(theme);
    setShowSettingsOverlay(false);
  };

  const getLogoForTheme = () => {
    switch (theme) {
      case "december":
        return (
          <img src="/assets/december-logo.png" className="header-admin-logo" />
        );
      case "november":
        return (
          <img src="/assets/november-logo.png" className="header-admin-logo" />
        );
        case "clover":
        return (
          <img src="/assets/clover-logo.png" className="header-admin-logo" />
        );
      default:
        return <img src="/assets/logo.png" className="header-admin-logo" />;
    }
  };

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

  const navItems = [
    { name: "Dashboard", id: "rental-activity", icon: "/assets/rental.png" },
    { name: "Analytics", id: "analytics", icon: "/assets/analytics.png" },
    { name: "Reports", id: "financial-reports", icon: "/assets/reports.png" },
    { name: "Messages", id: "messages", icon: "/assets/notifications.png" },
    { name: "Admin", id: "settings", icon: "/assets/settings.png" },
  ];

const icons = [
  {
    outline: BiSearch,
    filled: BiSearchAlt,  // close icon when hovered
    alt: "Search",
  },
  {
    outline: FiUser,
    filled: FiUser,  // same icon when hovered
    alt: "Account",
  },
];


  // SEARCH FUNCTION
  const routes = [
    { path: "/", label: "Home", keywords: "vios toyota rent" },
    {
      path: "/fleet-details",
      label: "Fleet",
      keywords: "vios innova hilux suv van",
    },
    { path: "/about", label: "About", keywords: "about us emnl info" },
    {
      path: "/contact",
      label: "Contact",
      keywords: "contact message call booking",
    },
    {
      path: "/account",
      label: "Account",
      keywords: "account settings user messages",
    },
    { path: "/admin", label: "Account", keywords: "admin" },
  ];

  const generateSearchIndex = () => {
    const index = [];
    routes.forEach(({ path, label, keywords }) => {
      keywords.split(" ").forEach((keyword) => {
        index.push({
          keyword: keyword.toLowerCase(),
          label: `${
            keyword.charAt(0).toUpperCase() + keyword.slice(1)
          } → ${label}`,
          path,
        });
      });
    });
    return index;
  };

  const searchIndex = generateSearchIndex();

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(regex, "<span class='highlight'>$1</span>");
  };

  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMenuClick = () => {
    setMenuOpen((prev) => {
      const newVal = !prev;
      if (newVal) {
        setSearchExpanded(false);
        setAccountDropdownOpen(false);
      }
      return newVal;
    });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !e.target.closest(".hamburger-icon")
      ) {
        setMenuOpen(false);
      }

      if (
        accountRef.current &&
        !accountRef.current.contains(e.target) &&
        !e.target.closest(".account-icon")
      ) {
        setAccountDropdownOpen(false);
      }
    };

    const handleScroll = () => {
      if (menuOpen) setMenuOpen(false);
      if (accountDropdownOpen) setAccountDropdownOpen(false);
      if (searchExpanded) {
        setFadingOut(true);
        setTimeout(() => {
          setSearchExpanded(false);
          setFadingOut(false);
        }, 300);
      }
    };

    window.addEventListener("click", handleClickOutside);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("click", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [menuOpen, accountDropdownOpen, searchExpanded]);

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    const headerHeight = document.querySelector(
      ".header-admin-container",
    ).offsetHeight;

    if (target) {
      const targetPosition =
        target.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = targetPosition - headerHeight - 70;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }

    setMenuOpen(false);
  };

  const handleReplaceAdminProfilePic = () => {
    fileInputRef.current.click();
  };

  const handleAdminProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewAdminProfilePic(event.target.result); // Set preview base64
        setSelectedAdmin((prev) => ({
          ...prev,
          profilePicFile: file,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAdminProfilePic = async () => {
    if (selectedAdmin.profilePicFile) {
      setIsSavingAdminProfile(true);
      try {
        await updateAdminProfilePic(
          selectedAdmin.id,
          selectedAdmin.profilePicFile,
        );
        setSelectedAdmin((prev) => ({
          ...prev,
          profilePic: prev.profilePic,
          profilePicFile: null,
        }));
        setNewAdminProfilePic(null);
        setIsEditingAdmin(false);
        setIsSavingAdminProfile(false);

        setShowAdminProfileSavedSuccess(true);
        setHideAdminProfileSavedAnimation(false);

        setTimeout(() => {
          setHideAdminProfileSavedAnimation(true);
          setTimeout(() => setShowAdminProfileSavedSuccess(false), 400);
        }, 5000);

        showActionOverlay({
          message: "Admin profile picture updated successfully!",
          type: "success",
        });
      } catch (error) {
        console.error("Error saving admin profile picture:", error);
        setIsSavingAdminProfile(false);
        showActionOverlay({
          message: "Failed to update admin profile picture",
          type: "warning",
        });
      }
    } else {
      // No new file, just exit edit mode
      setIsEditingAdmin(false);
    }
  };

  const handleCancelAdminEdit = () => {
    setSelectedAdmin((prev) => ({
      ...prev,
      profilePicFile: null,
    }));
    setNewAdminProfilePic(null);
    setIsEditingAdmin(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleResetAdminProfilePic = async () => {
    setIsResettingAdminProfile(true);
    try {
      await resetAdminProfilePic(selectedAdmin.id);
      setIsResettingAdminProfile(false);

      setNewAdminProfilePic(null);
      setSelectedAdmin((prev) => ({
        ...prev,
        profilePic: prev.originalProfilePic || "/assets/profile.png",
        profilePicFile: null,
      }));

      setShowAdminProfileResetSuccess(true);
      setHideAdminProfileResetAnimation(false);

      setTimeout(() => {
        setHideAdminProfileResetAnimation(true);
        setTimeout(() => setShowAdminProfileResetSuccess(false), 400);
      }, 5000);

      showActionOverlay({
        message: "Profile picture reset to original!",
        type: "success",
      });

      setIsEditingAdmin(false);
    } catch (error) {
      setIsResettingAdminProfile(false);
      showActionOverlay({
        message: "Failed to reset profile picture",
        type: "warning",
      });
    }
  };

  return (
    <>
      <div
        className={`sidebar ${collapsed && !isOverlay ? "collapsed" : ""} ${sidebarOpen ? "open" : ""}`}
      >
        <div className={`sidebar-header ${collapsed ? "collapsed" : ""}`}>
          <div
            className="logo"
            style={{
              opacity: collapsed ? 0 : 1,
              transition: "opacity 0.3s ease",
            }}
          >
            {getLogoForTheme()}
          </div>

          <button
            className="sidebar-toggle"
            onClick={() => {
              if (isOverlay) {
                setSidebarOpen(false);
              } else {
                const newCollapsed = !collapsed;
                setCollapsed(newCollapsed);
                onCollapseChange(newCollapsed);
                if (newCollapsed) {
                  setRentalDropdownOpen(false);
                  setAnalyticsDropdownOpen(false);
                  setSettingsDropdownOpen(false);
                }
              }
            }}
          >
            {collapsed ? (
              <img src="/assets/nxt-btn.png" alt="Expand" />
            ) : (
              <img src="/assets/prv-btn.png" alt="Collapse" />
            )}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, index) => {
            if (item.id === "rental-activity") {
              return (
                <div key={index} className="sidebar-nav-item-dropdown">
                  <a
                    className={`sidebar-nav-item ${activeSection === item.id ? "active" : ""}`}
                    onClick={() => {
                      if (collapsed) {
                        setCollapsed(false);
                        onCollapseChange(false);
                        onNavClick(item.id);
                        setRentalDropdownOpen(true);
                      } else {
                        onNavClick(item.id);
                        setRentalDropdownOpen(!rentalDropdownOpen);
                        setAnalyticsDropdownOpen(false);
                        setSettingsDropdownOpen(false);
                      }
                    }}
                  >
                    <span className="sidebar-icon">
                      <img src={item.icon} alt={item.name} />
                    </span>
                    {!collapsed && (
                      <span className="sidebar-text">{item.name}</span>
                    )}
                    <img
                      src="/assets/prv-btn.png"
                      alt="Arrow"
                      className={`dropdown-arrow ${rentalDropdownOpen ? "rotated" : ""}`}
                      style={{
                        marginLeft: "auto",
                        transition: "transform 0.3s",
                      }}
                    />
                  </a>
                  <div
                    className={`sidebar-sub-nav ${rentalDropdownOpen ? "open" : ""}`}
                  >
                    <a
                      className={`sidebar-sub-nav-item ${activeSubSections["rental-activity"] === "overview" ? "active" : ""}`}
                      onClick={() => {
                        onSubSectionClick("rental-activity", "overview");
                      }}
                    >
                      Overview
                    </a>
                    <a
                      className={`sidebar-sub-nav-item ${activeSubSections["rental-activity"] === "ongoing-rent" ? "active" : ""}`}
                      onClick={() => {
                        onSubSectionClick("rental-activity", "ongoing-rent");
                      }}
                    >
                      Ongoing Rent
                    </a>
                    <a
                      className={`sidebar-sub-nav-item ${activeSubSections["rental-activity"] === "available-units" ? "active" : ""}`}
                      onClick={() => {
                        onSubSectionClick("rental-activity", "available-units");
                      }}
                    >
                      Available Units
                    </a>
                    <a
                      className={`sidebar-sub-nav-item ${activeSubSections["rental-activity"] === "balance-due" ? "active" : ""}`}
                      onClick={() => {
                        onSubSectionClick("rental-activity", "balance-due");
                      }}
                    >
                      Balance Due
                    </a>
                  </div>
                </div>
              );
            }

            if (item.id === "analytics") {
              return (
                <div key={index} className="sidebar-nav-item-dropdown">
                  <a
                    className={`sidebar-nav-item ${activeSection === item.id ? "active" : ""}`}
                    onClick={() => {
                      if (collapsed) {
                        setCollapsed(false);
                        onCollapseChange(false);
                        onNavClick(item.id);
                        setAnalyticsDropdownOpen(true);
                      } else {
                        onNavClick(item.id); // Add this to set activeSection immediately
                        setAnalyticsDropdownOpen(!analyticsDropdownOpen);
                        setRentalDropdownOpen(false);
                        setSettingsDropdownOpen(false);
                      }
                    }}
                  >
                    <span className="sidebar-icon">
                      <img src={item.icon} alt={item.name} />
                    </span>
                    {!collapsed && (
                      <span className="sidebar-text">{item.name}</span>
                    )}
                    <img
                      src="/assets/prv-btn.png"
                      alt="Arrow"
                      className={`dropdown-arrow ${analyticsDropdownOpen ? "rotated" : ""}`}
                      style={{
                        marginLeft: "auto",
                        transition: "transform 0.3s",
                      }}
                    />
                  </a>
                  <div
                    className={`sidebar-sub-nav ${analyticsDropdownOpen ? "open" : ""}`}
                  >
                    <a
                      className={`sidebar-sub-nav-item ${activeSubSections["analytics"] === "overview" ? "active" : ""}`}
                      onClick={() => {
                        onSubSectionClick("analytics", "overview");
                      }}
                    >
                      Overview
                    </a>
                    <a
                      className={`sidebar-sub-nav-item ${activeSubSections["analytics"] === "graphs" ? "active" : ""}`}
                      onClick={() => {
                        onSubSectionClick("analytics", "graphs");
                      }}
                    >
                      Graphs
                    </a>
                    <a
                      className={`sidebar-sub-nav-item ${activeSubSections["analytics"] === "data" ? "active" : ""}`}
                      onClick={() => {
                        onSubSectionClick("analytics", "data");
                      }}
                    >
                      Data
                    </a>
                    <a
                      className={`sidebar-sub-nav-item ${activeSubSections["analytics"] === "partners" ? "active" : ""}`}
                      onClick={() => {
                        onSubSectionClick("analytics", "partners");
                      }}
                    >
                      Affiliations
                    </a>
                    <a
                      className={`sidebar-sub-nav-item ${activeSubSections["analytics"] === "calendar" ? "active" : ""}`}
                      onClick={() => {
                        onSubSectionClick("analytics", "calendar");
                      }}
                    >
                      Calendar
                    </a>
                  </div>
                </div>
              );
            }

            if (item.id === "settings") {
              return (
                <div key={index} className="sidebar-nav-item-dropdown">
                  <a
                    className={`sidebar-nav-item ${activeSection === item.id ? "active" : ""}`}
                    onClick={() => {
                      if (collapsed) {
                        setCollapsed(false);
                        onCollapseChange(false);
                        onNavClick(item.id);
                        setSettingsDropdownOpen(true);
                      } else {
                        onNavClick(item.id); // Add this to set activeSection immediately
                        setSettingsDropdownOpen(!settingsDropdownOpen);
                        setRentalDropdownOpen(false);
                        setAnalyticsDropdownOpen(false);
                      }
                    }}
                  >
                    <span className="sidebar-icon">
                      <img src={item.icon} alt={item.name} />
                    </span>
                    {!collapsed && (
                      <span className="sidebar-text">{item.name}</span>
                    )}
                    <img
                      src="/assets/prv-btn.png"
                      alt="Arrow"
                      className={`dropdown-arrow ${settingsDropdownOpen ? "rotated" : ""}`}
                      style={{
                        marginLeft: "auto",
                        transition: "transform 0.3s",
                      }}
                    />
                  </a>
                  <div
                    className={`sidebar-sub-nav ${settingsDropdownOpen ? "open" : ""}`}
                  >
                    <a
                      className={`sidebar-sub-nav-item ${activeSubSections["settings"] === "overview" ? "active" : ""}`}
                      onClick={() => {
                        onSubSectionClick("settings", "overview");
                      }}
                    >
                      Overview
                    </a>
                    <a
                      className={`sidebar-sub-nav-item ${activeSubSections["settings"] === "units" ? "active" : ""}`}
                      onClick={() => {
                        onSubSectionClick("settings", "units");
                      }}
                    >
                      Units
                    </a>
                    <a
                      className={`sidebar-sub-nav-item ${activeSubSections["settings"] === "entries" ? "active" : ""}`}
                      onClick={() => {
                        onSubSectionClick("settings", "entries");
                      }}
                    >
                      Entries
                    </a>
                    <a
                      className={`sidebar-sub-nav-item ${activeSubSections["settings"] === "clients" ? "active" : ""}`}
                      onClick={() => {
                        onSubSectionClick("settings", "clients");
                      }}
                    >
                      Clients
                    </a>
                    <a
                      className={`sidebar-sub-nav-item ${activeSubSections["settings"] === "content" ? "active" : ""}`}
                      onClick={() => {
                        onSubSectionClick("settings", "content");
                      }}
                    >
                      Content
                    </a>
                  </div>
                </div>
              );
            }

            // Default for other nav items (Reports, Messages)
            return (
              <a
                key={index}
                className={`sidebar-nav-item ${activeSection === item.id ? "active" : ""}`}
                onClick={() => {
                  onNavClick(item.id);
                  setOverlayActiveSection(item.id);
                  setRentalDropdownOpen(false);
                  setAnalyticsDropdownOpen(false);
                  setSettingsDropdownOpen(false);
                  setMenuOpen(false);
                }}
              >
                <span className="sidebar-icon">
                  <img src={item.icon} alt={item.name} />
                </span>
                {!collapsed && (
                  <span className="sidebar-text">{item.name}</span>
                )}
              </a>
            );
          })}
        </nav>
      </div>

      {/* Main content area */}
      <div
        className={`main-content ${collapsed ? "collapsed" : ""} ${sidebarOpen ? "sidebar-open" : ""}`}
      >
        {/* Icons in main content area */}
        <div className="main-icons">
          <FiMenu 
  className="hamburger-icon"
  onClick={() => setSidebarOpen(!sidebarOpen)}
/>
          <div
            className="logo"
            style={{ marginLeft: "30px", pointerEvents: "none" }}
          >
            {getLogoForTheme()}
          </div>

          <div className="right-icons">
            <div
              className={`search-input-container ${searchExpanded ? "visible" : ""} ${fadingOut ? "fading-out" : ""}`}
            >
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                placeholder="Search..."
                value={searchText}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchText(value);

                  const matches = searchIndex.filter((entry) =>
                    entry.keyword.includes(value.toLowerCase()),
                  );
                  setSearchResults(value ? matches : []);
                }}
              />
              {searchExpanded && searchResults.length > 0 && (
                <div className="Admin-SearchDropdown">
                  <ul>
                    {searchResults.map((result, index) => (
                      <li key={index}>
                        <a
                          href={result.path}
                          onClick={() => {
                            setSearchText("");
                            setSearchExpanded(false);
                            setSearchResults([]);
                            router.push(result.path);
                          }}
                          dangerouslySetInnerHTML={{
                            __html: highlightMatch(result.label, searchText),
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

{icons.map((icon, index) => {
 const showFilled = hoveredIcon === index || 
    (icon.alt === "Search" && searchExpanded);
  const IconComponent = showFilled ? icon.filled : icon.outline;

  if (icon.alt === "Account" && user?.profilePic) {
    return (
      <img
        key={index}
        src={user.profilePic}
        alt="User Profile"
        className="main-icon account-icon"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/assets/account.svg";
        }}
        onClick={() => setAccountDropdownOpen((prev) => !prev)}
      />
    );
  }

  return (
    <IconComponent
      key={index}
      className={`main-icon ${icon.alt === "Account" ? "account-icon" : ""}`}
      onMouseEnter={() => setHoveredIcon(index)}
      onMouseLeave={() => setHoveredIcon(null)}
      onClick={() => {
        if (icon.alt === "Search") {
          if (searchExpanded) {
            setFadingOut(true);
            setTimeout(() => {
              setSearchExpanded(false);
              setFadingOut(false);
            }, 300);
          } else {
            setSearchExpanded(true);
          }
        } else if (icon.alt === "Account") {
          setAccountDropdownOpen((prev) => !prev);
        }
      }}
    />
  );
})}

          </div>

          {/* Account dropdown */}
          <div
            className={`account-dropdown ${
              accountDropdownOpen ? "dropdown-visible" : "dropdown-hidden"
            }`}
          >
              <div
    className="dropdown-item"
    onClick={() => {
  setAccountDropdownOpen(false);
  router.push("/");
}}
  >
    Home
  </div>
            <div
              className="dropdown-item"
              onClick={() => {
                setAccountDropdownOpen(false);
                setShowProfileOverlay(true);
                setOverlayActiveSection("");
              }}
            >
              Profile
            </div>
            <div
              className="dropdown-item"
              onClick={() => {
                setAccountDropdownOpen(false);
                setShowSettingsOverlay(true);
              }}
            >
              Settings
            </div>
            <div
              className="dropdown-item"
              onClick={() => {
                setAccountDropdownOpen(false);
                setShowLogoutOverlay(true);
              }}
            >
              Logout
            </div>
          </div>
        </div>
      </div>

      {showAdminDetailsOverlay && selectedAdmin && (
        <div className="unit-details-overlay">
          <div className="unit-details-content">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowAdminDetailsOverlay(false)}
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

            <h3 className="client-details-title">Admin Details</h3>

            <div
              className="unit-details-scrollable"
              style={{ overflow: "auto" }}
            >
              <div className="client-details-layout">
                {/* Top Row */}
                <div className="client-top-row">
                  <div className="client-profile-column">
                    <div className="client-profile-left">
                      <img
                        src={
                          newAdminProfilePic ||
                          selectedAdmin.profilePic ||
                          "/assets/profile.png"
                        }
                        alt={selectedAdmin.name}
                        className="client-profile-pic"
                      />
                      <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        accept="image/*"
                        onChange={handleAdminProfilePicChange}
                      />
                      {isEditingAdmin && (
                        <button
                          className="admin-replace-btn"
                          onClick={handleReplaceAdminProfilePic}
                        >
                          <img src="/assets/replace.png" alt="Replace" />
                        </button>
                      )}
                      {!isEditingAdmin ? (
                        <button
                          className="edit-admin-btn"
                          onClick={() => setIsEditingAdmin(true)}
                        >
                          Edit
                        </button>
                      ) : (
                        <div className="admin-edit-buttons">
                          <div className="save-cancel-row">
                            <button
                              className="save-admin-btn"
                              onClick={() => setShowSaveConfirmDialog(true)}
                            >
                              Save
                            </button>
                            <button
                              className="cancel-admin-btn"
                              onClick={handleCancelAdminEdit}
                            >
                              Cancel
                            </button>
                          </div>
                          <button
                            className="reset-admin-btn"
                            onClick={() => setShowResetConfirmDialog(true)}
                          >
                            Reset to Original
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="client-profile-right">
                      <div className="admin-name-container">
                        <h3>{selectedAdmin.name}</h3>
                        {selectedAdmin.emailVerified ? (
                          <img
                            src="/assets/verified.png"
                            alt="Verified"
                            className="verification-icon"
                          />
                        ) : (
                          <img
                            src="/assets/unverified.png"
                            alt="Unverified"
                            className="verification-icon clickable"
                            onClick={() => {
                              sendVerificationEmail();
                              setShowVerifyOverlay(true);
                            }}
                          />
                        )}
                      </div>

                      <p>
                        <strong style={{ color: "var(--accent-color)" }}>
                          Email:
                        </strong>{" "}
                        {selectedAdmin.email}
                      </p>

                      <p>
                        <strong style={{ color: "var(--accent-color)" }}>
                          Role:
                        </strong>{" "}
                        {selectedAdmin.role}
                      </p>

                      <p>
                        <strong style={{ color: "var(--accent-color)" }}>
                          Phone:
                        </strong>{" "}
                        {selectedAdmin.phone}
                      </p>

                      <p>
                        <strong style={{ color: "var(--accent-color)" }}>
                          Recent Backup:
                        </strong>{" "}
                        {selectedAdmin.backupAt
                          ? formatDate(new Date(selectedAdmin.backupAt))
                          : "None"}
                      </p>
                    </div>
                  </div>

                  <div
                    className="client-info-column"
                    style={{ cursor: "pointer" }}
                  >
                    <div className="admin-stats-admin">
                      <div className="client-stats-row">
                        <div
                          className="client-summary-box backup"
                          onClick={() => setShowBackupConfirmDialog(true)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="client-box-content">
                            <p className="client-analytics-label">Data</p>
                            <p className="client-analytics-value">Backup</p>
                          </div>
                          <div className="box-icon">
                            <img src="/assets/backup.png" alt="Revenue" />
                          </div>
                        </div>

                                                <div
                          className="client-summary-box profit"
                          onClick={() => setShowImportDialog(true)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="client-box-content">
                            <p className="client-analytics-label">Data</p>
                            <p className="client-analytics-value">Import</p>
                          </div>
                          <div className="box-icon">
                            <img src="/assets/export.png" alt="Import" />
                          </div>
                        </div>

                      </div>

                      <div
                        className="client-summary-box bookings"
                        onClick={() => setShowDownloadConfirmDialog(true)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="client-box-content">
                          <p className="client-analytics-label">Data</p>
                          <p className="client-analytics-value">Download</p>
                        </div>
                        <div className="box-icon">
                          <img src="/assets/download.png" alt="Revenue" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="client-bookings-row">
                  <h3>Completed Bookings</h3>
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
                          const allBookings = Object.values(
                            completedBookingsAnalytics,
                          ).flatMap((car) => car.bookings || []);

                          return allBookings.map((booking, index) => {
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
                                  setShowBookingDetailsOverlay(true);
                                }}
                                style={{ cursor: "pointer" }}
                                className="table-row"
                              >
                                <td>
                                  <img
                                    src={image?.base64 || "/assets/images/default.png"}
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

      {showBookingDetailsOverlay && selectedBooking && (
        <div className="unit-details-overlay">
          <div className="unit-details-content">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowBookingDetailsOverlay(false)}
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

            <div className="unit-details-scrollable">
              <div className="unit-details-layout">
                {/* LEFT IMAGE */}
                <div className="unit-image-column">
                  <img
                    src={
                      fetchedImages[
                        selectedBooking.imageId ||
                          `${selectedBooking.plateNo}_main`
                      ]?.base64 || "/assets/images/default.png"
                    }
                    className="unit-main-image"
                    alt={selectedBooking.carName}
                  />
                </div>

                {/* INFO COLUMN */}
                <div className="unit-info-column">
                  <div className="unit-name-plate-row">
                    <div className="unit-name-column">
                      <label>Contact</label>
                      <span className="unit-name">
                        {selectedBooking.contact}
                      </span>
                    </div>

                    <div className="unit-plate-column">
                      <label>Email</label>
                      <span className="unit-plate" style={{ fontSize: "18px" }}>
                        {selectedBooking.email}
                      </span>
                    </div>

                    <div className="unit-plate-column">
                      <label>Occupation</label>
                      <span className="unit-plate">
                        {selectedBooking.occupation}
                      </span>
                    </div>
                  </div>

                  <div className="unit-name-plate-row">
                    <div className="unit-name-column">
                      <label>Travel Location</label>
                      <span className="unit-name">
                        {selectedBooking.location}
                      </span>
                    </div>

                    <div className="unit-plate-column">
                      <label>Purpose</label>
                      <span className="unit-plate">
                        {selectedBooking.purpose}
                      </span>
                    </div>

                    <div className="unit-plate-column">
                      <label>Address</label>
                      <span className="unit-plate">
                        {selectedBooking.address}
                      </span>
                    </div>
                  </div>

                  <div className="unit-name-plate-row">
                    <div className="unit-name-column">
                      <label>Car Name</label>
                      <span className="unit-name">
                        {selectedBooking.carName}
                      </span>
                    </div>

                    <div className="unit-plate-column">
                      <label>Plate No.</label>
                      <span className="unit-plate">
                        {selectedBooking.plateNo}
                      </span>
                    </div>

                    <div className="unit-plate-column">
                      <label>Renter</label>
                      <span className="unit-plate">
                        {`${selectedBooking.surname || ""}, ${
                          selectedBooking.firstName || ""
                        } ${selectedBooking.middleName || ""}`.trim()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ADDITIONAL DETAILS */}
              <div className="unit-additional-container">
                <div className="specs-grid">
                  <div className="spec-item">
                    <label>Paid</label>
                    <span>{selectedBooking.paid ? "Yes" : "No"}</span>
                  </div>

                  <div className="spec-item">
                    <label>Total Price</label>
                    <span>
                      ₱
                      {selectedBooking.totalPrice?.toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="spec-item">
                    <label>Total Paid</label>
                    <span>
                      ₱
                      {selectedBooking.totalPaid?.toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="spec-item">
                    <label>Balance Due</label>
                    <span>
                      ₱
                      {selectedBooking.balanceDue?.toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="spec-item">
                    <label>Driver Option</label>
                    <span>{selectedBooking.drivingOption || "N/A"}</span>
                  </div>

                  <div className="spec-item">
                    <label>Pickup Option</label>
                    <span>{selectedBooking.pickupOption || "N/A"}</span>
                  </div>

                  <div className="spec-item">
                    <label>Assigned Driver</label>
                    <span>{selectedBooking.assignedDriver || "None"}</span>
                  </div>

                  <div className="spec-item">
                    <label>Rental Duration</label>
                    <span>
                      {selectedBooking.rentalDuration?.days || 0}d
                      {selectedBooking.rentalDuration?.extraHours > 0
                        ? ` + ${selectedBooking.rentalDuration.extraHours}hr`
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 Loading Overlay (Saving Admin Profile) */}
      {isSavingAdminProfile && (
        <div className="submitting-overlay">
          <div className="loading-container">
            <div className="loading-bar-road">
              <img
                src="/assets/images/submitting.gif"
                alt="Saving admin profile..."
                className="car-gif"
              />
            </div>
            <p className="submitting-text">Saving admin profile...</p>
          </div>
        </div>
      )}

      {/* 🟢 Success Overlay (Admin Profile Saved) */}
      {showAdminProfileSavedSuccess && (
        <div
          className={`sent-ongoing-overlay ${
            hideAdminProfileSavedAnimation ? "hide" : ""
          }`}
        >
          <button
            className="close-sent-ongoing"
            onClick={() => {
              setHideAdminProfileSavedAnimation(true);
              setTimeout(() => setShowAdminProfileSavedSuccess(false), 400);
            }}
          >
            ✖
          </button>
          <span className="warning-text" style={{ color: "#28a745" }}>
            Admin profile updated successfully!
          </span>
          <div className="sent-ongoing-progress-bar"></div>
        </div>
      )}

      {/* 🔴 Loading Overlay (Resetting Admin Profile) */}
      {isResettingAdminProfile && (
        <div className="submitting-overlay">
          <div className="loading-container">
            <div className="loading-bar-road">
              <img
                src="/assets/images/submitting.gif"
                alt="Resetting admin profile..."
                className="car-gif"
              />
            </div>
            <p className="submitting-text">Resetting admin profile...</p>
          </div>
        </div>
      )}

      {/* 🟢 Success Overlay (Backup Completed) */}
      {showBackupSuccess && (
        <div
          className={`sent-ongoing-overlay ${
            hideBackupAnimation ? "hide" : ""
          }`}
        >
          <button
            className="close-sent-ongoing"
            onClick={() => {
              setHideBackupAnimation(true);
              setTimeout(() => setShowBackupSuccess(false), 400);
            }}
          >
            ✖
          </button>
          <span className="warning-text" style={{ color: "#28a745" }}>
            Backup completed successfully!
          </span>
          <div className="sent-ongoing-progress-bar"></div>
        </div>
      )}

      {/* 🟢 Success Overlay (Download Completed) */}
      {showDownloadSuccess && (
        <div
          className={`sent-ongoing-overlay ${
            hideDownloadAnimation ? "hide" : ""
          }`}
        >
          <button
            className="close-sent-ongoing"
            onClick={() => {
              setHideDownloadAnimation(true);
              setTimeout(() => setShowDownloadSuccess(false), 400);
            }}
          >
            ✖
          </button>
          <span className="warning-text" style={{ color: "#28a745" }}>
            Download completed successfully!
          </span>
          <div className="sent-ongoing-progress-bar"></div>
        </div>
      )}

      {/* 🟢 Success Overlay (Admin Profile Reset) */}
      {showAdminProfileResetSuccess && (
        <div
          className={`sent-ongoing-overlay ${
            hideAdminProfileResetAnimation ? "hide" : ""
          }`}
        >
          <button
            className="close-sent-ongoing"
            onClick={() => {
              setHideAdminProfileResetAnimation(true);
              setTimeout(() => setShowAdminProfileResetSuccess(false), 400);
            }}
          >
            ✖
          </button>
          <span className="warning-text" style={{ color: "#28a745" }}>
            Admin profile reset successfully!
          </span>
          <div className="sent-ongoing-progress-bar"></div>
        </div>
      )}






      {/* DATA BACKUP */}
      {showBackupConfirmDialog && (
        <div className="overlay-delete">
          <div className="confirm-modal" style={{ minWidth: "400px" }}>
            <h3>Start Data Backup?</h3>
            <p style={{ marginBottom: "15px" }}>
              Select which collections to backup:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "20px" }}>
              {Object.keys(selectedBackupCollections).map((collection) => (
                <label
                  key={collection}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px", cursor: "pointer",
                    padding: "12px 16px", borderRadius: "12px", textTransform: "capitalize",
                    fontWeight: "600", fontSize: "14px", transition: "all 0.3s ease",
                    background: selectedBackupCollections[collection] ? "#e8f5e9" : "#fff",
                    border: selectedBackupCollections[collection] ? "2px solid #4caf50" : "2px solid #e0e0e0",
                    boxShadow: selectedBackupCollections[collection] ? "0 2px 8px rgba(76, 175, 80, 0.2)" : "0 1px 3px rgba(0,0,0,0.08)",
                  }}
                >
                  <div style={{
                    width: "24px", height: "24px", borderRadius: "8px", display: "flex",
                    alignItems: "center", justifyContent: "center", transition: "all 0.3s ease", flexShrink: 0,
                    border: selectedBackupCollections[collection] ? "2px solid #4caf50" : "2px solid #bdbdbd",
                    background: selectedBackupCollections[collection] ? "#4caf50" : "#fff",
                  }}>
                    {selectedBackupCollections[collection] && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                  <input type="checkbox" checked={selectedBackupCollections[collection]}
                    onChange={() => setSelectedBackupCollections((prev) => ({ ...prev, [collection]: !prev[collection] }))}
                    style={{ display: "none" }} />
                  {collection}
                </label>
              ))}
            </div>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  const selected = Object.keys(selectedBackupCollections).filter(
                    (key) => selectedBackupCollections[key]
                  );

                  if (selected.length === 0) {
                    console.warn("No collections selected for backup.");
                    return;
                  }

                  console.log("Backup started for:", selected);
                  createBackup(selectedBackupCollections); // or createBackup(selected)
                  setShowBackupConfirmDialog(false);

                }}
              >
                Yes, Backup
              </button>
              <button
                className="confirm-btn cancel"
                onClick={() => setShowBackupConfirmDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      {/* DATA DOWNLOAD */}
      {showDownloadConfirmDialog && (
        <div className="overlay-delete">
          <div className="confirm-modal" style={{ minWidth: "400px" }}>
            <h3>Start Data Download?</h3>
            <p style={{ marginBottom: "15px" }}>
              Select which collections to download:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "20px" }}>
              {Object.keys(selectedDownloadCollections).map((collection) => (
                <label
                  key={collection}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px", cursor: "pointer",
                    padding: "12px 16px", borderRadius: "12px", textTransform: "capitalize",
                    fontWeight: "600", fontSize: "14px", transition: "all 0.3s ease",
                    background: selectedDownloadCollections[collection] ? "#e8f5e9" : "#fff",
                    border: selectedDownloadCollections[collection] ? "2px solid #4caf50" : "2px solid #e0e0e0",
                    boxShadow: selectedDownloadCollections[collection] ? "0 2px 8px rgba(76, 175, 80, 0.2)" : "0 1px 3px rgba(0,0,0,0.08)",
                  }}
                >
                  <div style={{
                    width: "24px", height: "24px", borderRadius: "8px", display: "flex",
                    alignItems: "center", justifyContent: "center", transition: "all 0.3s ease", flexShrink: 0,
                    border: selectedDownloadCollections[collection] ? "2px solid #4caf50" : "2px solid #bdbdbd",
                    background: selectedDownloadCollections[collection] ? "#4caf50" : "#fff",
                  }}>
                    {selectedDownloadCollections[collection] && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                  <input type="checkbox" checked={selectedDownloadCollections[collection]}
                    onChange={() => setSelectedDownloadCollections((prev) => ({ ...prev, [collection]: !prev[collection] }))}
                    style={{ display: "none" }} />
                  {collection}
                </label>
              ))}
            </div>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  const selected = Object.keys(selectedDownloadCollections).filter(
                    (key) => selectedDownloadCollections[key]
                  );

                  if (selected.length === 0) {
                    console.warn("No collections selected for download.");
                    return;
                  }

                  console.log("Download started for:", selected);
                  createDownload(selectedDownloadCollections); // or createDownload(selected)
                  setShowDownloadConfirmDialog(false);
                }}
              >
                Yes, Download
              </button>
              <button
                className="confirm-btn cancel"
                onClick={() => setShowDownloadConfirmDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}









      {showImportDialog && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Import Data</h3>
            <p>Choose how you want to import the data:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button
                  className="confirm-btn delete"
                  style={{ flex: 1, margin: 0 }}
                  onClick={() => {
                    setImportMode("merge");
                    setShowImportDialog(false);
                    setShowImportConfirmDialog(true);
                  }}
                >
                  Merge Data
                </button>
                <button
                  className="confirm-btn delete"
                  onClick={() => {
                    setImportMode("overwrite");
                    setShowImportDialog(false);
                    setShowImportConfirmDialog(true);
                  }}
                >
                  Overwrite Data
                </button>
              </div>
              <button
                className="confirm-btn cancel"
                style={{ width: "100%", margin: 0 }}
                onClick={() => setShowImportDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}






      {/* DATA IMPORT */}
      {showImportConfirmDialog && (
        <div className="overlay-delete">
          <div className="confirm-modal" style={{ minWidth: "400px" }}>
            <h3>{importMode === "merge" ? "Merge Data?" : "Overwrite Data?"}</h3>
            <p style={{ marginBottom: "15px" }}>
              {importMode === "merge"
                ? "This will merge the imported data with existing data. Select which collections to import:"
                : "This will completely replace existing data. Select which collections to import:"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "20px" }}>
              {Object.keys(selectedCollections).map((collection) => (
                <label
                  key={collection}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                    padding: "12px 16px",
                    background: selectedCollections[collection] ? "#e8f5e9" : "#fff",
                    borderRadius: "12px",
                    border: selectedCollections[collection] ? "2px solid #4caf50" : "2px solid #e0e0e0",
                    transition: "all 0.3s ease",
                    textTransform: "capitalize",
                    fontWeight: "600",
                    fontSize: "14px",
                    boxShadow: selectedCollections[collection] ? "0 2px 8px rgba(76, 175, 80, 0.2)" : "0 1px 3px rgba(0,0,0,0.08)",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "8px",
                      border: selectedCollections[collection] ? "2px solid #4caf50" : "2px solid #bdbdbd",
                      background: selectedCollections[collection] ? "#4caf50" : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s ease",
                      flexShrink: 0,
                    }}
                  >
                    {selectedCollections[collection] && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedCollections[collection]}
                    onChange={() =>
                      setSelectedCollections((prev) => ({
                        ...prev,
                        [collection]: !prev[collection],
                      }))
                    }
                    style={{ display: "none" }}
                  />
                  {collection}
                </label>
              ))}
            </div>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  const selected = Object.keys(selectedCollections).filter(
                    (key) => selectedCollections[key]
                  );
                  console.log(`${importMode} import started for:`, selected);
                  setShowImportConfirmDialog(false);
                  setImportMode(null);
                }}
              >
                Yes, {importMode === "merge" ? "Merge" : "Overwrite"}
              </button>
              <button
                className="confirm-btn cancel"
                onClick={() => {
                  setShowImportConfirmDialog(false);
                  setShowImportDialog(true);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}












      {showResetConfirmDialog && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Reset Profile Picture?</h3>
            <p>
              Are you sure you want to reset the admin profile picture to the
              original?
            </p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  handleResetAdminProfilePic();
                  setShowResetConfirmDialog(false);
                }}
              >
                Yes, Reset
              </button>
              <button
                className="confirm-btn cancel"
                onClick={() => setShowResetConfirmDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveConfirmDialog && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Save Profile Picture?</h3>
            <p>Are you sure you want to save the new admin profile picture?</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  handleSaveAdminProfilePic();
                  setShowSaveConfirmDialog(false);
                }}
              >
                Yes, Save
              </button>
              <button
                className="confirm-btn cancel"
                onClick={() => setShowSaveConfirmDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditAdminConfirmDialog && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Edit Admin Details?</h3>
            <p>Are you sure you want to edit this admin's details?</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  setSelectedAdmin(adminToEdit);
                  setShowAdminDetailsOverlay(true);
                  setShowEditAdminConfirmDialog(false);
                  setAdminToEdit(null);
                }}
              >
                Yes, Edit
              </button>
              <button
                className="confirm-btn cancel"
                onClick={() => {
                  setShowEditAdminConfirmDialog(false);
                  setAdminToEdit(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isBackingUp && (
        <div
          className={`backup-progress ${
            isBackupMinimized ? "backup-minimized" : ""
          }`}
        >
          {!isBackupMinimized ? (
            <div className="backup-progress-container">
              <span className="backup-progress-label">Backing Up Data</span>

              <div className="backup-progress-bar">
                <div
                  className="backup-progress-fill"
                  style={{ width: `${backupProgress}%` }}
                />
              </div>

              <span className="backup-progress-text">
                {Math.round(backupProgress)}%
              </span>

              <button
                className="backup-toggle-btn"
                onClick={() => setIsBackupMinimized(true)}
                aria-label="Minimize backup progress"
              >
                ◀
              </button>
            </div>
          ) : (
            <div className="backup-minimized-container">
              <span className="backup-progress-text">
                {Math.round(backupProgress)}%
              </span>

              <button
                className="backup-toggle-btn backup-triangle-left"
                onClick={() => setIsBackupMinimized(false)}
                aria-label="Expand backup progress"
              >
                ▶
              </button>
            </div>
          )}
        </div>
      )}

      {isDownloading && (
        <div
          className={`backup-progress ${
            isDownloadMinimized ? "backup-minimized" : ""
          }`}
        >
          {!isDownloadMinimized ? (
            <div className="backup-progress-container">
              <span className="backup-progress-label">Downloading Data</span>

              <div className="backup-progress-bar">
                <div
                  className="backup-progress-fill"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>

              <span className="backup-progress-text">
                {Math.round(downloadProgress)}%
              </span>

              <button
                className="backup-toggle-btn"
                onClick={() => setIsDownloadMinimized(true)}
                aria-label="Minimize download progress"
              >
                ◀
              </button>
            </div>
          ) : (
            <div className="backup-minimized-container">
              <button
                className="backup-toggle-btn backup-triangle-left"
                onClick={() => setIsDownloadMinimized(false)}
                aria-label="Expand download progress"
              >
                ▶
              </button>

              <span className="backup-progress-text">
                {Math.round(downloadProgress)}%
              </span>
            </div>
          )}
        </div>
      )}

      {showLogoutOverlay && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Logout?</h3>
            <p>Are you sure you want to log out of your account?</p>

            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={async () => {
                  await handleLogout();
                  setShowLogoutOverlay(false);
                }}
              >
                Yes, Logout
              </button>
              <button
                className="confirm-btn cancel"
                onClick={() => setShowLogoutOverlay(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfileOverlay && (
        <div className="admin-settings-overlay">
          <div
            className="admin-settings-container"
            style={{ height: `${containerHeight}px` }}
          >
            {/* Back Button */}
            {overlayActiveSection && (
              <button
                className="back-btn"
                type="button"
                onClick={() => {
                  // go back one level
                  if (overlayActiveSection === "blockedUsers") {
                    handleSectionChange("users");
                  } else {
                    handleSectionChange("");
                  }
                }}
              >
                ← Back
              </button>
            )}

            {/* Close Button */}

            <button
              className="close-btn"
              type="button"
              onClick={() => {
                setShowProfileOverlay(false);
                setOverlayActiveSection("");
                setContainerHeight(300);
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

            {/* Dynamic Title */}
            <h3 className="confirm-header">
              {overlayActiveSection === "admin"
                ? "ADMIN SETTINGS"
                : overlayActiveSection === "users"
                  ? "USER MANAGEMENT"
                  : overlayActiveSection === "blockedUsers"
                    ? "BLOCKED USERS"
                    : "PROFILE"}
            </h3>

            <p className="confirm-text">
              {overlayActiveSection === "admin"
                ? "Manage admin emails and access here."
                : overlayActiveSection === "users"
                  ? "View and manage users of the platform."
                  : overlayActiveSection === "blockedUsers"
                    ? "Manage blocked users and restore access if needed."
                    : "Manage your global preferences and configurations here."}
            </p>

            {/* Outer wrapper */}
            <div
              className={`settings-slider-wrapper ${
                isTransitioning ? "transitioning" : ""
              } ${slideDirection ? `sliding-${slideDirection}` : ""}`}
            >
              <div
                className={`settings-slider ${
                  overlayActiveSection === "admin"
                    ? "shifted-admin"
                    : overlayActiveSection === "users"
                      ? "shifted-users"
                      : overlayActiveSection === "blockedUsers"
                        ? "shifted-blocked"
                        : "default"
                }`}
              >
                {/* Default Menu */}
                <div className="settings-scrollable settings-page">
                  <div
                    className="settings-item-box"
                    onClick={() => handleSectionChange("admin")}
                  >
                    Admin
                  </div>
                  <div
                    className="settings-item-box"
                    onClick={() => handleSectionChange("users")}
                  >
                    Users
                  </div>
                </div>

                {/* Admin Section */}
                <div className="settings-page">
                  <div className="admin-header">
                    <span>Email</span>
                  </div>
                  <div className="admin-list">
                    {adminAccounts.map((admin) => (
                      <div className="admin-item" key={admin.id}>
                        <div className="email-with-status">
                          <img
                            src="/assets/verified.png"
                            alt="Verified"
                            className="status-icon"
                          />
                          <span>{admin.email}</span>
                        </div>
                        <span
                          style={{
                            backgroundColor: "#28a745",
                            color: "white",
                            textTransform: "uppercase",
                            borderRadius: 20,
                            padding: "5px",
                            fontSize: "12px",
                          }}
                        >
                          {admin.role}
                        </span>
                        <button
                          className="remove-btn"
                          onClick={() => {
                            setAdminToEdit(admin);
                            setShowEditAdminConfirmDialog(true);
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Users Section */}
                <div className="settings-page">
                  <div className="admin-header">
                    <span>Users</span>
                    <button
                      className="add-btn"
                      onClick={() => handleSectionChange("blockedUsers")}
                    >
                      Blocked Users
                    </button>
                  </div>
                  <div className="admin-list">
                    {userAccounts.length === 0 ? (
                      <p className="empty-message">No Users Yet</p>
                    ) : (
                      userAccounts.map((usr) => (
                        <div className="admin-item" key={usr.id}>
                          <div className="email-with-status">
                            <img
                              src={
                                usr.emailVerified
                                  ? "/assets/verified.png"
                                  : "/assets/unverified.png"
                              }
                              alt={
                                usr.emailVerified ? "Verified" : "Unverified"
                              }
                              className="status-icon"
                            />
                            <span>{usr.email}</span>
                          </div>
                          <button
                            className="remove-btn"
                            onClick={() => confirmBlockUser(usr)}
                          >
                            Block
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Blocked Users Section */}
                <div className="settings-page">
                  <div className="admin-header">
                    <span>Blocked Users</span>
                  </div>
                  <div className="admin-list">
                    {blockedUsers.length === 0 ? (
                      <p className="empty-message">No Blocked Users Yet</p>
                    ) : (
                      blockedUsers.map((usr) => (
                        <div className="admin-item" key={usr.id}>
                          <div className="email-with-status">
                            <img
                              src={
                                usr.emailVerified
                                  ? "/assets/verified.png"
                                  : "/assets/unverified.png"
                              }
                              alt={
                                usr.emailVerified ? "Verified" : "Unverified"
                              }
                              className="status-icon"
                            />
                            <span>{usr.email}</span>
                          </div>
                          <button
                            className="remove-btn"
                            onClick={() => confirmUnblockUser(usr)}
                          >
                            Unblock
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
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

      {/* Block User Overlay */}
      {showBlockUserReason && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Block this user?</h3>
            <p>
              This will restrict <b>{userToProcess?.email}</b> from accessing
              their account.
            </p>

            {/* Reason input */}
            <textarea
              placeholder="Enter reason for blocking..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="message-reject"
            ></textarea>

            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={async () => {
                  setShowBlockUserReason(false);
                  setIsBlockingUser(true);

                  try {
                    await blockUsers(userToProcess, blockReason);

                    // Reset form fields
                    setBlockReason("");
                    setUserToProcess(null);

                    setTimeout(() => {
                      setIsBlockingUser(false);
                      setShowBlockedSuccess(true);
                      setHideBlockAnimation(false);

                      setTimeout(() => {
                        setHideBlockAnimation(true);
                        setTimeout(() => setShowBlockedSuccess(false), 400);
                      }, 5000);
                    }, 1200);
                  } catch (err) {
                    console.error("Error blocking user:", err);
                    setIsBlockingUser(false);
                  }
                }}
              >
                Yes, Block
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => {
                  setShowBlockUserReason(false);
                  setBlockReason("");
                  setUserToProcess(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 Loading Overlay (Blocking User) */}
      {isBlockingUser && (
        <div className="submitting-overlay">
          <div className="loading-container">
            <div className="loading-bar-road">
              <img
                src="/assets/images/submitting.gif"
                alt="Blocking user..."
                className="car-gif"
              />
            </div>
            <p className="submitting-text-red">Blocking user...</p>
          </div>
        </div>
      )}

      {/* 🟢 Success Overlay (User Blocked) */}
      {showBlockedSuccess && (
        <div
          className={`date-warning-overlay ${hideBlockAnimation ? "hide" : ""}`}
        >
          <button
            className="close-warning"
            onClick={() => {
              setHideBlockAnimation(true);
              setTimeout(() => setShowBlockedSuccess(false), 400);
            }}
          >
            ✖
          </button>
          <span className="warning-text" style={{ color: "#dc3545" }}>
            User blocked successfully!
          </span>
          <div className="progress-bar"></div>
        </div>
      )}

      {/* Unblock User Overlay */}
      {showUnblockUserConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Unblock this user?</h3>
            <p>
              <b>{userToProcess?.email}</b> was blocked for the following
              reason:
              <br />
              <i>{userToProcess?.blockedReason || "No reason provided"}</i>
            </p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={async () => {
                  setShowUnblockUserConfirm(false);
                  setIsUnblockingUser(true);

                  try {
                    await unblockUser(userToProcess);
                    setUserToProcess(null);

                    setTimeout(() => {
                      setIsUnblockingUser(false);
                      setShowUnblockedSuccess(true);
                      setHideUnblockAnimation(false);

                      setTimeout(() => {
                        setHideUnblockAnimation(true);
                        setTimeout(() => setShowUnblockedSuccess(false), 400);
                      }, 5000);
                    }, 1200);
                  } catch (err) {
                    console.error("Error unblocking user:", err);
                    setIsUnblockingUser(false);
                  }
                }}
              >
                Yes, Unblock
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => {
                  setShowUnblockUserConfirm(false);
                  setUserToProcess(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay (Unblocking User) */}
      {isUnblockingUser && (
        <div className="submitting-overlay">
          <div className="loading-container">
            <div className="loading-bar-road">
              <img
                src="/assets/images/submitting.gif"
                alt="Unblocking user..."
                className="car-gif"
              />
            </div>
            <p className="submitting-text">Unblocking user...</p>
          </div>
        </div>
      )}

      {/* 🟢 Success Overlay (User Unblocked) */}
      {showUnblockedSuccess && (
        <div
          className={`sent-ongoing-overlay ${
            hideUnblockAnimation ? "hide" : ""
          }`}
        >
          <button
            className="close-sent-ongoing"
            onClick={() => {
              setHideUnblockAnimation(true);
              setTimeout(() => setShowUnblockedSuccess(false), 400);
            }}
          >
            ✖
          </button>
          <span className="warning-text" style={{ color: "#28a745" }}>
            User unblocked successfully!
          </span>
          <div className="sent-ongoing-progress-bar"></div>
        </div>
      )}

      {showSettingsOverlay && (
        <div className="admin-settings-overlay">
          <div className="admin-settings-container">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowSettingsOverlay(false)}
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

            <h3 className="confirm-header">SETTINGS</h3>
            <p className="confirm-text">
              Manage your global preferences and configurations here.
            </p>

            {/* Theme selector */}
            <div className="theme-toggle">
              <label
                htmlFor="theme-select"
                style={{
                  fontFamily: "Montserrat, san-serif",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Global Theme:
              </label>
              <div className="theme-option">
                <select
                  id="theme-select"
                  value={pendingTheme}
                  onChange={(e) => setPendingTheme(e.target.value)}
                >
                  <option value="pine">Pine</option>
                  <option value="clover">Clover</option>
                  <option value="november">November</option>
                  <option value="december">December</option>
                </select>

                <div
                  className="theme-preview"
                  style={{
                    background:
                      pendingTheme === "pine"
                        ? "linear-gradient(135deg, #074609, #133c09)"
                        : pendingTheme === "clover"
                          ? "linear-gradient(135deg, #28a745, #218838)"
                          : pendingTheme === "november"
                            ? "linear-gradient(135deg, #b3541e, #8c3a13)"
                            : "linear-gradient(135deg, #b3001b, #0d4d1a)", // December
                  }}
                />
              </div>
            </div>

            <div className="confirm-button-group">
              <button className="confirm-proceed-btn" onClick={handleSaveTheme}>
                Save
              </button>
              <button className="confirm-cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        className="custom-chat-btn"
        onClick={() => setShowMessengerConfirm(true)}
      >
        <img src="/assets/message.png" alt="Chat" className="btn-icon" />
      </button>

      {showMessengerConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3 className="confirm-header">Open Messenger?</h3>
            <p className="confirm-text">
              You will be redirected to Facebook Messenger to chat with us.
            </p>

            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  setShowMessengerConfirm(false);
                  window.open("https://m.me/111898015131645", "_blank");
                }}
              >
                Open Messenger
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowMessengerConfirm(false)}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        className={`scroll-to-top-btn ${showScrollToTop ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <img src="/assets/top.png" alt="Top" className="btn-icon" />
      </button>
    </>
  );
};

// export default Header;


export default React.memo(Header);