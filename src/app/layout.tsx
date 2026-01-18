import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Solana Compliance Relayer',
  description: 'Privacy-preserving compliance-verified transfers on Solana',
  keywords: ['Solana', 'DeFi', 'Privacy', 'Compliance', 'Relayer'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
