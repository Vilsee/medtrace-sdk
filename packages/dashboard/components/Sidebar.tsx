'use client'
import dynamic from 'next/dynamic'
import { NavLink } from './NavLink'

const Balatro = dynamic(() => import('@/components/ui/balatro'), { ssr: false })

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'grid' },
  { label: 'Traces', href: '/traces', icon: 'search' },
  { label: 'Replay', href: '/replay', icon: 'refresh' },
  { label: 'Export', href: '/export', icon: 'download' },
]

export function Sidebar() {
  return (
    <nav className="fixed left-0 top-0 h-full w-56 border-r border-teal-900/40 z-50 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Balatro
          isRotate={false}
          mouseInteraction={true}
          pixelFilter={600}
          color1="#0D9488"
          color2="#134E4A"
          color3="#020c0a"
          spinSpeed={5.0}
          spinAmount={0.3}
          contrast={3.0}
          lighting={0.35}
        />
      </div>
      <div className="absolute inset-0 z-10 bg-[#020c0a]/70 backdrop-blur-[2px]" />
      <div className="relative z-20 flex flex-col h-full px-4 py-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 rounded-lg bg-teal-400 flex items-center justify-center font-bold text-[#020c0a] text-sm flex-shrink-0">
            M
          </div>
          <div>
            <p className="font-bold text-white text-sm tracking-wide">MEDTRACE</p>
            <p className="text-[10px] text-teal-400 tracking-widest">SDK</p>
          </div>
        </div>
        <div className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} iconName={item.icon} />
          ))}
        </div>
        <div className="px-2 py-2 rounded-xl border border-teal-900/40 bg-teal-950/40 text-center">
          <p className="text-[10px] text-teal-400/60 font-mono tracking-widest">V0.1.0-ALPHA</p>
        </div>
      </div>
    </nav>
  )
}
