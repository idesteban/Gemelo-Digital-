"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, ChartTooltip, LegendRow, SERIES, Stat, pctDelta } from "@/components/dashboard/ChartParts";
import { formatNumber } from "@/lib/simulation";

const ROWS = [
  { key: "consumo", baseKey: "baseConsumo", label: "kWh de red", color: SERIES.blue },
  { key: "solar", baseKey: "baseSolar", label: "kWh solares", color: SERIES.green },
];

// Barra con punta redondeada de 4px y, si se compara, una marca en el valor base.
function BarWithBase({ x, y, width, height, fill, payload, baseKey, compare }) {
  if (!height || height <= 0) return null;
  const r = Math.min(4, width / 2, height);
  const path = `M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`;
  const valueKey = baseKey === "baseConsumo" ? "consumo" : "solar";
  const perUnit = height / payload[valueKey];
  const baseY = y + height - payload[baseKey] * perUnit;
  return (
    <g>
      <path d={path} fill={fill} />
      {compare && payload[baseKey] !== payload[valueKey] && (
        <line x1={x - 3} x2={x + width + 3} y1={baseY} y2={baseY} stroke="#e2e8f0" strokeWidth={2} strokeLinecap="round" />
      )}
    </g>
  );
}

export default function EnergyChart({ data, summary, baseSummary, compare = false }) {
  const max = Math.max(...data.map((d) => Math.max(d.consumo, compare ? d.baseConsumo : 0)));
  const top = Math.max(400, Math.ceil(max / 100) * 100);
  const ticks = Array.from({ length: top / 100 + 1 }, (_, i) => i * 100);

  return (
    <ChartCard
      title="Consumo Energético Semanal"
      subtitle="Comparativa: consumo de red vs. generación solar"
      stats={
        <>
          <Stat label="Consumo semana" value={formatNumber(summary.consumo)} unit="kWh" delta={pctDelta(summary.consumo, baseSummary.consumo)} goodWhen="down" />
          <Stat label="Cobertura solar" value={`${Math.round(summary.coverage * 100)}%`} unit="" delta={(summary.coverage - baseSummary.coverage) * 100} deltaUnit=" pts" goodWhen="up" />
          <Stat label="CO₂ de la red" value={formatNumber(summary.co2)} unit="kg" delta={pctDelta(summary.co2, baseSummary.co2)} goodWhen="down" />
        </>
      }
    >
      <div className="h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 18, right: 12, left: -8, bottom: 0 }} barGap={2} barCategoryGap="22%">
            <CartesianGrid stroke={SERIES.grid} vertical={false} />
            <XAxis dataKey="dia" stroke={SERIES.axis} tick={{ fill: SERIES.tick, fontSize: 12 }} tickLine={false} />
            <YAxis
              stroke={SERIES.axis}
              tick={{ fill: SERIES.tick, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              domain={[0, top]}
              ticks={ticks}
            />
            <Tooltip content={<ChartTooltip rows={ROWS} compare={compare} />} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
            <Bar dataKey="consumo" fill={SERIES.blue} maxBarSize={24} animationDuration={400}
              shape={(p) => <BarWithBase {...p} baseKey="baseConsumo" compare={compare} />} />
            <Bar dataKey="solar" fill={SERIES.green} maxBarSize={24} animationDuration={400}
              shape={(p) => <BarWithBase {...p} baseKey="baseSolar" compare={compare} />} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <LegendRow
        items={[
          { label: "Consumo Red", color: SERIES.blue },
          { label: "Energía Solar", color: SERIES.green },
          ...(compare ? [{ label: "Marca blanca = valor base", color: "#e2e8f0", kind: "tick" }] : []),
        ]}
      />
    </ChartCard>
  );
}
