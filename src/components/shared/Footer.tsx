'use client';

import { Github, FileText, Scale, Circle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-panel/50 backdrop-blur-sm">
      <div className="px-6 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left - Brand & Copyright */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-foreground">Relayer</span>
            <span className="text-muted-dark">|</span>
            <span className="text-muted">© 2026 Relayer. All rights reserved.</span>
          </div>

          {/* Center - Quick Links */}
          <nav className="flex items-center gap-6">
            <a
              href="https://github.com/Berektassuly/solana-compliance-relayer/blob/main/docs/GUIDE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>Documentation</span>
            </a>
            <a
              href="https://github.com/Berektassuly/solana-compliance-relayer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </a>
            <a
              href="https://github.com/Berektassuly/solana-compliance-relayer/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors"
            >
              <Scale className="h-4 w-4" />
              <span>License</span>
            </a>
          </nav>

          {/* Right - System Status */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Circle className="h-2 w-2 fill-status-confirmed text-status-confirmed animate-pulse-slow" />
              <span className="text-muted">API:</span>
              <span className="text-status-confirmed font-medium">Operational</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Circle className="h-2 w-2 fill-status-confirmed text-status-confirmed animate-pulse-slow" />
              <span className="text-muted">Network:</span>
              <span className="text-status-confirmed font-medium">Healthy</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
