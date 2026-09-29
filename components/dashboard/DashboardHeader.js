"use client";
import { Activity, MapPin } from "lucide-react";
import { formatDate, formatTime, useNow } from "@/hooks/useNow";

export default function DashboardHeader({ criticalCount, live }) {
  const now = useNow(1000);
  const critical = criticalCount > 0;

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white flex items-center gap-3">
          <Activity className="text-blue-400" size={34} /> El Modelo Virtual
        </h1>
        <p className="mt-1 text-slate-400 flex items-center gap-2">
          <MapPin size={16} /> Monitoreo en tiempo real — Barrio Bogotá, Colombia
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span
          role="status"
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${critical ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"}`}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${critical ? "bg-red-400" : "bg-emerald-400"}`} />
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${critical ? "bg-red-500" : "bg-emerald-400"}`} />
          </span>
          {critical ? `${criticalCount} ${criticalCount === 1 ? "Alerta Crítica" : "Alertas Críticas"}` : "Sistema Activo"}
          {live && <span className="rounded bg-slate-900/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-300">En vivo</span>}
        </span>
        <span className="rounded-full border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm text-slate-300">
          {now ? (
            <>
              {formatDate(now)} <span className="text-slate-500">·</span>{" "}
              <span className="tabular-nums text-slate-400">{formatTime(now)}</span>
            </>
          ) : (
            <span className="inline-block w-44">&nbsp;</span>
          )}
        </span>
      </div>
    </header>
  );
}
