# Backend integration notes

## Routes
- `GET /api/sections` — available section IDs and names; validates the loaded dataset.
- `GET /api/sections/:sectionId/subjects` — subjects for a section.
- `GET /api/sections/:sectionId/timetable?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` — generated class instances, clamped to semester boundaries.
- `POST /api/projections` — body: `{ "sectionId": "SEC_A", "planningDate": "2026-09-28", "subjects": [{ "subjectId": "SUB101", "attendedClasses": 18, "conductedClasses": 24 }] }`.

Projection `remainingClasses` is calculated by the timetable service; attendance threshold math is delegated to the core engine. The current date is obtained in `Asia/Kolkata`.

## Important dataset limitation
`data/timetable.dataset.json` is the supplied generated JSON, not a verified transcription of the supplied timetable PDFs. It contains ten section keys, but eight have empty timetables, and its subject names are generic CS subjects that do not match the PDF section/subject labels. The PDFs cover nine 2026–2027 sections plus one first-year 2024–2025 timetable. Do not treat the current JSON as production timetable truth until the timetable data is reconciled and transcribed.

## Dataset handling
The supplied `data/timetable.dataset.json` is used exactly as provided. No section, subject, calendar date, or timetable slot has been inferred or rewritten. Sections with empty timetable arrays remain available and return an empty schedule; projections for those sections use zero remaining scheduled classes.

## Section routes
- `GET /api/sections/:sectionId/subjects` — subjects defined for the selected section.
- `GET /api/sections/:sectionId/timetable?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` — schedule entries generated from the supplied dataset.

## Phase 2 — Visuals, leave simulation, Attendance Advisor

- Added a weighted overall-attendance donut chart alongside the subject-wise attendance bar chart.
- Added an OD / Medical Leave simulator. It counts timetable entries during the selected calendar-day window and previews the resulting subject and combined percentages. The student can choose whether the institution credits the leave as attended or counts it as an absence. The simulation is a preview and does not mutate entered attendance.
- Added a floating Attendance Advisor chat. It uses the current dashboard attendance inputs and loaded timetable to answer common attendance, 75%/90%, and leave-impact questions. It is a local rule-based assistant; it does not call an external LLM or send student data to a third party.
- Leave and chatbot projections assume every scheduled timetable entry in the selected window is conducted. Official OD/medical treatment varies by institution and must be confirmed locally.

## Known data limitation
The supplied attendance counts are still editable sample inputs and may not align one-to-one with the supplied timetable subject labels. The simulator and advisor match subject names by exact or substring match where possible. Replace the sample attendance inputs with verified student attendance records before relying on predictions.


## Uploaded timetable PDFs
All ten source class labels and unchanged PDFs are included under `public/timetables/`; the selected class page links to its source. See `TIMETABLE_DATA_STATUS.md`. Structured timetable slots are intentionally not fabricated: scanned PDF grids still require verified transcription before schedule-based predictions can be enabled. I ECE-A is historical (2024–25) and excluded from current-semester predictions.
