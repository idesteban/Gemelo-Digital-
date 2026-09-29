"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Scale, ShieldCheck, Leaf, Activity } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Virtual", icon: LayoutDashboard },
  { href: "/legalidad", label: "Legal", icon: Scale },
  { href: "/ciberseguridad", label: "Seguridad", icon: ShieldCheck },
  { href: "/sostenibilidad", label: "Ambiental", icon: Leaf },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="hidden md:flex items-center gap-2 text-white font-semibold">
          <Activity size={20} className="text-blue-400" /> Gemelo Digital
        </Link>
        <div className="flex gap-0.5 sm:gap-2 mx-auto md:mx-0 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-colors whitespace-nowrap ${pathname === item.href ? "bg-blue-500/20 text-blue-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`}
            >
              <item.icon size={16} /> {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
