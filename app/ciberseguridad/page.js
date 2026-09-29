"use client";
import StatusBadge from "@/components/StatusBadge";
import { securityChecklist, coevaluationFeedback } from "@/data/mockData";
import { ShieldCheck, Lock, Star } from "lucide-react";

export default function CiberseguridadPage() {
  const done = securityChecklist.filter((c) => c.status === "completed").length;
  const fb = coevaluationFeedback;
  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-white flex items-center gap-3"><ShieldCheck className="text-blue-400" /> Ciberseguridad</h1>
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-white font-semibold flex items-center gap-2"><Lock className="text-blue-400" /> Lista de Chequeo</h2>
          <span className="text-sm text-slate-400">{done} de {securityChecklist.length} controles completados</span>
        </div>
        <div className="h-1.5 rounded-full bg-blue-500/15 mb-2">
          <div className="h-full rounded-full bg-blue-500" style={{ width: `${(done / securityChecklist.length) * 100}%` }} />
        </div>
        {securityChecklist.map((item) => (
          <div key={item.id} className="flex justify-between items-center gap-4 p-4 border-b border-slate-700 last:border-b-0">
            <div>
              <p className="text-white font-medium">{item.control}</p>
              <p className="text-slate-400 text-sm">{item.description}</p>
              <p className="text-xs text-slate-500 mt-1">{item.category}</p>
            </div>
            <StatusBadge status={item.status} />
          </div>
        ))}
      </div>
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-white font-semibold">{fb.title}</h2>
            <p className="text-sm text-slate-400">{fb.subtitle}</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-sm font-semibold text-amber-300">
            <Star size={16} className="fill-amber-300" /> {fb.score} / 5
          </span>
        </div>
        <p className="mt-4 text-sm text-slate-300 leading-relaxed">{fb.feedback.replaceAll("**", "")}</p>
        <ul className="mt-4 space-y-2">
          {fb.improvements.map((imp) => (
            <li key={imp} className="flex items-center gap-2 text-sm text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> {imp}</li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500">{fb.evaluator} · {fb.date}</p>
      </div>
    </div>
  );
}
