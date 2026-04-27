'use client'
import AuditExport from '@/components/AuditExport'

export default function ExportPage() {
  return (
    <div className="min-h-screen bg-[#020c0a] p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Audit Export</h1>
      <AuditExport />
    </div>
  )
}
