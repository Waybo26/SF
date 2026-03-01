"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudentClassPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/student");
  }, [router]);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}>
      <p style={{ color: "#666", fontSize: "14px" }}>Redirecting to dashboard...</p>
    </div>
  );
}
