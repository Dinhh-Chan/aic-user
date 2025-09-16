import type { Metadata } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AIC 2025',
  description: 'Created with v0',
  generator: 'v0.app',
}

// Be Vietnam Pro hỗ trợ tiếng Việt, dùng cùng variable với GeistSans để không phải đổi CSS
const beVietnam = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-geist-sans',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${beVietnam.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
