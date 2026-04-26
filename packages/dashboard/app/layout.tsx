"use client";

import React, { useState } from "react";
import { Inter } from "next/font/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Search, RotateCcw, Download, Shield, LayoutDashboard, Database } from "lucide-react";
import AuditExport from "@/components/AuditExport";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Hide sidebar on landing page
  const isLandingPage = pathname === "/";

  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0A0F1C] text-white antialiased min-h-screen`}>
        {!isLandingPage && (
          <aside className="fixed left-0 top-0 h-screen w-64 bg-[#060B14] border-r border-white/10 z-50 flex flex-col p-8">
            {/* Logo */}
            <div className="mb-12">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center font-black text-[#0A0B14]">M</div>
                <span className="text-xl font-black uppercase tracking-tighter">MedTrace</span>
              </div>
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-[0.3em] ml-10">SDK</span>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 space-y-2">
              <NavLink href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" active={pathname === "/dashboard"} />
              <NavLink href="/traces" icon={<Search className="w-4 h-4" />} label="Traces" active={pathname === "/traces"} />
              <NavLink href="/replay" icon={<RotateCcw className="w-4 h-4" />} label="Replay" active={pathname === "/replay"} />
              
              <button 
                onClick={() => setIsExportOpen(!isExportOpen)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  isExportOpen ? "bg-white/10 text-white" : "text-slate-500 hover:text-white hover:bg-white/5"
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </nav>

            {/* Bottom Version */}
            <div className="mt-auto">
              <div className="flex items-center space-x-2 text-slate-700 bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                <Database className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-widest">v0.1.0-alpha</span>
              </div>
            </div>
          </aside>
        )}

        <main className={`${!isLandingPage ? "ml-64" : ""} min-h-screen relative`}>
          {children}

          {/* Inline Export Panel Overlay */}
          {isExportOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
               <div className="absolute inset-0" onClick={() => setIsExportOpen(false)} />
               <div className="relative max-w-lg w-full">
                  <AuditExport />
               </div>
            </div>
          )}
        </main>
      </body>
    </html>
  );
}

function NavLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
        active 
          ? "bg-white/10 text-white shadow-xl shadow-white/5" 
          : "text-slate-500 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
