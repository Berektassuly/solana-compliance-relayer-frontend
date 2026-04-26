'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Bell,
  BookOpen,
  ClipboardList,
  Gauge,
  HelpCircle,
  Server,
  Settings,
  ShieldAlert,
  SquareStack,
  Zap,
} from 'lucide-react';

import type { HealthResponse } from '@/services/health';
import { IconButton, StatusChip } from './OperationsPrimitives';
import { healthLabel, INITIAL_HEALTH, statusTone } from './operations-utils';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: Gauge },
  { label: 'Investigations', href: '/dashboard/investigations', icon: ShieldAlert },
  { label: 'Transactions', href: '/dashboard/transactions', icon: ClipboardList },
  { label: 'Relayer Nodes', href: '/dashboard/relayer-nodes', icon: Server },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
  return pathname.startsWith(href);
}

function TopAppBar({ pathname }: { pathname: string }) {
  return (
    <header className="fixed left-0 top-0 z-50 flex h-[56px] w-full items-center justify-between border-b border-[#e4e4e7] bg-white/80 px-[16px] backdrop-blur-[6px] sm:px-[24px]">
      <div className="flex min-w-0 items-center gap-[16px]">
        <Link
          href="/dashboard"
          className="shrink-0 text-[13px] font-bold uppercase leading-5 tracking-[0.7px] text-[#18181b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b] sm:text-[14px]"
        >
          SOLANA COMPLIANCE RELAYER
        </Link>
        <nav className="hidden items-center gap-[4px] xl:flex" aria-label="Primary navigation">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-[38px] items-center px-[12px] text-[14px] leading-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b] ${
                  active
                    ? 'border-b-2 border-[#18181b] font-bold text-[#18181b]'
                    : 'text-[#71717a] hover:text-[#18181b]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-[10px] sm:gap-[16px]">
        <div className="hidden items-center gap-[4px] sm:flex">
          <IconButton label="Queue snapshot">
            <SquareStack className="h-[15px] w-[15px]" aria-hidden="true" />
          </IconButton>
          <IconButton label="Network activity">
            <Activity className="h-[15px] w-[15px]" aria-hidden="true" />
          </IconButton>
          <IconButton label="Automation">
            <Zap className="h-[15px] w-[15px]" aria-hidden="true" />
          </IconButton>
          <IconButton label="Notifications">
            <Bell className="h-[15px] w-[15px]" aria-hidden="true" />
          </IconButton>
        </div>
        <div className="hidden h-[16px] w-px bg-[#e4e4e7] sm:block" />
        <span className="rounded-[2px] bg-[#e5e2e1] px-[8px] py-[4px] text-[11px] font-semibold leading-4 tracking-[0.55px] text-[#47464a]">
          Devnet
        </span>
      </div>
    </header>
  );
}

function SideBar({
  pathname,
  health,
}: {
  pathname: string;
  health: HealthResponse;
}) {
  return (
    <aside className="fixed left-0 top-[56px] z-40 hidden h-[calc(100vh-56px)] w-[256px] flex-col gap-[8px] overflow-hidden border-r border-[#e4e4e7] bg-[#fafafa] px-[16px] py-[24px] lg:flex">
      <div className="w-full pb-[24px]">
        <div className="flex w-full flex-col gap-[16px] px-[12px]">
          <div className="flex items-center gap-[12px]">
            <div className="flex h-[32px] w-[32px] items-center justify-center rounded-[2px] border border-[#c8c5ca] bg-[#e5e2e1] text-[11px] font-bold text-[#09090b]">
              CR
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-bold leading-5 text-[#09090b]">
                Compliance Relayer
              </div>
              <div className="text-[11px] uppercase leading-5 tracking-[0.55px] text-[#71717a]">
                OPERATOR CONSOLE
              </div>
            </div>
          </div>
          <StatusChip
            label={`System Status: ${healthLabel(health.status, 'Healthy')}`}
            tone={statusTone(health.status)}
            className="h-[30px] w-full justify-start"
          />
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-[4px]" aria-label="Sidebar navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex h-[40px] items-center gap-[12px] rounded-[6px] px-[12px] text-[13px] leading-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b] ${
                active
                  ? 'bg-[rgba(228,228,231,0.7)] text-[#18181b]'
                  : 'text-[#71717a] hover:bg-[rgba(228,228,231,0.35)] hover:text-[#18181b]'
              }`}
            >
              <Icon className="h-[15px] w-[15px]" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="w-full border-t border-[#e4e4e7] pt-[17px]">
        <Link
          href="/dashboard/settings#docs"
          className="flex h-[40px] items-center gap-[12px] rounded-[6px] px-[12px] text-[13px] leading-5 text-[#71717a] hover:bg-[rgba(228,228,231,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b]"
        >
          <BookOpen className="h-[15px] w-[15px]" aria-hidden="true" />
          Docs
        </Link>
        <Link
          href="/dashboard/settings#support"
          className="flex h-[40px] items-center gap-[12px] rounded-[6px] px-[12px] text-[13px] leading-5 text-[#71717a] hover:bg-[rgba(228,228,231,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b]"
        >
          <HelpCircle className="h-[15px] w-[15px]" aria-hidden="true" />
          Support
        </Link>
      </div>
    </aside>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 grid h-[58px] w-screen max-w-[100vw] overflow-hidden border-t border-[#e4e4e7] bg-white/95 px-[4px] backdrop-blur lg:hidden"
      style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
      aria-label="Mobile navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-w-0 flex-col items-center justify-center gap-[3px] rounded-[2px] text-[10px] leading-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b] ${
              active ? 'text-[#18181b]' : 'text-[#71717a]'
            }`}
          >
            <Icon className="h-[16px] w-[16px]" aria-hidden="true" />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function OperationsShell({
  health = INITIAL_HEALTH,
  children,
}: {
  health?: HealthResponse;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fdf8f8] text-[#1c1b1b]">
      <TopAppBar pathname={pathname} />
      <SideBar pathname={pathname} health={health} />
      <main className="min-h-screen overflow-x-hidden pt-[56px] lg:pl-[256px]">
        <div className="flex min-h-[calc(100vh-56px)] min-w-0 flex-col gap-[24px] overflow-x-hidden px-[16px] pb-[82px] pt-[20px] sm:px-[24px] lg:pb-[24px]">
          {children}
        </div>
      </main>
      <MobileNav pathname={pathname} />
    </div>
  );
}
