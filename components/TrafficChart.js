"use client";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, ChartTooltip, LegendRow, SERIES, Stat, pctDelta } from "@/components/dashboard/ChartParts";
import { formatNumber, franjaById } from "@/lib/simulation";

const ROWS = [
  { key: "vehiculos", baseKey: "baseVehiculos", label: "vehículos", color: SERIES.blue },
  { key: "peatones", baseKey: "basePeatones", label: "peatones", color: SERIES.green },
];

export default function TrafficChart({ data, summary, baseSummary, compare = false, franja }) {
  const band = franja ? franjaById(franja) : null;
  const max = Math.max(...data.map((d) => Math.max(d.vehiculos, compare ? d.baseVehiculos : 0)));
  const top = Math.max(1200, Math.ceil(max / 300) * 300);
  const ticks = Array.from({ length: top / 300 + 1 }, (_, i) => i * 300);
  const { peak } = summary;

  return (
    <ChartCard
      title="Flujo de Tráfico"
      subtitle="Vehículos y peatones por hora — Hoy"
      stats={
        <>
          <Stat label="Pico vehicular" value={formatNumber(peak.vehiculos)} unit={peak.hora} delta={pctDelta(peak.vehiculos, baseSummary.peak.vehiculos)} goodWhen="down" />
          <Stat label="Vehículos (día)" value={formatNumber(summary.vehiculos)} unit="veh" delta={pctDelta(summary.vehiculos, baseSummary.vehiculos)} goodWhen="down" />
          <Stat label="Peatones (día)" value={formatNumber(summary.peatones)} unit="pers" delta={pctDelta(summary.peatones, baseSummary.peatones)} goodWhen="up" />
        </>
      }
    >
      <div className="h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 18, right: 12, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="gVeh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES.blue} stopOpacity={0.28} />
                <stop offset="100%" stopColor={SERIES.blue} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gPea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES.green} stopOpacity={0.28} />
                <stop offset="100%" stopColor={SERIES.green} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            {band?.hours.length > 0 && (
              <ReferenceArea x1={band.hours[0]} x2={band.hours[1]} fill="#94a3b8" fillOpacity={0.08} ifOverflow="extendDomain"
                label={{ value: band.name, position: "insideTopLeft", fill: "#94a3b8", fontSize: 11 }} />
            )}
            <CartesianGrid stroke={SERIES.grid} vertical={false} />
            <XAxis dataKey="hora" stroke={SERIES.axis} tick={{ fill: SERIES.tick, fontSize: 12 }} tickLine={false} />
            <YAxis
              stroke={SERIES.axis}
              tick={{ fill: SERIES.tick, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              domain={[0, top]}
              ticks={ticks}
              tickFormatter={(v) => formatNumber(v)}
            />
            <Tooltip
              content={<ChartTooltip rows={ROWS} compare={compare} />}
              cursor={{ stroke: "#64748b", strokeWidth: 1 }}
            />
            {compare && (
              <Line type="monotone" dataKey="baseVehiculos" stroke={SERIES.blue} strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="5 4" dot={false} activeDot={false} isAnimationActive={false} />
            )}
            {compare && (
              <Line type="monotone" dataKey="basePeatones" stroke={SERIES.green} strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="5 4" dot={false} activeDot={false} isAnimationActive={false} />
            )}
            <Area type="monotone" dataKey="peatones" stroke={SERIES.green} strokeWidth={2} fill="url(#gPea)" animationDuration={400}
              activeDot={{ r: 5, stroke: "#1e293b", strokeWidth: 2, fill: SERIES.green }} />
            <Area type="monotone" dataKey="vehiculos" stroke={SERIES.blue} strokeWidth={2} fill="url(#gVeh)" animationDuration={400}
              activeDot={{ r: 5, stroke: "#1e293b", strokeWidth: 2, fill: SERIES.blue }} />
            <ReferenceDot
              x={peak.hora}
              y={peak.vehiculos}
              r={4}
              fill={SERIES.blue}
              stroke="#1e293b"
              strokeWidth={2}
              label={{ value: `Pico ${formatNumber(peak.vehiculos)}`, position: "top", fill: "#e2e8f0", fontSize: 11 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <LegendRow
        items={[
          { label: "Vehículos", color: SERIES.blue },
          { label: "Peatones", color: SERIES.green },
          ...(compare ? [{ label: "Escenario base", color: "#94a3b8", kind: "line" }] : []),
        ]}
      />
    </ChartCard>
  );
}
