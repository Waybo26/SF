import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/seed - Reset database and create fresh seed data
export async function POST() {
  try {
    // ===== FULL WIPE: Delete all data in dependency order =====
    await prisma.submission.deleteMany();
    await prisma.assignmentStudent.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.classStudent.deleteMany();
    await prisma.class.deleteMany();
    await prisma.user.deleteMany();

    // ===== CREATE TEACHERS =====
    const teachers = await Promise.all([
      prisma.user.create({
        data: {
          name: "Ms. Johnson",
          email: "johnson@school.edu",
          role: "TEACHER",
        },
      }),
      prisma.user.create({
        data: {
          name: "Mr. Garcia",
          email: "garcia@school.edu",
          role: "TEACHER",
        },
      }),
      prisma.user.create({
        data: {
          name: "Dr. Patel",
          email: "patel@school.edu",
          role: "TEACHER",
        },
      }),
    ]);

    const [johnson, garcia, patel] = teachers;

    // ===== CREATE STUDENTS =====
    const students = await Promise.all([
      prisma.user.create({
        data: {
          name: "Alex Smith",
          email: "alex.smith@student.edu",
          role: "STUDENT",
        },
      }),
      prisma.user.create({
        data: {
          name: "Jordan Lee",
          email: "jordan.lee@student.edu",
          role: "STUDENT",
        },
      }),
      prisma.user.create({
        data: {
          name: "Samira Khan",
          email: "samira.khan@student.edu",
          role: "STUDENT",
        },
      }),
      prisma.user.create({
        data: {
          name: "Marcus Brown",
          email: "marcus.brown@student.edu",
          role: "STUDENT",
        },
      }),
      prisma.user.create({
        data: {
          name: "Emily Chen",
          email: "emily.chen@student.edu",
          role: "STUDENT",
        },
      }),
      prisma.user.create({
        data: {
          name: "David Wilson",
          email: "david.wilson@student.edu",
          role: "STUDENT",
        },
      }),
      prisma.user.create({
        data: {
          name: "Olivia Martinez",
          email: "olivia.martinez@student.edu",
          role: "STUDENT",
        },
      }),
      prisma.user.create({
        data: {
          name: "Liam O'Brien",
          email: "liam.obrien@student.edu",
          role: "STUDENT",
        },
      }),
      prisma.user.create({
        data: {
          name: "Aisha Patel",
          email: "aisha.patel@student.edu",
          role: "STUDENT",
        },
      }),
      prisma.user.create({
        data: {
          name: "Noah Kim",
          email: "noah.kim@student.edu",
          role: "STUDENT",
        },
      }),
    ]);

    const [alex, jordan, samira, marcus, emily, david, olivia, liam, aisha, noah] = students;

    // ===== CREATE CLASSES =====
    const classes = await Promise.all([
      prisma.class.create({
        data: {
          name: "English 101",
          description: "Introduction to English Composition - focusing on essay writing, argumentation, and critical analysis.",
          teacherId: johnson.id,
        },
      }),
      prisma.class.create({
        data: {
          name: "AP Literature",
          description: "Advanced Placement Literature and Composition - literary analysis, close reading, and argumentative writing.",
          teacherId: johnson.id,
        },
      }),
      prisma.class.create({
        data: {
          name: "World History",
          description: "Survey of world history from ancient civilizations to the modern era. Emphasis on analytical writing.",
          teacherId: garcia.id,
        },
      }),
      prisma.class.create({
        data: {
          name: "Biology 101",
          description: "Introduction to Biology - lab reports, research summaries, and scientific writing.",
          teacherId: patel.id,
        },
      }),
    ]);

    const [english101, apLit, worldHistory, biology101] = classes;

    // ===== ENROLL STUDENTS IN CLASSES =====
    // English 101: Alex, Jordan, Samira, Marcus, Emily, David
    // AP Literature: Emily, Olivia, Liam, Aisha
    // World History: Alex, Jordan, Marcus, David, Noah, Olivia
    // Biology 101: Samira, Emily, Liam, Aisha, Noah

    const enrollments = [
      // English 101
      { classId: english101.id, studentId: alex.id },
      { classId: english101.id, studentId: jordan.id },
      { classId: english101.id, studentId: samira.id },
      { classId: english101.id, studentId: marcus.id },
      { classId: english101.id, studentId: emily.id },
      { classId: english101.id, studentId: david.id },
      // AP Literature
      { classId: apLit.id, studentId: emily.id },
      { classId: apLit.id, studentId: olivia.id },
      { classId: apLit.id, studentId: liam.id },
      { classId: apLit.id, studentId: aisha.id },
      // World History
      { classId: worldHistory.id, studentId: alex.id },
      { classId: worldHistory.id, studentId: jordan.id },
      { classId: worldHistory.id, studentId: marcus.id },
      { classId: worldHistory.id, studentId: david.id },
      { classId: worldHistory.id, studentId: noah.id },
      { classId: worldHistory.id, studentId: olivia.id },
      // Biology 101
      { classId: biology101.id, studentId: samira.id },
      { classId: biology101.id, studentId: emily.id },
      { classId: biology101.id, studentId: liam.id },
      { classId: biology101.id, studentId: aisha.id },
      { classId: biology101.id, studentId: noah.id },
    ];

    await Promise.all(
      enrollments.map((e) => prisma.classStudent.create({ data: e }))
    );

    // ===== CREATE ASSIGNMENTS =====
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const twoWeeks = 14 * 24 * 60 * 60 * 1000;

    const assignments = await Promise.all([
      // English 101 assignments
      prisma.assignment.create({
        data: {
          title: "Essay: The Impact of Technology on Education",
          description:
            "Write a 500-word essay discussing how technology has changed education in the 21st century. Consider both positive and negative impacts. Use specific examples to support your arguments.",
          createdById: johnson.id,
          classId: english101.id,
          dueDate: new Date(Date.now() + oneWeek),
        },
      }),
      prisma.assignment.create({
        data: {
          title: "Persuasive Essay: Social Media and Society",
          description:
            "Write a 600-word persuasive essay arguing either for or against the claim that social media has done more harm than good to society. Support your position with evidence and reasoning.",
          createdById: johnson.id,
          classId: english101.id,
          dueDate: new Date(Date.now() + twoWeeks),
        },
      }),
      // AP Literature assignment
      prisma.assignment.create({
        data: {
          title: "Literary Analysis: Themes in The Great Gatsby",
          description:
            "Write a 750-word literary analysis examining one major theme in The Great Gatsby. Use close reading techniques and cite specific passages from the text to support your argument.",
          createdById: johnson.id,
          classId: apLit.id,
          dueDate: new Date(Date.now() + oneWeek),
        },
      }),
      // World History assignments
      prisma.assignment.create({
        data: {
          title: "Research Essay: Causes of World War I",
          description:
            "Write a 700-word research essay analyzing the primary causes of World War I. Consider political alliances, nationalism, imperialism, and the assassination of Archduke Franz Ferdinand.",
          createdById: garcia.id,
          classId: worldHistory.id,
          dueDate: new Date(Date.now() + oneWeek),
        },
      }),
      prisma.assignment.create({
        data: {
          title: "Comparative Essay: Ancient Rome vs. Ancient Greece",
          description:
            "Write a 500-word comparative essay exploring the similarities and differences between Ancient Roman and Ancient Greek civilizations. Focus on government, culture, or military.",
          createdById: garcia.id,
          classId: worldHistory.id,
          dueDate: new Date(Date.now() + twoWeeks),
        },
      }),
      // Biology 101 assignment
      prisma.assignment.create({
        data: {
          title: "Lab Report: Photosynthesis Experiment",
          description:
            "Write a formal lab report (500-600 words) documenting your photosynthesis experiment. Include hypothesis, methodology, results, and conclusion sections following scientific writing conventions.",
          createdById: patel.id,
          classId: biology101.id,
          dueDate: new Date(Date.now() + oneWeek),
        },
      }),
    ]);

    // ===== ASSIGN STUDENTS TO ASSIGNMENTS =====
    // Each assignment is assigned to all students enrolled in that class
    const classStudentMap: Record<string, string[]> = {
      [english101.id]: [alex.id, jordan.id, samira.id, marcus.id, emily.id, david.id],
      [apLit.id]: [emily.id, olivia.id, liam.id, aisha.id],
      [worldHistory.id]: [alex.id, jordan.id, marcus.id, david.id, noah.id, olivia.id],
      [biology101.id]: [samira.id, emily.id, liam.id, aisha.id, noah.id],
    };

    const assignmentStudentData: { assignmentId: string; studentId: string }[] = [];
    for (const assignment of assignments) {
      const classId = assignment.classId;
      if (classId && classStudentMap[classId]) {
        for (const studentId of classStudentMap[classId]) {
          assignmentStudentData.push({
            assignmentId: assignment.id,
            studentId,
          });
        }
      }
    }

    await Promise.all(
      assignmentStudentData.map((d) =>
        prisma.assignmentStudent.create({ data: d })
      )
    );

    return NextResponse.json({
      message: "Database reset and seeded successfully",
      summary: {
        teachers: teachers.map((t) => ({ id: t.id, name: t.name })),
        students: students.map((s) => ({ id: s.id, name: s.name })),
        classes: classes.map((c) => ({ id: c.id, name: c.name })),
        assignments: assignments.map((a) => ({ id: a.id, title: a.title })),
        enrollments: enrollments.length,
        assignmentStudents: assignmentStudentData.length,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed database", details: String(error) },
      { status: 500 }
    );
  }
}
