'use client';
import { getAttendanceResult } from '@/lib/attendance';
import { Subject } from '@/types/attendance';
import { StatusBadge } from './StatusBadge';
import { Trash2 } from 'lucide-react';

export function SubjectTable({
  subjects,
  onUpdate,
  onRemove,
}: {
  subjects: Subject[];
  onUpdate: (id: string, patch: Partial<Pick<Subject, 'attended' | 'conducted'>>) => void;
  onRemove: (id: string) => void;
}) {
  if (!subjects.length) return <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center"><h2 className="font-bold">Subject-wise attendance</h2><p className="mt-2 text-sm text-slate-500">Add a subject below with the number of classes attended and conducted. Your percentages and targets will calculate automatically.</p></div>;
  return <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft"><div className="border-b border-line p-5"><h2 className="font-bold">Subject-wise attendance</h2><p className="text-sm text-slate-500">Edit attended/conducted counts; all attendance metrics update instantly.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Subject</th><th className="px-5 py-3">Attended</th><th className="px-5 py-3">Conducted</th><th className="px-5 py-3">Attendance</th><th className="px-5 py-3">To 75%</th><th className="px-5 py-3">To 90%</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Remove</th></tr></thead><tbody className="divide-y divide-line">{subjects.map(s=>{const r=getAttendanceResult(s); return <tr key={s.id}><td className="px-5 py-4 font-semibold text-slate-800">{s.name}</td><td className="px-5 py-3"><input aria-label={`${s.name} classes attended`} className="w-20 rounded-lg border border-slate-200 px-2 py-2" type="number" min="0" max={s.conducted} value={s.attended} onChange={e=>{const n=Number(e.target.value); if(Number.isInteger(n)&&n>=0&&n<=s.conducted)onUpdate(s.id,{attended:n});}} /></td><td className="px-5 py-3"><input aria-label={`${s.name} classes conducted`} className="w-20 rounded-lg border border-slate-200 px-2 py-2" type="number" min={s.attended} value={s.conducted} onChange={e=>{const n=Number(e.target.value); if(Number.isInteger(n)&&n>=s.attended)onUpdate(s.id,{conducted:n});}} /></td><td className="px-5 py-4 font-bold">{r.percentage.toFixed(1)}%<div className="mt-2 h-2 w-28 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${r.state==='safe'?'bg-emerald-500':r.state==='warning'?'bg-amber-500':r.state==='risk'?'bg-red-500':'bg-red-950'}`} style={{width:`${Math.min(r.percentage,100)}%`}}/></div></td><td className="px-5 py-4">{r.classesTo75===0?'Reached':`${r.classesTo75} classes`}</td><td className="px-5 py-4">{r.classesTo90===0?'Reached':`${r.classesTo90} classes`}</td><td className="px-5 py-4"><StatusBadge state={r.state}/></td><td className="px-5 py-4"><button type="button" onClick={()=>onRemove(s.id)} aria-label={`Remove ${s.name}`} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={16}/></button></td></tr>})}</tbody></table></div></div>;
}
