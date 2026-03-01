"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/landing/Navbar";

/**
 * Route-aware layout shell.
 *
 * On full-screen editor pages (/student/class/.../write/...) the landing-page
 * Navbar and the pt-16 content padding are hidden so the editor can claim the
 * full viewport height.  On every other route they render normally.
 */
export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Match /student/class/<id>/write/<id> — the essay editor page
  const isEditorPage = /^\/student\/class\/[^/]+\/write\/[^/]+/.test(pathname);

  if (isEditorPage) {
    // Full-screen mode: no navbar, no padding — editor owns the viewport
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <div className="pt-16">{children}</div>
    </>
  );
}
