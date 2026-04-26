import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Solana Compliance Relayer',
  description: 'Operational compliance dashboard for Solana payment settlement',
  keywords: ['Solana', 'DeFi', 'Privacy', 'Compliance', 'Relayer'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
