import { CheckCircle, Clock } from "lucide-react";

const STYLES = {
  completed: { label: "Completado", icon: CheckCircle, className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  pending: { label: "Pendiente", icon: Clock, className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
};

export default function StatusBadge({ status }) {
  const s = STYLES[status] ?? STYLES.pending;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${s.className}`}>
      <s.icon size={14} /> {s.label}
    </span>
  );
}
