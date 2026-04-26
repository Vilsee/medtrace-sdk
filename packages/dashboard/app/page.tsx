"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import SplineScene from "@/components/SplineScene";
import { fetchSummary, AuditSummary } from "@/lib/api";
import { ArrowRight, Shield, Zap, FileText } from "lucide-react";

export default function LandingPage() {
  const [stats, setStats] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await fetchSummary();
        setStats(data);
      } catch {
        console.error("Dashboard refresh failed");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white relative overflow-hidden flex flex-col items-center justify-center">
      {/* 3D Background */}
      <SplineScene 
        sceneUrl="https://prod.spline.design/uT2VgXg5qF7Y80Ym/scene.splinecode" 
        className="absolute inset-0 w-full h-full" 
        style={{ zIndex: 0 }} 
      />

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1C]/20 via-transparent to-[#0A0F1C] z-10 pointer-events-none" />

      {/* Hero Content */}
      <div className="relative z-20 flex flex-col items-center justify-center px-6 text-center max-w-4xl">
        {/* Badge Pill */}
        <div className="inline-flex items-center space-x-2 border border-teal-500/30 bg-teal-500/10 rounded-full px-4 py-1.5 mb-8 backdrop-blur-md">
          <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
          <span className="text-teal-400 text-xs font-bold uppercase tracking-widest">
            Open Source · MIT License
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-6xl md:text-[72px] font-black tracking-tighter leading-none mb-6 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-400">
          MedTrace-SDK
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-2xl mb-12 leading-relaxed">
          Distributed observability for healthcare AI agent pipelines. 
          <span className="text-white"> HIPAA-aware tracing</span> that actually understands LLMs.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 bg-teal-500 hover:bg-teal-400 text-[#0A0B14] px-8 py-4 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-xl shadow-teal-500/20"
          >
            <span>View Dashboard</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="#github"
            className="flex items-center space-x-2 border border-white/10 bg-white/5 hover:bg-white/10 px-8 py-4 rounded-2xl font-bold transition-all backdrop-blur-md"
          >
            <span>GitHub</span>
          </Link>
        </div>

        {/* Feature Chips */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <FeatureChip icon={<Shield className="w-4 h-4" />} label="PHI Auto-Redaction" />
          <FeatureChip icon={<Zap className="w-4 h-4" />} label="LangGraph Native" />
          <FeatureChip icon={<FileText className="w-4 h-4" />} label="EU AI Act Audit Trails" />
        </div>
      </div>

      {/* Floating Metrics Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4">
        <div className="max-w-5xl mx-auto bg-white/5 border-t border-x border-white/10 backdrop-blur-2xl rounded-t-3xl p-6 shadow-2xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <MetricItem 
              label="Total Spans" 
              value={stats?.total_spans} 
              loading={loading} 
            />
            <MetricItem 
              label="Safety Gates" 
              value={stats?.safety_gates_triggered} 
              loading={loading} 
              color="text-yellow-400"
            />
            <MetricItem 
              label="Avg Latency" 
              value={stats ? `${stats.avg_latency_ms}ms` : null} 
              loading={loading} 
            />
            <MetricItem 
              label="PHI Scrubs" 
              value={stats?.phi_scrubs_total} 
              loading={loading} 
              color="text-teal-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center space-x-2 bg-white/5 border border-white/5 px-4 py-2 rounded-xl">
      <div className="text-slate-500">{icon}</div>
      <span className="text-sm font-bold text-slate-400">{label}</span>
    </div>
  );
}

function MetricItem({ label, value, loading, color = "text-white" }: { label: string; value: string | number | null | undefined; loading: boolean; color?: string }) {
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
      {loading ? (
        <div className="h-6 w-16 bg-white/5 animate-pulse rounded" />
      ) : (
        <span className={`text-xl font-black ${color}`}>{value ?? 0}</span>
      )}
    </div>
  );
}
