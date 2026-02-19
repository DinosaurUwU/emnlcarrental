"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "../lib/UserContext";
import { useBooking } from "./BookingProvider";
import Link from "next/link";
import "./Header.css";

import { BiSearch, BiSearchAlt } from "react-icons/bi";

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

  useEffect(() => {
  router.prefetch("/");
  router.prefetch("/fleet-details");
}, [router]);


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
                      {/* <Link
                        href={path}
                        className={pathname === path ? "active" : ""}
                        onClick={() => setMenuOpen(false)}
                      >
                        {labels[index]}
                      </Link> */}

                      <Link
                        href={path}
                        prefetch
                        onMouseEnter={() => router.prefetch(path)}
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
                <Link href="/" 
                prefetch
                onMouseEnter={() => router.prefetch("/")} 
                className={pathname === "/" ? "active" : ""}>
                  Home
                </Link>
              </li>

              <li>
                <Link
                  href="/fleet-details"
                  prefetch
                  onMouseEnter={() => router.prefetch("/fleet-details")}
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

        {/* <div className="Header__right">
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
        </div> */}

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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                width="500"
                height="500"
                zoomAndPan="magnify"
                viewBox="0 0 375 374.999991"
                preserveAspectRatio="xMidYMid meet"
                version="1.2"
                className="header-account-icon"
              >
                <defs>
                  <clipPath id="125d292a6e">
                    <path d="M 16.804688 16.804688 L 358.054688 16.804688 L 358.054688 358 L 16.804688 358 Z M 16.804688 16.804688 " />
                  </clipPath>
                  <clipPath id="7a14a02d0a">
                    <path d="M 32 108 L 269 108 L 269 345 L 32 345 Z M 32 108 " />
                  </clipPath>
                  <clipPath id="81ddddeac4">
                    <path d="M 32.035156 131.015625 L 54.917969 108.132812 L 268.777344 321.988281 L 245.894531 344.875 Z M 32.035156 131.015625 " />
                  </clipPath>
                  <clipPath id="816d5f922a">
                    <path d="M 0 0 L 236.800781 0 L 236.800781 236.878906 L 0 236.878906 Z M 0 0 " />
                  </clipPath>
                  <clipPath id="929fd842fd">
                    <path d="M 0.0351562 23.015625 L 22.917969 0.132812 L 236.777344 213.988281 L 213.894531 236.875 Z M 0.0351562 23.015625 " />
                  </clipPath>
                  <clipPath id="cc785e7ef7">
                    <rect x="0" y="0" width="237" height="237" />
                  </clipPath>
                  <clipPath id="0a048d254b">
                    <path d="M 16.804688 16.804688 L 358.054688 16.804688 L 358.054688 358.054688 L 16.804688 358.054688 Z M 16.804688 16.804688 " />
                  </clipPath>
                  <clipPath id="08643bf965">
                    <path d="M 187.496094 16.804688 C 93.226562 16.804688 16.804688 93.226562 16.804688 187.496094 C 16.804688 281.765625 93.226562 358.183594 187.496094 358.183594 C 281.765625 358.183594 358.183594 281.765625 358.183594 187.496094 C 358.183594 93.226562 281.765625 16.804688 187.496094 16.804688 Z M 187.496094 16.804688 " />
                  </clipPath>
                </defs>

                <g id="58b9444797">
                  <path
                    style={{
                      stroke: "none",
                      fillRule: "nonzero",
                      fill: "currentColor",
                      fillOpacity: 1,
                    }}
                    d="M 187.429688 86.988281 C 155.242188 86.988281 128.964844 113.152344 128.964844 145.34375 C 128.964844 177.648438 155.242188 203.8125 187.429688 203.8125 C 219.621094 203.8125 245.898438 177.648438 245.898438 145.34375 C 245.898438 113.152344 219.621094 86.988281 187.429688 86.988281 Z M 187.429688 86.988281 "
                  />

                  <g clipRule="nonzero" clipPath="url(#125d292a6e)">
                    <path
                      style={{
                        stroke: "none",
                        fillRule: "nonzero",
                        fill: "currentColor",
                        fillOpacity: 1,
                      }}
                      d="M 187.316406 16.921875 C 93.359375 16.921875 16.804688 93.359375 16.804688 187.429688 C 16.804688 239.757812 40.582031 286.621094 77.777344 317.902344 C 107.464844 342.925781 145.683594 357.941406 187.316406 357.941406 C 246.695312 357.941406 300.839844 327.914062 332.234375 277.519531 C 349.183594 250.449219 358.054688 219.394531 358.054688 187.429688 C 358.054688 155.46875 349.183594 124.300781 332.234375 97.339844 C 300.839844 46.949219 246.695312 16.921875 187.316406 16.921875 Z M 313.011719 265.464844 C 307.550781 274.222656 301.179688 281.957031 294.242188 289.238281 C 276.953125 253.746094 240.210938 230.085938 199.601562 230.085938 L 175.261719 230.085938 C 147.050781 230.085938 120.546875 241.121094 100.640625 261.027344 C 92.335938 269.21875 85.738281 278.886719 80.621094 289.351562 C 55.253906 262.847656 39.554688 227.015625 39.554688 187.429688 C 39.554688 105.984375 105.871094 39.671875 187.316406 39.671875 C 238.847656 39.671875 285.710938 65.71875 313.011719 109.398438 C 327.570312 132.832031 335.304688 159.789062 335.304688 187.429688 C 335.304688 215.074219 327.570312 242.03125 313.011719 265.464844 Z M 313.011719 265.464844 "
                    />
                  </g>

                  <g clipRule="nonzero" clipPath="url(#7a14a02d0a)">
                    <g clipRule="nonzero" clipPath="url(#81ddddeac4)">
                      <g transform="matrix(1,0,0,1,32,108)">
                        <g clipPath="url(#cc785e7ef7)">
                          <g clipRule="nonzero" clipPath="url(#816d5f922a)">
                            <g clipRule="nonzero" clipPath="url(#929fd842fd)">
                              <path
                                style={{
                                  stroke: "none",
                                  fillRule: "nonzero",
                                  fill: "#ffd900",
                                  fillOpacity: 1,
                                }}
                                d="M 0.0351562 23.015625 L 22.917969 0.132812 L 236.730469 213.945312 L 213.847656 236.828125 Z M 0.0351562 23.015625 "
                              />
                            </g>
                          </g>
                        </g>
                      </g>
                    </g>
                  </g>

                  <g clipRule="nonzero" clipPath="url(#0a048d254b)">
                    <g clipRule="nonzero" clipPath="url(#08643bf965)">
                      <path
                        style={{
                          fill: "none",
                          strokeWidth: 62,
                          strokeLinecap: "butt",
                          strokeLinejoin: "miter",
                          stroke: "currentColor",
                          strokeOpacity: 1,
                          strokeMiterlimit: 4,
                        }}
                        d="M 227.586509 -0.00204197 C 101.893792 -0.00204197 -0.00204797 101.893798 -0.00204797 227.586515 C -0.00204797 353.279231 101.893792 455.169863 227.586509 455.169863 C 353.279225 455.169863 455.169857 353.279231 455.169857 227.586515 C 455.169857 101.893798 353.279225 -0.00204197 227.586509 -0.00204197 Z M 227.586509 -0.00204197 "
                        transform="matrix(0.75,0,0,0.75,16.806223,16.806219)"
                      />
                    </g>
                  </g>
                </g>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                width="500"
                height="500"
                zoomAndPan="magnify"
                viewBox="0 0 375 374.999991"
                preserveAspectRatio="xMidYMid meet"
                version="1.2"
                className="header-account-icon"
              >
                <defs>
                  <clipPath id="917e21a4d4">
                    <path d="M 16.804688 16.804688 L 358.054688 16.804688 L 358.054688 358 L 16.804688 358 Z M 16.804688 16.804688 " />
                  </clipPath>
                  <clipPath id="bcca5e2613">
                    <path d="M 16.804688 16.804688 L 358.054688 16.804688 L 358.054688 358.054688 L 16.804688 358.054688 Z M 16.804688 16.804688 " />
                  </clipPath>
                  <clipPath id="4760d79b4b">
                    <path d="M 187.496094 16.804688 C 93.226562 16.804688 16.804688 93.226562 16.804688 187.496094 C 16.804688 281.765625 93.226562 358.183594 187.496094 358.183594 C 281.765625 358.183594 358.183594 281.765625 358.183594 187.496094 C 358.183594 93.226562 281.765625 16.804688 187.496094 16.804688 Z M 187.496094 16.804688 " />
                  </clipPath>
                </defs>

                <g id="045f95f314">
                  <path
                    style={{
                      stroke: "none",
                      fillRule: "nonzero",
                      fill: "currentColor",
                      fillOpacity: 1,
                    }}
                    d="M 187.429688 86.988281 C 155.242188 86.988281 128.964844 113.152344 128.964844 145.34375 C 128.964844 177.648438 155.242188 203.8125 187.429688 203.8125 C 219.621094 203.8125 245.898438 177.648438 245.898438 145.34375 C 245.898438 113.152344 219.621094 86.988281 187.429688 86.988281 Z M 187.429688 86.988281 "
                  />

                  <g clipRule="nonzero" clipPath="url(#917e21a4d4)">
                    <path
                      style={{
                        stroke: "none",
                        fillRule: "nonzero",
                        fill: "currentColor",
                        fillOpacity: 1,
                      }}
                      d="M 187.316406 16.921875 C 93.359375 16.921875 16.804688 93.359375 16.804688 187.429688 C 16.804688 239.757812 40.582031 286.621094 77.777344 317.902344 C 77.777344 317.902344 77.777344 317.902344 77.777344 318.015625 C 107.464844 342.925781 145.683594 357.941406 187.316406 357.941406 C 246.695312 357.941406 300.839844 327.914062 332.234375 277.519531 C 349.183594 250.449219 358.054688 219.394531 358.054688 187.429688 C 358.054688 155.46875 349.183594 124.300781 332.234375 97.339844 C 300.839844 46.949219 246.695312 16.921875 187.316406 16.921875 Z M 313.011719 265.464844 C 307.550781 274.222656 301.179688 281.957031 294.242188 289.238281 C 276.953125 253.746094 240.210938 230.085938 199.601562 230.085938 L 175.261719 230.085938 C 147.050781 230.085938 120.546875 241.121094 100.640625 261.027344 C 92.335938 269.21875 85.738281 278.886719 80.621094 289.351562 C 55.253906 262.847656 39.554688 227.015625 39.554688 187.429688 C 39.554688 105.984375 105.871094 39.671875 187.316406 39.671875 C 238.847656 39.671875 285.710938 65.71875 313.011719 109.398438 C 327.570312 132.832031 335.304688 159.789062 335.304688 187.429688 C 335.304688 215.074219 327.570312 242.03125 313.011719 265.464844 Z M 313.011719 265.464844 "
                    />
                  </g>

                  <g clipRule="nonzero" clipPath="url(#bcca5e2613)">
                    <g clipRule="nonzero" clipPath="url(#4760d79b4b)">
                      <path
                        style={{
                          fill: "none",
                          strokeWidth: 62,
                          strokeLinecap: "butt",
                          strokeLinejoin: "miter",
                          stroke: "currentColor",
                          strokeOpacity: 1,
                          strokeMiterlimit: 4,
                        }}
                        d="M 227.586509 -0.00204197 C 101.893792 -0.00204197 -0.00204797 101.893798 -0.00204797 227.586515 C -0.00204797 353.279231 101.893792 455.169863 227.586509 455.169863 C 353.279225 455.169863 455.169857 353.279231 455.169857 227.586515 C 455.169857 101.893798 353.279225 -0.00204197 227.586509 -0.00204197 Z M 227.586509 -0.00204197 "
                        transform="matrix(0.75,0,0,0.75,16.806223,16.806219)"
                      />
                    </g>
                  </g>
                </g>
              </svg>
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
