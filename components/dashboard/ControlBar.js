"use client";
import { GitCompareArrows, Link2, Link2Off, Radio, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Icon } from "@/components/icons";
import { SCENARIOS } from "@/lib/simulation";

function Toggle({ on, onClick, icon: IconOn, iconOff: IconOff, label, hint }) {
  const Ico = !on && IconOff ? IconOff : IconOn;
  return (
    <button
      type="button"
      aria-pressed={on}
      title={hint}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${on ? "border-blue-500/40 bg-blue-500/15 text-blue-300" : "border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200"}`}
    >
      <Ico size={15} />
      {label}
      <span className={`ml-1 h-4 w-7 rounded-full p-0.5 transition-colors ${on ? "bg-blue-500" : "bg-slate-600"}`}>
        <span className={`block h-3 w-3 rounded-full bg-white transition-transform ${on ? "translate-x-3" : ""}`} />
      </span>
    </button>
  );
}

export default function ControlBar({ state, onScenario, onToggle, onReset }) {
  const active = SCENARIOS.find((s) => s.id === state.scenario);
  return (
    <section className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 animate-fade-in">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-2 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="flex items-center gap-2"><SlidersHorizontal size={13} /> Escenarios de simulación</span>
            <span className="normal-case tracking-normal text-slate-500">
              — {active ? active.description : "Personalizado: valores ajustados a mano"}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map((s) => {
              const on = s.id === state.scenario;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  title={s.description}
                  onClick={() => onScenario(s.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${on ? "border-blue-400/60 bg-blue-500/20 text-white shadow-[0_0_18px_rgba(59,130,246,0.25)]" : "border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-500 hover:text-white"}`}
                >
                  <Icon name={s.icon} size={15} className={on ? "text-blue-300" : "text-slate-400"} />
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 min-w-0">
            Arrastra cualquier barra de los sensores: gráficos, escena, índice y alertas se recalculan al instante.
          </p>
          <div className="flex flex-wrap items-center gap-2 md:shrink-0">
            <Toggle
              on={state.live}
              onClick={() => onToggle("live")}
              icon={Radio}
              label="En vivo"
              hint="Los sensores fluctúan como en la vida real alrededor del valor fijado"
            />
            <Toggle
              on={state.coupling}
              onClick={() => onToggle("coupling")}
              icon={Link2}
              iconOff={Link2Off}
              label="Acoplamiento"
              hint="Mover una variable afecta a las demás (tráfico → aire, luz → consumo…)"
            />
            <Toggle
              on={state.compare}
              onClick={() => onToggle("compare")}
              icon={GitCompareArrows}
              label="Comparar base"
              hint="Muestra en los gráficos los valores del escenario base"
            />
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
            >
              <RotateCcw size={15} /> Restablecer
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
