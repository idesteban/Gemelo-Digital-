"use client";
import { formatNumber } from "@/lib/simulation";

// Colores de serie (validados para superficie oscura: separación CVD ΔE > 20).
export const SERIES = {
  blue: "#3b82f6",
  green: "#0ea371",
  grid: "#26324a",
  axis: "#475569",
  tick: "#94a3b8",
};

export function ChartCard({ title, subtitle, stats, children, className = "" }) {
  return (
    <section className={`bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 sm:p-6 animate-fade-in ${className}`}>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-400">{subtitle}</p>
      {stats && <div className="mt-4 grid grid-cols-3 gap-2">{stats}</div>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

// Mini indicador con variación frente al escenario base.
export function Stat({ label, value, unit, delta, goodWhen = "up", deltaUnit = "%" }) {
  const hasDelta = delta !== undefined && Number.isFinite(delta) && Math.abs(delta) >= 0.5;
  const good = goodWhen === "up" ? delta > 0 : delta < 0;
  return (
    <div className="rounded-xl bg-slate-900/50 border border-slate-700/40 px-3 py-2 min-w-0">
      <p className="text-[11px] text-slate-400 truncate">{label}</p>
      <p className="text-base font-semibold text-white leading-tight truncate">
        {value} <span className="text-xs font-normal text-slate-400">{unit}</span>
      </p>
      <p className={`text-[11px] ${hasDelta ? (good ? "text-emerald-400" : "text-red-400") : "text-slate-500"}`}>
        {hasDelta ? `${delta > 0 ? "+" : ""}${delta.toFixed(0)}${deltaUnit} vs. base` : "= base"}
      </p>
    </div>
  );
}

export function LegendRow({ items }) {
  return (
    <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-slate-300">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2">
          {it.kind === "line" ? (
            <span className="inline-block w-5 border-t-2 border-dashed" style={{ borderColor: it.color }} />
          ) : it.kind === "tick" ? (
            <span className="inline-block w-3.5 h-0.5 rounded" style={{ background: it.color }} />
          ) : (
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: it.color }} />
          )}
          {it.label}
        </li>
      ))}
    </ul>
  );
}

// Tooltip: el valor manda, el nombre acompaña; tecla de línea con el color de la serie.
export function ChartTooltip({ active, payload, label, rows, compare }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-600 bg-slate-900/95 px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-400 mb-1.5">{label}</p>
      {rows.map((r) => {
        const v = d[r.key];
        const base = d[r.baseKey];
        const pct = base ? ((v - base) / base) * 100 : 0;
        return (
          <div key={r.key} className="flex items-center gap-2 py-0.5">
            <span className="inline-block w-3 h-0.5 rounded" style={{ background: r.color }} />
            <span className="font-semibold text-white tabular-nums">{formatNumber(v)}</span>
            <span className="text-slate-400">{r.label}</span>
            {compare && Math.abs(pct) >= 0.5 && (
              <span className="ml-auto pl-2 text-slate-500 tabular-nums">
                base {formatNumber(base)} ({pct > 0 ? "+" : ""}{pct.toFixed(0)}%)
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const pctDelta = (value, base) => (base ? ((value - base) / base) * 100 : 0);
