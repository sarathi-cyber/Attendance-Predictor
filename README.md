# The Attendance Predictor — Frontend

A Next.js App Router + TypeScript + Tailwind CSS frontend for an attendance-planning dashboard.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Structure

- `app/page.tsx` — dashboard composition and local demo state.
- `components/` — reusable UI components.
- `lib/attendance.ts` — attendance calculations; no UI dependencies.
- `types/attendance.ts` — shared TypeScript contracts.
- `data/sections.ts` — the 10 selectable sections.
- `data/mock.ts` — development-only subject/timetable examples.

## Calculation-engine contract

`Subject` requires:

```ts
interface Subject {
  id: string;
  name: string;
  attended: number;
  conducted: number;
  currentPercentage?: number;
}
```

Use `getAttendanceResult(subject)` for subject-level percentage, state, and classes needed to reach 75%/90%.

Use `getDashboardSummary(subjects, remainingClasses)` for combined dashboard totals.

`classesNeeded(attended, conducted, target)` solves the minimum number of consecutive attended future classes needed to reach a target percentage.

## Timetable-module contract

```ts
interface TimetableEntry {
  id: string;
  sectionId: string;
  subject: string;
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  room?: string;
  faculty?: string;
}
```

The `Timetable` component accepts `entries` and `sectionName`. It does not create or infer real schedules. Replace `mockTimetable` with data from your API/database.

## Attendance states

- **Safe**: 90% or higher
- **Warning**: 75%–89.99%
- **Detention risk**: below 75% with attendance still mathematically recoverable
- **Irreversible detention**: below 75% and the required recovery exceeds the remaining planned classes

The exact detention policy should be configurable because colleges may use different rules around condonation, medical leave, exclusions, or semester-specific requirements.
