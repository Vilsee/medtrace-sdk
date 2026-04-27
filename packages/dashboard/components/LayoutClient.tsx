'use client';

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import AuditExport from '@/components/AuditExport'

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isExportOpen, setIsExportOpen] = useState(false)
  const isLandingPage = pathname === "/"

  return (
    <>
      <Sidebar onExportClick={() => setIsExportOpen(true)} />
      <main className={`${!isLandingPage ? "ml-56" : ""} min-h-screen relative`}>
        {children}
        {isExportOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setIsExportOpen(false)} />
            <div className="relative max-w-lg w-full">
              <AuditExport />
            </div>
          </div>
        )}
      </main>
    </>
  )
}
