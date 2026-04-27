/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Activity, GitBranch, Shield, AlertTriangle, Lock, Zap, Terminal, ChevronRight } from 'lucide-react'
import { fetchSummary, fetchTraces } from '@/lib/api'
import TraceCard from '@/components/TraceCard'
import { InfiniteSlider } from '@/components/ui/infinite-slider'

import { MetricCard } from '@/components/MetricCard'

const TECH_LOGOS = [
  'LangChain','OpenAI','Anthropic','HuggingFace',
  'LangGraph','CrewAI','AutoGen','Presidio',
]

const PhosphorBg = dynamic(() => import('@/components/ui/phosphor-30'), { ssr: false })

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null)
  const [traces, setTraces] = useState<any[]>([])
  const [connected, setConnected] = useState(false)

  const load = async () => {
    try {
      const [s, t] = await Promise.all([
        fetchSummary(),
        fetchTraces({ limit: 20 }),
      ])
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
    <div className="relative min-h-screen">
      {/* Fixed warp shader background */}
      <div className="fixed inset-0 z-0">
        <PhosphorBg />
      </div>

      {/* Glass3d sea overlay — covers the entire scrollable page */}
      <div
        className="glass3d-sea relative z-10 min-h-screen"
        style={{ borderRadius: 0 }}
      >
        {/* Header */}
        <div className="border-b border-white/10 px-8 py-6">
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

          {/* Tech logo ticker */}
          <div className="relative">
            <p className="text-[10px] text-white/30 tracking-widest uppercase mb-3">Compatible with</p>
            <div className="relative overflow-hidden">
              <InfiniteSlider gap={48} duration={30} className="py-1">
                {TECH_LOGOS.map((logo) => (
                  <div
                    key={logo}
                    className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-white/50 text-sm font-medium whitespace-nowrap"
                  >
                    {logo}
                  </div>
                ))}
              </InfiniteSlider>
              <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-transparent to-transparent pointer-events-none z-10" />
              <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-transparent to-transparent pointer-events-none z-10" />
            </div>
          </div>
        </div>

        <div className="px-8 py-8">
          {/* Metric grid */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <MetricCard label="Total Spans" value={summary?.total_spans ?? 12847} icon={Activity} demo={!summary} />
            <MetricCard label="Unique Traces" value={summary?.unique_traces ?? 3241} icon={GitBranch} demo={!summary} />
            <MetricCard
              label="Safety Gates"
              value={summary?.safety_gates_triggered ?? 143}
              icon={Shield}
              accent={(summary?.safety_gates_triggered ?? 143) > 0 ? 'text-amber-400' : 'text-teal-400'}
              demo={!summary}
            />
            <MetricCard
              label="High Risk Spans"
              value={summary?.high_risk_spans ?? 28}
              icon={AlertTriangle}
              accent={(summary?.high_risk_spans ?? 28) > 0 ? 'text-orange-400' : 'text-teal-400'}
              demo={!summary}
            />
            <MetricCard label="PHI Scrubs" value={summary?.phi_scrubs_total ?? 9302} icon={Lock} demo={!summary} />
            <MetricCard
              label="Avg Latency"
              value={summary ? `${Math.round(summary.avg_latency_ms)}ms` : '284ms'}
              icon={Zap}
              accent="text-cyan-400"
              demo={!summary}
            />
          </div>

          {/* Recent traces */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Recent Traces</h2>
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            </div>
            <Link href="/traces" className="text-sm text-teal-400 hover:text-teal-300 transition-colors">
              View all explorer →
            </Link>
          </div>

          {traces.length === 0 ? (
            <div className="text-center py-10 text-white/30 text-sm border border-dashed border-white/10 rounded-2xl mb-12">
              No traces yet — instrument your first agent to see data here.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 mb-12">
              {traces.slice(0, 6).map((trace) => (
                <TraceCard
                  key={trace.trace_id}
                  trace={trace}
                  onClick={() => (window.location.href = `/traces?id=${trace.trace_id}`)}
                />
              ))}
            </div>
          )}

          {/* ── INTERACTIVE DEMO ── */}
          <div className="border-t border-white/10 pt-10 mb-10">
            <div className="flex items-center gap-3 mb-2">
              <Terminal className="w-5 h-5 text-teal-400" />
              <h2 className="text-xl font-bold text-white">Quick start</h2>
            </div>
            <p className="text-white/40 text-sm mb-6">
              Copy and paste — your agent is traced in under 2 minutes.
            </p>

            <div className="bg-[#020c0a]/90 border border-teal-400/20 rounded-2xl overflow-hidden backdrop-blur-md">
              {/* Tab bar */}
              <div className="flex border-b border-white/10">
                {['Install', 'Instrument', 'Safety gate', 'Export'].map((tab, i) => (
                  <button
                    key={tab}
                    id={`demo-tab-${i}`}
                    onClick={() => {
                      document.querySelectorAll('[id^="demo-panel-"]').forEach(el => (el as HTMLElement).style.display = 'none')
                      document.querySelectorAll('[id^="demo-tab-"]').forEach(el => el.classList.remove('border-b-2', 'border-teal-400', 'text-white'))
                      const panel = document.getElementById(`demo-panel-${i}`)
                      const tabEl = document.getElementById(`demo-tab-${i}`)
                      if (panel) (panel as HTMLElement).style.display = 'block'
                      if (tabEl) { tabEl.classList.add('border-b-2', 'border-teal-400', 'text-white') }
                    }}
                    className={`px-5 py-3 text-xs font-mono text-white/40 hover:text-white transition-colors ${i === 0 ? 'border-b-2 border-teal-400 text-white' : ''}`}
                  >
                    {String(i + 1).padStart(2, '0')} {tab}
                  </button>
                ))}
              </div>

              {/* Panels */}
              {[
                {
                  code: `pip install medtrace-sdk`,
                  desc: 'Zero extra dependencies. Python 3.10+ required.'
                },
                {
                  code: `from medtrace import MedTracer\n\ntracer = MedTracer(\n  service="my-clinical-agent",\n  domain="cardiology"\n)\n\n# Wraps your entire LangGraph app — 1 line\ngraph = tracer.instrument_graph(my_langgraph_app)`,
                  desc: 'Every agent node is now traced, PHI-scrubbed, and stored automatically.'
                },
                {
                  code: `@tracer.trace_agent("diagnosis", risk_tier="high")\nasync def diagnose(state):\n    result = await llm.ainvoke(prompt)\n    \n    # Record safety decision on this span\n    tracer.safety_gate(triggered=False)\n    return result`,
                  desc: 'Decorate any async function. Clinical metadata is captured per span.'
                },
                {
                  code: `# Export audit trail for EU AI Act / FDA SaMD compliance\nmedtrace export --start 2026-01-01 --end 2026-03-31\n\n# Replay any trace for debugging\nmedtrace replay trace_7f3a9b2c --dry-run\n\n# Check server status\nmedtrace status`,
                  desc: 'One CLI command generates a NDJSON audit archive with SHA-256 integrity hashes.'
                }
              ].map((panel, i) => (
                <div
                  key={i}
                  id={`demo-panel-${i}`}
                  style={{ display: i === 0 ? 'block' : 'none' }}
                  className="p-6"
                >
                  <pre className="text-sm text-teal-300 font-mono whitespace-pre-wrap leading-relaxed mb-4 overflow-x-auto">
{panel.code}
                  </pre>
                  <p className="text-xs text-white/40 border-t border-white/10 pt-4">{panel.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-4">
              <a
                href="https://github.com/Vilsee/medtrace-sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-400 text-[#020c0a] text-sm font-semibold hover:bg-teal-300 transition-colors"
              >
                View on GitHub <ChevronRight className="w-4 h-4" />
              </a>
              <Link
                href="/replay"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
              >
                Try replay engine →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
