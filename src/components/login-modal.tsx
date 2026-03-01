"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setPassword("");
      setError("");
      setSubmitting(false);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError("");

      // Client-side validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("Please enter a valid email.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      setSubmitting(true);

      const result = await login(email.trim(), password);

      if (!result.ok) {
        setError(result.error || "Sign in failed.");
        setSubmitting(false);
        return;
      }

      // Redirect based on the user's actual role from the server
      onClose();
      router.push(result.user?.role === "TEACHER" ? "/teacher" : "/student");
    },
    [email, password, login, onClose, router]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        {/* Card -- stop propagation so clicking inside doesn't close */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: "420px",
            background: "#9D1535",
            border: "1px solid rgb(255, 255, 255)",
            padding: "28px",
            borderRadius: "12px",
            boxShadow: "0 6px 30px rgba(2,6,23,0.6)",
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
            color: "#e6eef7",
          }}
        >
          {/* Heading */}
          <h1
            style={{
              margin: "0 0 6px 0",
              fontSize: "20px",
              letterSpacing: "0.2px",
              color: "#e6eef7",
            }}
          >
            Welcome back
          </h1>
          <p
            style={{
              margin: "0 0 18px 0",
              fontSize: "13px",
              color: "#9aa4b2",
            }}
          >
            Sign in with your school account
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <label
              htmlFor="login-email"
              style={{
                display: "block",
                fontSize: "13px",
                color: "#9aa4b2",
                marginBottom: "6px",
              }}
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgb(255, 255, 255)",
                color: "#e6eef7",
                borderRadius: "8px",
                outline: "none",
                marginBottom: "14px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />

            <label
              htmlFor="login-password"
              style={{
                display: "block",
                fontSize: "13px",
                color: "#9aa4b2",
                marginBottom: "6px",
              }}
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgb(255, 255, 255)",
                color: "#e6eef7",
                borderRadius: "8px",
                outline: "none",
                marginBottom: "14px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />

            {/* Remember me / Forgot password row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#9aa4b2",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <input type="checkbox" />
                Remember me
              </label>
              <span
                style={{
                  color: "#9aa4b2",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Forgot Password?
              </span>
            </div>

            {/* Error message */}
            {error && (
              <div
                aria-live="polite"
                style={{
                  color: "#ef4444",
                  fontSize: "13px",
                  minHeight: "20px",
                  marginBottom: "6px",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                background: "#949594",
                border: "0",
                color: "white",
                fontWeight: 600,
                cursor: submitting ? "default" : "pointer",
                marginTop: "6px",
                fontSize: "14px",
                opacity: submitting ? 0.6 : 1,
                transition:
                  "transform .14s cubic-bezier(.2,.9,.2,1), box-shadow .14s ease, background-color .14s ease, filter .14s ease",
                transformOrigin: "center",
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.transform = "scale(1.04)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.18)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
              onMouseDown={(e) => {
                if (!submitting) {
                  e.currentTarget.style.transform = "scale(0.995)";
                }
              }}
              onMouseUp={(e) => {
                if (!submitting) {
                  e.currentTarget.style.transform = "scale(1.04)";
                }
              }}
            >
              {submitting ? "Signing in\u2026" : "Sign in"}
            </button>
          </form>

          {/* Footer */}
          <div
            style={{
              marginTop: "14px",
              textAlign: "center",
              color: "#9aa4b2",
              fontSize: "13px",
            }}
          >
            <span>New here? </span>
            <span
              style={{
                color: "rgb(255, 255, 255)",
                cursor: "pointer",
                marginLeft: "6px",
              }}
            >
              Create an account
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
