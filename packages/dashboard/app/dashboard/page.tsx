/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity, GitBranch, Shield, AlertTriangle, Lock, Zap } from 'lucide-react'
import { fetchSummary, fetchTraces } from '@/lib/api'
import TraceCard from '@/components/TraceCard'
import { InfiniteSlider } from '@/components/ui/infinite-slider'

const TECH_LOGOS = [
  { name: 'LangChain', text: 'LangChain' },
  { name: 'OpenAI', text: 'OpenAI' },
  { name: 'Anthropic', text: 'Anthropic' },
  { name: 'HuggingFace', text: 'HuggingFace' },
  { name: 'LangGraph', text: 'LangGraph' },
  { name: 'CrewAI', text: 'CrewAI' },
  { name: 'AutoGen', text: 'AutoGen' },
  { name: 'Presidio', text: 'Presidio' },
]

function MetricCard({ label, value, icon: Icon, accent }: {
  label: string; value: string | number; icon: any; accent?: string
}) {
  return (
    <div className="bg-[#0d1f1a] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5`}>
        <Icon className={`w-5 h-5 ${accent || 'text-teal-400'}`} />
      </div>
      <div>
        <p className="text-[11px] text-white/40 tracking-widest uppercase mb-1">{label}</p>
        <p className={`text-3xl font-bold ${accent || 'text-white'}`}>{value}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [summary, setSummary] = useState<any>(null)
  const [traces, setTraces] = useState<any[]>([])
  const [connected, setConnected] = useState(false)

  const load = async () => {
    try {
      const [s, t] = await Promise.all([fetchSummary(), fetchTraces({ limit: 20 })])
      setSummary(s)
      setTraces(t.items || [])
      setConnected(true)
    } catch {
      setConnected(false)
    }
  }

  useEffect(() => {
    load()
    const i = setInterval(load, 8000)
    return () => clearInterval(i)
  }, [])

  return (
    <div className="min-h-screen bg-[#020c0a] text-white">

      {/* Header with animated logo ticker */}
      <div className="border-b border-white/10 bg-[#0a1a14] px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Live Dashboard</h1>
            <p className="text-sm text-white/40 mt-1">Real-time clinical AI pipeline observability</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-teal-400 animate-pulse' : 'bg-red-400'}`} />
            <span className={connected ? 'text-teal-400' : 'text-red-400'}>
              {connected ? 'Connected' : 'Server offline'}
            </span>
          </div>
        </div>

        {/* Tech logo infinite slider */}
        <div className="relative">
          <p className="text-[10px] text-white/30 tracking-widest uppercase mb-3">
            Compatible with
          </p>
          <div className="relative overflow-hidden">
            <InfiniteSlider gap={48} duration={30} className="py-1">
              {TECH_LOGOS.map((logo) => (
                <div
                  key={logo.name}
                  className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-white/50 text-sm font-medium whitespace-nowrap"
                >
                  {logo.text}
                </div>
              ))}
            </InfiniteSlider>
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0a1a14] to-transparent pointer-events-none z-10" />
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#0a1a14] to-transparent pointer-events-none z-10" />
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <MetricCard label="Total Spans" value={summary?.total_spans ?? 0} icon={Activity} />
          <MetricCard label="Unique Traces" value={summary?.unique_traces ?? 0} icon={GitBranch} />
          <MetricCard
            label="Safety Gates"
            value={summary?.safety_gates_triggered ?? 0}
            icon={Shield}
            accent={(summary?.safety_gates_triggered ?? 0) > 0 ? 'text-amber-400' : 'text-teal-400'}
          />
          <MetricCard
            label="High Risk Spans"
            value={summary?.high_risk_spans ?? 0}
            icon={AlertTriangle}
            accent={(summary?.high_risk_spans ?? 0) > 0 ? 'text-red-400' : 'text-teal-400'}
          />
          <MetricCard label="PHI Scrubs" value={summary?.phi_scrubs_total ?? 0} icon={Lock} />
          <MetricCard
            label="Avg Latency"
            value={summary ? `${Math.round(summary.avg_latency_ms)}ms` : '0ms'}
            icon={Zap}
            accent="text-cyan-400"
          />
        </div>

        {/* Recent traces */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Recent Traces</h2>
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          </div>
          <Link href="/traces" className="text-sm text-teal-400 hover:text-teal-300 transition-colors">
            View all explorer →
          </Link>
        </div>

        {traces.length === 0 ? (
          <div className="text-center py-16 text-white/30 text-sm border border-dashed border-white/10 rounded-2xl">
            No traces yet. Instrument your first agent to see data here.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {traces.slice(0, 6).map((trace) => (
              <TraceCard
                key={trace.trace_id}
                trace={trace}
                onClick={() => window.location.href = `/traces?id=${trace.trace_id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
