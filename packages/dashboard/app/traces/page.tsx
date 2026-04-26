/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState, useCallback } from 'react'
import { Search, X, Shield } from 'lucide-react'
import { fetchTraces } from '@/lib/api'
import TraceCard from '@/components/TraceCard'

const DOMAINS = ['ALL', 'cardiology', 'oncology', 'emergency', 'general', 'mental_health', 'radiology', 'pharmacy']
const RISK_TIERS = ['ALL', 'low', 'moderate', 'high', 'critical']

const RISK_COLORS: Record<string, string> = {
  low: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
  moderate: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  high: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  critical: 'text-red-400 bg-red-400/10 border-red-400/20',
}

export default function TracesPage() {
  const [service, setService] = useState('')
  const [domain, setDomain] = useState('ALL')
  const [riskTier, setRiskTier] = useState('ALL')
  const [traces, setTraces] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const LIMIT = 10

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { limit: LIMIT }
      if (service) params.service = service
      if (domain !== 'ALL') params.domain = domain
      if (riskTier !== 'ALL') params.risk_tier = riskTier
      const res = await fetchTraces({ ...params, offset } as any)
      setTraces(res.items || [])
      setTotal(res.total || 0)
    } catch { setTraces([]) }
    setLoading(false)
  }, [service, domain, riskTier, offset])

  useEffect(() => {
    const t = setTimeout(load, 400)
    return () => clearTimeout(t)
  }, [load])

  const riskCounts = traces.reduce((acc: any, t: any) => {
    acc[t.risk_tier] = (acc[t.risk_tier] || 0) + 1
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-[#020c0a] text-white">
      <div className="grid grid-cols-[1fr_300px]">

        {/* LEFT — main content */}
        <div className="border-r border-white/10 p-8">
          <h1 className="text-2xl font-bold mb-6">Trace Explorer</h1>

          {/* Filters */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="e.g. diagnostic-engine"
                value={service}
                onChange={e => { setService(e.target.value); setOffset(0) }}
                className="w-full bg-[#0d1f1a] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-teal-400/50"
              />
            </div>
            <select
              value={domain}
              onChange={e => { setDomain(e.target.value); setOffset(0) }}
              className="bg-[#0d1f1a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400/50"
            >
              {DOMAINS.map(d => <option key={d} value={d}>{d === 'ALL' ? 'All Domains' : d}</option>)}
            </select>
            <select
              value={riskTier}
              onChange={e => { setRiskTier(e.target.value); setOffset(0) }}
              className="bg-[#0d1f1a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400/50"
            >
              {RISK_TIERS.map(r => <option key={r} value={r}>{r === 'ALL' ? 'All Risk Tiers' : r}</option>)}
            </select>
            {(service || domain !== 'ALL' || riskTier !== 'ALL') && (
              <button
                onClick={() => { setService(''); setDomain('ALL'); setRiskTier('ALL'); setOffset(0) }}
                className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/40"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : traces.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-2xl py-16 text-center">
              <p className="text-white/30 text-sm font-mono tracking-widest uppercase">No clinical traces found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {traces.map(trace => (
                <div key={trace.trace_id}>
                  <TraceCard
                    trace={trace}
                    expanded={expandedId === trace.trace_id}
                    onClick={() => setExpandedId(expandedId === trace.trace_id ? null : trace.trace_id)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
            <p className="text-sm text-white/40">
              Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total} total
            </p>
            <div className="flex gap-2">
              <button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                className="px-4 py-2 text-sm rounded-xl border border-white/10 disabled:opacity-30 hover:bg-white/5 transition-colors"
              >
                Prev
              </button>
              <button
                disabled={offset + LIMIT >= total}
                onClick={() => setOffset(offset + LIMIT)}
                className="px-4 py-2 text-sm rounded-xl border border-white/10 bg-teal-400/10 text-teal-400 disabled:opacity-30 hover:bg-teal-400/20 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT — stats sidebar (no Spline) */}
        <div className="p-6 space-y-6 sticky top-0 h-screen overflow-y-auto">
          <div>
            <h3 className="text-xs text-white/40 tracking-widest uppercase mb-4">Risk distribution</h3>
            <div className="space-y-2">
              {Object.entries(RISK_COLORS).map(([tier, classes]) => (
                <div key={tier} className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full border ${classes} capitalize`}>{tier}</span>
                  <span className="text-sm text-white/60">{riskCounts[tier] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h3 className="text-xs text-white/40 tracking-widest uppercase mb-4">Filter summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Domain</span>
                <span className="text-teal-400">{domain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Risk tier</span>
                <span className="text-teal-400">{riskTier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Results</span>
                <span className="text-white">{total}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="rounded-2xl bg-teal-400/5 border border-teal-400/10 p-4">
              <Shield className="w-5 h-5 text-teal-400 mb-2" />
              <p className="text-xs text-white/50 leading-relaxed">
                All traces are PHI-scrubbed before storage. Span payloads contain only hashed identifiers.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
