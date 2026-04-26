"use client";

import React from "react";
import { TraceSpan } from "@/lib/api";
import { Shield, Lock, Zap, Clock } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TraceCardProps {
  trace: TraceSpan;
  onClick?: () => void;
  expanded?: boolean;
}

export default function TraceCard({ trace, onClick, expanded }: TraceCardProps) {
  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const riskColors = {
    low: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    moderate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    critical: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const currentRisk = (trace.risk_tier?.toLowerCase() as keyof typeof riskColors) || "low";

  return (
    <div 
      onClick={onClick}
      className="bg-[#111827] border border-white/10 rounded-xl p-5 cursor-pointer hover:border-white/20 transition-all group overflow-hidden"
    >
      {/* Row 1: ID, Service, Time */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="font-mono text-xs text-slate-500 truncate max-w-[150px]">
            {trace.trace_id.slice(0, 16)}...
          </span>
          <div className="bg-white/5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-slate-400 border border-white/5">
            {trace.service_name}
          </div>
        </div>
        <div className="flex items-center space-x-1.5 text-slate-600">
          <Clock className="w-3 h-3" />
          <span className="text-[10px] font-bold uppercase tracking-widest">{timeAgo(trace.start_time)}</span>
        </div>
      </div>

      {/* Row 2: Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-md">
          {trace.clinical_domain || "general"}
        </span>
        <span className="text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
          {trace.agent_type || "router"}
        </span>
        <span className={cn(
          "text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 border rounded-md",
          riskColors[currentRisk]
        )}>
          {trace.risk_tier || "low"} risk
        </span>
      </div>

      {/* Row 3: Stats */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-1.5 text-yellow-400">
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span className="text-[10px] font-bold font-mono">{trace.latency_ms || 0}ms</span>
        </div>
        
        {trace.phi_scrub_count > 0 && (
          <div className="flex items-center space-x-1.5 text-teal-400">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold font-mono">{trace.phi_scrub_count} PHI SCRUBBED</span>
          </div>
        )}

        {trace.safety_gate_triggered && (
          <div className="flex items-center space-x-1.5 text-red-500 animate-pulse">
            <Shield className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Safety gate fired</span>
          </div>
        )}
      </div>

      {/* Expanded Section */}
      {expanded && (
        <div className="mt-6 pt-6 border-t border-white/5 bg-black/20 -mx-5 -mb-5 p-5 animate-in slide-in-from-top-4 duration-300">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {Object.entries(trace).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center border-b border-white/[0.02] pb-1">
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{key.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] font-mono text-slate-300 truncate max-w-[200px]" title={String(value)}>
                    {String(value)}
                  </span>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}
