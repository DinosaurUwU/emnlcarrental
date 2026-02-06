"use client";
import React, { useState, useEffect, useRef } from "react";
import "./Login.css";
import { useRouter } from "next/navigation";
import { auth, provider } from "../../lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { useUser } from "../../lib/UserContext";

const images = [
  "/assets/images/image1.png",
  "/assets/images/pickup.png",
  "/assets/images/sedan.png",
];

const Login = () => {
  const router = useRouter();
  const { user, authLoading, showBlockedUserOverlay } = useUser();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [imageClass, setImageClass] = useState("visible");
  const intervalRef = useRef(null);

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
      console.error("Google Sign-In Error:", error);
      alert("Google Sign-In failed: " + error.message);
      setIsSubmitting(false);
    }
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
          <img src="/assets/logo.png" alt="Logo" className="login-logo" />

          <h2>Sign in with Google</h2>
          <p style={{ marginBottom: 20 }}>
            Use your Google account to access the system.
          </p>

          <button className="google-btn" onClick={handleGoogleSignIn}>
            <img src="/assets/google-icon.png" alt="Google" />
            <span>Continue with Google</span>
          </button>
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
            <p className="submitting-text">
              Signing you in with Google...
            </p>
          </div>
        </div>
      )}

      {/* ================= Blocked Overlay (kept from your system) ================= */}
      {showBlockedUserOverlay && (
        <div className="admin-booking-confirm-overlay">
          <div className="admin-booking-confirm-container">
            <h3 style={{ color: "#dc3545" }}>
              🚫 ACCOUNT BLOCKED
            </h3>
            <p>Your account has been blocked by the administrator.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
