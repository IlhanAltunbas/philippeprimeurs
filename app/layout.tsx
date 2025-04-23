import './globals.css'
import '../public/fonts/fonts.css'
import type React from "react"
import { Playfair_Display, Source_Sans_3 } from "next/font/google"
import { Toaster } from "react-hot-toast"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair",
})

const sourceSansPro = Source_Sans_3({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-source-sans",
})

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Philippe Primeurs",
  description: "Votre primeur de confiance",
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Framer Motion optimizasyonu için preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Kritik CSS için preload - kaldırıldı çünkü globals.css zaten import edildi */}
        
        {/* Performans ipuçları */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="theme-color" content="#FFFFFF" />
      </head>
      <body className={`h-full font-sans`}>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}