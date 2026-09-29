"use client";
import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Icon } from "@/components/icons";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { STATUS_META, formatValue } from "@/lib/simulation";

const ACCENT = { online: "#3b82f6", warning: "#f59e0b", critical: "#ef4444" };
const ICON_BOX = {
  online: "bg-blue-500/15 text-blue-400",
  warning: "bg-amber-500/15 text-amber-400",
  critical: "bg-red-500/15 text-red-400",
};
const ZONE_COLOR = { online: "bg-emerald-500/40", warning: "bg-amber-500/50", critical: "bg-red-500/55" };

export default function SensorCard({ sensor, index = 0, impact, sourceName, onChange, onHold }) {
  const { key, value, status, trend, min, max, step, zones, base, unit } = sensor;
  const [dragging, setDragging] = useState(false);
  const shown = useAnimatedNumber(value, { instant: dragging });
  const meta = STATUS_META[status];
  const accent = ACCENT[status];
  const pct = (v) => ((v - min) / (max - min)) * 100;

  // Soltar el slider fuera de la tarjeta también termina el arrastre.
  useEffect(() => {
    if (!dragging) return undefined;
    const end = () => {
      setDragging(false);
      onHold?.(null);
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [dragging, onHold]);

  const TrendIcon = trend.direction === "up" ? ArrowUpRight : trend.direction === "down" ? ArrowDownRight : Minus;
  const trendColor = trend.good ? "text-emerald-400" : "text-red-400";

  return (
    <div
      className="relative bg-slate-800/60 p-5 rounded-2xl border border-slate-700/50 card-hover animate-fade-in"
      style={{ animationDelay: `${index * 70}ms`, "--accent": accent }}
    >
      {/* Pulso cuando otra variable (o un escenario) mueve este sensor */}
      {impact && <span key={impact.id} className="impact-pulse pointer-events-none absolute inset-0 rounded-2xl" />}

      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-500 ${ICON_BOX[status]}`}>
          <Icon name={sensor.icon} size={22} />
        </div>
        <span className="flex items-center gap-2 text-xs text-slate-300">
          <span className={`w-2 h-2 rounded-full ${meta.dot} ${status === "critical" ? "animate-pulse" : ""}`} />
          {meta.label}
        </span>
      </div>

      <h3 className="text-slate-200 text-sm font-medium mt-4">{sensor.name}</h3>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="text-4xl font-bold text-white">{formatValue(key, dragging ? value : shown)}</span>
        <span className="text-sm text-slate-400">{unit}</span>
      </p>

      <div className="mt-2 flex items-center gap-1.5 text-xs min-h-5">
        <TrendIcon size={14} className={trendColor} />
        <span className={`font-semibold ${trendColor}`}>{trend.text}</span>
        <span className="text-slate-500">vs. ayer</span>
        {impact && (
          <span
            key={`b${impact.id}`}
            className="impact-badge ml-auto truncate rounded-full bg-slate-900/80 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300"
            title={impact.reason}
          >
            {impact.delta > 0 ? "▲" : "▼"} {impact.delta > 0 ? "+" : ""}{formatValue(key, impact.delta)} · {sourceName}
          </span>
        )}
      </div>

      {/* Barra de desplazamiento */}
      <div className="mt-4 pt-3 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <label htmlFor={`slider-${key}`}>{sensor.control}</label>
          <span>Base: {formatValue(key, base)} {unit}</span>
        </div>
        <input
          id={`slider-${key}`}
          type="range"
          className="sim-slider"
          min={min}
          max={max}
          step={step}
          value={value}
          style={{ "--fill": `${pct(value)}%` }}
          aria-valuetext={`${formatValue(key, value)} ${unit}, estado ${meta.label}`}
          onChange={(e) => onChange(key, Number(e.target.value))}
          onPointerDown={() => {
            setDragging(true);
            onHold?.(key);
          }}
        />
        {/* Zonas de estado + marca del valor base, alineadas con el centro del thumb */}
        <div className="relative mx-[9px] h-1 mt-0.5" aria-hidden="true">
          {zones.map((z, i) => {
            const from = i === 0 ? min : zones[i - 1].to;
            return (
              <span
                key={z.to}
                className={`absolute top-0 h-1 ${ZONE_COLOR[z.status]} ${i === 0 ? "rounded-l-full" : ""} ${i === zones.length - 1 ? "rounded-r-full" : ""}`}
                style={{ left: `${pct(from)}%`, width: `calc(${pct(z.to) - pct(from)}% - 2px)` }}
              />
            );
          })}
          <span className="absolute -top-1 h-3 w-0.5 rounded bg-slate-200" style={{ left: `${pct(base)}%` }} title="Valor base" />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
          <span>{formatValue(key, min)}</span>
          <span>{formatValue(key, max)}</span>
        </div>
      </div>
    </div>
  );
}
