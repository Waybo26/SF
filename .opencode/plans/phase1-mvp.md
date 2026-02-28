# SF Platform - Phase 1 MVP Plan

## Overview
Educational writing platform that logs all student actions in a custom `.sf` file format, enabling teachers to play back the writing process and detect potential AI usage.

## Tech Stack
- **Framework**: Next.js 16 + TypeScript (App Router)
- **Database**: SQLite via Prisma ORM
- **Rich Text Editor**: Tiptap (ProseMirror-based)
- **AI Detection**: Gemini API (Phase 2)
- **Auth**: NextAuth.js (Phase 2, stubbed for now)
- **Styling**: Tailwind CSS (minimal, function-first)

## Database Schema (4 Tables)

### User
| Column    | Type     | Notes                    |
|-----------|----------|--------------------------|
| id        | String   | Primary key (cuid)       |
| name      | String   |                          |
| email     | String   | Unique                   |
| role      | Enum     | TEACHER / STUDENT        |
| createdAt | DateTime | Default: now()           |

### Assignment
| Column      | Type     | Notes                  |
|-------------|----------|------------------------|
| id          | String   | Primary key (cuid)     |
| title       | String   |                        |
| description | String   |                        |
| createdById | String   | FK -> User (teacher)   |
| dueDate     | DateTime | Optional               |
| createdAt   | DateTime | Default: now()         |

### AssignmentStudent (Join Table)
| Column       | Type     | Notes                |
|--------------|----------|----------------------|
| assignmentId | String   | FK -> Assignment     |
| studentId    | String   | FK -> User (student) |
| assignedAt   | DateTime | Default: now()       |

Composite primary key: (assignmentId, studentId)

### Submission
| Column         | Type     | Notes                                  |
|----------------|----------|----------------------------------------|
| id             | String   | Primary key (cuid)                     |
| assignmentId   | String   | FK -> Assignment                       |
| studentId      | String   | FK -> User (student)                   |
| sfFile         | String   | Full .sf JSON content (TEXT blob)      |
| status         | Enum     | NOT_STARTED / IN_PROGRESS / SUBMITTED / GRADED |
| totalTimeSpent | Int      | Seconds, computed on submit            |
| wordCount      | Int      | Computed on submit                     |
| eventCount     | Int      | Total events logged                    |
| pasteCount     | Int      | Number of paste events                 |
| tabAwayCount   | Int      | Number of tab-away events              |
| snapshotCount  | Int      | Number of snapshots saved              |
| createdAt      | DateTime | Default: now()                         |
| submittedAt    | DateTime | Nullable, set on submit                |

Unique constraint: (assignmentId, studentId)

## .sf File Format

```json
{
  "version": "1.0",
  "metadata": {
    "studentId": "string",
    "assignmentId": "string",
    "createdAt": "ISO-timestamp",
    "submittedAt": "ISO-timestamp | null"
  },
  "snapshots": [
    {
      "id": "string",
      "label": "string (e.g. 'First Draft')",
      "timestamp": 1234567890,
      "content": "<html content at this point>"
    }
  ],
  "events": [
    { "type": "keystroke", "key": "a", "position": 42, "timestamp": 1234567890 },
    { "type": "backspace", "position": 42, "deletedContent": "x", "timestamp": 1234567891 },
    { "type": "delete", "position": 42, "deletedContent": "y", "timestamp": 1234567892 },
    { "type": "paste", "content": "pasted text", "position": 10, "length": 11, "timestamp": 1234567893 },
    { "type": "cut", "content": "cut text", "from": 10, "to": 18, "timestamp": 1234567894 },
    { "type": "selection", "from": 10, "to": 25, "timestamp": 1234567895 },
    { "type": "formatting", "mark": "bold", "from": 10, "to": 20, "timestamp": 1234567896 },
    { "type": "tab_away", "timestamp": 1234567897 },
    { "type": "tab_return", "timestamp": 1234567903, "awayDuration": 6000 },
    { "type": "snapshot", "snapshotId": "draft-1", "timestamp": 1234567910 }
  ]
}
```

Events are ordered chronologically. Timestamps are Unix milliseconds.

## File Structure

```
SF/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Landing page
│   │   ├── editor/
│   │   │   └── page.tsx                # Student editor page
│   │   ├── viewer/
│   │   │   └── page.tsx                # Teacher viewer page (file upload + playback)
│   │   └── api/
│   │       └── submissions/
│   │           ├── route.ts            # GET list, POST create
│   │           └── [id]/
│   │               └── route.ts        # GET one, PUT update (auto-save)
│   ├── components/
│   │   ├── sf-editor.tsx               # Tiptap editor with logging
│   │   ├── sf-viewer.tsx               # .sf playback viewer
│   │   ├── timeline.tsx                # Timeline scrubber component
│   │   └── event-log.tsx               # Event log panel
│   ├── lib/
│   │   ├── sf-types.ts                 # TypeScript types for .sf format
│   │   ├── sf-logger.ts                # SFLogger class - records events
│   │   ├── sf-parser.ts                # Parse .sf JSON, validate
│   │   ├── sf-playback.ts             # Playback engine - reconstruct doc state from events
│   │   └── prisma.ts                   # Prisma client singleton
│   └── extensions/
│       ├── keystroke-logger.ts         # Tiptap extension: keystrokes + backspace/delete
│       ├── paste-logger.ts             # Tiptap extension: paste + cut
│       └── selection-logger.ts         # Tiptap extension: selection + formatting
├── package.json
├── tsconfig.json
├── next.config.ts
└── prisma/schema.prisma
```

