"use client";
import React, { useState, useEffect, useRef } from "react";
import "./Login.css";
import { useRouter } from "next/navigation";
import { auth, provider } from "../../lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { useUser } from "../../lib/UserContext";

const images = [
  "/assets/images/image1.png",
  "/assets/images/about.png",
  "/assets/images/sedan.png",
];

const Login = () => {
  const router = useRouter();
  const { user, authLoading, showBlockedUserOverlay } = useUser();
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [imageClass, setImageClass] = useState("visible");
  const intervalRef = useRef(null);

  const [showErrorOverlay, setShowErrorOverlay] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // =========================
  // Redirect if logged in
  // =========================
  useEffect(() => {
    if (authLoading) return;
    if (user && user.role) {
      router.push(user.role === "admin" ? "/admin" : "/");
    }
  }, [user, authLoading, router]);

  // =========================
  // Carousel
  // =========================
  const goToImage = (index) => {
    setImageClass("");
    setTimeout(() => {
      setCurrentImage(index);
      setImageClass("visible");
    }, 400);
  };

  const setCarouselInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setImageClass("");
      setTimeout(() => {
        setCurrentImage((prev) => (prev + 1) % images.length);
        setImageClass("visible");
      }, 400);
    }, 3000);
  };

  useEffect(() => {
    setCarouselInterval();
    return () => clearInterval(intervalRef.current);
  }, [currentImage]);

  // =========================
  // Google Login Only
  // =========================

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      await signInWithPopup(auth, provider);
      // UserContext onAuthStateChanged will handle user state
    } catch (error) {
      setIsSubmitting(false);

      // Handle popup closed by user - respond fast, no overlay
      if (error.code === "auth/popup-closed-by-user") {
        console.log("ℹ️ User closed the popup");
        // Still show overlay for closed popup
        setErrorMessage("Sign-in was cancelled");
        setShowErrorOverlay(true);
        return;
      }

      // Show overlay for real errors
      console.error("Google Sign-In Error:", error);
      setErrorMessage(error.message || "Google Sign-In failed");
      setShowErrorOverlay(true);
    }
  };

  // const handleGoogleSignIn = async () => {
  //   try {
  //     setIsSubmitting(true);
  //     await signInWithPopup(auth, provider);
  //     // UserContext onAuthStateChanged will handle user state
  //   } catch (error) {
  //     console.error("Google Sign-In Error:", error);
  //     alert("Google Sign-In failed: " + error.message);
  //     setIsSubmitting(false);
  //   }
  // };

  const closeErrorOverlay = () => {
    setShowErrorOverlay(false);
    setErrorMessage("");
  };

  return (
    <div className="login background">
      <div className="login glass-container">
        {/* ================= Carousel ================= */}
        <div className="login carousel">
          <img
            src={images[currentImage]}
            alt="carousel"
            className={imageClass}
          />
          <div className="carousel-indicators">
            {images.map((_, i) => (
              <span
                key={i}
                className={`carousel-indicator ${currentImage === i ? "active" : ""}`}
                onClick={() => goToImage(i)}
              />
            ))}
          </div>
        </div>

        {/* ================= Form Section ================= */}
        <div className="login form-section">
          <img src="/assets/dark-logo.png" alt="Logo" className="login-logo" />

          <h2>Sign in with Google</h2>
          <p style={{ marginBottom: 20 }}>
            Use your Google account to access the system.
          </p>

          <button
            className="google-btn"
            onClick={handleGoogleSignIn}
            disabled={!acceptedTerms}
            style={{
              opacity: acceptedTerms ? 1 : 0.5,
              cursor: acceptedTerms ? "pointer" : "not-allowed",
            }}
          >
            <img src="/assets/google-icon.png" alt="Google" />
            <span>Continue with Google</span>
          </button>

          {/* ================= Terms & Privacy ================= */}
          <div className="terms-container">
            <label className="terms-label">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="terms-checkbox"
              />
              <span className="terms-text">
                I agree to the{" "}
                <a
                  href="/info#terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="terms-link"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/info#privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="terms-link"
                >
                  Privacy Policy
                </a>
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* ================= Loading Overlay ================= */}
      {isSubmitting && (
        <div className="submitting-overlay">
          <div className="loading-container">
            <div className="loading-bar-road">
              <img
                src="/assets/images/submitting.gif"
                alt="Loading"
                className="car-gif"
              />
            </div>
            <p className="submitting-text">Signing you in with Google...</p>
          </div>
        </div>
      )}

      {/* ================= Blocked Overlay (kept from your system) ================= */}
      {showBlockedUserOverlay && (
        <div className="admin-booking-confirm-overlay">
          <div className="admin-booking-confirm-container">
            <h3 style={{ color: "#dc3545" }}>🚫 ACCOUNT BLOCKED</h3>
            <p>Your account has been blocked by the administrator.</p>
          </div>
        </div>
      )}

      {/* ================= Error Overlay ================= */}
      {showErrorOverlay && (
        <div className="error-overlay" onClick={closeErrorOverlay}>
          <div className="error-container" onClick={(e) => e.stopPropagation()}>
            <div className="error-icon">❌</div>
            <h3>Sign-In Failed</h3>
            <p>{errorMessage}</p>
            <button className="error-btn" onClick={closeErrorOverlay}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
