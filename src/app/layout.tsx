import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Market Genius | Real-Time Market Intelligence',
  description: 'AI-powered real-time market analysis with technical indicators, live streaming prices, and market briefs',
  openGraph: {
    title: 'Market Genius',
    description: 'AI-powered real-time market intelligence dashboard',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
