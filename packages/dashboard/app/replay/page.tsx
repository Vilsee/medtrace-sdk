/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useState } from 'react'
import { RotateCcw, Play, Copy, CheckCheck, Info, Terminal, AlertCircle } from 'lucide-react'
import { fetchTrace } from '@/lib/api'

const DEMO_TRACE = {
  trace_id: 'demo-7f3a9b2c1d',
  service_name: 'cardiology-agent',
  domain: 'cardiology',
  risk_tier: 'high',
  model_name: 'gpt-4o',
  spans: [
    { span_name: 'triage_node', latency_ms: 312, agent_type: 'triage', safety_gate_triggered: false },
    { span_name: 'diagnosis_node', latency_ms: 1840, agent_type: 'diagnostic', safety_gate_triggered: true },
    { span_name: 'report_node', latency_ms: 520, agent_type: 'conversational', safety_gate_triggered: false },
  ],
}

const DEMO_OUTPUT = JSON.stringify({
  trace_id: 'demo-7f3a9b2c1d',
  spans: DEMO_TRACE.spans,
  replay_inputs: {
    query: '[PHI_REDACTED] reports chest tightness and shortness of breath',
    context: 'Emergency department intake',
  },
  model: 'gpt-4o',
  dry_run: true,
  note: 'DRY RUN — no LLM calls were made. Inputs reconstructed from stored span attributes.',
}, null, 2)

