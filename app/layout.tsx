import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DevPulse — High Signal Feed',
  description: 'Developer Taste Graph & Trending Engine'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-gray-300 font-sans pb-20 sm:pb-0">
        {children}
      </body>
    </html>
  );
}
