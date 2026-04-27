import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MedTrace SDK Dashboard',
  description: 'Real-time clinical AI pipeline observability',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0A0F1C] text-white antialiased min-h-screen`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="ml-56 flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
