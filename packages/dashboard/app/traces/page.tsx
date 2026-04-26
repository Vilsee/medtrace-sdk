"use client";

import React, { useEffect, useState, useCallback } from "react";
import SplineScene from "@/components/SplineScene";
import TraceCard from "@/components/TraceCard";
import { fetchTraces, TraceSpan } from "@/lib/api";
import { Search, X, ChevronRight, ChevronDown, Shield, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// Domains from our SDK schema
const DOMAINS = ["cardiology", "oncology", "emergency", "general", "mental_health", "radiology", "pharmacy"];
const RISK_TIERS = ["low", "moderate", "high", "critical"];

export default function TracesPage() {
  const [traces, setTraces] = useState<TraceSpan[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);
  
  // Filters
  const [service, setService] = useState("");
  const [domain, setDomain] = useState("all");
  const [riskTier, setRiskTier] = useState("all");
  const [limit] = useState(10);
  const [page, setPage] = useState(1);

  const loadTraces = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetchTraces({
        service: service || undefined,
        domain: domain === "all" ? undefined : domain,
        risk_tier: riskTier === "all" ? undefined : riskTier,
        limit: limit,
      });
      setTraces(resp.items);
      setTotal(resp.total);
    } catch (error) {
      console.error("Failed to load traces:", error);
    } finally {
      setLoading(false);
    }
  }, [service, domain, riskTier, limit, page]);

  // Initial load
  useEffect(() => {
    const timer = setTimeout(loadTraces, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [loadTraces]);

  const clearFilters = () => {
    setService("");
    setDomain("all");
    setRiskTier("all");
    setPage(1);
  };

  // Compute domain breakdown for the chart
  const domainData = DOMAINS.map(d => ({
    name: d.split("_")[0].toUpperCase(),
    count: traces.filter(t => t.clinical_domain === d).length
  })).filter(d => d.count > 0);

  return (
    <main className="min-h-screen bg-[#0A0F1C] text-white p-8">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8 max-w-[1600px] mx-auto">
        
        {/* LEFT COLUMN */}
        <section className="space-y-6">
          {/* 1. Filter Bar */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px] space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Service Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="e.g. diagnostic-engine" 
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            
            <FilterSelect 
              label="Clinical Domain" 
              value={domain} 
              options={["all", ...DOMAINS]} 
              onChange={setDomain} 
            />
            
            <FilterSelect 
              label="Risk Tier" 
              value={riskTier} 
              options={["all", ...RISK_TIERS]} 
              onChange={setRiskTier} 
            />

            <button 
              onClick={clearFilters}
              className="px-4 py-2.5 rounded-xl border border-white/5 text-slate-500 hover:text-white hover:bg-white/5 transition-all text-sm font-bold"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 2. Results List */}
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-44 bg-white/5 rounded-3xl animate-pulse" />)
            ) : traces.length > 0 ? (
              traces.map(trace => (
                <div key={trace.id} className="space-y-2">
                  <div 
                    onClick={() => setExpandedTrace(expandedTrace === trace.trace_id ? null : trace.trace_id)}
                    className="cursor-pointer transition-transform active:scale-[0.99]"
                  >
                    <TraceCard trace={trace} />
                  </div>
                  
                  {expandedTrace === trace.trace_id && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 ml-4 animate-in slide-in-from-top-2 duration-300">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Span Execution Tree</h4>
                      {/* Simplified Span Tree - in a real app, this would be computed by parent_span_id */}
                      <div className="space-y-4">
                        <SpanNode name={trace.span_name} latency={trace.latency_ms || 0} type={trace.agent_type || "N/A"} safety={trace.safety_gate_triggered} level={0} />
                        <SpanNode name="phi_scrubber_node" latency={12} type="internal" safety={false} level={1} />
                        <SpanNode name="clinical_logic_node" latency={245} type="reasoning" safety={trace.safety_gate_triggered} level={1} />
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                <p className="text-slate-500 font-medium font-mono text-xs tracking-widest uppercase">No clinical traces found</p>
              </div>
            )}
          </div>

          {/* 3. Pagination */}
          <div className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-2xl">
             <span className="text-xs text-slate-500 font-mono">SHOWING {traces.length} OF {total} TOTAL</span>
             <div className="flex space-x-2">
                <button className="px-4 py-2 bg-white/5 rounded-lg text-xs font-bold text-slate-400 hover:text-white disabled:opacity-30" disabled={page === 1}>PREV</button>
                <button className="px-4 py-2 bg-white/5 rounded-lg text-xs font-bold text-slate-400 hover:text-white" disabled={traces.length < limit}>NEXT</button>
             </div>
          </div>
        </section>

        {/* RIGHT COLUMN */}
        <aside className="hidden xl:block space-y-8">
          <SplineScene 
            sceneUrl="https://prod.spline.design/JN450hb8wloMLhT2/scene.splinecode" 
            className="sticky top-8 h-[480px] rounded-3xl border border-white/10"
          />
          
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Domain Insights</h3>
              <BarChart2 className="w-4 h-4 text-slate-500" />
            </div>
            
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={domainData.length > 0 ? domainData : [{name: 'NONE', count: 0}]}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 9}} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '10px'}}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {domainData.map((entry, index) => (
                      <Cell key={index} fill={index % 2 === 0 ? '#3b82f6' : '#14b8a6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string, value: string, options: string[], onChange: (v: string) => void }) {
  return (
    <div className="space-y-2 lg:w-48">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{label}</label>
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer text-slate-300"
      >
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-[#0A0F1C]">{opt.replace("_", " ").toUpperCase()}</option>
        ))}
      </select>
    </div>
  );
}

function SpanNode({ name, latency, type, safety, level }: { name: string, latency: number, type: string, safety: boolean, level: number }) {
  return (
    <div className="flex items-center justify-between group" style={{ marginLeft: `${level * 24}px` }}>
      <div className="flex items-center space-x-3">
        <div className="w-px h-10 bg-white/5 absolute -left-4" />
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{name}</span>
          <span className="text-[9px] text-slate-600 uppercase font-mono">{type}</span>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {safety && <Shield className="w-3 h-3 text-amber-500" />}
        <span className="text-[10px] font-mono text-slate-500">{latency}ms</span>
      </div>
    </div>
  );
}
