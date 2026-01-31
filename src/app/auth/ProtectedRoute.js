"use client";
//ProtectedRoute.js
import { useRouter } from "next/navigation";
import { useUser } from "../lib/UserContext";
import { useEffect } from "react";

const ProtectedRoute = ({ children, onlyAdmin = false, onlyUser = false }) => {
  const { user, authLoading, isUpdatingUser, lastKnownUser } = useUser();
  const router = useRouter();

  const effectiveUser = user || (isUpdatingUser ? lastKnownUser : null);

  useEffect(() => {
    if (authLoading) return;

    if (!effectiveUser) {
      router.push("/auth/login");
      return;
    }

    if (onlyUser && effectiveUser.role !== "user") {
      router.push("/admin");
      return;
    }

    if (onlyAdmin && effectiveUser.role !== "admin") {
      router.push("/");
      return;
    }
  }, [authLoading, effectiveUser, router, onlyAdmin, onlyUser]);

  if (authLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div
          className="spinner"
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid #ccc",
            borderTop: "4px solid #28a745",
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
    );
  }

  if (!effectiveUser) return null;

  if (onlyUser && effectiveUser.role !== "user") return null;

  if (onlyAdmin && effectiveUser.role !== "admin") return null;

  return children;
};

export default ProtectedRoute;
