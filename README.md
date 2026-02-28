# SF Editor

Educational writing platform with keystroke logging and AI detection. Students write essays in a rich-text editor while every action is recorded into a custom `.sf` file format. Teachers can replay the entire writing session to verify authenticity.

## Prerequisites

- **Node.js** 18+ (check with `node -v`)
- **npm** (comes with Node.js)

## First-Time Setup

After cloning the repository, run these commands in order:

```bash
# 1. Install dependencies
npm install

# 2. Create your local environment file
cp .env.example .env
# (Or create .env manually with: DATABASE_URL="file:./dev.db")

# 3. Run database migrations (creates the SQLite database)
npx prisma migrate dev

# 4. Generate the Prisma client
npx prisma generate

# 5. Start the dev server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) and click **"Seed Database"** on the home page to populate test data.

## After Pulling New Changes

If someone has pushed schema changes, you may need to re-run migrations:

```bash
# Re-run migrations to apply any new schema changes
npx prisma migrate dev

# Regenerate the Prisma client
npx prisma generate

# Start the dev server
npm run dev
```

Then go to [http://localhost:3000](http://localhost:3000) and click **"Seed Database"** to reset and repopulate test data.

## Seeding the Database

The seed button on the home page (or `POST /api/seed`) performs a **full reset**:
1. Deletes all existing data (submissions, assignments, classes, users)
2. Creates fresh test data: 3 teachers, 10 students, 4 classes, 6 assignments

**Important:** Seeding wipes all submissions. Only seed when you want a clean slate.

## Application Routes

| Route | Role | Description |
|-------|------|-------------|
| `/` | All | Home page with seed button |
| `/editor` | Student | Select a student and assignment, then write with keystroke logging |
| `/teacher` | Teacher | Dashboard: select teacher, browse classes, assignments, and student submissions |
| `/viewer` | Any | Standalone .sf file upload viewer (for reviewing files outside the database) |

### Teacher Dashboard Flow

1. **`/teacher`** -- Select your teacher identity, see your classes
2. **`/teacher/class/[classId]`** -- See all assignments for a class with submission stats
3. **`/teacher/class/[classId]/assignment/[assignmentId]`** -- See all students and their submission status, word count, paste count, etc.
4. **`/teacher/class/[classId]/assignment/.../student/[studentId]`** -- Full .sf playback viewer for a student's submission

## Test Data

After seeding, the following test data is created:

**Teachers:**
- Ms. Johnson (English 101, AP Literature)
- Mr. Garcia (World History)
- Dr. Patel (Biology 101)

**Students:** Alex Smith, Jordan Lee, Samira Khan, Marcus Brown, Emily Chen, David Wilson, Olivia Martinez, Liam O'Brien, Aisha Patel, Noah Kim

**Classes & Assignments:**
- English 101 (6 students, 2 assignments)
- AP Literature (4 students, 1 assignment)
- World History (6 students, 2 assignments)
- Biology 101 (5 students, 1 assignment)

## Database

The app uses **SQLite** via Prisma for local development. The database file (`prisma/dev.db`) is git-ignored -- each developer has their own local copy.

**Note:** The `.env` file is also git-ignored. Each developer needs to create their own (see setup instructions above).

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **Prisma 7** with SQLite
- **TipTap 3** (ProseMirror-based rich text editor)
- **TypeScript 5**
