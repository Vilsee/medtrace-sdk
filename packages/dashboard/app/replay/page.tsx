"use client";

import React, { useState, Suspense } from "react";
import Spline from "@splinetool/react-spline/next";
import { fetchTrace, TraceSpan } from "@/lib/api";
import { 
  Play, 
  Activity, 
  Lock, 
  Terminal, 
  Copy, 
  Check, 
  AlertCircle,
  Database,
  Cpu
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8765";

export default function ReplayPage() {
  const [traceId, setTraceId] = useState("");
  const [traceData, setTraceData] = useState<TraceSpan[] | null>(null);
  const [replayOutput, setReplayOutput] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDryRun, setIsDryRun] = useState(false);
  const [copied, setCopied] = useState(false);

  async function loadTrace() {
    if (!traceId.trim()) {
      setStatus("error");
      setErrorMsg("Please enter a valid Trace ID");
      return;
    }

    setStatus("loading");
    setTraceData(null);
    setReplayOutput(null);
    
    try {
      const spans = await fetchTrace(traceId);
      setTraceData(spans);
      setStatus("idle");
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      setStatus("error");
      setErrorMsg(error.message === "Failed to fetch trace" ? "Trace ID not found" : "Server unreachable");
    }
  }

  async function startReplay() {
    if (!traceId) return;
    
    setStatus("loading");
    try {
      if (isDryRun) {
        // Mock dry run success
        await new Promise(resolve => setTimeout(resolve, 800));
        setReplayOutput({
          status: "dry_run_success",
          trace_id: traceId,
          execution: "simulated",
          reconstructed_context: {
              model: traceData?.[0]?.model_name,
              domain: traceData?.[0]?.clinical_domain,
              phi_check: "passed",
              safety_verification: true
          }
        });
      } else {
        const res = await fetch(`${NEXT_PUBLIC_API_URL}/traces/${traceId}/replay`);
        if (!res.ok) throw new Error("Replay failed");
        const data = await res.json();
        setReplayOutput(data);
      }
      setStatus("success");
    } catch (err: unknown) {
      const error = err as Error;
      setStatus("error");
      setErrorMsg(error.message);
    }
  }

  const handleCopy = () => {
    if (!replayOutput) return;
    navigator.clipboard.writeText(JSON.stringify(replayOutput, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-[#0A0F1C] text-white px-8 py-10 selection:bg-teal-500/30">
      {/* TOP: Spline Banner */}
      <section className="h-48 w-full rounded-2xl overflow-hidden mb-8 border border-white/5 relative bg-white/[0.02]">
        <Suspense fallback={<div className="h-48 w-full rounded-2xl bg-white/5 animate-pulse" />}>
          <Spline scene="https://prod.spline.design/Us3kYDSFsmCuBGDH/scene.splinecode" />
        </Suspense>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1C] to-transparent pointer-events-none" />
      </section>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        
        {/* LEFT: Input Panel */}
        <section className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl h-fit">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black uppercase tracking-tight">Replay Engine</h2>
            <div className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
              status === "loading" ? "bg-blue-500/20 text-blue-400" :
              status === "success" ? "bg-green-500/20 text-green-400" :
              status === "error" ? "bg-red-500/20 text-red-400" : "bg-white/5 text-slate-500"
            )}>
              {status}
            </div>
          </div>

          <div className="space-y-6">
            {/* ID Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Trace Identity</label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Enter Trace ID..." 
                    value={traceId}
                    onChange={(e) => setTraceId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-teal-500 transition-all font-mono"
                  />
                </div>
                <button 
                  onClick={loadTrace}
                  className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl border border-white/10 text-xs font-bold transition-all uppercase tracking-widest"
                >
                  Load
                </button>
              </div>
            </div>

            {/* Metadata (when loaded) */}
            {traceData && (
              <div className="grid grid-cols-2 gap-4 p-6 bg-white/5 rounded-2xl border border-white/5 animate-in fade-in zoom-in duration-500">
                <MetaItem label="Service" value={traceData[0].service_name} icon={<Cpu className="w-3 h-3" />} />
                <MetaItem label="Risk Tier" value={traceData[0].risk_tier} colored />
                <MetaItem label="Model" value={traceData[0].model_name || "Unknown"} />
                <MetaItem label="Nodes" value={traceData.length} />
              </div>
            )}

            {/* Replay Controls */}
            <div className="pt-4 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">Safe Execution Mode</span>
                  <span className="text-[10px] text-slate-500">Enable dry-run for zero-side-effect simulation</span>
                </div>
                <button 
                  onClick={() => setIsDryRun(!isDryRun)}
                  className={cn(
                    "w-12 h-6 rounded-full p-1 transition-all duration-300 relative",
                    isDryRun ? "bg-teal-500" : "bg-white/10"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 bg-white rounded-full shadow-lg transition-transform",
                    isDryRun ? "translate-x-6" : "translate-x-0"
                  )} />
                </button>
              </div>

              <button 
                onClick={startReplay}
                disabled={status === "loading" || !traceData}
                className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-600 text-[#0A0B14] py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-3 shadow-xl shadow-teal-500/10 active:scale-[0.98]"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Begin {isDryRun ? "Simulation" : "State Replay"}</span>
              </button>
            </div>

            {/* Errors */}
            {status === "error" && (
              <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/10 rounded-2xl text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{errorMsg}</span>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT: Output Panel */}
        <section className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <Terminal className="w-5 h-5 text-teal-400" />
              <h2 className="text-xl font-black uppercase tracking-tight">Replay Output</h2>
            </div>
            {replayOutput && (
              <button 
                onClick={handleCopy}
                className="p-2 hover:bg-white/5 rounded-lg transition-all text-slate-500 hover:text-teal-400"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>

          {isDryRun && replayOutput && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-widest py-2 px-4 rounded-lg mb-4 text-center">
              DRY RUN — no execution occurred
            </div>
          )}

          <div className="flex-1 bg-[#0D1117] font-mono text-sm text-green-400 rounded-xl p-6 border border-white/5 overflow-auto custom-scrollbar shadow-inner">
            {replayOutput ? (
              <pre className="whitespace-pre-wrap">{JSON.stringify(replayOutput, null, 2)}</pre>
            ) : status === "loading" ? (
              <div className="flex flex-col space-y-4 animate-pulse">
                <div className="h-4 w-3/4 bg-white/5 rounded" />
                <div className="h-4 w-1/2 bg-white/5 rounded" />
                <div className="h-4 w-5/6 bg-white/5 rounded" />
                <div className="h-4 w-2/3 bg-white/5 rounded" />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-700 font-bold uppercase tracking-[0.2em] text-[10px]">
                <Activity className="w-8 h-8 mb-4 opacity-10" />
                <span>Waiting for Transaction...</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetaItem({ label, value, icon, colored }: { label: string; value: any; icon?: React.ReactNode; colored?: boolean }) {
  const riskColor = value === "critical" ? "text-red-500" : value === "high" ? "text-orange-500" : "text-teal-400";
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
      <div className="flex items-center space-x-2">
        {icon && <div className="text-slate-600">{icon}</div>}
        <span className={cn("text-xs font-bold font-mono tracking-tight", colored ? riskColor : "text-white")}>
          {value}
        </span>
      </div>
    </div>
  );
}
