'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, X, RotateCcw, Sparkles } from 'lucide-react';
import { Subject, TimetableEntry } from '@/types/attendance';
import { attendancePercentage, classesNeeded } from '@/lib/attendance';

type Message = { role: 'user' | 'assistant'; text: string };
type Props = { subjects: Subject[]; timetable: TimetableEntry[]; planningDate: string; timetableVerified?: boolean };

const GREETING = 'Hi! I’m your Attendance Advisor. Ask about your current attendance, a subject, the 75%/90% targets, or a leave scenario. Attendance values may be sample inputs; timetable-based estimates are available only for verified schedules.';
const QUICK_QUESTIONS = ['What is my overall attendance?', 'Which subjects are below 75%?', 'How many classes to reach 90%?', 'Can I take leave tomorrow?'];
const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const plusDays = (date: string, days: number) => { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
const pct = (a: number, c: number, digits = 1) => `${attendancePercentage(a, c).toFixed(digits)}%`;

function subjectKey(value: string) {
  // Normalize common singular/plural variations (e.g. "data structure" / "data structures").
  return norm(value).split(' ').map(word => word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word).join(' ');
}

function findSubject(question: string, subjects: Subject[]) {
  const q = ` ${subjectKey(question)} `;
  // Prefer the longest match so a specific subject wins over a shorter overlapping name.
  return [...subjects].sort((a, b) => subjectKey(b.name).length - subjectKey(a.name).length)
    .find(s => {
      const name = subjectKey(s.name);
      return name.length > 0 && q.includes(` ${name} `);
    });
}

function respond(question: string, subjects: Subject[], timetable: TimetableEntry[], planningDate: string, timetableVerified: boolean) {
  const q = norm(question);
  if (!q) return 'Please enter a question, or choose one of the suggested questions.';
  if (!subjects.length) return 'No subject attendance data is loaded yet. Select a class and check that its attendance data is available.';

  const subject = findSubject(question, subjects);
  const asksSchedule = /\b(leave|sick|medical|absent|absence|miss|skip|od|on duty|timetable|schedule|class|classes|period|periods|tomorrow|upcoming|remaining|projection|predict|can i take)\b/.test(q);
  if (!timetableVerified && asksSchedule) {
    return 'I can’t safely estimate schedule or leave impact because this class timetable has not been fully verified. I won’t guess the number of classes. You can still ask about attendance percentages using the dashboard values, which may be sample inputs.';
  }

  const dateMatch = question.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  const tomorrow = /\btomorrow\b/.test(q);
  const daysMatch = q.match(/\b(\d{1,2})\s*(?:day|days)\b/);
  const duration = daysMatch ? Math.min(90, Math.max(1, Number(daysMatch[1]))) : 1;
  const start = dateMatch?.[1] ?? (tomorrow ? plusDays(planningDate, 1) : planningDate);
  const end = plusDays(start, duration - 1);
  const subjectRows = subjects.map(s => ({ ...s, percentage: attendancePercentage(s.attended, s.conducted) }));
  const attended = subjectRows.reduce((n, s) => n + s.attended, 0);
  const conducted = subjectRows.reduce((n, s) => n + s.conducted, 0);

  if (/\b(help|what can you do|examples|capabilities)\b/.test(q)) return 'I can summarize overall attendance, show subjects below 75%, calculate classes needed for 75% or 90%, explain a subject’s current percentage, and estimate leave impact when the timetable is verified. Try a suggested question below.';
  if (/\b(below|under|less than|at risk|shortage|detention|low attendance)\b/.test(q) && /75|attendance|subject|risk|shortage|detention/.test(q)) {
    const low = subjectRows.filter(s => s.percentage < 75);
    return low.length ? `Subjects below 75% (${low.length}): ${low.map(s => `${s.name}: ${pct(s.attended, s.conducted)} (${s.attended}/${s.conducted})`).join('; ')}. These figures come from the dashboard and should be checked against your official record.` : 'No loaded subject is currently below 75%. This is based on dashboard inputs, which may be sample values.';
  }
  if (!subject && (/\b(overall|combined|total)\b/.test(q) || /\b(my attendance|attendance percentage|attendance level)\b/.test(q))) {
    return `Overall attendance is ${pct(attended, conducted, 2)} (${attended} attended out of ${conducted} conducted). ${classesNeeded(attended, conducted, 75) === 0 ? 'You are currently at or above 75% overall.' : `You need to attend ${classesNeeded(attended, conducted, 75)} consecutive classes to reach 75%, assuming no further classes are missed.`} Dashboard values may be sample inputs.`;
  }
  if (subject && /\b(90|ninety|target|reach|need|how many|classes)\b/.test(q)) {
    const need75 = classesNeeded(subject.attended, subject.conducted, 75);
    const need90 = classesNeeded(subject.attended, subject.conducted, 90);
    return `${subject.name}: ${pct(subject.attended, subject.conducted)} (${subject.attended}/${subject.conducted}). To reach 75%, attend ${need75} consecutive classes; to reach 90%, attend ${need90}. This assumes each future class is attended and no additional absences occur.`;
  }
  if (subject) return `${subject.name} is at ${pct(subject.attended, subject.conducted, 2)} (${subject.attended}/${subject.conducted}). ${subject.attended / Math.max(1, subject.conducted) >= 0.9 ? 'That is at least 90%.' : subject.attended / Math.max(1, subject.conducted) >= 0.75 ? 'That is at least 75%, but below 90%.' : 'That is below the 75% threshold.'} To reach 75%, attend ${classesNeeded(subject.attended, subject.conducted, 75)} consecutive classes; to reach 90%, attend ${classesNeeded(subject.attended, subject.conducted, 90)}. Verify the dashboard values against your official record.`;

  if (/\b(leave|sick|medical|absent|absence|miss|skip|od|on duty|tomorrow)\b/.test(q)) {
    const matching = timetable.filter(e => e.date >= start && e.date <= end);
    const future = timetable.filter(e => e.date > end);
    const missed = matching.length;
    const after = attendancePercentage(attended, conducted + missed);
    const recoverable = attendancePercentage(attended + future.length, conducted + missed + future.length);
    return `From ${start} to ${end}, the verified timetable contains ${missed} class session(s) across the selected class. If you miss all of them, the simple combined attendance projection becomes ${after.toFixed(2)}% (${attended}/${conducted + missed}), assuming each scheduled session is counted as conducted. This is not an approval of leave; check your institution’s OD/medical policy. ${recoverable < 75 ? 'With the currently loaded future timetable, 75% would not be reachable even if you attend every remaining listed session.' : 'The current data suggests recovery may be possible by attending future listed sessions.'}`;
  }

  if (/\b(75|seventy five|seventyfive)\b/.test(q)) {
    const need = classesNeeded(attended, conducted, 75);
    return `Your overall dashboard attendance is ${pct(attended, conducted, 2)}. ${need === 0 ? 'You are already at or above 75%.' : `You need ${need} consecutive attended classes to reach 75%, assuming no further absences.`} For subject-wise values, mention the subject name. These figures may be sample inputs.`;
  }
  if (/\b(90|ninety)\b/.test(q)) {
    return subjectRows.map(s => { const need = classesNeeded(s.attended, s.conducted, 90); return `${s.name}: ${pct(s.attended, s.conducted)}; ${need === 0 ? 'already at 90%' : `needs ${need} consecutive attended classes to reach 90%`}.`; }).join(' ');
  }
  return `I can help with overall attendance, a specific subject, 75%/90% targets, or leave impact. I couldn’t confidently identify the intent of that question. Try: “What is my overall attendance?” or “How many classes to reach 90%?”`;
}

export function AttendanceAdvisor({ subjects, timetable, planningDate, timetableVerified = false }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', text: GREETING }]);
  const listRef = useRef<HTMLDivElement>(null);
  const contextKey = useMemo(() => `${subjects.map(s => `${s.id}:${s.attended}/${s.conducted}`).join('|')}:${timetable.length}:${planningDate}:${timetableVerified}`, [subjects, timetable.length, planningDate, timetableVerified]);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, open]);
  useEffect(() => { setMessages([{ role: 'assistant', text: GREETING }]); }, [contextKey]);

  function send(text = draft) {
    const value = text.trim();
    if (!value) return;
    setMessages(prev => [...prev, { role: 'user', text: value }, { role: 'assistant', text: respond(value, subjects, timetable, planningDate, timetableVerified) }]);
    setDraft('');
  }
  function submit(e: FormEvent) { e.preventDefault(); send(); }

  return <>
    <button aria-label={open ? 'Close Attendance Advisor' : 'Open Attendance Advisor'} onClick={() => setOpen(v => !v)} className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-navy px-5 py-4 text-sm font-bold text-white shadow-xl hover:bg-slate-800"><MessageCircle size={19}/><span>Attendance Advisor</span>{open ? <X size={16}/> : <Bot size={17}/>}</button>
    {open && <section className="fixed bottom-24 right-4 z-50 flex h-[min(680px,78vh)] w-[min(440px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" aria-label="Attendance Advisor chat">
      <header className="flex items-center justify-between bg-navy px-4 py-3 text-white"><div className="flex items-center gap-2"><Bot size={20}/><div><p className="font-bold">Attendance Advisor</p><p className="text-xs text-slate-300">Fast, dashboard-aware answers</p></div></div><div className="flex items-center gap-3"><button aria-label="Reset chat" title="Reset chat" onClick={() => setMessages([{ role: 'assistant', text: GREETING }])}><RotateCcw size={16}/></button><button aria-label="Close chat" onClick={() => setOpen(false)}><X size={18}/></button></div></header>
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-3" aria-live="polite">{messages.map((m, i) => <div key={i} className={`max-w-[94%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-5 ${m.role === 'user' ? 'ml-auto bg-navy text-white' : 'bg-slate-100 text-slate-800'}`}>{m.text}</div>)}
        {messages.length <= 1 && <div className="grid gap-2 pt-1">{QUICK_QUESTIONS.map(q => <button key={q} onClick={() => send(q)} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left text-xs text-slate-700 hover:border-slate-400 hover:bg-slate-50"><Sparkles size={13} className="shrink-0"/>{q}</button>)}</div>}
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-slate-200 p-3"><input value={draft} onChange={e => setDraft(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" placeholder="Ask about attendance…" aria-label="Ask Attendance Advisor"/><button type="submit" disabled={!draft.trim()} className="rounded-xl bg-navy px-3 text-white disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send question"><Send size={17}/></button></form>
      <p className="px-3 pb-2 text-[10px] text-slate-400">Rule-based guidance, not an external AI model or official record. Confirm college policy.</p>
    </section>}
  </>;
}
