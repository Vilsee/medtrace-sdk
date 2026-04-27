/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Activity, GitBranch, Shield, AlertTriangle, Lock, Zap, Terminal, ChevronRight } from 'lucide-react'
import { fetchSummary, fetchTraces } from '@/lib/api'
import TraceCard from '@/components/TraceCard'
import { InfiniteSlider } from '@/components/ui/infinite-slider'

const WarpShaderHero = dynamic(() => import('@/components/ui/warp-shader'), { ssr: false })

const TECH_LOGOS = [
  'LangChain','OpenAI','Anthropic','HuggingFace',
  'LangGraph','CrewAI','AutoGen','Presidio',
]

const DEMO_STEPS = [
  {
    step: '01',
    title: 'Install the SDK',
    code: 'pip install medtrace-sdk',
    description: 'Zero-dependency install. Works with any Python 3.10+ environment.',
  },
  {
    step: '02',
    title: 'Instrument your agent',
    code: `from medtrace import MedTracer

tracer = MedTracer(
  service="my-clinical-agent",
  domain="cardiology"
)
graph = tracer.instrument_graph(my_langgraph_app)`,
    description: 'Two lines. Your entire LangGraph agent is now traced, PHI-scrubbed, and auditable.',
  },
  {
    step: '03',
    title: 'Add safety gates',
    code: `@tracer.trace_agent("diagnosis", risk_tier="high")
async def diagnose(state):
    result = await llm.ainvoke(prompt)
    tracer.safety_gate(triggered=False)
    return result`,
    description: 'Decorate agent nodes to capture clinical metadata and safety decisions per span.',
  },
  {
    step: '04',
    title: 'Export audit trail',
    code: 'medtrace export --start 2026-01-01 --end 2026-03-31',
    description: 'One CLI command generates a NDJSON audit archive with SHA-256 integrity hashes for EU AI Act compliance.',
  },
]

function MetricCard({ label, value, icon: Icon, accent }: {
  label: string; value: string | number; icon: any; accent?: string
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4 backdrop-blur-sm">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5">
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
        {/* Deep dark base so shader has contrast to work with */}
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 50% 40% at 15% 25%, hsl(25 100% 30% / 0.6) 0%, transparent 55%),
            radial-gradient(ellipse 40% 50% at 80% 60%, hsl(160 90% 20% / 0.7) 0%, transparent 55%),
            radial-gradient(ellipse 60% 40% at 50% 90%, hsl(180 80% 15% / 0.5) 0%, transparent 50%),
            hsl(0 0% 2%)
          `
        }} />
        <WarpShaderHero />
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

          {/* ── DEMO SECTION ── */}
          <div className="border-t border-white/10 pt-10 mb-10">
            <div className="flex items-center gap-3 mb-2">
              <Terminal className="w-5 h-5 text-teal-400" />
              <h2 className="text-xl font-bold text-white">How it works</h2>
            </div>
            <p className="text-white/40 text-sm mb-8">
              From zero to fully-traced clinical AI pipeline in 4 steps.
            </p>

            <div className="grid grid-cols-2 gap-6">
              {DEMO_STEPS.map((s) => (
                <div
                  key={s.step}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-teal-400/30 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-mono text-teal-400 bg-teal-400/10 border border-teal-400/20 px-2 py-1 rounded-md">
                      {s.step}
                    </span>
                    <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                  </div>
                  <pre className="bg-[#020c0a]/80 border border-white/10 rounded-xl p-4 text-xs text-teal-300 font-mono overflow-x-auto mb-4 whitespace-pre-wrap">
{s.code}
                  </pre>
                  <p className="text-xs text-white/40 leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-4">
              <a
                href="https://github.com/Vilsee/medtrace-sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-400 text-[#020c0a] text-sm font-semibold hover:bg-teal-300 transition-colors"
              >
                View on GitHub <ChevronRight className="w-4 h-4" />
              </a>
              <Link
                href="/traces"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
              >
                Explore traces →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
