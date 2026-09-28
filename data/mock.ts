import { Subject, TimetableEntry } from '@/types/attendance';

export const mockSubjects: Subject[] = [
  { id:'cs1', name:'Data Structures', attended:42, conducted:48 },
  { id:'cs2', name:'Java Programming', attended:39, conducted:45 },
  { id:'cs3', name:'Computer Networks', attended:35, conducted:44 },
  { id:'cs4', name:'Operating Systems', attended:31, conducted:42 },
  { id:'cs5', name:'Mathematics', attended:43, conducted:47 },
];

// Development-only sample. Replace this array with API/database timetable data.
export const mockTimetable: TimetableEntry[] = [
  { id:'m1', sectionId:'section-1', subject:'Data Structures', date:'2026-09-29', startTime:'09:00', endTime:'10:00', room:'TBD', faculty:'TBD' },
  { id:'m2', sectionId:'section-1', subject:'Java Programming', date:'2026-09-29', startTime:'11:15', endTime:'12:15', room:'TBD', faculty:'TBD' },
  { id:'m3', sectionId:'section-1', subject:'Computer Networks', date:'2026-09-30', startTime:'10:00', endTime:'11:00', room:'TBD', faculty:'TBD' },
];
