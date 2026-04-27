'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Search, RotateCcw, Download } from 'lucide-react'

const ICONS: Record<string, React.ElementType> = {
  grid: LayoutDashboard,
  search: Search,
  refresh: RotateCcw,
  download: Download,
}

export function NavLink({ href, label, iconName }: {
  href: string
  label: string
  iconName: string
}) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')
  const Icon = ICONS[iconName]
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group
        ${active
          ? 'bg-teal-400/15 text-white border border-teal-400/25'
          : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
        }`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-teal-400' : 'text-white/40 group-hover:text-white/70'}`} />
      <span className="font-medium">{label}</span>
      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />}
    </Link>
  )
}