## Implementation Steps

### Step 1: Project Setup
- Fix package.json name from "sf-temp" to "sf-editor"
- Install dependencies:
  - `@tiptap/react @tiptap/starter-kit @tiptap/pm @tiptap/extension-placeholder`
  - `prisma @prisma/client`
  - `uuid` (for generating IDs)
- Initialize Prisma with SQLite
- Create schema.prisma with all 4 tables
- Run `prisma migrate dev`

### Step 2: .sf Type Definitions (src/lib/sf-types.ts)
- Define TypeScript interfaces for all event types (discriminated union)
- Define SFFile interface (metadata, snapshots, events)
- Define SFSnapshot interface
- Export all types

### Step 3: SFLogger Class (src/lib/sf-logger.ts)
- Constructor: takes studentId, assignmentId
- Methods:
  - `logKeystroke(key, position)` - record a keystroke event
  - `logBackspace(position, deletedContent)` - record backspace
  - `logDelete(position, deletedContent)` - record delete
  - `logPaste(content, position)` - record paste
  - `logCut(content, from, to)` - record cut
  - `logSelection(from, to)` - record text selection
  - `logFormatting(mark, from, to)` - record formatting change
  - `logTabAway()` - record tab switch away
  - `logTabReturn()` - record tab return (auto-calculates away duration)
  - `createSnapshot(label, htmlContent)` - save a named snapshot
  - `serialize()` - return the full .sf JSON string
  - `getStats()` - return summary stats (eventCount, pasteCount, etc.)
- Internal: maintains events array, snapshots array, metadata
- All events get a `timestamp: Date.now()` automatically

### Step 4: .sf Parser + Playback Engine
**sf-parser.ts:**
- `parseSFFile(json: string): SFFile` - parse and validate .sf content
- Validation: check version, required fields, event types

**sf-playback.ts:**
- `SFPlaybackEngine` class:
  - Constructor: takes parsed SFFile
  - `getStateAtTime(timestamp: number)`: replay events up to timestamp, return reconstructed HTML
  - `getEventsInRange(start, end)`: get events in a time window
  - `getTimelineMarkers()`: return key events for timeline display (pastes, tab switches, snapshots)
  - `getTotalDuration()`: first event to last event time span
  - Uses snapshots as checkpoints for faster reconstruction

### Step 5: Tiptap Extensions
**keystroke-logger.ts:**
- Extends Tiptap Extension
- Hooks into keyboard events (onKeyDown)
- Detects regular keystrokes, backspace, delete
- Calls SFLogger methods

**paste-logger.ts:**
- Hooks into Tiptap paste handler (handlePaste)
- Captures pasted content (plain text)
- Also hooks into cut handler
- Calls SFLogger methods

**selection-logger.ts:**
- Hooks into Tiptap selection update (onSelectionUpdate)
- Debounced to avoid logging every cursor movement
- Only logs meaningful selections (from != to)
- Also detects formatting changes via transaction steps

### Step 6: SF Editor Component (src/components/sf-editor.tsx)
- Initializes Tiptap editor with StarterKit + custom extensions
- Initializes SFLogger
- Integrates Page Visibility API for tab detection
- Toolbar: Bold, Italic, Headings, Lists
- "Save Snapshot" button with label input
- "Submit" button
- Auto-save every 30 seconds (calls API to update submission)
- Status bar: word count, event count, time elapsed

### Step 7: SF Viewer Component (src/components/sf-viewer.tsx)
- Accepts .sf file content (from upload or API)
- Initializes SFPlaybackEngine
- Renders:
  - Document preview (HTML content at current timestamp)
  - Timeline scrubber (range slider from start to end)
  - Play/pause/speed controls
  - Event markers on timeline (color-coded: paste=red, tab_away=orange, snapshot=blue)
  - Event log panel (scrollable list of events near current time)
  - Stats summary panel (total time, word count, paste count, tab switches)
- Snapshot navigation (buttons to jump to each snapshot)

### Step 8: API Routes
**POST /api/submissions** - Create new submission (when student starts writing)
**GET /api/submissions/[id]** - Get submission with .sf content
**PUT /api/submissions/[id]** - Update .sf content (auto-save)
**GET /api/submissions?assignmentId=X** - List submissions for an assignment

### Step 9: Pages
**/ (landing):** Links to /editor and /viewer
**/editor:** Renders SF Editor, saves to API
**/viewer:** File upload area OR loads from API, renders SF Viewer

### Step 10: Integration Testing
- Create a submission, type in editor, verify events are logged
- Save snapshot, verify it appears in .sf
- Submit, verify stats are computed
- Upload .sf in viewer, verify playback works
- Test tab detection, paste detection

## Key Technical Notes

1. **Event batching**: Consecutive same-character keystrokes can be batched (e.g., "hello" = 1 event with key="hello") to reduce .sf file size. Implement this optimization if file sizes become problematic.

2. **Playback reconstruction**: The playback engine applies events sequentially to rebuild document state. Snapshots serve as checkpoints - to get state at time T, find the nearest snapshot before T, then replay events from that snapshot to T.

3. **Tab detection limitations**: Page Visibility API detects full tab switches and window minimization. It does NOT detect split-screen, second monitors, or phone usage. Be transparent about this with educators.

4. **Auto-save strategy**: Save .sf to server every 30s AND to localStorage continuously. On page reload, recover from localStorage if server save failed. This prevents data loss from browser crashes.

5. **For MVP**: Auth is stubbed - the editor page will have a simple user selector dropdown to pick a student identity. The viewer page will accept .sf file upload directly (no need to log in as teacher).
