// App.js
import React, { useState, useEffect, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import { UserProvider, useUser } from "./lib/UserContext";
import ProtectedRoute from "./auth/ProtectedRoute";

import LandingPage from "./LandingPage";
import FleetDetails from "./fleet-details/FleetDetails";
import About from "./about/page";
import Contact from "./contact/page";
import AdminDashboard from "./admin/AdminDashboard";
import AccountDashboard from "./users/AccountDashboard";
import Login from "./auth/login/page";
import BookingPage from "./component/BookingPage";

import InfoPage from "./component/InfoPage";
import NotFound from "./NotFound";

import "./styles/theme.css";

// import ImportData from "./admin/importData";

// Inner App (can use useUser)
function AppContent() {
  const {
    user,
    isActivatingBooking,
    showVerifyOverlay,
    setShowVerifyOverlay,
    sendVerificationEmail,
  } = useUser();
  const [verifyTargetEmail, setVerifyTargetEmail] = useState("");
const [showVerifyInstructions, setShowVerifyInstructions] = useState(false);
const [showVerifyError, setShowVerifyError] = useState(false);
const [verifyErrorMessage, setVerifyErrorMessage] = useState("");


  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState(null);
  const [showSubmittedBookingRequest, setShowSubmittedBookingRequest] =
    useState(false);
  const [showEditedBookingRequest, setShowEditedBookingRequest] =
    useState(false);
  const [showDiscardedChanges, setShowDiscardedChanges] = useState(false);
  const [hideAnimation, setHideAnimation] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [prefillBookingData, setPrefillBookingData] = useState(null);

  const [showMovedToActiveRentals, setShowMovedToActiveRentals] =
    useState(false);
  const [showSettings, setShowSettings] = useState(false);
  //SCROLL RELATED
  const scrollYRef = useRef(0);

  //OVERLAY STOP BACKGROUND CLICK AND SCROLL
  useEffect(() => {
    const handleClickOrScroll = (e) => {
      if (!showVerifyOverlay && !showVerifyInstructions) {
        setShowSettings(false);
      }
    };

    const preventTouch = (e) => {
      if (showVerifyOverlay || showVerifyInstructions) {
        e.preventDefault();
      }
    };

    document.addEventListener("mousedown", handleClickOrScroll);
    document.addEventListener("scroll", handleClickOrScroll);
    document.addEventListener("touchmove", preventTouch, { passive: false });

    if (showVerifyOverlay || showVerifyInstructions) {
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
  }, [showVerifyOverlay, showVerifyInstructions]);

  const openBooking = (event, prefillData = {}) => {
    event.stopPropagation();

    const rect = event.target.getBoundingClientRect();
    setButtonRect({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    });

    const mergedData = {
      firstName: user?.firstName || "",
      middleName: user?.middleName || "",
      surname: user?.surname || "",
      occupation: user?.occupation || "",
      address: user?.address || "",
      contact: user?.phone || "",
      email: user?.email || "",
      ...prefillData, // Car info overrides or adds
    };

    setPrefillBookingData(mergedData);

    setIsBookingOpen(true);
  };

  const closeBooking = () => setIsBookingOpen(false);

  const closeVerifyError = () => {
  setShowVerifyError(false);
  setVerifyErrorMessage("");
};


  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage openBooking={openBooking} />} />
        <Route
          path="/fleet-details"
          element={<FleetDetails openBooking={openBooking} />}
        />
        <Route
          path="/fleet-details/:category"
          element={<FleetDetails openBooking={openBooking} />}
        />
        <Route path="/about" element={<About openBooking={openBooking} />} />
        <Route
          path="/contact"
          element={<Contact openBooking={openBooking} />}
        />
        <Route path="/auth/login" element={<Login />} />

        {/* Admin Route - Only for admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute onlyAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* User Route - Only for regular users */}
        <Route
          path="/account"
          element={
            <ProtectedRoute onlyUser>
              <AccountDashboard openBooking={openBooking} />
            </ProtectedRoute>
          }
        />

        {/* Public Booking Page */}
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/info" element={<InfoPage />} openBooking={openBooking} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Booking Overlay */}
      {isBookingOpen && (
        <BookingPage
          isOpen={isBookingOpen}
          closeOverlay={closeBooking}
          buttonRect={buttonRect}
          prefillData={prefillBookingData}
          editingBookingData={prefillBookingData}
          triggerSuccessOverlay={(msg, type) => {
            setSuccessMessage(
              msg ||
                (type === "edit"
                  ? "Booking request successfully updated!"
                  : type === "discard"
                    ? "All unsaved changes have been discarded."
                    : "Booking request successfully submitted!"),
            );

            setHideAnimation(false);

            // Reset all overlays first
            setShowSubmittedBookingRequest(false);
            setShowEditedBookingRequest(false);
            setShowDiscardedChanges(false);

            // Choose overlay to show
            if (type === "edit") {
              setShowEditedBookingRequest(true);
              setTimeout(() => {
                setHideAnimation(true);
                setTimeout(() => setShowEditedBookingRequest(false), 400);
              }, 5000);
            } else if (type === "discard") {
              setShowDiscardedChanges(true);
              setTimeout(() => {
                setHideAnimation(true);
                setTimeout(() => setShowDiscardedChanges(false), 400);
              }, 5000);
            } else {
              setShowSubmittedBookingRequest(true);
              setTimeout(() => {
                setHideAnimation(true);
                setTimeout(() => setShowSubmittedBookingRequest(false), 400);
              }, 5000);
            }
          }}
        />
      )}

      {/* Submitted Overlay */}
      {showSubmittedBookingRequest && (
        <div className={`sent-ongoing-overlay ${hideAnimation ? "hide" : ""}`}>
          <button
            className="close-sent-ongoing"
            onClick={() => {
              setHideAnimation(true);
              setTimeout(() => setShowSubmittedBookingRequest(false), 400);
            }}
          >
            ✖
          </button>
          <span className="warning-text">
            {successMessage || "Successfully Sent Booking Request!"}
          </span>
          <div className="sent-ongoing-progress-bar"></div>
        </div>
      )}

      {/* Edited Overlay */}
      {showEditedBookingRequest && (
        <div className={`sent-ongoing-overlay ${hideAnimation ? "hide" : ""}`}>
          <button
            className="close-sent-ongoing"
            onClick={() => {
              setHideAnimation(true);
              setTimeout(() => setShowEditedBookingRequest(false), 400);
            }}
          >
            ✖
          </button>
          <span className="warning-text">
            Successfully Updated Booking Request!
          </span>
          <div className="sent-ongoing-progress-bar"></div>
        </div>
      )}

      {/* Discarded Overlay */}
      {showDiscardedChanges && (
        <div className={`date-warning-overlay ${hideAnimation ? "hide" : ""}`}>
          <button
            className="close-warning"
            onClick={() => {
              setHideAnimation(true);
              setTimeout(() => setShowDiscardedChanges(false), 400);
            }}
          >
            ✖
          </button>
          <span className="warning-text">
            {successMessage || "All unsaved changes have been discarded."}
          </span>
          <div className="progress-bar"></div>
        </div>
      )}

      {/* Activating Booking Overlay */}
      {isActivatingBooking && (
        <div className="submitting-overlay">
          <div className="loading-container">
            <div className="loading-bar-road">
              <img
                src="/assets/images/submitting.gif"
                alt="Processing Booking"
                className="car-gif"
              />
            </div>
            <p className="submitting-text">Activating Booking Request...</p>
          </div>
        </div>
      )}

      {/* Moved to Active Rentals Overlay */}
      {showMovedToActiveRentals && (
        <div className={`sent-ongoing-overlay ${hideAnimation ? "hide" : ""}`}>
          <button
            className="close-sent-ongoing"
            onClick={() => {
              setHideAnimation(true);
              setTimeout(() => setShowMovedToActiveRentals(false), 400);
            }}
          >
            ✖
          </button>
          <span className="warning-text">Booking Request Now Active!</span>
          <div className="sent-ongoing-progress-bar"></div>
        </div>
      )}

      {showVerifyOverlay && (
        <div className="admin-booking-confirm-overlay">
          <div className="admin-booking-confirm-container">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowVerifyOverlay(false)}
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

            <h3 className="confirm-header">EMAIL VERIFICATION REQUIRED</h3>
            <p className="confirm-text">
              Please verify your email to continue using booking services.
            </p>

            <div className="confirm-button-group">
              <button
                className="confirm-proceed-btn"
                onClick={async () => {
                  const res = await sendVerificationEmail();

                  if (res.ok) {
                    setVerifyTargetEmail(res.email);
                    setShowVerifyInstructions(true);
                  } else {
                    setVerifyErrorMessage("Failed to send verification email. Please try again.");
                    setShowVerifyError(true);
                  }
                }}
              >
                Send Verification Email
              </button>

              <button
                className="confirm-cancel-btn"
                onClick={() => setShowVerifyOverlay(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ================= Verify Email Error Overlay ================= */}
      {showVerifyError && (
        <div className="error-overlay" onClick={closeVerifyError}>
          <div className="error-container" onClick={(e) => e.stopPropagation()}>
            <div className="error-icon">❌</div>
            <h3>Failed to Send</h3>
            <p>{verifyErrorMessage}</p>
            <button className="error-btn" onClick={closeVerifyError}>
              OK
            </button>
          </div>
        </div>
      )}




      {showVerifyInstructions && (
        <div className="admin-booking-confirm-overlay">
          <div className="admin-booking-confirm-container">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowVerifyOverlay(false)}
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

            <h3 className="confirm-header">VERIFICATION EMAIL SENT</h3>
            <p className="confirm-text">
              We’ve sent a verification link to{" "}
              <span style={{ color: "#dc3545", fontWeight: "600" }}>
                {verifyTargetEmail || "your email"}
              </span>
              .
              <br />
              Please open your inbox, click the link, and once your email is{" "}
              <span style={{ color: "#28a745", fontWeight: "600" }}>
                VERIFIED
              </span>
              , simply{" "}
              <span style={{ color: "#28a745", fontWeight: "600" }}>
                RELOAD{" "}
              </span>
              this page to continue.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// Outer App
function App() {
  return (
    <UserProvider>
      {/* <ImportData /> */}
      <AppContent />
    </UserProvider>
  );
}

export default App;
