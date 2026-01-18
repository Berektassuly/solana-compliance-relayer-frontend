'use client';

import { Header } from '@/components/shared/Header';
import { Terminal } from '@/features/terminal';
import { Monitor } from '@/features/monitor';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 h-full">
          {/* Left Panel - Terminal */}
          <div className="min-w-0">
            <Terminal />
          </div>
          
          {/* Right Panel - Monitor */}
          <div className="min-w-0">
            <Monitor />
          </div>
        </div>
      </main>
    </div>
  );
}
