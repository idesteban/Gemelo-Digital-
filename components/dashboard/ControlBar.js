"use client";
import { ChevronDown, Clock, CloudSun, GitCompareArrows, Link2, Link2Off, Radio, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Icon } from "@/components/icons";
import { CLIMAS, FRANJAS, SCENARIOS, climaById, franjaById } from "@/lib/simulation";

// Barra desplegable (select nativo, accesible con teclado y en celular).
function Dropdown({ id, label, icon: Ico, value, options, onChange }) {
  return (
    <label htmlFor={id} className="flex min-w-0 flex-1 sm:flex-none flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Ico size={12} /> {label}
      </span>
      <span className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full sm:w-60 appearance-none rounded-lg border border-slate-600 bg-slate-900/70 py-2 pl-3 pr-9 text-xs font-medium text-white hover:border-blue-400 focus-visible:outline-2 focus-visible:outline-blue-400 cursor-pointer"
        >
          {options.map((o) => (
            <option key={o.id} value={o.id} className="bg-slate-900">{o.label}</option>
          ))}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
      </span>
    </label>
  );
}

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

export default function ControlBar({ state, onScenario, onToggle, onReset, onContext }) {
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
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 pt-3 border-t border-slate-700/50">
          <div className="flex flex-wrap items-end gap-3 min-w-0">
            <Dropdown
              id="select-clima"
              label="Clima en Bogotá"
              icon={CloudSun}
              value={state.clima}
              options={CLIMAS.map((c) => ({ id: c.id, label: c.name }))}
              onChange={(clima) => onContext({ clima })}
            />
            <Dropdown
              id="select-franja"
              label="Franja horaria"
              icon={Clock}
              value={state.franja}
              options={FRANJAS.map((f) => ({ id: f.id, label: `${f.name} (${f.range})` }))}
              onChange={(franja) => onContext({ franja })}
            />
            <span className="text-[11px] text-slate-500 pb-2 hidden xl:inline">
              {franjaById(state.franja).name} · {climaById(state.clima).name}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
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
