"use client";

import { Manrope } from "next/font/google";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { LoginModal } from "@/components/login-modal";

interface AssignmentPreview {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
}

interface ClassSummary {
  id: string;
  name: string;
  description: string;
  teacher: { id: string; name: string };
  studentCount: number;
  assignmentCount: number;
  progress: {
    submitted: number;
    inProgress: number;
    notStarted: number;
    total: number;
  };
  assignments: AssignmentPreview[];
}

interface AssignmentQueueItem extends AssignmentPreview {
  classId: string;
  className: string;
}

type SortOption = "due-asc" | "due-desc" | "title-asc" | "title-desc";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const STATUS_META: Record<
  string,
  { label: string; tone: string; action: "Start" | "Continue" | "View" }
> = {
  NOT_STARTED: {
    label: "Not started",
    tone: "bg-slate-100 text-slate-700",
    action: "Start",
  },
  IN_PROGRESS: {
    label: "In progress",
    tone: "bg-blue-50 text-blue-700",
    action: "Continue",
  },
  SUBMITTED: {
    label: "Submitted",
    tone: "bg-emerald-50 text-emerald-700",
    action: "View",
  },
  GRADED: {
    label: "Graded",
    tone: "bg-violet-50 text-violet-700",
    action: "View",
  },
};

function isCompleted(status: string) {
  return status === "SUBMITTED" || status === "GRADED";
}

function getStatusMeta(status: string) {
  return STATUS_META[status] ?? STATUS_META.NOT_STARTED;
}

function parseDueDate(dueDate: string | null) {
  if (!dueDate) return null;
  const parsed = new Date(dueDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isOverdue(dueDate: string | null) {
  const parsed = parseDueDate(dueDate);
  if (!parsed) return false;
  return parsed.getTime() < Date.now();
}

function isDueSoon(dueDate: string | null) {
  const parsed = parseDueDate(dueDate);
  if (!parsed) return false;
  const diffDays = (parsed.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 3;
}

function formatDueDate(dueDate: string | null) {
  const parsed = parseDueDate(dueDate);
  if (!parsed) return "No due date";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getAssignmentPriority(assignment: AssignmentQueueItem) {
  const completed = isCompleted(assignment.status);

  if (isOverdue(assignment.dueDate) && !completed) return 0;
  if (isDueSoon(assignment.dueDate) && !completed) return 1;
  if (assignment.status === "IN_PROGRESS") return 2;
  if (assignment.status === "NOT_STARTED") return 3;
  return 4;
}

export default function StudentDashboard() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("due-asc");

  useEffect(() => {
    if (!user || user.role !== "STUDENT") return;
    setLoading(true);
    fetch(`/api/classes?studentId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        setClasses(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const assignmentQueue = useMemo<AssignmentQueueItem[]>(() => {
    return classes.flatMap((cls) =>
      cls.assignments.map((assignment) => ({
        ...assignment,
        classId: cls.id,
        className: cls.name,
      }))
    );
  }, [classes]);

  const allAssignments = useMemo(() => {
    return [...assignmentQueue].sort((a, b) => {
      if (sortBy === "title-asc") {
        return a.title.localeCompare(b.title);
      }

      if (sortBy === "title-desc") {
        return b.title.localeCompare(a.title);
      }

      const aDate = parseDueDate(a.dueDate);
      const bDate = parseDueDate(b.dueDate);

      // Keep assignments without due dates at the end for readability.
      if (!aDate && !bDate) {
        return a.title.localeCompare(b.title);
      }
      if (!aDate) return 1;
      if (!bDate) return -1;

      if (sortBy === "due-desc") {
        return bDate.getTime() - aDate.getTime();
      }

      const dueAscDiff = aDate.getTime() - bDate.getTime();
      if (dueAscDiff !== 0) return dueAscDiff;

      const priorityDiff = getAssignmentPriority(a) - getAssignmentPriority(b);
      if (priorityDiff !== 0) return priorityDiff;

      return a.title.localeCompare(b.title);
    });
  }, [assignmentQueue, sortBy]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Student Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Log in as a student to see your assignments and get started.
          </p>
          <button
            onClick={() => setShowLogin(true)}
            className="mt-6 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Login
          </button>
        </div>
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      </div>
    );
  }

  if (user.role !== "STUDENT") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Student Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            You are currently logged in as a teacher.
          </p>
          <Link
            href="/teacher"
            className="mt-6 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Go to Teacher Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`${manrope.className} min-h-[calc(100vh-80px)] bg-[#f1f3f4]`}>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-full bg-[#f1f3f4] px-4 py-2 text-sm text-slate-500">
            Search assignments
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
            <h2 className="text-sm font-medium text-slate-700">Assignments</h2>
            <div className="flex items-center gap-2">
              <label htmlFor="assignment-sort" className="text-[11px] text-slate-500">
                Sort
              </label>
              <select
                id="assignment-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 outline-none transition focus:border-slate-400"
              >
                <option value="due-asc">Due date (earliest first)</option>
                <option value="due-desc">Due date (latest first)</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
              </select>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                {allAssignments.length} total
              </span>
            </div>
          </div>

          {loading ? (
            <div className="px-5 py-8 text-sm text-slate-500">Loading assignments...</div>
          ) : allAssignments.length === 0 ? (
            <div className="px-5 py-10">
              <p className="text-sm text-slate-600">
                No assignments yet. Your teacher will add them here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {allAssignments.map((assignment) => {
                const statusMeta = getStatusMeta(assignment.status);
                const overdue = isOverdue(assignment.dueDate);
                const dueSoon = isDueSoon(assignment.dueDate);
                const completed = isCompleted(assignment.status);
                const urgencyLabel = !assignment.dueDate
                  ? "No due date"
                  : completed
                    ? "Completed"
                    : overdue
                      ? "Overdue"
                      : dueSoon
                        ? "Due soon"
                        : "On track";
                const urgencyTone = !assignment.dueDate
                  ? "bg-slate-100 text-slate-600"
                  : completed
                    ? "bg-slate-100 text-slate-600"
                    : overdue
                      ? "bg-red-50 text-red-700"
                      : dueSoon
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700";

                return (
                  <article
                    key={assignment.id}
                    className="overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                  >
                    <div className="aspect-[4/3] border-b border-slate-200 bg-[#f8f9fa] px-3 py-2.5">
                      <p className="line-clamp-2 text-xs font-medium text-slate-800">
                        {assignment.title}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-slate-500">
                        {assignment.className}
                      </p>
                    </div>

                    <div className="space-y-2 px-3 py-2.5">
                      <p className="text-[11px] text-slate-500">
                        Due {formatDueDate(assignment.dueDate)}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusMeta.tone}`}
                        >
                          {statusMeta.label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${urgencyTone}`}
                        >
                          {urgencyLabel}
                        </span>
                      </div>

                      <Link
                        href={`/student/class/${assignment.classId}/write/${assignment.id}`}
                        className="inline-flex items-center rounded-md bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-slate-800"
                      >
                        {statusMeta.action}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
