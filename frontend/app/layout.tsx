import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NutriLens AI — Scan Food. Know Health.',
  description: 'NutriLens AI helps you scan packaged foods, analyze ingredients with AI, and get instant honest nutrition verdicts.',
  metadataBase: new URL('https://nutrilens.ai'),
  openGraph: {
    title: 'NutriLens AI',
    description: 'Scan food labels, analyze ingredients, and make smarter food decisions with AI.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