export default function ReplayPage() {
  const [traceId, setTraceId] = useState('')
  const [traceData, setTraceData] = useState<any>(null)
  const [output, setOutput] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [dryRun, setDryRun] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(false)

  const handleLoad = async () => {
    if (!traceId.trim()) return
    setStatus('loading')
    setError(null)
    try {
      const spans = await fetchTrace(traceId)
      if (!spans || spans.length === 0) throw new Error('Trace not found')
      setTraceData({ trace_id: traceId, spans })
      setStatus('idle')
    } catch (e: any) {
      setError(e.message || 'Trace not found')
      setStatus('error')
      setTraceData(null)
    }
  }

  const handleReplay = async () => {
    setStatus('loading')
    setOutput(null)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8765'}/traces/${traceId}/replay`
      )
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const json = await res.json()
      setOutput(JSON.stringify({ ...json, dry_run: dryRun }, null, 2))
      setStatus('success')
    } catch (e: any) {
      setError(e.message)
      setStatus('error')
    }
  }

  const handleDemo = () => {
    setDemoMode(true)
    setTraceData(DEMO_TRACE)
    setOutput(DEMO_OUTPUT)
    setStatus('success')
    setError(null)
  }

  const handleCopy = () => {
    if (output) navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const STATUS_COLORS = {
    idle: 'text-white/40 bg-white/5 border-white/10',
    loading: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    success: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
    error: 'text-red-400 bg-red-400/10 border-red-400/20',
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Sea-green radial gradient background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 40% at 20% 30%, hsl(25 100% 25% / 0.7) 0%, transparent 55%),
            radial-gradient(ellipse 40% 60% at 75% 65%, hsl(163 90% 18% / 0.8) 0%, transparent 55%),
            radial-gradient(ellipse 30% 40% at 60% 10%, hsl(200 80% 20% / 0.5) 0%, transparent 50%),
            hsl(0 0% 2%)
          `
        }}
      />

      {/* Glass3d-green full-page wrapper */}
      <div
        className="glass3d-green relative z-10 min-h-screen"
        style={{ borderRadius: 0 }}
      >
        <div className="px-8 py-8 max-w-7xl mx-auto">

          {/* Page header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <RotateCcw className="w-5 h-5 text-teal-400" />
                <h1 className="text-2xl font-bold text-white">Replay Engine</h1>
              </div>
              <p className="text-sm text-white/40">
                Deterministically re-execute any stored clinical agent trace for debugging and compliance.
              </p>
            </div>
            <button
              onClick={handleDemo}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-400/10 border border-teal-400/20 text-teal-400 text-sm hover:bg-teal-400/20 transition-colors"
            >
              <Play className="w-3.5 h-3.5" /> Run demo trace
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-10">
            {/* LEFT — Input panel */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white uppercase tracking-widest">Replay Engine</h2>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-mono uppercase ${STATUS_COLORS[status]}`}>
                  {status}
                </span>
              </div>

              {demoMode && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-400/10 border border-teal-400/20 text-xs text-teal-300">
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  Demo mode — showing a simulated cardiology agent trace. Connect your server to replay real traces.
                </div>
              )}

              <div>
                <label className="text-[10px] text-white/40 tracking-widest uppercase block mb-2">
                  Trace Identity
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Trace ID..."
                    value={traceId}
                    onChange={(e) => { setTraceId(e.target.value); setDemoMode(false) }}
                    className="flex-1 bg-[#020c0a]/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-teal-400/50 font-mono"
                  />
                  <button
                    onClick={handleLoad}
                    disabled={!traceId.trim() || status === 'loading'}
                    className="px-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-sm text-white font-semibold hover:bg-white/15 disabled:opacity-40 transition-colors"
                  >
                    Load
                  </button>
                </div>
                {error && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-red-400">
                    <AlertCircle className="w-3.5 h-3.5" /> {error}
                  </div>
                )}
              </div>

              {/* Loaded trace metadata */}
              {traceData && (
                <div className="bg-[#020c0a]/60 border border-white/10 rounded-xl p-4 space-y-2">
                  <p className="text-[10px] text-white/40 tracking-widest uppercase mb-3">Trace metadata</p>
                  {[
                    ['Service', traceData.service_name || traceData.spans?.[0]?.service_name || '—'],
                    ['Domain', traceData.domain || traceData.spans?.[0]?.clinical_domain || '—'],
                    ['Risk tier', traceData.risk_tier || traceData.spans?.[0]?.risk_tier || '—'],
                    ['Spans', (traceData.spans?.length ?? 0).toString()],
                    ['Model', traceData.model_name || traceData.spans?.[0]?.model_name || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-white/40">{k}</span>
                      <span className="text-white font-mono text-xs">{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Dry run toggle */}
              <div className="flex items-center justify-between py-3 border-t border-white/10">
                <div>
                  <p className="text-sm text-white font-medium">Safe Execution Mode</p>
                  <p className="text-xs text-white/40 mt-0.5">Enable dry-run for zero-side-effect simulation</p>
                </div>
                <button
                  onClick={() => setDryRun(!dryRun)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${dryRun ? 'bg-teal-400' : 'bg-white/20'}`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${dryRun ? 'translate-x-7' : 'translate-x-1'}`}
                  />
                </button>
              </div>

              <button
                onClick={demoMode ? () => setOutput(DEMO_OUTPUT) : handleReplay}
                disabled={!traceData || status === 'loading'}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-400 text-[#020c0a] text-sm font-bold hover:bg-teal-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Play className="w-4 h-4" />
                Begin State Replay
              </button>
            </div>

            {/* RIGHT — Output panel */}
            <div className="bg-[#020c0a]/60 border border-white/10 rounded-2xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-teal-400" />
                  <h2 className="text-sm font-semibold text-white uppercase tracking-widest">Replay Output</h2>
                </div>
                {output && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
                  >
                    {copied ? <CheckCheck className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>

              {dryRun && output && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-amber-400/10 border border-amber-400/20 text-xs text-amber-300 font-mono">
                  DRY RUN — no execution
                </div>
              )}

              <pre className="flex-1 text-xs font-mono text-teal-300 overflow-auto min-h-[320px] leading-relaxed">
                {output || (
                  <span className="text-white/20 font-mono tracking-widest">
                    WAITING FOR TRANSACTION...
                  </span>
                )}
              </pre>
            </div>
          </div>

          {/* ── HOW REPLAY WORKS DEMO ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-lg font-bold text-white mb-2">How trace replay works</h2>
            <p className="text-sm text-white/40 mb-6">
              MedTrace stores a hash of every agent input/output. Replay reconstructs the exact call 
              without re-exposing PHI — safe for debugging, auditing, and regression testing.
            </p>

            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  num: '1',
                  title: 'Capture',
                  desc: 'Every agent node call is captured as an OTel span with input hash, output hash, latency, and clinical metadata.',
                  color: 'border-teal-400/20 bg-teal-400/5',
                  accent: 'text-teal-400',
                },
                {
                  num: '2',
                  title: 'Store',
                  desc: 'Spans are PHI-scrubbed and persisted to PostgreSQL via the MedTrace server. SHA-256 hashes ensure tamper-evidence.',
                  color: 'border-cyan-400/20 bg-cyan-400/5',
                  accent: 'text-cyan-400',
                },
                {
                  num: '3',
                  title: 'Replay',
                  desc: 'The replay engine reconstructs inputs from stored attributes and re-runs the agent call at temperature=0 for determinism.',
                  color: 'border-emerald-400/20 bg-emerald-400/5',
                  accent: 'text-emerald-400',
                },
              ].map((item) => (
                <div key={item.num} className={`border rounded-2xl p-5 ${item.color}`}>
                  <span className={`text-2xl font-bold ${item.accent} block mb-3`}>{item.num}</span>
                  <h3 className={`font-semibold ${item.accent} mb-2`}>{item.title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-[#020c0a]/60 border border-white/10 rounded-2xl p-5">
              <p className="text-[10px] text-white/30 tracking-widest uppercase mb-3">CLI equivalent</p>
              <pre className="text-sm font-mono text-teal-300">
{`medtrace replay <trace_id>          # execute replay
medtrace replay <trace_id> --dry-run # simulate only, no LLM calls
medtrace replay <trace_id> --diff    # compare output vs stored`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
