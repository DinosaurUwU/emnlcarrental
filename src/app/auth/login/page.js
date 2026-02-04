//Login.js
"use client";
import React, { useState, useEffect, useRef } from "react";
import "./Login.css";
import { useRouter } from "next/navigation";
import { auth, provider } from "../../lib/firebase";
import {
  signInWithPopup,
  signOut,
  linkWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
} from "firebase/auth";
import { useUser } from "../../lib/UserContext";

const images = [
  "/assets/images/image1.png",
  "/assets/images/image2.jpg",
  "/assets/images/image3.jpg",
];

const Login = () => {
  const router = useRouter();
  const {
    setUser,
    user,
    authLoading,
    forgotPassword,
    showActionOverlay,
    rememberUser,
    clearRememberMe,
    showBlockedUserOverlay,
    setShowBlockedUserOverlay,
    blockedUserReason,
    adminContactInfo,
  } = useUser();

  const [rememberMe, setRememberMe] = useState(false);
  const [showRememberExpiryOverlay, setShowRememberExpiryOverlay] =
    useState(false);
  const [rememberExpiryMessage, setRememberExpiryMessage] = useState("");

  const [conflictMode, setConflictMode] = useState(null); // e.g. 'email-already-in-use'
  const [conflictEmail, setConflictEmail] = useState("");
  const [conflictPassword, setConflictPassword] = useState("");

  const [invalidPasswordMessage, setInvalidPasswordMessage] = useState(
    "The email or password you entered is incorrect. Please try again or reset your password.",
  );

  const [showInvalidPasswordOverlay, setShowInvalidPasswordOverlay] =
    useState(false);
  const [showForgotPasswordOverlay, setShowForgotPasswordOverlay] =
    useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkExpiry = () => {
      if (localStorage.getItem("rememberMeExpired") === "true") {
        setRememberExpiryMessage(
          <>
            You have been{" "}
            <strong style={{ color: "#dc3545" }}>logged out</strong> because
            your <strong style={{ color: "#28a745" }}>Remember Me</strong>{" "}
            session has expired after{" "}
            <span style={{ fontWeight: "bold", color: "#dc3545" }}>
              72 hours
            </span>
            . <br />
            Please <strong style={{ color: "#28a745" }}>log in again</strong> to
            continue.
          </>,
        );
        setShowRememberExpiryOverlay(true);
        localStorage.removeItem("rememberMeExpired"); // reset flag
      }
    };

    // check on mount
    checkExpiry();

    // listen for changes
    window.addEventListener("storage", checkExpiry);

    return () => window.removeEventListener("storage", checkExpiry);
  }, []);

  useEffect(() => {
    if (!user) {
      console.log("✅ User is logged out.");
      console.log("PROVIDER.", provider);
    } else {
      console.log("⚠️ User is still logged in:", user);
    }
  }, [user]);

  const [currentImage, setCurrentImage] = useState(0);
  const [imageClass, setImageClass] = useState("visible");
  const [isLogin, setIsLogin] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const intervalRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const goToImage = (index) => {
    setImageClass("");
    setTimeout(() => {
      setCurrentImage(index);
      setImageClass("visible");
    }, 500);
  };

  const setCarouselInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setImageClass("");
      setTimeout(() => {
        setCurrentImage((prev) => (prev + 1) % images.length);
        setImageClass("visible");
      }, 500);
    }, 3000);
  };

  useEffect(() => {
    setCarouselInterval();
    return () => clearInterval(intervalRef.current);
  }, [currentImage]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (updated.password && updated.confirmPassword) {
        setPasswordsMatch(updated.password === updated.confirmPassword);
      } else {
        setPasswordsMatch(true);
      }
      return updated;
    });
  };

  useEffect(() => {
    if (authLoading) return;

    if (user && user.role) {
      console.log("✅ User loaded in Login.js:", user.role);

      setIsSubmitting(false);
      router.push(user.role === "admin" ? "/admin" : "/");
    } else if (!user) {
      setIsSubmitting(false);
    } else {
      setIsSubmitting(true);
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password,
        );
      } else {
        if (!passwordsMatch) {
          alert("Passwords do not match!");
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password,
        );

        // Stash full name into Auth profile
        await updateProfile(userCredential.user, {
          displayName: `${formData.firstName} ${formData.surname}`,
        });
      }

      // Remember Me logic (only after successful auth)
      if (rememberMe) {
        rememberUser();
      } else {
        clearRememberMe();
      }
    } catch (error) {
      console.error("Authentication Error:", error);

      // if wrong password / invalid credential -> check what providers exist for that email
      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        try {
          const emailNormalized = (formData.email || "").trim().toLowerCase();
          let methods = [];
          try {
            methods = await fetchSignInMethodsForEmail(auth, emailNormalized);
            console.log("[Login] fetchSignInMethodsForEmail =>", methods);
          } catch (e) {
            console.warn("[Login] fetchSignInMethodsForEmail failed:", e);
            methods = [];
          }

          if (methods && methods.length > 0) {
            if (methods.includes("password")) {
              setInvalidPasswordMessage(
                "The email or password you entered is incorrect. Please try again or reset your password.",
              );
            } else {
              const mapped = methods
                .map((m) =>
                  m === "google.com"
                    ? "Google"
                    : m === "facebook.com"
                      ? "Facebook"
                      : m,
                )
                .join(", ");
              setInvalidPasswordMessage(
                `It looks like this email is registered using ${mapped} only. Please sign in with ${mapped} or link Email/Password in your Account settings.`,
              );
            }
          } else {
            // methods empty -> can't determine provider (Auth returned nothing)
            setInvalidPasswordMessage(
              <div style={{ textAlign: "center", lineHeight: "0.5" }}>
                <p style={{ marginBottom: "12px" }}>
                  The email or password you entered is incorrect.
                </p>

                <p style={{ marginBottom: "8px" }}>
                  If you used{" "}
                  <span style={{ fontWeight: "bold", color: "#28a745" }}>
                    Google
                  </span>{" "}
                  to sign up, please try{" "}
                  <span style={{ fontWeight: "bold", color: "#28a745" }}>
                    signing in with Google
                  </span>
                  .
                </p>

                <p style={{ marginBottom: "0px" }}>
                  Otherwise, try{" "}
                  <span style={{ fontWeight: "bold", color: "#dc3545" }}>
                    Forgot Password
                  </span>{" "}
                  or{" "}
                  <span style={{ fontWeight: "bold", color: "#28a745" }}>
                    contact support
                  </span>
                  .
                </p>
              </div>,
            );
          }
        } catch (e) {
          setInvalidPasswordMessage(
            "The email or password you entered is incorrect. Please try again or reset your password.",
          );
        }

        setShowInvalidPasswordOverlay(true);
      } else {
        // if trying to CREATE account and the email is already used || inside your email-already-in-use branch
        if (!isLogin && error.code === "auth/email-already-in-use") {
          const attemptedEmail = (formData.email || "").trim().toLowerCase();
          const attemptedPassword = formData.password || "";

          setConflictEmail(attemptedEmail);
          setConflictPassword(attemptedPassword);

          setInvalidPasswordMessage(
            <div>
              <p
                style={{
                  marginTop: "5px",
                  marginBottom: "5px",
                }}
              >
                This email <strong>({attemptedEmail})</strong> is already linked
                to another sign-in method.
              </p>

              {/* Google only */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "8px",
                }}
              >
                <img
                  src="/assets/google-icon.png"
                  alt="Google"
                  style={{ width: "20px", height: "20px" }}
                />
                <span>Google</span>
              </div>

              <p style={{ marginTop: "10px", marginBottom: "0px" }}>
                You can either{" "}
                <strong>link your Email/Password here directly</strong>, or you
                can <strong>sign in with Google</strong> and then link
                Email/Password from your <strong>Account Dashboard</strong>.
              </p>
            </div>,
          );

          setConflictMode("email-already-in-use");
          setShowInvalidPasswordOverlay(true);
        } else {
          alert(error.message); // keep alerts for other errors
        }
      }

      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = (formData.email || "").trim();
    if (!email) {
      setForgotPasswordMessage(
        "Please enter your email before resetting your password.",
      );
      setShowForgotPasswordOverlay(true);
      return;
    }

    const res = await forgotPassword(email);
    if (res.success) {
      setForgotPasswordMessage(
        `A password reset link has been sent to **${email}**. Please check your inbox (including spam/junk folders).`,
      );
    } else {
      if (res.error?.code === "auth/user-not-found") {
        setForgotPasswordMessage(
          <div style={{ textAlign: "center", lineHeight: "0.5" }}>
            <p style={{ marginBottom: "12px" }}>
              <span style={{ fontWeight: "bold", color: "#dc3545" }}>
                No account
              </span>{" "}
              is registered with this email.
            </p>
            <p style={{ marginBottom: "8px" }}>
              If you signed up with{" "}
              <span style={{ fontWeight: "bold", color: "#28a745" }}>
                Google
              </span>
              , please try{" "}
              <span style={{ fontWeight: "bold", color: "#28a745" }}>
                signing in with Google
              </span>
              .
            </p>
            <p style={{ marginBottom: "0px" }}>
              If you're sure you used{" "}
              <span style={{ fontWeight: "bold", color: "#28a745" }}>
                Email/Password
              </span>
              , please{" "}
              <span style={{ fontWeight: "bold", color: "#28a745" }}>
                contact support
              </span>
              .
            </p>
          </div>,
        );
      } else {
        setForgotPasswordMessage(
          res.message ||
            "Failed to send reset email. Please try again or contact support.",
        );
      }
    }

    setShowForgotPasswordOverlay(true);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged in UserContext will set isSubmitting true once user is detected
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      alert("Google Sign-In failed: " + error.message);
      setIsSubmitting(false);
    }
  };

  const handleLinkGoogleToPassword = async () => {
    try {
      const pw = prompt(`Enter your password for ${conflictEmail}:`);
      if (!pw) return;

      // 1. Sign in with Email/Password
      const emailCred = EmailAuthProvider.credential(conflictEmail, pw);
      const userCred = await signInWithEmailAndPassword(
        auth,
        conflictEmail,
        pw,
      );

      // 2. Link Google provider to this existing account
      await linkWithPopup(userCred.user, provider);

      alert("✅ Google linked successfully! You can now use both methods.");
      setShowInvalidPasswordOverlay(false);
      setConflictMode(null);
      setConflictEmail("");
    } catch (err) {
      console.error("❌ Linking failed:", err);
      alert("Link failed: " + err.message);
    }
  };

  const handleLinkExistingAccount = async () => {
    try {
      setIsSubmitting(true);
      // Sign in with Google (opens popup) — this should sign the user into the existing provider account
      await signInWithPopup(auth, provider);

      // after successful popup sign-in, currentUser is the provider account — link the email credential
      const credential = EmailAuthProvider.credential(
        conflictEmail,
        conflictPassword,
      );
      await linkWithCredential(auth.currentUser, credential);

      // refresh user in context (UserContext onAuthStateChanged should handle)
      showActionOverlay?.({
        message: "Account linked successfully.",
        type: "success",
        autoHide: true,
      });
      setShowInvalidPasswordOverlay(false);
      setConflictMode(null);
      setConflictEmail("");
      setConflictPassword("");
    } catch (err) {
      console.error("Link existing account error:", err);
      showActionOverlay?.({
        message: `Link failed: ${err?.message || "Unknown error"}`,
        type: "warning",
        autoHide: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelConflict = () => {
    setConflictMode(null);
    setConflictEmail("");
    setConflictPassword("");
    setShowInvalidPasswordOverlay(false);
  };

  const handleGoogleLoginConflict = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("✅ Google login success:", result.user);
      router.push("/account"); // redirect after login

      router.push("/account", {
        state: { openLinkAccount: true, focusProvider: "password" }, // focusProvider optional: "password" | "google" etc.
      });
    } catch (error) {
      console.error("❌ Google login failed:", error);
      alert("Google login failed, please try again.");
    }
  };

  return (
    <div className="login background" id="loginBackground">
      <div className="login glass-container">
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
                className={`carousel-indicator ${
                  currentImage === i ? "active" : ""
                }`}
                onClick={() => goToImage(i)}
              />
            ))}
          </div>
        </div>

        <div className="login form-section">
          <img src="/assets/logo.png" alt="Logo" className="login-logo" />

          <h2>{isLogin ? "Log in to your Account" : "Create an Account"}</h2>
          <p className="auth-toggle-text">
            {isLogin ? (
              <>
                <label>Don't have an Account? </label>
                <a onClick={() => setIsLogin(false)}>Sign up</a>
              </>
            ) : (
              <>
                <label>Already have an account? </label>
                <a onClick={() => setIsLogin(true)}>Log in</a>
              </>
            )}
          </p>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="login input-row">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First Name"
                  required
                />
                <input
                  type="text"
                  name="surname"
                  value={formData.surname}
                  onChange={handleInputChange}
                  placeholder="Surname"
                  required
                />
              </div>
            )}
            <input
              className="login full-width"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email Address"
              required
            />

            <div style={{ position: "relative", width: "100%" }}>
              <input
                className="login full-width"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
                required
                style={{ paddingRight: 44 }}
              />

              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 375 374.999991"
                    preserveAspectRatio="xMidYMid meet"
                    version="1.0"
                  >
                    <defs>
                      <clipPath id="2d9d09e812">
                        <path
                          d="M 9 72.03125 L 366 72.03125 L 366 303.03125 L 9 303.03125 Z M 9 72.03125 "
                          clipRule="nonzero"
                        />
                      </clipPath>
                    </defs>
                    <g clipPath="url(#2d9d09e812)">
                      <path
                        fill="currentColor"
                        d="M 360.371094 169.820312 C 342.980469 140.589844 318.117188 116.089844 288.46875 98.980469 C 257.925781 81.347656 222.972656 72.03125 187.402344 72.03125 C 151.824219 72.03125 116.875 81.347656 86.335938 98.980469 C 56.679688 116.089844 31.816406 140.589844 14.425781 169.820312 C 7.933594 180.742188 7.933594 194.320312 14.433594 205.253906 C 31.820312 234.480469 56.691406 258.972656 86.339844 276.085938 C 116.878906 293.710938 151.824219 303.023438 187.402344 303.023438 C 222.964844 303.023438 257.917969 293.710938 288.457031 276.085938 C 318.109375 258.972656 342.976562 234.480469 360.363281 205.25 C 366.863281 194.316406 366.867188 180.742188 360.371094 169.820312 Z M 187.390625 276.234375 C 138.445312 276.234375 98.753906 236.519531 98.753906 187.53125 C 98.753906 138.539062 138.445312 98.824219 187.390625 98.824219 C 236.355469 98.824219 276.042969 138.539062 276.042969 187.53125 C 276.042969 236.519531 236.355469 276.234375 187.390625 276.234375 Z M 187.390625 276.234375 "
                        fillOpacity="1"
                        fillRule="nonzero"
                      />
                    </g>
                    <path
                      fill="currentColor"
                      d="M 187.390625 136.535156 C 159.253906 136.535156 136.4375 159.367188 136.4375 187.53125 C 136.4375 215.691406 159.253906 238.523438 187.390625 238.523438 C 215.539062 238.523438 238.355469 215.691406 238.355469 187.53125 C 238.355469 159.367188 215.539062 136.535156 187.390625 136.535156 Z M 187.390625 136.535156 "
                      fillOpacity="1"
                      fillRule="nonzero"
                    />
                    <path
                      strokeLinecap="round"
                      transform="matrix(0.53033, -0.53033, 0.53033, 0.53033, 36.749698, 265.239182)"
                      fill="none"
                      strokeLinejoin="miter"
                      d="M 25.000306 24.998608 L 391.237447 24.998608 "
                      stroke="#fff"
                      strokeWidth="50"
                      strokeOpacity="1"
                      strokeMiterlimit="4"
                    />
                    <path
                      strokeLinecap="round"
                      transform="matrix(0.53033, -0.53033, 0.53033, 0.53033, 30.488597, 323.491736)"
                      fill="none"
                      strokeLinejoin="miter"
                      d="M 24.998448 24.999301 L 528.907815 24.999301 "
                      stroke="currentColor"
                      strokeWidth="50"
                      strokeOpacity="1"
                      strokeMiterlimit="4"
                    />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 375 374.999991"
                    preserveAspectRatio="xMidYMid meet"
                    version="1.0"
                  >
                    <defs>
                      <clipPath id="ccfbe853e7">
                        <path
                          d="M 9 72.03125 L 366 72.03125 L 366 303.03125 L 9 303.03125 Z M 9 72.03125 "
                          clipRule="nonzero"
                        />
                      </clipPath>
                    </defs>
                    <g clipPath="url(#ccfbe853e7)">
                      <path
                        fill="currentColor"
                        d="M 360.371094 169.820312 C 342.980469 140.589844 318.117188 116.089844 288.46875 98.980469 C 257.925781 81.347656 222.972656 72.03125 187.402344 72.03125 C 151.824219 72.03125 116.875 81.347656 86.335938 98.980469 C 56.679688 116.089844 31.816406 140.589844 14.425781 169.820312 C 7.933594 180.742188 7.933594 194.320312 14.433594 205.253906 C 31.820312 234.480469 56.691406 258.972656 86.339844 276.085938 C 116.878906 293.710938 151.824219 303.027344 187.402344 303.027344 C 222.964844 303.027344 257.917969 293.710938 288.457031 276.085938 C 318.109375 258.972656 342.976562 234.480469 360.363281 205.25 C 366.863281 194.316406 366.867188 180.742188 360.371094 169.820312 Z M 187.390625 276.234375 C 138.445312 276.234375 98.753906 236.519531 98.753906 187.53125 C 98.753906 138.539062 138.445312 98.824219 187.390625 98.824219 C 236.355469 98.824219 276.042969 138.539062 276.042969 187.53125 C 276.042969 236.519531 236.355469 276.234375 187.390625 276.234375 Z M 187.390625 276.234375 "
                        fillOpacity="1"
                        fillRule="nonzero"
                      />
                    </g>
                    <path
                      fill="currentColor"
                      d="M 187.390625 136.535156 C 159.253906 136.535156 136.4375 159.367188 136.4375 187.53125 C 136.4375 215.691406 159.253906 238.523438 187.390625 238.523438 C 215.539062 238.523438 238.355469 215.691406 238.355469 187.53125 C 238.355469 159.367188 215.539062 136.535156 187.390625 136.535156 Z M 187.390625 136.535156 "
                      fillOpacity="1"
                      fillRule="nonzero"
                    />
                  </svg>
                )}
              </button>
            </div>

            {!isLogin && (
              <div className="login confirm-password-row">
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm Password"
                    required
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    className="create-password-toggle"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 375 374.999991"
                        preserveAspectRatio="xMidYMid meet"
                        version="1.0"
                      >
                        <defs>
                          <clipPath id="2d9d09e812">
                            <path
                              d="M 9 72.03125 L 366 72.03125 L 366 303.03125 L 9 303.03125 Z M 9 72.03125 "
                              clipRule="nonzero"
                            />
                          </clipPath>
                        </defs>
                        <g clipPath="url(#2d9d09e812)">
                          <path
                            fill="currentColor"
                            d="M 360.371094 169.820312 C 342.980469 140.589844 318.117188 116.089844 288.46875 98.980469 C 257.925781 81.347656 222.972656 72.03125 187.402344 72.03125 C 151.824219 72.03125 116.875 81.347656 86.335938 98.980469 C 56.679688 116.089844 31.816406 140.589844 14.425781 169.820312 C 7.933594 180.742188 7.933594 194.320312 14.433594 205.253906 C 31.820312 234.480469 56.691406 258.972656 86.339844 276.085938 C 116.878906 293.710938 151.824219 303.023438 187.402344 303.023438 C 222.964844 303.023438 257.917969 293.710938 288.457031 276.085938 C 318.109375 258.972656 342.976562 234.480469 360.363281 205.25 C 366.863281 194.316406 366.867188 180.742188 360.371094 169.820312 Z M 187.390625 276.234375 C 138.445312 276.234375 98.753906 236.519531 98.753906 187.53125 C 98.753906 138.539062 138.445312 98.824219 187.390625 98.824219 C 236.355469 98.824219 276.042969 138.539062 276.042969 187.53125 C 276.042969 236.519531 236.355469 276.234375 187.390625 276.234375 Z M 187.390625 276.234375 "
                            fillOpacity="1"
                            fillRule="nonzero"
                          />
                        </g>
                        <path
                          fill="currentColor"
                          d="M 187.390625 136.535156 C 159.253906 136.535156 136.4375 159.367188 136.4375 187.53125 C 136.4375 215.691406 159.253906 238.523438 187.390625 238.523438 C 215.539062 238.523438 238.355469 215.691406 238.355469 187.53125 C 238.355469 159.367188 215.539062 136.535156 187.390625 136.535156 Z M 187.390625 136.535156 "
                          fillOpacity="1"
                          fillRule="nonzero"
                        />
                        <path
                          strokeLinecap="round"
                          transform="matrix(0.53033, -0.53033, 0.53033, 0.53033, 36.749698, 265.239182)"
                          fill="none"
                          strokeLinejoin="miter"
                          d="M 25.000306 24.998608 L 391.237447 24.998608 "
                          stroke="#fff"
                          strokeWidth="50"
                          strokeOpacity="1"
                          strokeMiterlimit="4"
                        />
                        <path
                          strokeLinecap="round"
                          transform="matrix(0.53033, -0.53033, 0.53033, 0.53033, 30.488597, 323.491736)"
                          fill="none"
                          strokeLinejoin="miter"
                          d="M 24.998448 24.999301 L 528.907815 24.999301 "
                          stroke="currentColor"
                          strokeWidth="50"
                          strokeOpacity="1"
                          strokeMiterlimit="4"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 375 374.999991"
                        preserveAspectRatio="xMidYMid meet"
                        version="1.0"
                      >
                        <defs>
                          <clipPath id="ccfbe853e7">
                            <path
                              d="M 9 72.03125 L 366 72.03125 L 366 303.03125 L 9 303.03125 Z M 9 72.03125 "
                              clipRule="nonzero"
                            />
                          </clipPath>
                        </defs>
                        <g clipPath="url(#ccfbe853e7)">
                          <path
                            fill="currentColor"
                            d="M 360.371094 169.820312 C 342.980469 140.589844 318.117188 116.089844 288.46875 98.980469 C 257.925781 81.347656 222.972656 72.03125 187.402344 72.03125 C 151.824219 72.03125 116.875 81.347656 86.335938 98.980469 C 56.679688 116.089844 31.816406 140.589844 14.425781 169.820312 C 7.933594 180.742188 7.933594 194.320312 14.433594 205.253906 C 31.820312 234.480469 56.691406 258.972656 86.339844 276.085938 C 116.878906 293.710938 151.824219 303.027344 187.402344 303.027344 C 222.964844 303.027344 257.917969 293.710938 288.457031 276.085938 C 318.109375 258.972656 342.976562 234.480469 360.363281 205.25 C 366.863281 194.316406 366.867188 180.742188 360.371094 169.820312 Z M 187.390625 276.234375 C 138.445312 276.234375 98.753906 236.519531 98.753906 187.53125 C 98.753906 138.539062 138.445312 98.824219 187.390625 98.824219 C 236.355469 98.824219 276.042969 138.539062 276.042969 187.53125 C 276.042969 236.519531 236.355469 276.234375 187.390625 276.234375 Z M 187.390625 276.234375 "
                            fillOpacity="1"
                            fillRule="nonzero"
                          />
                        </g>
                        <path
                          fill="currentColor"
                          d="M 187.390625 136.535156 C 159.253906 136.535156 136.4375 159.367188 136.4375 187.53125 C 136.4375 215.691406 159.253906 238.523438 187.390625 238.523438 C 215.539062 238.523438 238.355469 215.691406 238.355469 187.53125 C 238.355469 159.367188 215.539062 136.535156 187.390625 136.535156 Z M 187.390625 136.535156 "
                          fillOpacity="1"
                          fillRule="nonzero"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                {!passwordsMatch && formData.confirmPassword && (
                  <p className="error-text">Passwords do not match</p>
                )}
              </div>
            )}

            <div className="login checkbox-container">
              {isLogin ? (
                <div className="login-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />{" "}
                    Remember me
                  </label>

                  <a
                    href="#"
                    className="forgot-password"
                    onClick={(e) => {
                      e.preventDefault();
                      handleForgotPassword();
                    }}
                  >
                    Forgot Password?
                  </a>
                </div>
              ) : (
                <label className="checkbox-label">
                  <input type="checkbox" required /> I agree to the{" "}
                  <a href="/info#terms" className="terms-link">
                    Terms
                  </a>
                  and{" "}
                  <a href="/info#privacy-policy" className="terms-link">
                    Privacy Policy
                  </a>
                </label>
              )}
            </div>

            <button
              type="submit"
              className="login create-btn"
              disabled={!passwordsMatch}
            >
              {isLogin ? "Log In" : "Create Account"}
            </button>
          </form>

          <p className="or-signin">
            {isLogin ? "or Sign in with" : "or Sign up with"}
          </p>
          <button className="google-btn" onClick={handleGoogleSignIn}>
            <img src="/assets/google-icon.png" alt="Google" />
            <span>Google</span>
          </button>
        </div>
      </div>

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
              {isLogin ? "Logging you in..." : "Creating your account..."}
            </p>
          </div>
        </div>
      )}

      {showInvalidPasswordOverlay && (
        <div className="admin-booking-confirm-overlay">
          <div className="admin-booking-confirm-container">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowInvalidPasswordOverlay(false)}
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
            <h3 className="confirm-header">
              {conflictMode === "email-already-in-use"
                ? "ACCOUNT ALREADY EXISTS"
                : conflictMode === "google-to-password"
                  ? "GOOGLE ACCOUNT ALREADY LINKED"
                  : "INVALID CREDENTIALS"}
            </h3>

            <div className="confirm-message-block">
              <p className="confirm-message-main">{invalidPasswordMessage}</p>

              {conflictMode === "email-already-in-use" ? (
                // Existing email -> google branch
                <div className="confirm-message-help">
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 8,
                      justifyContent: "center",
                      alignItems: "stretch",
                    }}
                  >
                    <button
                      className="confirm-details-btn"
                      style={{ backgroundColor: "#28a745" }}
                      onClick={handleLinkExistingAccount}
                    >
                      Link <br /> Email / Password
                    </button>
                    <button
                      className="confirm-details-btn"
                      style={{ backgroundColor: "#dc3545" }}
                      onClick={handleGoogleLoginConflict}
                    >
                      Login with Google
                    </button>
                  </div>
                </div>
              ) : conflictMode === "google-to-password" ? (
                // New google -> email branch
                <div className="confirm-message-help">
                  <p>
                    This Google account <strong>({conflictEmail})</strong>{" "}
                    already has an Email/Password login. To continue, enter your
                    password and link Google to it.
                  </p>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      className="confirm-details-btn"
                      style={{ backgroundColor: "#28a745" }}
                      onClick={handleLinkGoogleToPassword}
                    >
                      Link Google to Email/Password
                    </button>
                    <button
                      className="confirm-details-btn"
                      style={{ backgroundColor: "#dc3545" }}
                      onClick={handleCancelConflict}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Fallback (invalid credentials)
                <div className="confirm-message-help">
                  <p className="help-text">Need help signing in?</p>
                  <ul className="contact-list">
                    <li>
                      <a href="tel:+639123456789" className="contact-link">
                        +63 912 345 6789
                      </a>
                    </li>
                    <li>
                      <a
                        href="mailto:rentalinquiries.emnl@gmail.com"
                        className="contact-link"
                      >
                        rentalinquiries.emnl@gmail.com
                      </a>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="admin-confirm-details"></div>
          </div>
        </div>
      )}

      {showForgotPasswordOverlay && (
        <div className="admin-booking-confirm-overlay">
          <div className="admin-booking-confirm-container">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowForgotPasswordOverlay(false)}
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
            <h3 className="confirm-header">Password Reset</h3>

            <div className="confirm-message-block">
              <p className="confirm-message-main">{forgotPasswordMessage}</p>
              <div className="confirm-message-help">
                <p className="help-text">Still need assistance?</p>
                <ul className="contact-list">
                  <li>
                    <a href="tel:+639123456789" className="contact-link">
                      +63 912 345 6789
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:rentalinquiries.emnl@gmail.com"
                      className="contact-link"
                    >
                      rentalinquiries.emnl@gmail.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="admin-confirm-details"></div>
          </div>
        </div>
      )}

      {showRememberExpiryOverlay && (
        <div className="admin-booking-confirm-overlay">
          <div className="admin-booking-confirm-container">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowRememberExpiryOverlay(false)}
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
            <h3 className="confirm-header">Session Expired</h3>

            <div className="confirm-message-block">
              <p className="confirm-message-main">{rememberExpiryMessage}</p>
              <div className="confirm-message-help">
                <p className="help-text">Still need assistance?</p>
                <ul className="contact-list">
                  <li>
                    <a href="tel:+639123456789" className="contact-link">
                      +63 912 345 6789
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:rentalinquiries.emnl@gmail.com"
                      className="contact-link"
                    >
                      rentalinquiries.emnl@gmail.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="admin-confirm-details"></div>
          </div>
        </div>
      )}

      {showBlockedUserOverlay && (
        <div className="admin-booking-confirm-overlay">
          <div className="admin-booking-confirm-container">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowBlockedUserOverlay(false)}
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

            <h3 className="confirm-header" style={{ color: "#dc3545" }}>
              🚫 ACCOUNT BLOCKED 🚫
            </h3>
            <p className="confirm-text">
              Your account has been blocked and you can no longer access the
              booking system.
            </p>

            <div className="blocked-reason-section">
              <h4 style={{ marginBottom: "0px" }}>Reason for Blocking:</h4>
              <p
                style={{
                  color: "#dc3545",
                  fontWeight: "bold",
                  backgroundColor: "#f8d7da",
                  padding: "10px",
                  borderRadius: "5px",
                  margin: "10px 0",
                }}
              >
                {blockedUserReason}
              </p>
            </div>

            <div className="admin-contact-section">
              <h4 style={{ marginBottom: "0px" }}>Contact Admin:</h4>
              <p style={{ marginTop: "10px" }}>
                If you believe this blocking was made in error, please contact
                the administrator:
              </p>
              <div className="contact-info">
                <p>
                  <strong>Name:</strong> {adminContactInfo.name}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  <a href={`mailto:${adminContactInfo.email}`}>
                    {adminContactInfo.email}
                  </a>
                </p>
                <p>
                  <strong>Phone:</strong>{" "}
                  <a href={`tel:${adminContactInfo.contact}`}>
                    {adminContactInfo.contact}
                  </a>
                </p>
              </div>
            </div>

            <div className="blocked-actions">
              <button
                className="confirm-cancel-btn"
                style={{ width: "250px" }}
                onClick={() => {
                  setShowBlockedUserOverlay(false);
                  // Allow user to try logging in with different account
                }}
              >
                Login with Different Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
