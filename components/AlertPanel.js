"use client";
import { useRef } from "react";
import { BellRing } from "lucide-react";
import { Icon } from "@/components/icons";
import { formatAgo, useNow } from "@/hooks/useNow";

const STYLE = {
  critical: { box: "border-red-500/30 bg-red-500/10", icon: "bg-red-500/15 text-red-400", tag: "bg-red-500/20 text-red-300", label: "Crítica" },
  warning: { box: "border-amber-500/30 bg-amber-500/10", icon: "bg-amber-500/15 text-amber-400", tag: "bg-amber-500/20 text-amber-300", label: "Advertencia" },
  info: { box: "border-blue-500/25 bg-blue-500/5", icon: "bg-blue-500/15 text-blue-400", tag: "bg-blue-500/20 text-blue-300", label: "Info" },
};

// Alertas presentes al cargar: conservan la antigüedad de los datos originales.
const SEEDED_AGE_MIN = { "consumo-warn": 3, "luz-pred": 15, "cam-ok": 28 };

export default function AlertPanel({ alerts, className = "" }) {
  const now = useNow(5000);
  const firstSeen = useRef(null);

  // Registra cuándo apareció cada alerta (solo en el cliente).
  if (now !== null) {
    if (firstSeen.current === null) {
      firstSeen.current = new Map(
        alerts.map((a) => [a.id, now - (SEEDED_AGE_MIN[a.id] ?? 0) * 60000]),
      );
    }
    const seen = firstSeen.current;
    for (const a of alerts) if (!seen.has(a.id)) seen.set(a.id, Date.now());
    for (const id of [...seen.keys()]) if (!alerts.some((a) => a.id === id)) seen.delete(id);
  }

  const counts = alerts.reduce((acc, a) => ({ ...acc, [a.type]: (acc[a.type] ?? 0) + 1 }), {});

  return (
    <section className={`bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 sm:p-6 animate-fade-in ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BellRing size={20} className="text-blue-400" /> Alertas Inteligentes
        </h3>
        <div className="flex gap-2 text-[11px]">
          {["critical", "warning", "info"].filter((t) => counts[t]).map((t) => (
            <span key={t} className={`rounded-full px-2 py-0.5 ${STYLE[t].tag}`}>
              {counts[t]} {STYLE[t].label.toLowerCase()}{counts[t] > 1 && t !== "info" ? "s" : ""}
            </span>
          ))}
        </div>
      </div>
      <p className="text-sm text-slate-400">Generadas automáticamente por el gemelo según el estado de los sensores</p>

      <ul className="mt-4 space-y-3" aria-live="polite">
        {alerts.map((a) => {
          const s = STYLE[a.type];
          const seen = firstSeen.current?.get(a.id);
          return (
            <li key={a.id} className={`flex gap-3 rounded-xl border p-3.5 animate-slide-in ${s.box}`}>
              <div className={`h-9 w-9 shrink-0 rounded-lg flex items-center justify-center ${s.icon}`}>
                <Icon name={a.icon} size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-sm font-semibold text-white">{a.title}</p>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${s.tag}`}>{s.label}</span>
                  <span className="ml-auto text-[11px] text-slate-500">{now && seen ? formatAgo(now - seen) : ""}</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-300 leading-relaxed">{a.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
