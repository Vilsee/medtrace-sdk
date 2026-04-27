/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ChevronRight, Shield, GitBranch, FileCheck } from 'lucide-react'
import { fetchSummary } from '@/lib/api'

const WarpShaderHero = dynamic(() => import('@/components/ui/warp-shader'), { ssr: false })

const features = [
  { icon: Shield, label: 'PHI Auto-Redaction' },
  { icon: GitBranch, label: 'LangGraph Native' },
  { icon: FileCheck, label: 'EU AI Act Audit Trails' },
]

export default function Home() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    fetchSummary().then(setSummary).catch(() => {})
    const interval = setInterval(() => {
      fetchSummary().then(setSummary).catch(() => {})
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative min-h-screen bg-[#020c0a] overflow-hidden">
      {/* Warp shader background */}
      <div className="absolute inset-0 w-full h-full">
        <WarpShaderHero />
      </div>

      {/* Dark overlay so text is readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020c0a]/40 via-transparent to-[#020c0a] z-10 pointer-events-none" />

      {/* Hero content */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-6 text-center pt-0">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-400/30 bg-teal-400/10 text-teal-300 text-sm font-medium tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          Open Source · MIT License
        </div>

        {/* Title */}
        <h1 className="text-7xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-teal-300 via-cyan-200 to-teal-400 bg-clip-text text-transparent leading-none">
          MedTrace-SDK
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-lg md:text-xl text-white/70 mb-4 leading-relaxed">
          Distributed observability for healthcare AI agent pipelines.{' '}
          <span className="text-white font-semibold">HIPAA-aware tracing</span>{' '}
          that actually understands LLMs.
        </p>

        {/* Feature chips */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {features.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm"
            >
              <Icon className="w-3.5 h-3.5 text-teal-400" />
              {label}
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-teal-400 text-[#020c0a] font-semibold text-sm hover:bg-teal-300 transition-colors"
          >
            View Dashboard <ChevronRight className="w-4 h-4" />
          </Link>
          
          <a
            href="https://github.com/Vilsee/medtrace-sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/20 text-white/80 text-sm hover:bg-white/10 transition-colors"
          >
            GitHub ↗
          </a>
        </div>
      </div>

      {/* Metrics bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#020c0a]/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-4 grid grid-cols-4 gap-6">
          {[
            {
              label: 'TOTAL SPANS',
              value: summary?.total_spans ?? '12,847',
              color: 'text-white',
              demo: !summary
            },
            {
              label: 'SAFETY GATES',
              value: summary?.safety_gates_triggered ?? '143',
              color: 'text-amber-400',
              demo: !summary
            },
            {
              label: 'AVG LATENCY',
              value: summary ? `${summary.avg_latency_ms}ms` : '284ms',
              color: 'text-white',
              demo: !summary
            },
            {
              label: 'PHI SCRUBS',
              value: summary?.phi_scrubs_total ?? '9,302',
              color: 'text-teal-400',
              demo: !summary
            },
          ].map(({ label, value, color, demo }) => (
            <div key={label} className="text-center">
              <p className="text-[10px] text-white/40 tracking-widest mb-1">
                {label}
                {demo && <span className="ml-1 text-white/20">(demo)</span>}
              </p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
        <div className="text-center pb-2">
          <p className="text-[9px] text-white/20 tracking-widest">
            {summary ? 'LIVE DATA' : 'DEMO VALUES — connect your server to see live metrics'}
          </p>
        </div>
      </div>
    </div>
  )
}
