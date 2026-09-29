"use client";
import { Info, ScrollText, SlidersHorizontal, Sparkles } from "lucide-react";
import { Icon } from "@/components/icons";
import { SENSOR_BY_KEY } from "@/lib/simulation";
import { formatTime, useNow } from "@/hooks/useNow";

const KIND_ICON = { scenario: Sparkles, system: Info, change: SlidersHorizontal };

export default function EventLog({ log, className = "" }) {
  const mounted = useNow(60000) !== null;

  return (
    <section className={`bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 sm:p-6 animate-fade-in ${className}`}>
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <ScrollText size={20} className="text-blue-400" /> Bitácora de Simulación
      </h3>
      <p className="text-sm text-slate-400">Cada ajuste queda registrado con su efecto en cadena</p>

      <ol className="mt-4 space-y-3 max-h-[26rem] overflow-y-auto pr-1">
        {log.map((e) => {
          const KindIcon = KIND_ICON[e.kind] ?? Info;
          return (
            <li key={e.id} className="flex gap-3 animate-slide-in">
              <div className="mt-0.5 h-7 w-7 shrink-0 rounded-lg bg-slate-900/60 border border-slate-700/60 flex items-center justify-center text-slate-400">
                {e.sensor ? <Icon name={SENSOR_BY_KEY[e.sensor].icon} size={14} /> : <KindIcon size={14} />}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-200 leading-snug">{e.text}</p>
                {e.detail && <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{e.detail}</p>}
                <p className="text-[10px] text-slate-500 tabular-nums mt-0.5">{mounted ? formatTime(e.time) : "--:--:--"}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
