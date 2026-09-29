"use client";
import { useEffect, useMemo, useRef } from "react";
import { Bike, Building2, Camera, CarFront, CloudFog, Lightbulb, ScanEye, ShieldCheck, Users } from "lucide-react";
import { Icon } from "@/components/icons";
import { STATUS_META, clamp, climaById, formatNumber, franjaById, solarFactor } from "@/lib/simulation";

// ---------------------------------------------------------------------------
// Geometría fija de la escena (determinista para que servidor y cliente coincidan)
// ---------------------------------------------------------------------------
function seeded(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GROUND = 222; // base de los edificios (inicio del andén)
const W = 800;
const WRAP = 880;
const rand = seeded(2026);

const FAR = Array.from({ length: 22 }, (_, i) => ({ x: i * 38 - 10, w: 30 + rand() * 26, h: 45 + rand() * 50 }));
const STARS = Array.from({ length: 34 }, () => ({ x: rand() * W, y: 8 + rand() * 120, r: 0.6 + rand() * 1.1, d: rand() * 3 }));

const BUILDINGS = [
  { x: 0, w: 70, h: 118 }, { x: 78, w: 54, h: 160 }, { x: 140, w: 90, h: 96, solar: true },
  { x: 238, w: 60, h: 178, antenna: true }, { x: 306, w: 80, h: 130, solar: true }, { x: 394, w: 48, h: 150 },
  { x: 450, w: 96, h: 104, solar: true }, { x: 554, w: 62, h: 186, antenna: true }, { x: 624, w: 84, h: 124 },
  { x: 716, w: 84, h: 152 },
].map((raw) => {
  const b = { ...raw, h: Math.round(raw.h * 0.72) }; // más bajos para que se vean los cerros
  const cols = Math.floor((b.w - 10) / 12);
  const rows = Math.floor((b.h - 20) / 16);
  const windows = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      windows.push({ x: b.x + 8 + c * 12, y: GROUND - b.h + 12 + r * 16, t: rand() });
    }
  }
  return { ...b, windows };
});

const CLOUDS = Array.from({ length: 8 }, (_, i) => ({ x: 40 + i * 100 + rand() * 40, y: 22 + rand() * 60, s: 0.7 + rand() * 0.6 }));
const DROPS = Array.from({ length: 110 }, () => ({ x: rand() * 840 - 20, y: rand() * 300, l: 8 + rand() * 8 }));

// Cerros Orientales con Monserrate (pico en x=560)
const FAR_RANGE = "M0 150 L60 128 L120 140 L190 112 L260 126 L330 100 L400 118 L470 92 L520 104 L560 78 L600 96 L660 88 L720 110 L800 98 L800 222 L0 222 Z";
const NEAR_RANGE = "M0 172 L80 152 L150 164 L230 142 L310 158 L380 140 L450 152 L520 136 L600 150 L680 138 L760 154 L800 148 L800 222 L0 222 Z";

const SKY = {
  madrugada: ["#02040b", "#0b1428"],
  manana: ["#1d4ed8", "#fdba74"],
  tarde: ["#1669d6", "#bfdbfe"],
  noche: ["#060a14", "#1e293b"],
};
const CAM_RANGE = 78; // alcance horizontal del cono de visión sobre la vía

const LAMPS = Array.from({ length: 7 }, (_, i) => 30 + i * 125);
const CAMERA_ORDER = [0, 3, 6, 1, 4, 2, 5];
const CAR_COLORS = ["#60a5fa", "#f87171", "#fbbf24", "#e5e7eb", "#a78bfa", "#34d399", "#f472b6", "#94a3b8", "#fb923c"];
const SLOT_ORDER = [0, 4, 2, 6, 1, 5, 3, 7, 8]; // cualquier prefijo queda repartido en la vía

const LANES = [{ y: 246, dir: 1 }, { y: 272, dir: -1 }];
const MAX_CARS = 18;
const MAX_PEDS = 14;
const MAX_BIKES = 6;

