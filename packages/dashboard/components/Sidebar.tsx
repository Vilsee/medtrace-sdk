'use client';

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Search, RotateCcw, Download } from 'lucide-react'

const Balatro = dynamic(() => import('@/components/ui/balatro'), { ssr: false })

const ICONS: Record<string, React.ElementType> = {
  grid: LayoutDashboard,
  search: Search,
  refresh: RotateCcw,
  download: Download,
}

function NavLink({ href, label, iconName, onClick }: { href: string; label: string; iconName: string; onClick?: () => void }) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')
  const Icon = ICONS[iconName]

  const content = (
    <>
      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-teal-400' : 'text-white/40 group-hover:text-white/70'}`} />
      <span className="font-medium">{label}</span>
      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />}
    </>
  )

  const commonClass = `flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group
    ${active
      ? 'bg-teal-400/15 text-white border border-teal-400/25'
      : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
    }`

  if (onClick) {
    return (
      <button onClick={onClick} className={commonClass}>
        {content}
      </button>
    )
  }

  return (
    <Link href={href} className={commonClass}>
      {content}
    </Link>
  )
}

export default function Sidebar({ onExportClick }: { onExportClick?: () => void }) {
  const pathname = usePathname()
  const isLandingPage = pathname === "/"

  if (isLandingPage) return null

  return (
    <nav className="fixed left-0 top-0 h-full w-56 border-r border-teal-900/40 z-50 overflow-hidden">
      {/* Balatro reactive background */}
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

      {/* Dark overlay so text stays readable */}
      <div className="absolute inset-0 z-10 bg-[#020c0a]/70 backdrop-blur-[2px]" />

      {/* Content */}
      <div className="relative z-20 flex flex-col h-full px-4 py-6">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 rounded-lg bg-teal-400 flex items-center justify-center font-bold text-[#020c0a] text-sm flex-shrink-0">
            M
          </div>
          <div>
            <p className="font-bold text-white text-sm tracking-wide">MEDTRACE</p>
            <p className="text-[10px] text-teal-400 tracking-widest">SDK</p>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex-1 space-y-1">
          <NavLink href="/dashboard" label="Dashboard" iconName="grid" />
          <NavLink href="/traces" label="Traces" iconName="search" />
          <NavLink href="/replay" label="Replay" iconName="refresh" />
          <NavLink href="#" label="Export" iconName="download" onClick={onExportClick} />
        </div>

        {/* Version badge */}
        <div className="px-2 py-2 rounded-xl border border-teal-900/40 bg-teal-950/40 text-center">
          <p className="text-[10px] text-teal-400/60 font-mono tracking-widest">V0.1.0-ALPHA</p>
        </div>
      </div>
    </nav>
  )
}
