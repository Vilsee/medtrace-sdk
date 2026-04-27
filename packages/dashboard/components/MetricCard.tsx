'use client'
import { useState, useEffect } from 'react'

export function MetricCard({ label, value, icon: Icon, accent, demo }: {
  label: string
  value: string | number
  icon: React.ElementType
  accent?: string
  demo?: boolean
}) {
  const [displayed, setDisplayed] = useState<string | number>(0)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const raw = typeof value === 'string' ? value : value
    if (typeof value === 'string' && (value.includes('ms') || value.includes('.'))) {
      setDisplayed(value)
      return
    }
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''))
    if (isNaN(num) || num === 0) { setDisplayed(typeof value === 'number' ? '0' : value); return }
    let start = 0
    const duration = 1200
    const step = 16
    const increment = num / (duration / step)
    const timer = setInterval(() => {
      start += increment
      if (start >= num) {
        setDisplayed(num.toLocaleString())
        clearInterval(timer)
      } else {
        setDisplayed(Math.floor(start).toLocaleString())
      }
    }, step)
    return () => clearInterval(timer)
  }, [value])

  return (
    <div className="relative overflow-hidden bg-[#020c0a]/85 border border-teal-900/50 rounded-2xl p-6 flex flex-col gap-4 backdrop-blur-md group hover:border-teal-400/30 transition-all duration-300">
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, hsl(174 80% 20% / 0.15) 0%, transparent 70%)' }}
      />
      <div className="relative flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-950/60 border border-teal-900/40">
          <Icon className={`w-5 h-5 ${accent || 'text-teal-400'}`} />
        </div>
        {demo && (
          <span className="text-[9px] text-white/20 font-mono tracking-widest border border-white/10 px-1.5 py-0.5 rounded">
            DEMO
          </span>
        )}
      </div>
      <div className="relative">
        <p className="text-[11px] text-white/40 tracking-widest uppercase mb-1.5">{label}</p>
        <p className={`text-3xl font-bold tabular-nums ${accent || 'text-white'}`}>
          {displayed}
        </p>
      </div>
    </div>
  )
}
