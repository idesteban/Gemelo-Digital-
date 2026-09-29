"use client";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function CarbonChart({ data }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white">Huella de Carbono</h3>
      <p className="text-sm text-slate-400">Emisión mensual vs. objetivo (kg CO₂)</p>
      <div className="h-72 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="#26324a" vertical={false} />
            <XAxis dataKey="mes" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} />
            <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 8]} ticks={[0, 2, 4, 6, 8]} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: "#94a3b8" }}
              formatter={(v, name) => [`${v} kg`, name === "emision" ? "Emisión" : "Objetivo"]}
            />
            <Line type="monotone" dataKey="emision" stroke="#0ea371" strokeWidth={2} dot={{ r: 4, fill: "#0ea371", stroke: "#1e293b", strokeWidth: 2 }} />
            <Line type="monotone" dataKey="objetivo" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 flex justify-center gap-5 text-xs text-slate-300">
        <li className="flex items-center gap-2"><span className="inline-block w-4 h-0.5 bg-[#0ea371]" /> Emisión</li>
        <li className="flex items-center gap-2"><span className="inline-block w-4 border-t-2 border-dashed border-slate-400" /> Objetivo</li>
      </ul>
    </div>
  );
}
