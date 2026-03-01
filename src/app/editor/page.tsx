"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EditorPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/student");
  }, [router]);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}>
      <p style={{ color: "#666", fontSize: "14px" }}>
        Redirecting to Student Dashboard...
      </p>
      <p style={{ fontSize: "13px", color: "#94a3b8" }}>
        If you are not redirected,{" "}
        <a href="/student" style={{ color: "#1d4ed8" }}>
          click here
        </a>
        .
      </p>
    </div>
  );
}
