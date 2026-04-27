import { Inter } from "next/font/google";
import LayoutClient from "@/components/LayoutClient";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'MedTrace SDK Dashboard',
  description: 'Real-time clinical AI pipeline observability',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#020c0a] text-white antialiased min-h-screen`}>
        <LayoutClient>
          {children}
        </LayoutClient>
      </body>
    </html>
  );
}
