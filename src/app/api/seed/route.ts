import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/seed - Create test data for the MVP
export async function POST() {
  // Create a teacher
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@test.com" },
    update: {},
    create: {
      name: "Ms. Johnson",
      email: "teacher@test.com",
      role: "TEACHER",
    },
  });

  // Create a student
  const student = await prisma.user.upsert({
    where: { email: "student@test.com" },
    update: {},
    create: {
      name: "Alex Smith",
      email: "student@test.com",
      role: "STUDENT",
    },
  });

  // Create a second student
  const student2 = await prisma.user.upsert({
    where: { email: "student2@test.com" },
    update: {},
    create: {
      name: "Jordan Lee",
      email: "student2@test.com",
      role: "STUDENT",
    },
  });

  // Create an assignment
  const assignment = await prisma.assignment.upsert({
    where: { id: "test-assignment-1" },
    update: {},
    create: {
      id: "test-assignment-1",
      title: "Essay: The Impact of Technology on Education",
      description:
        "Write a 500-word essay discussing how technology has changed education in the 21st century. Consider both positive and negative impacts. Use specific examples to support your arguments.",
      createdById: teacher.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    },
  });

  // Assign both students
  await prisma.assignmentStudent.upsert({
    where: {
      assignmentId_studentId: {
        assignmentId: assignment.id,
        studentId: student.id,
      },
    },
    update: {},
    create: {
      assignmentId: assignment.id,
      studentId: student.id,
    },
  });

  await prisma.assignmentStudent.upsert({
    where: {
      assignmentId_studentId: {
        assignmentId: assignment.id,
        studentId: student2.id,
      },
    },
    update: {},
    create: {
      assignmentId: assignment.id,
      studentId: student2.id,
    },
  });

  return NextResponse.json({
    message: "Seed data created",
    teacher,
    students: [student, student2],
    assignment,
  });
}
