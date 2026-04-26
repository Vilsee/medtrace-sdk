"use client";

import React, { useState } from "react";
import { exportAudit, fetchAuditSummary, AuditSummary } from "@/lib/api";
import { Download, FileText, CheckCircle, AlertCircle, Info } from "lucide-react";

export default function AuditExport() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState<AuditSummary | null>(null);

  const handleExport = async () => {
    if (!start || !end) {
      setStatus("error");
      setMessage("Please select both start and end dates.");
      return;
    }

    setStatus("loading");
    setMessage("Exporting audit archive...");

    try {
      const blob = await exportAudit(start, end);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_${start}_to_${end}.ndjson`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus("success");
      setMessage(`Archive downloaded successfully.`);
    } catch {
      setStatus("error");
      setMessage("Failed to generate export. Check server connection.");
    }
  };

  const loadSummary = async () => {
    try {
      const data = await fetchAuditSummary();
      setSummary(data);
    } catch (error) {
      console.error("Summary fetch failed:", error);
    }
  };

  return (
    <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">Export Audit Archive</h2>
          <div className="inline-flex items-center space-x-1.5 mt-1 bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20">
            <span className="text-[9px] font-black uppercase tracking-widest">EU AI Act Compliant</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Start Date</label>
            <input 
              type="date" 
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition-all text-slate-400"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">End Date</label>
            <input 
              type="date" 
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition-all text-slate-400"
            />
          </div>
        </div>

        <div className="flex space-x-3">
          <button 
            onClick={handleExport}
            disabled={status === "loading"}
            className="flex-1 flex items-center justify-center space-x-2 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 text-[#0A0B14] py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{status === "loading" ? "Exporting..." : "Export NDJSON"}</span>
          </button>
          
          <button 
            onClick={loadSummary}
            className="flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>

        {/* Status Messages */}
        {message && (
          <div className={`flex items-center space-x-3 p-4 rounded-xl border ${
            status === "error" ? "bg-red-500/10 border-red-500/10 text-red-400" : 
            status === "success" ? "bg-green-500/10 border-green-500/10 text-green-400" :
            "bg-blue-500/10 border-blue-500/10 text-blue-400"
          }`}>
            {status === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span className="text-xs font-bold font-mono uppercase tracking-tighter">{message}</span>
          </div>
        )}

        {/* Summary Grid */}
        {summary && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-black/20 rounded-xl border border-white/5 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <SummaryItem label="Total Spans" value={summary.total_spans} />
             <SummaryItem label="PHI Redacted" value={summary.phi_scrubs_total} />
             <SummaryItem label="Safety Hits" value={summary.safety_gates_triggered} />
             <SummaryItem label="High Risk" value={summary.high_risk_spans} />
          </div>
        )}

        <div className="flex items-start space-x-2.5 text-slate-500 bg-white/[0.02] p-3 rounded-xl">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] leading-relaxed font-medium">
            Each span entry includes a **SHA-256 integrity hash** generated at ingestion for cryptographically verified tamper detection.
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex flex-col">
       <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{label}</span>
       <span className="text-sm font-black text-white">{value}</span>
    </div>
  );
}
