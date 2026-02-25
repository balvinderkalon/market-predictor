import './globals.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Market Predictor | Bullish or Bearish?',
  description: 'Real-time market sentiment predictor',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
