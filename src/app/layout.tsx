import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VALORANT Team Balancer',
  description: 'Balance VALORANT custom match teams fairly',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
