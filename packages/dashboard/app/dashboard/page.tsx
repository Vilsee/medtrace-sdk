"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SplineScene from "@/components/SplineScene";
import TraceCard from "@/components/TraceCard";
import { fetchSummary, fetchTraces, fetchHealth, AuditSummary, TraceSpan } from "@/lib/api";
import { Activity, GitBranch, Shield, AlertTriangle, Lock, Zap, Server } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [traces, setTraces] = useState<TraceSpan[]>([]);
  const [isHealthy, setIsHealthy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sum, tr, health] = await Promise.all([
          fetchSummary(),
          fetchTraces({ limit: 20 }),
          fetchHealth().catch(() => ({ status: "down" }))
        ]);
        setSummary(sum);
        setTraces(tr.items);
        setIsHealthy(health.status === "ok");
      } catch (error) {
        console.error("Dashboard refresh failed:", error);
        setIsHealthy(false);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#0A0F1C] text-white selection:bg-blue-500/30">
      {/* 1. Header Section */}
      <section className="h-64 relative overflow-hidden">
        <SplineScene 
          sceneUrl="https://prod.spline.design/geWeD4ae7IXuSB3A/scene.splinecode" 
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 0 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1C] via-[#0A0F1C]/20 to-transparent z-10" />
        
        <div className="relative z-20 h-full flex flex-col justify-center px-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-4xl font-black uppercase tracking-tighter">Live Dashboard</h1>
            <div className="flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md">
              <div className={cn("w-2 h-2 rounded-full", isHealthy ? "bg-green-500 animate-pulse" : "bg-red-500")} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {isHealthy ? "System Online" : "System Offline"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-8 -mt-8 relative z-20">
        <MetricCard 
          label="Total Spans" 
          value={summary?.total_spans} 
          icon={<Activity className="w-5 h-5 text-blue-400" />} 
          loading={loading}
        />
        <MetricCard 
          label="Unique Traces" 
          value={summary?.unique_traces} 
          icon={<GitBranch className="w-5 h-5 text-purple-400" />} 
          loading={loading}
        />
        <MetricCard 
          label="Safety Gates" 
          value={summary?.safety_gates_triggered} 
          icon={<Shield className="w-5 h-5" />} 
          color={summary?.safety_gates_triggered && summary.safety_gates_triggered > 0 ? "text-amber-500" : "text-slate-400"}
          loading={loading}
        />
        <MetricCard 
          label="High Risk Spans" 
          value={summary?.high_risk_spans} 
          icon={<AlertTriangle className="w-5 h-5" />} 
          color={summary?.high_risk_spans && summary.high_risk_spans > 0 ? "text-red-500" : "text-slate-400"}
          loading={loading}
        />
        <MetricCard 
          label="PHI Scrubs" 
          value={summary?.phi_scrubs_total} 
          icon={<Lock className="w-5 h-5 text-teal-400" />} 
          loading={loading}
        />
        <MetricCard 
          label="Avg Latency" 
          value={summary ? `${summary.avg_latency_ms.toFixed(0)}ms` : null} 
          icon={<Zap className="w-5 h-5 text-yellow-400" />} 
          loading={loading}
        />
      </section>

      {/* 3. Trace Feed */}
      <section className="px-8 mt-12 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-black uppercase tracking-tight">Recent Traces</h2>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
          </div>
          <button 
            onClick={() => router.push("/traces")}
            className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors tracking-widest border-b border-slate-800"
          >
            VIEW ALL EXPLORER
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {traces.length > 0 ? (
            traces.map((trace) => (
              <div 
                key={trace.id} 
                onClick={() => router.push(`/traces?id=${trace.trace_id}`)}
                className="cursor-pointer"
              >
                <TraceCard 
                  trace={trace}
                />
              </div>
            ))
          ) : (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-44 bg-white/5 border border-white/5 rounded-2xl animate-pulse" />
            ))
          )}
        </div>
      </section>
    </main>
  );
}

interface MetricCardProps {
  label: string;
  value: any;
  icon: React.ReactNode;
  color?: string;
  loading: boolean;
}

function MetricCard({ label, value, icon, color = "text-white", loading }: MetricCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group hover:border-white/20 transition-all hover:bg-white/[0.07]">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/5 rounded-xl text-slate-400 group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
        {loading ? (
          <div className="h-8 w-24 bg-white/5 animate-pulse rounded mt-1" />
        ) : (
          <h3 className={cn("text-2xl font-black mt-1 tracking-tight", color)}>
            {value ?? 0}
          </h3>
        )}
      </div>
      <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
    </div>
  );
}
