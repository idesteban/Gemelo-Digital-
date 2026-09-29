"use client";
import { useEffect, useState } from "react";

// Hora actual que se refresca cada `interval` ms. Devuelve null hasta montar
// en el cliente para no provocar diferencias de hidratación.
export function useNow(interval = 1000) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}

const DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];

export function formatDate(ts) {
  const d = new Date(ts);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(ts) {
  const d = new Date(ts);
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
}

export function formatAgo(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 10) return "Justo ahora";
  if (s < 60) return `Hace ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `Hace ${m} min`;
  return `Hace ${Math.floor(m / 60)} h`;
}
