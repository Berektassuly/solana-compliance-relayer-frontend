'use client';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Terminal } from '@/features/terminal';
import { Monitor } from '@/features/monitor';
import { RiskScanner } from '@/features/risk-scanner';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
          {/* Left Panel - Terminal */}
          <div className="min-w-0">
            <Terminal />
          </div>
          
          {/* Right Panel - Risk Scanner */}
          <div className="min-w-0">
            <RiskScanner />
          </div>
        </div>

        {/* Monitor Section - Full Width */}
        <div>
          <Monitor />
        </div>
      </main>

      <Footer />
    </div>
  );
}
