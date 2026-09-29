"use client";
import { HeartPulse } from "lucide-react";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";

const LEN = Math.PI * 80;

function tone(v) {
  if (v >= 60) return { stroke: "#10b981", track: "rgba(16,185,129,0.15)", bar: "bg-emerald-500", text: "text-emerald-400" };
  if (v >= 40) return { stroke: "#f59e0b", track: "rgba(245,158,11,0.15)", bar: "bg-amber-500", text: "text-amber-400" };
  return { stroke: "#ef4444", track: "rgba(239,68,68,0.15)", bar: "bg-red-500", text: "text-red-400" };
}

export default function CityHealth({ health, baseScore, className = "" }) {
  const shown = useAnimatedNumber(health.score, { duration: 600 });
  const t = tone(health.score);
  const delta = health.score - baseScore;
  const weakest = [...health.parts].sort((a, b) => a.value - b.value)[0];

  return (
    <section className={`bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 sm:p-6 flex flex-col animate-fade-in ${className}`}>
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <HeartPulse size={20} className={t.text} /> Índice de Salud Urbana
      </h3>
      <p className="text-sm text-slate-400">Síntesis del gemelo: movilidad, energía, ambiente y seguridad</p>

      <div className="relative mx-auto mt-4 w-full max-w-[260px]">
        <svg viewBox="0 0 200 116" className="w-full" role="img" aria-label={`Índice de salud urbana: ${health.score} de 100, ${health.label}`}>
          <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke={t.track} strokeWidth="14" strokeLinecap="round" />
          <path
            d="M20 100 A80 80 0 0 1 180 100"
            fill="none"
            stroke={t.stroke}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${(LEN * shown) / 100} ${LEN}`}
            style={{ transition: "stroke 0.5s ease" }}
          />
          {[40, 60].map((v) => {
            const a = Math.PI * (1 - v / 100);
            return (
              <line key={v} x1={100 + 64 * Math.cos(a)} y1={100 - 64 * Math.sin(a)} x2={100 + 70 * Math.cos(a)} y2={100 - 70 * Math.sin(a)} stroke="#64748b" strokeWidth="1.5" />
            );
          })}
        </svg>
        <div className="absolute inset-x-0 bottom-1 text-center">
          <p className="text-5xl font-bold text-white leading-none">{Math.round(shown)}</p>
          <p className={`mt-1 text-sm font-semibold ${t.text}`}>{health.label}</p>
        </div>
      </div>
      <p className="text-center text-xs text-slate-400 mt-1">
        {delta === 0 ? "Igual al escenario base" : `${delta > 0 ? "+" : ""}${delta} puntos vs. escenario base`}
      </p>

      <ul className="mt-5 space-y-3">
        {health.parts.map((p) => {
          const pt = tone(p.value);
          return (
            <li key={p.key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">{p.name}</span>
                <span className="font-semibold text-white">{p.value}</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: pt.track }}>
                <div className={`h-full rounded-full ${pt.bar} transition-all duration-500`} style={{ width: `${p.value}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-auto pt-4 text-xs text-slate-400">
        Punto débil: <span className="text-slate-200 font-medium">{weakest.name}</span> ({weakest.value}/100)
      </p>
    </section>
  );
}
