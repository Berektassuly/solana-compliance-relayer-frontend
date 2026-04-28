'use client';

import { Fragment, useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Bell,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileSearch,
  Gauge,
  Server,
  Settings,
  SquareStack,
  Zap,
} from 'lucide-react';

import type { HealthResponse } from '@/services/health';
import { IconButton, StatusChip } from './OperationsPrimitives';
import { healthLabel, INITIAL_HEALTH, statusTone } from './operations-utils';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: Gauge },
  { label: 'Checkout', href: '/dashboard/checkout', icon: CreditCard },
  { label: 'Transactions', href: '/dashboard/transactions', icon: ClipboardList },
  { label: 'Relayer Nodes', href: '/dashboard/relayer-nodes', icon: Server },
  { label: 'Evidence', href: '/dashboard/investigations', icon: FileSearch },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const settingsMenuItems = [
  { id: 'add-blocklist-rule', label: 'Add Blocklist Rule' },
  { id: 'runtime', label: 'Runtime' },
  { id: 'docs', label: 'Docs' },
  { id: 'support', label: 'Support' },
  { id: 'current-blocklist', label: 'Current Blocklist' },
] as const;

type SettingsMenuItemId = (typeof settingsMenuItems)[number]['id'];

const settingsSectionAliases: Record<string, SettingsMenuItemId> = {
  'add-blocklist-rule': 'add-blocklist-rule',
  add: 'add-blocklist-rule',
  blocklist: 'current-blocklist',
  'current-blocklist': 'current-blocklist',
  docs: 'docs',
  runtime: 'runtime',
  support: 'support',
};

function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
  return pathname.startsWith(href);
}

function settingsSectionFromValue(value: string | null | undefined): SettingsMenuItemId {
  const key = (value ?? '').replace(/^#/, '').toLowerCase();
  return settingsSectionAliases[key] ?? 'current-blocklist';
}

function settingsSectionFromLocation() {
  const params = new URLSearchParams(window.location.search);
  return settingsSectionFromValue(params.get('section') ?? window.location.hash);
}

function TopAppBar() {
  return (
    <header className="fixed left-0 top-0 z-50 flex h-[56px] w-full items-center justify-between border-b border-[#e4e4e7] bg-white/80 px-[16px] backdrop-blur-[6px] sm:px-[24px]">
      <div className="flex min-w-0 items-center gap-[16px]">
        <Link
          href="/dashboard"
          className="shrink-0 text-[13px] font-bold uppercase leading-5 tracking-[0.7px] text-[#18181b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b] sm:text-[14px]"
        >
          SOLANA COMPLIANCE RELAYER
        </Link>
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
  activeSettingsSection,
  settingsBlocklistCount,
  settingsBlocklistLoading,
  onSettingsSectionSelect,
}: {
  pathname: string;
  health: HealthResponse;
  activeSettingsSection: SettingsMenuItemId;
  settingsBlocklistCount?: number;
  settingsBlocklistLoading?: boolean;
  onSettingsSectionSelect: (section: SettingsMenuItemId) => void;
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
          const expandedSettings = item.href === '/dashboard/settings' && active;
          return (
            <Fragment key={item.href}>
              <Link
                href={item.href}
                aria-current={active && !expandedSettings ? 'page' : undefined}
                className={`flex h-[40px] items-center gap-[12px] rounded-[6px] px-[12px] text-[13px] leading-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b] ${
                  active
                    ? 'bg-[rgba(228,228,231,0.7)] text-[#18181b]'
                    : 'text-[#71717a] hover:bg-[rgba(228,228,231,0.35)] hover:text-[#18181b]'
                }`}
              >
                <Icon className="h-[15px] w-[15px]" aria-hidden="true" />
                <span className="min-w-0 flex-1">{item.label}</span>
                {expandedSettings && (
                  <ChevronDown className="h-[14px] w-[14px] text-[#71717a]" aria-hidden="true" />
                )}
              </Link>
              {expandedSettings && (
                <div className="ml-[22px] border-l border-[#e4e4e7] py-[3px] pl-[10px]">
                  {settingsMenuItems.map((section) => {
                    const sectionActive = activeSettingsSection === section.id;
                    return (
                      <button
                        key={section.id}
                        aria-current={sectionActive ? 'page' : undefined}
                        onClick={() => onSettingsSectionSelect(section.id)}
                        type="button"
                        className={`flex min-h-[34px] items-center justify-between gap-[8px] rounded-[2px] px-[12px] py-[7px] text-[13px] leading-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b] ${
                          sectionActive
                            ? 'bg-[#ececec] font-semibold text-[#18181b]'
                            : 'font-medium text-[#47464a] hover:bg-[#f7f7f8] hover:text-[#18181b]'
                        }`}
                      >
                        <span className="min-w-0 truncate">{section.label}</span>
                        {section.id === 'current-blocklist' &&
                          !settingsBlocklistLoading &&
                          typeof settingsBlocklistCount === 'number' && (
                            <span className="min-w-[20px] rounded-[2px] bg-white px-[5px] py-[1px] text-center font-mono text-[11px] leading-4 text-[#47464a]">
                              {settingsBlocklistCount}
                            </span>
                          )}
                      </button>
                    );
                  })}
                </div>
              )}
            </Fragment>
          );
        })}
      </nav>
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
  settingsBlocklistCount,
  settingsBlocklistLoading,
  children,
}: {
  health?: HealthResponse;
  settingsBlocklistCount?: number;
  settingsBlocklistLoading?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [activeSettingsSection, setActiveSettingsSection] =
    useState<SettingsMenuItemId>('current-blocklist');

  useEffect(() => {
    const syncSettingsSection = () => {
      setActiveSettingsSection(settingsSectionFromLocation());
    };
    syncSettingsSection();
    window.addEventListener('popstate', syncSettingsSection);
    window.addEventListener('operations-settings-section-change', syncSettingsSection);
    return () => {
      window.removeEventListener('popstate', syncSettingsSection);
      window.removeEventListener('operations-settings-section-change', syncSettingsSection);
    };
  }, [pathname]);

  const handleSettingsSectionSelect = useCallback((section: SettingsMenuItemId) => {
    setActiveSettingsSection(section);
    const url = new URL(window.location.href);
    url.searchParams.set('section', section);
    url.hash = '';
    window.history.pushState(null, '', url);
    window.dispatchEvent(new CustomEvent('operations-settings-section-change'));
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fdf8f8] text-[#1c1b1b]">
      <TopAppBar />
      <SideBar
        pathname={pathname}
        health={health}
        activeSettingsSection={activeSettingsSection}
        settingsBlocklistCount={settingsBlocklistCount}
        settingsBlocklistLoading={settingsBlocklistLoading}
        onSettingsSectionSelect={handleSettingsSectionSelect}
      />
      <main className="min-h-screen overflow-x-hidden pt-[56px] lg:pl-[256px]">
        <div className="flex min-h-[calc(100vh-56px)] min-w-0 flex-col gap-[24px] overflow-x-hidden px-[16px] pb-[82px] pt-[20px] sm:px-[24px] lg:pb-[24px]">
          {children}
        </div>
      </main>
      <MobileNav pathname={pathname} />
    </div>
  );
}