function initAgents() {
  const r = seeded(7);
  const cars = Array.from({ length: MAX_CARS }, (_, i) => {
    const lane = LANES[i % 2];
    const slot = SLOT_ORDER[Math.floor(i / 2)];
    return { x: slot * (WRAP / 9) - 40 + (i % 2) * 45, y: lane.y, dir: lane.dir, color: CAR_COLORS[i % CAR_COLORS.length] };
  });
  const peds = Array.from({ length: MAX_PEDS }, (_, i) => ({
    x: r() * WRAP - 40, y: 229 + r() * 2, dir: i % 2 ? 1 : -1, v: 10 + r() * 8, phase: r() * 6,
  }));
  const bikes = Array.from({ length: MAX_BIKES }, (_, i) => ({
    x: (SLOT_ORDER[i] / 6) * WRAP - 40, y: 294, dir: i % 2 ? -1 : 1, v: 34 + r() * 8,
  }));
  return { cars, peds, bikes };
}

// ---------------------------------------------------------------------------
// Utilidades de color
// ---------------------------------------------------------------------------
function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * clamp(t, 0, 1)));
  return `rgb(${c.join(",")})`;
}

// ---------------------------------------------------------------------------
export default function CityScene({ values, trafficSummary, live, clima, franja, security, className = "" }) {
  const { iluminacion, camaras, consumo, aire, flujo, temperatura } = values;
  const c = climaById(clima);
  const f = franjaById(franja);
  const dark = f.dark;
  const overcast = { nublado: 0.45, llovizna: 0.6, aguacero: 0.75, granizada: 0.75, niebla: 0.55 }[c.id] ?? 0;
  const lowVis = c.rain || c.hail || c.fog;

  // Parámetros visuales derivados del estado del gemelo
  const light = iluminacion / 100;
  const litFrac = Math.pow(clamp((consumo - 150) / 350, 0.03, 1), 0.8);
  const haze = clamp((aire - 40) / 260, 0, 0.5);
  const capacity = 1500 + 25 * camaras;
  const speed = clamp(1.3 - (flujo / capacity) * 0.75, 0.18, 1.3) * c.speed;
  const nCars = Math.round(clamp(flujo / 3000, 0, 1) * MAX_CARS);
  const nPeds = Math.round(clamp((trafficSummary.peatones / 3190) * 7, 0, MAX_PEDS));
  const nBikes = Math.round(clamp((1600 - flujo) / 1600, 0, 1) * MAX_BIKES);
  const [skyTop0, skyBottom0] = SKY[f.id];
  const tempTint = temperatura > 22 ? mix(skyBottom0, "#ea580c", (temperatura - 22) / 14) : skyBottom0;
  const gray = dark ? "#1f2937" : c.fog ? "#cbd5e1" : "#64748b";
  const skyTop = mix(skyTop0, gray, overcast * 0.8);
  const horizon = mix(tempTint, gray, overcast);
  const heat = clamp((temperatura - 24) / 10, 0, 0.35);
  const starAlpha = dark ? clamp((1 - haze * 2) * (1 - light * 0.55) * (1 - overcast), 0, 1) : 0;
  const solar = solarFactor(values, clima);
  const lampAlpha = dark ? 1 : lowVis ? 0.25 : 0.06;
  const beams = dark || lowVis;
  const sunPos = f.id === "manana" ? [110, 58] : [680, 44];
  const activeXs = useMemo(
    () => LAMPS.filter((_, i) => CAMERA_ORDER.indexOf(i) < Math.round((camaras / 40) * LAMPS.length)).map((x) => x + 1),
    [camaras],
  );
  const overload = consumo >= 430 ? "#ef4444" : consumo >= 330 ? "#f59e0b" : "#10b981";

  const lit = useMemo(() => {
    const q = Math.round(litFrac * 50) / 50;
    return BUILDINGS.map((b) => b.windows.map((w) => w.t < q));
  }, [litFrac]);

  // Animación de agentes: se mueve el DOM directamente con requestAnimationFrame
  const agents = useRef(null);
  if (agents.current === null) agents.current = initAgents();
  const carEls = useRef([]);
  const pedEls = useRef([]);
  const bikeEls = useRef([]);
  const speedRef = useRef(speed);
  const camsRef = useRef(activeXs);
  const detRef = useRef(null);
  useEffect(() => {
    speedRef.current = speed;
    camsRef.current = activeXs;
  }, [speed, activeXs]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wrap = (a) => {
      if (a.x > W + 40) a.x -= WRAP;
      if (a.x < -40) a.x += WRAP;
    };
    let last = performance.now();
    let lastCount = 0;
    let frame;
    // Una cámara activa "detecta" lo que pasa dentro de su cono de visión.
    const seen = (x) => camsRef.current.some((x0) => x > x0 && x < x0 + CAM_RANGE);
    const mark = (el, on) => {
      const box = el?.lastChild;
      if (box) box.setAttribute("opacity", on ? "1" : "0");
    };
    const loop = (now) => {
      const dt = reduce ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      let detections = 0;
      const { cars, peds, bikes } = agents.current;
      cars.forEach((c, i) => {
        c.x += c.dir * 95 * speedRef.current * dt;
        wrap(c);
        const el = carEls.current[i];
        el?.setAttribute("transform", `translate(${c.x.toFixed(1)} ${c.y})${c.dir < 0 ? " scale(-1 1)" : ""}`);
        const on = el?.isConnected && seen(c.x);
        if (on) detections += 1;
        mark(el, on);
      });
      peds.forEach((p, i) => {
        p.x += p.dir * p.v * dt;
        p.phase += dt * 8;
        wrap(p);
        const bob = Math.abs(Math.sin(p.phase)) * 0.8;
        const el = pedEls.current[i];
        el?.setAttribute("transform", `translate(${p.x.toFixed(1)} ${(p.y - bob).toFixed(1)})`);
        const on = el?.isConnected && seen(p.x);
        if (on) detections += 1;
        mark(el, on);
      });
      if (detRef.current && now - lastCount > 400) {
        detRef.current.textContent = String(detections);
        lastCount = now;
      }
      bikes.forEach((b, i) => {
        b.x += b.dir * b.v * dt;
        wrap(b);
        bikeEls.current[i]?.setAttribute("transform", `translate(${b.x.toFixed(1)} ${b.y})${b.dir < 0 ? " scale(-1 1)" : ""}`);
      });
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  const { cars, peds, bikes } = agents.current;

  const secMeta = STATUS_META[security.status];
  const legend = [
    { icon: ShieldCheck, text: `Seguridad ${security.score}/100 · cobertura ${security.coverage}% · visibilidad ${security.visibility}%` },
    { icon: Camera, text: `${activeXs.length}/${LAMPS.length} cámaras de seguridad activas` },
    { icon: Lightbulb, text: `Luminarias ${Math.round(iluminacion)}%${dark ? "" : " (de día casi no se notan)"}` },
    { icon: CarFront, text: `${nCars} autos · velocidad ${Math.round(speed * 100)}%` },
    { icon: Users, text: `${formatNumber(trafficSummary.peatones)} peatones/día` },
    { icon: Bike, text: `${nBikes} ${nBikes === 1 ? "ciclista" : "ciclistas"} en la ciclorruta` },
    { icon: Building2, text: `Ventanas encendidas = consumo (${Math.round(litFrac * 100)}%)` },
    { icon: CloudFog, text: `Smog = AQI ${Math.round(aire)}` },
  ];

  const building = dark ? "#172136" : mix("#64748b", "#334155", overcast);
  const buildingEdge = dark ? "#0b1220" : "#334155";
  const glass = dark ? "#0e1626" : mix("#bae6fd", "#94a3b8", overcast);

  return (
    <section className={`bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 sm:p-6 animate-fade-in ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Vista del Gemelo</h3>
          <p className="text-sm text-slate-400">Barrio con los Cerros Orientales al fondo, reaccionando en tiempo real</p>
        </div>
        {live && (
          <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-1 text-[11px] font-semibold text-red-300">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" /> EN VIVO
          </span>
        )}
      </div>

      <div className="relative mt-4 overflow-hidden rounded-xl border border-slate-700/60">
        {/* HUD de seguridad y contexto */}
        <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 rounded-lg bg-slate-950/75 backdrop-blur px-2.5 py-1.5 text-[11px] text-slate-200">
            <ShieldCheck size={13} className={secMeta.text} />
            Seguridad <strong className="text-white">{security.score}/100</strong>
            <span className={secMeta.text}>{security.label}</span>
          </span>
          <span className="flex items-center gap-1.5 rounded-lg bg-slate-950/75 backdrop-blur px-2.5 py-1.5 text-[11px] text-slate-300">
            <ScanEye size={13} className="text-cyan-300" />
            Detecciones en vivo: <strong ref={detRef} className="text-cyan-300 tabular-nums">0</strong>
          </span>
        </div>
        <div className="pointer-events-none absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-lg bg-slate-950/75 backdrop-blur px-2.5 py-1.5 text-[11px] text-slate-200">
          <Icon name={c.icon} size={13} className="text-sky-300" />
          {f.name} · {c.name} · {formatNumber(temperatura, 1, 0)} °C
        </div>

        <svg
          viewBox="0 0 800 300"
          preserveAspectRatio="xMidYMid slice"
          className="block w-full h-60 sm:h-80"
          role="img"
          aria-label={`Escena del barrio en la ${f.name.toLowerCase()}, clima ${c.name.toLowerCase()}: luminarias al ${Math.round(iluminacion)}%, ${nCars} autos, ${activeXs.length} cámaras activas, seguridad ${security.score} de 100, AQI ${Math.round(aire)}, ${formatNumber(temperatura, 1, 0)} grados`}
        >
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={skyTop} style={{ transition: "stop-color 0.8s" }} />
              <stop offset="100%" stopColor={horizon} style={{ transition: "stop-color 0.8s" }} />
            </linearGradient>
            <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde68a" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="heat" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.rain || c.hail ? "#1f2a3d" : "#0f1521"} />
              <stop offset="100%" stopColor={c.rain || c.hail ? "#111a2b" : "#0a0f19"} />
            </linearGradient>
            <radialGradient id="sunGlow">
              <stop offset="0%" stopColor="#fff7d6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
            </radialGradient>
            <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
            <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
            <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          {/* Cielo según franja horaria y clima */}
          <rect width="800" height="300" fill="url(#sky)" />
          <g opacity={starAlpha} style={{ transition: "opacity 0.6s" }}>
            {STARS.map((st, i) => (
              <circle key={i} className="scene-star" cx={st.x} cy={st.y} r={st.r} fill="#e2e8f0" style={{ animationDelay: `${st.d}s` }} />
            ))}
          </g>
          {dark ? (
            <g opacity={clamp(0.9 - haze - overcast * 0.8, 0.1, 0.9)}>
              <circle cx="712" cy="46" r="15" fill="#f1f5f9" />
              <circle cx="706" cy="42" r="15" fill="#060a14" opacity={0.35} />
            </g>
          ) : (
            <g opacity={clamp(1.1 - overcast * 1.3, 0.05, 1)} style={{ transition: "opacity 0.8s" }}>
              <circle cx={sunPos[0]} cy={sunPos[1]} r="48" fill="url(#sunGlow)" />
              <circle cx={sunPos[0]} cy={sunPos[1]} r="16" fill="#fff4c2" />
            </g>
          )}

          {/* Cerros Orientales y Monserrate */}
          <path d={FAR_RANGE} fill={dark ? "#0c1524" : mix("#5f7f96", "#7c8a99", overcast)} />
          <g transform="translate(553 70)">
            <rect x="0" y="2" width="14" height="7" fill={dark ? "#1f2937" : "#f8fafc"} />
            <rect x="5" y="-4" width="4" height="6" fill={dark ? "#1f2937" : "#f8fafc"} />
            {dark && <circle cx="7" cy="4" r="6" fill="#fde68a" opacity="0.45" filter="url(#glow)" />}
            <text x="7" y="-8" textAnchor="middle" fontSize="7" fill={dark ? "#64748b" : "#e2e8f0"}>Monserrate</text>
          </g>
          <path d={NEAR_RANGE} fill={dark ? "#0a1410" : mix("#3f6b4c", "#566b5c", overcast)} />
          <rect y="150" width="800" height="80" fill="url(#heat)" opacity={heat} style={{ transition: "opacity 0.6s" }} />

          {/* Nubes */}
          <g className="scene-smog" opacity={dark ? 0.55 : 0.9}>
            {CLOUDS.slice(0, c.clouds).map((cl, i) => (
              <g key={i} transform={`translate(${cl.x} ${cl.y}) scale(${cl.s})`} filter="url(#soft)">
                <ellipse cx="0" cy="0" rx="46" ry="14" fill={dark ? "#334155" : overcast > 0.5 ? "#94a3b8" : "#f1f5f9"} />
                <ellipse cx="-18" cy="-8" rx="22" ry="14" fill={dark ? "#334155" : overcast > 0.5 ? "#a3b1c2" : "#ffffff"} />
                <ellipse cx="14" cy="-10" rx="26" ry="16" fill={dark ? "#3b4a60" : overcast > 0.5 ? "#a3b1c2" : "#ffffff"} />
              </g>
            ))}
          </g>

          {/* Skyline lejano */}
          {FAR.map((b, i) => (
            <rect key={i} x={b.x} y={GROUND - b.h} width={b.w} height={b.h} fill={dark ? "#0f1a2e" : mix("#7b8da3", "#8793a3", overcast)} opacity={dark ? 1 : 0.85} />
          ))}

          {/* Edificios con volumen, ventanas y paneles solares */}
          {BUILDINGS.map((b, bi) => (
            <g key={bi}>
              <rect x={b.x} y={GROUND - b.h} width={b.w} height={b.h} fill={building} stroke={buildingEdge} />
              <rect x={b.x + b.w - 9} y={GROUND - b.h} width="9" height={b.h} fill="#000" opacity="0.22" />
              <rect x={b.x} y={GROUND - b.h} width={b.w} height="3" fill="#fff" opacity={dark ? 0.05 : 0.18} />
              {b.antenna && (
                <>
                  <line x1={b.x + b.w / 2} y1={GROUND - b.h} x2={b.x + b.w / 2} y2={GROUND - b.h - 16} stroke="#475569" strokeWidth="1.5" />
                  <circle className="scene-led" cx={b.x + b.w / 2} cy={GROUND - b.h - 17} r="2" fill="#ef4444" />
                </>
              )}
              {b.solar && (
                <g opacity={0.45 + Math.min(1, solar) * 0.55}>
                  {[0, 1, 2].map((k) => (
                    <polygon
                      key={k}
                      points={`${b.x + 8 + k * 26},${GROUND - b.h - 2} ${b.x + 28 + k * 26},${GROUND - b.h - 2} ${b.x + 24 + k * 26},${GROUND - b.h - 9} ${b.x + 12 + k * 26},${GROUND - b.h - 9}`}
                      fill="#1d4ed8"
                      stroke={dark ? "#60a5fa" : "#bfdbfe"}
                      strokeWidth="0.8"
                    />
                  ))}
                </g>
              )}
              {b.windows.map((w, wi) => {
                const on = lit[bi][wi] && (dark || w.t < litFrac * 0.35);
                return (
                  <rect
                    key={wi}
                    x={w.x}
                    y={w.y}
                    width="6"
                    height="8"
                    rx="1"
                    fill={on ? (w.t < 0.12 ? "#bfdbfe" : "#fcd34d") : glass}
                    opacity={on ? 0.85 : dark ? 1 : 0.55}
                  />
                );
              })}
            </g>
          ))}

          {/* Transformador del sector 4-B */}
          <g transform="translate(446 188)">
            <circle cx="8" cy="10" r="14" fill={overload} opacity="0.35" filter="url(#glow)" className={consumo >= 430 ? "scene-led" : ""} />
            <rect width="16" height="20" rx="2" fill="#334155" stroke="#64748b" />
            <path d="M9 3 L5 11 H8 L7 17 L11 8 H8 Z" fill={overload} />
            <text x="8" y="-4" textAnchor="middle" fontSize="7" fill={dark ? "#94a3b8" : "#f1f5f9"}>4-B</text>
          </g>

          {/* Andén, vía y ciclorruta */}
          <rect y={GROUND} width="800" height="10" fill={dark ? "#273244" : "#6b7280"} />
          <rect y="232" width="800" height="54" fill="url(#road)" />
          <line x1="0" x2="800" y1="259" y2="259" stroke={dark ? "#64748b" : "#e5e7eb"} strokeWidth="1.5" strokeDasharray="16 12" />
          <rect y="286" width="800" height="14" fill="#14532d" opacity="0.7" />
          <line x1="0" x2="800" y1="286" y2="286" stroke="#22c55e" strokeOpacity="0.5" strokeWidth="1" />

          {/* Peatones (con caja de detección de las cámaras) */}
          {peds.slice(0, nPeds).map((p, i) => (
            <g key={i} ref={(el) => { pedEls.current[i] = el; }} transform="translate(-60 0)">
              <circle cx="0" cy="-10" r="2" fill={dark ? "#e2e8f0" : "#1e293b"} />
              <line x1="0" y1="-8" x2="0" y2="-3" stroke={dark ? "#cbd5e1" : "#334155"} strokeWidth="2" strokeLinecap="round" />
              <line x1="0" y1="-3" x2="-1.5" y2="1" stroke={dark ? "#cbd5e1" : "#334155"} strokeWidth="1.5" strokeLinecap="round" />
              <line x1="0" y1="-3" x2="1.5" y2="1" stroke={dark ? "#cbd5e1" : "#334155"} strokeWidth="1.5" strokeLinecap="round" />
              <rect x="-5" y="-15" width="10" height="18" fill="none" stroke="#22d3ee" strokeWidth="0.9" opacity="0" />
            </g>
          ))}

          {/* Autos (con caja de detección) */}
          {cars.slice(0, nCars).map((car, i) => (
            <g key={i} ref={(el) => { carEls.current[i] = el; }} transform="translate(-60 0)">
              {beams && <polygon points="14,-2 46,-7 46,5 14,2" fill="#fde68a" opacity={0.14 + (1 - light) * 0.1} />}
              <ellipse cx="0" cy="7" rx="15" ry="2" fill="#000" opacity="0.35" />
              <rect x="-14" y="-5" width="28" height="11" rx="3" fill={car.color} />
              <rect x="-7" y="-9" width="13" height="6" rx="2" fill={car.color} />
              <rect x="-5" y="-8" width="9" height="4" rx="1" fill="#0f172a" opacity="0.7" />
              <circle cx="13" cy="0" r="1.6" fill="#fef3c7" />
              <rect x="-14.5" y="-3" width="2" height="4" rx="0.5" fill="#ef4444" opacity={speed < 0.5 ? 1 : 0.7} />
              <rect x="-17" y="-12" width="34" height="21" rx="1" fill="none" stroke="#22d3ee" strokeWidth="0.9" opacity="0" />
            </g>
          ))}

          {/* Ciclistas en la ciclorruta */}
          {bikes.slice(0, nBikes).map((b, i) => (
            <g key={i} ref={(el) => { bikeEls.current[i] = el; }} transform="translate(-60 0)">
              <circle cx="-5" cy="0" r="3" fill="none" stroke="#86efac" strokeWidth="1.2" />
              <circle cx="5" cy="0" r="3" fill="none" stroke="#86efac" strokeWidth="1.2" />
              <path d="M-5 0 L-1 -4 L4 -4 L5 0 M-1 -4 L0 -8" fill="none" stroke="#86efac" strokeWidth="1.2" />
              <circle cx="0" cy="-10" r="1.8" fill="#e2e8f0" />
            </g>
          ))}

          {/* Postes: luminarias + cámaras de seguridad */}
          {LAMPS.map((x, i) => {
            const cam = activeXs.includes(x + 1);
            return (
              <g key={x}>
                <polygon
                  points={`${x + 10},156 ${x + 16},156 ${x + 52},286 ${x - 26},286`}
                  fill="url(#cone)"
                  opacity={light * 0.55 * lampAlpha}
                  style={{ mixBlendMode: "screen", transition: "opacity 0.4s" }}
                />
                <ellipse cx={x + 13} cy="262" rx="42" ry="10" fill="#fde68a" opacity={light * (c.rain || c.hail ? 0.26 : 0.14) * lampAlpha} style={{ transition: "opacity 0.4s" }} />
                <line x1={x} y1="228" x2={x} y2="150" stroke="#475569" strokeWidth="2.5" />
                <line x1={x} y1="151" x2={x + 13} y2="151" stroke="#475569" strokeWidth="2.5" />
                <rect x={x + 6} y="151" width="14" height="4" rx="2" fill={light > 0.05 ? "#fef3c7" : "#334155"} opacity={0.25 + light * 0.75} />
                <circle cx={x + 13} cy="156" r="7" fill="#fde68a" opacity={light * 0.5 * lampAlpha} filter="url(#glow)" />
                <g transform={`translate(${x + 1} 186)`}>
                  {cam && (
                    <g transform="rotate(62)">
                      <polygon className="scene-sweep" points="0,0 80,-16 80,16" fill="#22d3ee" opacity={0.1 + 0.08 * c.vis} style={{ animationDelay: `${i * 0.6}s` }} />
                    </g>
                  )}
                  <rect x="-1" y="-3" width="10" height="6" rx="1.5" fill={cam ? "#cbd5e1" : "#475569"} />
                  <circle cx="7.5" cy="-1.5" r="1.2" fill={cam ? "#ef4444" : "#1e293b"} className={cam ? "scene-led" : ""} />
                </g>
              </g>
            );
          })}

          {/* Lluvia / granizo */}
          {(c.rain || c.hail) && (
            <g opacity={c.hail ? 0.9 : 0.35 + 0.45 * c.rain}>
              <g className={c.hail ? "scene-hail" : "scene-rain"}>
                {[0, -300].map((dy) =>
                  DROPS.slice(0, c.hail ? 70 : Math.round(60 + 50 * c.rain)).map((d, i) =>
                    c.hail ? (
                      <circle key={`${dy}-${i}`} cx={d.x} cy={d.y + dy} r="1.5" fill="#f1f5f9" />
                    ) : (
                      <line key={`${dy}-${i}`} x1={d.x} y1={d.y + dy} x2={d.x - 3} y2={d.y + dy + d.l} stroke="#bfdbfe" strokeWidth="1" strokeLinecap="round" />
                    ),
                  ),
                )}
              </g>
            </g>
          )}

          {/* Niebla */}
          {c.fog && (
            <g>
              <rect width="800" height="300" fill={dark ? "#475569" : "#e2e8f0"} opacity="0.4" />
              <g filter="url(#blur)" className="scene-smog">
                <ellipse cx="200" cy="200" rx="220" ry="40" fill={dark ? "#64748b" : "#f8fafc"} opacity="0.7" />
                <ellipse cx="600" cy="170" rx="240" ry="44" fill={dark ? "#64748b" : "#f8fafc"} opacity="0.7" />
              </g>
            </g>
          )}

          {/* Smog según calidad del aire */}
          <g opacity={haze} style={{ transition: "opacity 0.6s" }}>
            <rect width="800" height="300" fill="#a8a29e" opacity="0.55" />
            <g filter="url(#blur)" className="scene-smog">
              <ellipse cx="160" cy="170" rx="160" ry="36" fill="#78716c" />
              <ellipse cx="480" cy="140" rx="200" ry="40" fill="#78716c" />
              <ellipse cx="720" cy="190" rx="140" ry="30" fill="#78716c" />
            </g>
          </g>
        </svg>
      </div>

      <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-400">
        {legend.map(({ icon: Ico, text }, i) => (
          <li key={i} className="flex items-center gap-2">
            <Ico size={14} className="text-slate-500 shrink-0" /> <span>{text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
