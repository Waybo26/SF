"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { LoginModal } from "@/components/login-modal";
import { useRouter } from "next/navigation";

export function NavAuth() {
  const { user, isLoggedIn, isLoading, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const router = useRouter();

  if (isLoading) {
    return (
      <span style={{ fontSize: "13px", color: "#999", marginLeft: "auto" }}>
        ...
      </span>
    );
  }

  if (isLoggedIn && user) {
    return (
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "13px", color: "#555" }}>
          {user.name}{" "}
          <span
            style={{
              fontSize: "11px",
              background: user.role === "TEACHER" ? "#dbeafe" : "#dcfce7",
              color: user.role === "TEACHER" ? "#1e40af" : "#166534",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            {user.role}
          </span>
        </span>
        <button
          onClick={async () => {
            await logout();
            router.push("/");
          }}
          style={{
            padding: "4px 12px",
            fontSize: "13px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            background: "white",
            cursor: "pointer",
            color: "#555",
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowLogin(true)}
        style={{
          marginLeft: "auto",
          padding: "4px 12px",
          fontSize: "13px",
          border: "1px solid #ddd",
          borderRadius: "4px",
          background: "white",
          cursor: "pointer",
          color: "#555",
        }}
      >
        Login
      </button>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
