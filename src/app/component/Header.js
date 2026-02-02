"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "../lib/UserContext";
import { useBooking } from "./BookingProvider";
import Link from "next/link";
import "./Header.css";

import { BiSearch, BiSearchAlt } from 'react-icons/bi';

function Header() {
  const { openBooking } = useBooking();

  const [searchHovered, setSearchHovered] = useState(false);
  const [accountHovered, setAccountHovered] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const headerMainRef = useRef(null);
  const pathname = usePathname();

  const { user, logout, theme } = useUser();
  const router = useRouter();

  const profilePic = user?.profilePic || "/assets/profile.png";

  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showMessengerConfirm, setShowMessengerConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  //SCROLL RELATED
  const scrollYRef = useRef(0);

  //OVERLAY STOP BACKGROUND CLICK AND SCROLL
  useEffect(() => {
    const handleClickOrScroll = (e) => {
      if (!showMessengerConfirm) {
        setShowSettings(false);
      }
    };

    const preventTouch = (e) => {
      if (showMessengerConfirm) {
        e.preventDefault();
      }
    };

    document.addEventListener("mousedown", handleClickOrScroll);
    document.addEventListener("scroll", handleClickOrScroll);
    document.addEventListener("touchmove", preventTouch, { passive: false });

    if (showMessengerConfirm) {
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
  }, [showMessengerConfirm]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const searchInputRef = useRef(null);

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);

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
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 750);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (headerMainRef.current) {
      headerMainRef.current.classList.toggle("expanded", searchOpen);
    }
  }, [searchOpen]);

  const toggleSearch = () => {
    setSearchOpen((prev) => !prev);
    setAccountOpen(false);
    setMenuOpen(false);
  };

  const toggleAccount = () => {
    setAccountOpen((prev) => !prev);
    setSearchOpen(false);
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
    setAccountOpen(false);
    setSearchOpen(false);
  };

  const getLogoForTheme = () => {
    switch (theme) {
      case "november":
        return (
          <img
            src="/assets/november-logo.png"
            alt="EMNL Logo"
            className="Header__logo"
          />
        );
      case "december":
        return (
          <img
            src="/assets/december-logo.png"
            alt="EMNL Logo"
            className="Header__logo"
          />
        );
        case "clover":
        return (
          <img
            src="/assets/clover-logo.png"
            alt="EMNL Logo"
            className="Header__logo"
          />
        );
      default:
        return (
          <img
            src="/assets/logo.png"
            alt="EMNL Logo"
            className="Header__logo"
          />
        );
    }
  };

  return (
    <div className={`Header ${menuOpen ? "open" : ""}`}>
      {/* Overlay Menu for mobile */}
      {isMobile && (
        <div
          className={`OverlayMenu ${menuOpen ? "show" : ""}`}
          onClick={() => menuOpen && setMenuOpen(false)}
        >
          <div
            className="OverlayMenu__container"
            onClick={(e) => e.stopPropagation()}
          >
            <ul className="OverlayMenu__nav">
              {["/", "/fleet-details", "/about", "/contact"].map(
                (path, index) => {
                  const labels = ["Home", "Fleet", "About", "Contact"];
                  return (
                    <li key={index}>
                      <Link
                        href={path}
                        className={pathname === path ? "active" : ""}
                        onClick={() => setMenuOpen(false)}
                      >
                        {labels[index]}
                      </Link>
                    </li>
                  );
                },
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Overlay Account Dropdown */}

      <div
        className={`OverlayAccount ${accountOpen ? "show-account" : ""}`}
        onClick={() => setAccountOpen(false)}
      >
        <div
          className="OverlayAccount__container"
          onClick={(e) => e.stopPropagation()}
        >
          <ul className="OverlayAccount__nav">
            <li>
              <Link href="/account" onClick={() => setAccountOpen(false)}>
                Account
              </Link>
            </li>

            <li>
              <Link href="/account" onClick={() => setAccountOpen(false)}>
                Notifications
              </Link>
            </li>

            <li>
              <Link
                href="/auth/login"
                onClick={(e) => {
                  e.preventDefault();
                  setAccountOpen(false);
                  setShowLogoutOverlay(true);
                }}
              >
                Log out
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Header */}
      <div
        ref={headerMainRef}
        className={`Header__main ${menuOpen ? "menu-open" : ""} ${
          accountOpen ? "show-account" : ""
        }`}
      >
        <div className="Header__left">{getLogoForTheme()}</div>

        {!isMobile && (
          <div className="Header__center">
            <ul className="Header__nav">
              <li>
                <Link href="/" className={pathname === "/" ? "active" : ""}>
                  Home
                </Link>
              </li>

              <li>
                <Link
                  href="/fleet-details"
                  className={
                    pathname.startsWith("/fleet-details") ? "active" : ""
                  }
                >
                  Fleet
                </Link>
              </li>

              <li>
                <button
                  className="Header__button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openBooking(e);
                  }}
                >
                  Book Now
                </button>
              </li>

              <li>
                <Link
                  href="/about"
                  className={pathname === "/about" ? "active" : ""}
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className={pathname === "/contact" ? "active" : ""}
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        )}

        {isMobile && (
          <div className="Header__bookNow">
            <button
              className="Header__button"
              onClick={(e) => {
                e.stopPropagation();
                openBooking(e);
              }}
            >
              Book Now
            </button>
          </div>
        )}

        <div className="Header__right">
          <span
            className="Header__icon"
            onMouseEnter={() => setSearchHovered(true)}
            onMouseLeave={() => setSearchHovered(false)}
            onClick={() => {
              toggleSearch();
              setSearchHovered(true);
            }}
          >
{searchHovered || searchOpen ? (
  <BiSearchAlt className="header-icon" />
) : (
  <BiSearch className="header-icon" />
)}
          </span>

          <span
            className="Header__icon"
            onMouseEnter={() => setAccountHovered(true)}
            onMouseLeave={() => setAccountHovered(false)}
            onClick={() => {
              toggleAccount();
              setAccountHovered(true);
            }}
          >
            {user && user.profilePic ? (
              <img
                src={profilePic}
                alt="User Profile"
                className="Header__icon account-icon"
                onError={(e) => {
                  e.currentTarget.src = "/assets/profile.png";
                }}
              />
            ) : accountHovered || accountOpen ? (
              <img
                src="/assets/account-filled.svg"
                alt=""
                className="header-account-icon"
              />
            ) : (
              <img
                src="/assets/account.svg"
                alt=""
                className="header-account-icon"
              />
            )}
          </span>

          {isMobile && (
            <span className="Header__icon menu-icon" onClick={toggleMenu}>
              {menuOpen ? (
                <img src="/assets/close.svg" alt="" className="header-icon" />
              ) : (
                <img src="/assets/menu.svg" alt="" className="header-icon" />
              )}
            </span>
          )}

          <div className={`Header__search ${searchOpen ? "open" : ""}`}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => {
                const value = e.target.value;
                setSearchText(value); // Keep user's original case

                const matches = searchIndex.filter(
                  (entry) => entry.keyword.includes(value.toLowerCase()), // Still match in lowercase
                );
                setSearchResults(value ? matches : []);
              }}
            />
          </div>
        </div>
      </div>

      {searchOpen && searchResults.length > 0 && (
        <div className="SearchDropdown">
          <ul>
            {searchResults.map((result, index) => (
              <li key={index}>
                <Link
                  href={{
                    pathname: result.path,
                    search: `?q=${searchText}`,
                  }}
                  onClick={() => {
                    setSearchText("");
                    setSearchOpen(false);
                    setSearchResults([]);
                  }}
                >
                  <span
                    dangerouslySetInnerHTML={{
                      __html: highlightMatch(result.label, searchText),
                    }}
                  />
                </Link>
              </li>
            ))}
          </ul>
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
                  await logout(); // from useUser()
                  setShowLogoutOverlay(false);

                  router.push("/auth/login");
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
    </div>
  );
}

export default Header;
