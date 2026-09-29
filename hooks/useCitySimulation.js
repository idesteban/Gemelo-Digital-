"use client";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import {
  BASE_VALUES, COUPLINGS, SCENARIOS, SENSORS, SENSOR_BY_KEY,
  buildEnergyData, buildSensors, buildTrafficData, clamp, computeHealth,
  formatValue, generateAlerts, snap, summarizeEnergy, summarizeTraffic,
} from "@/lib/simulation";

// Ruido del modo "en vivo": sigma por variable y fuerza de retorno al valor fijado.
const NOISE = { iluminacion: 0.8, camaras: 0, consumo: 3, aire: 1.6, flujo: 28, temperatura: 0.12 };
const REVERSION = 0.3;
const LOG_LIMIT = 12;

let eventId = 0;
const nextId = () => ++eventId;

function initState() {
  return {
    values: { ...BASE_VALUES },
    anchors: { ...BASE_VALUES }, // valores fijados por el usuario (el modo en vivo oscila alrededor)
    coupling: true,
    live: false,
    compare: true,
    scenario: "base",
    impact: null,
    log: [{ id: nextId(), time: Date.now(), kind: "system", text: "Gemelo digital sincronizado con 6 sensores del barrio" }],
  };
}

function pushLog(log, entry) {
  return [{ id: nextId(), time: Date.now(), ...entry }, ...log].slice(0, LOG_LIMIT);
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_VALUE": {
      const { key } = action;
      const prev = state.values[key];
      const next = snap(key, action.value);
      if (next === prev) return state;
      const values = { ...state.values, [key]: next };
      const anchors = { ...state.anchors, [key]: next };
      // Mientras el usuario sigue arrastrando la misma variable, el efecto se acumula.
      const sameGesture = state.impact?.source === key && action.at - state.impact.at < 1500;
      const targets = sameGesture ? { ...state.impact.targets } : {};
      let changed = false;
      if (state.coupling) {
        for (const rule of COUPLINGS[key] ?? []) {
          const before = values[rule.target];
          const after = snap(rule.target, before + rule.effect(prev, next));
          if (after !== before) {
            values[rule.target] = after;
            anchors[rule.target] = after;
            const acc = (targets[rule.target]?.delta ?? 0) + (after - before);
            targets[rule.target] = { delta: acc, reason: rule.reason };
            changed = true;
          }
        }
      }
      const impact = changed
        ? { id: nextId(), source: key, targets, at: action.at }
        : sameGesture ? { ...state.impact, at: action.at } : state.impact;
      return { ...state, values, anchors, impact, scenario: null };
    }
    case "APPLY_SCENARIO": {
      const scenario = SCENARIOS.find((s) => s.id === action.id);
      const values = { ...scenario.values };
      const targets = {};
      for (const k of Object.keys(values)) {
        if (values[k] !== state.values[k]) targets[k] = { delta: values[k] - state.values[k], reason: scenario.name };
      }
      return {
        ...state,
        values,
        anchors: { ...values },
        scenario: scenario.id,
        impact: { id: nextId(), source: "scenario", targets },
        log: pushLog(state.log, { kind: "scenario", text: `Escenario aplicado: ${scenario.name}`, detail: scenario.description }),
      };
    }
    case "TICK": {
      const values = { ...state.values };
      for (const s of SENSORS) {
        if (s.key === action.hold) continue;
        const anchor = state.anchors[s.key];
        let v = values[s.key];
        if (s.key === "camaras") {
          // De vez en cuando una cámara se cae; en el siguiente ciclo se reconecta.
          if (v === anchor) v -= action.noise.camaras < 0.1 ? 1 : 0;
          else v += Math.sign(anchor - v);
        } else {
          v = v + REVERSION * (anchor - v) + NOISE[s.key] * action.noise[s.key];
        }
        values[s.key] = snap(s.key, clamp(v, s.min, s.max));
      }
      return { ...state, values };
    }
    case "TOGGLE": {
      const on = !state[action.flag];
      const labels = {
        live: on ? "Simulación en vivo activada" : "Simulación en vivo en pausa",
        coupling: on ? "Acoplamiento de variables activado" : "Acoplamiento de variables desactivado",
        compare: on ? "Comparación con escenario base visible" : "Comparación con escenario base oculta",
      };
      const settle = action.flag === "live" && !on ? { values: { ...state.anchors } } : {};
      return { ...state, ...settle, [action.flag]: on, log: pushLog(state.log, { kind: "system", text: labels[action.flag] }) };
    }
    case "LOG":
      return { ...state, log: pushLog(state.log, action.entry) };
    case "RESET":
      return {
        ...state,
        values: { ...BASE_VALUES },
        anchors: { ...BASE_VALUES },
        scenario: "base",
        impact: null,
        log: pushLog(state.log, { kind: "system", text: "Simulación restablecida a los valores de referencia" }),
      };
    default:
      return state;
  }
}

