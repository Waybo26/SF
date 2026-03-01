import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

// POST /api/auth/logout
export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