// Normal estándar (Box–Muller) para el ruido del modo en vivo.
function gaussian() {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function useCitySimulation() {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const stateRef = useRef(state);
  const holdRef = useRef(null); // variable que el usuario está arrastrando
  const gestures = useRef({}); // cambios pendientes de registrar en la bitácora

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Modo en vivo: los sensores oscilan alrededor del valor fijado.
  useEffect(() => {
    if (!state.live) return undefined;
    const id = setInterval(() => {
      const noise = Object.fromEntries(SENSORS.map((s) => [s.key, s.key === "camaras" ? Math.random() : gaussian()]));
      dispatch({ type: "TICK", noise, hold: holdRef.current });
    }, 1400);
    return () => clearInterval(id);
  }, [state.live]);

  useEffect(() => () => Object.values(gestures.current).forEach((g) => clearTimeout(g.timer)), []);

  // Cada arrastre de slider se agrupa y se registra al soltarlo (debounce).
  const setValue = useCallback((key, value) => {
    const pending = gestures.current[key];
    if (pending) clearTimeout(pending.timer);
    const startAnchors = pending?.startAnchors ?? { ...stateRef.current.anchors };
    const timer = setTimeout(() => {
      delete gestures.current[key];
      const end = stateRef.current.anchors;
      const s = SENSOR_BY_KEY[key];
      if (end[key] === startAnchors[key]) return;
      const effects = Object.keys(end)
        .filter((k) => k !== key && end[k] !== startAnchors[k])
        .map((k) => {
          const d = end[k] - startAnchors[k];
          return `${SENSOR_BY_KEY[k].name} ${d > 0 ? "+" : ""}${formatValue(k, d)} ${SENSOR_BY_KEY[k].unit}`;
        });
      dispatch({
        type: "LOG",
        entry: {
          kind: "change",
          sensor: key,
          text: `${s.name}: ${formatValue(key, startAnchors[key])} → ${formatValue(key, end[key])} ${s.unit}`,
          detail: effects.length ? `Efecto en cadena: ${effects.join(" · ")}` : undefined,
        },
      });
    }, 700);
    gestures.current[key] = { startAnchors, timer };
    dispatch({ type: "SET_VALUE", key, value, at: Date.now() });
  }, []);

  const setHold = useCallback((key) => {
    holdRef.current = key;
  }, []);
  const applyScenario = useCallback((id) => dispatch({ type: "APPLY_SCENARIO", id }), []);
  const toggle = useCallback((flag) => dispatch({ type: "TOGGLE", flag }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const { values } = state;
  const derived = useMemo(() => {
    const sensors = buildSensors(values);
    const traffic = buildTrafficData(values);
    const energy = buildEnergyData(values);
    const energySummary = summarizeEnergy(energy);
    const trafficSummary = summarizeTraffic(traffic);
    const health = computeHealth(values, energySummary);
    const alerts = generateAlerts(values, energySummary);
    return { sensors, traffic, energy, energySummary, trafficSummary, health, alerts };
  }, [values]);

  const baseline = useMemo(() => {
    const energy = buildEnergyData(BASE_VALUES);
    return {
      health: computeHealth(BASE_VALUES, summarizeEnergy(energy)),
      trafficSummary: summarizeTraffic(buildTrafficData(BASE_VALUES)),
      energySummary: summarizeEnergy(energy),
    };
  }, []);

  return { state, ...derived, baseline, setValue, setHold, applyScenario, toggle, reset };
}
