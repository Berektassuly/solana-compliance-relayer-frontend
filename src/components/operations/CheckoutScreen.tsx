'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import bs58 from 'bs58';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Signature,
  Wallet,
  XCircle,
} from 'lucide-react';
import { v7 as uuidv7 } from 'uuid';

import { formatAddress } from '@/lib/utils';
import { generateKeypair, generatePublicTransfer, type KeypairResult } from '@/lib/wasm';
import { fetchHealth, type HealthResponse } from '@/services/health';
import { fetchTransferAuditReport } from '@/services/audit-report';
import {
  createCheckoutSession,
  fetchCheckoutSession,
  fetchLinkedTransfer,
  submitCheckoutTransfer,
  type SubmitTransferRequestBody,
} from '@/services/checkout';
import type { CheckoutSession, CheckoutUseCase } from '@/types/checkout';
import type { TransferAuditReport } from '@/types/audit-report';
import type { TransferRequest } from '@/types/transfer-request';
import { OperationsShell } from './OperationsShell';
import {
  EmptyState,
  ErrorBanner,
  FieldLabel,
  InlineStatus,
  KeyValue,
  Panel,
  PrimaryButton,
  SecondaryButton,
  SkeletonBlock,
  StatusChip,
  TextInput,
} from './OperationsPrimitives';
import {
  complianceLabel,
  formatAuditAmount,
  formatDateTime,
  formatTransferAmount,
  getTokenSymbol,
  healthLabel,
  INITIAL_HEALTH,
  settlementLabel,
  settlementTone,
  statusTone,
  titleCaseStatus,
} from './operations-utils';

type AssetId = 'usdc_devnet' | 'sol' | 'custom';
type SignerMode = 'phantom' | 'demo';

interface PhantomProvider {
  isPhantom?: boolean;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toBase58: () => string } }>;
  disconnect?: () => Promise<void>;
  signMessage?: (
    message: Uint8Array,
    encoding?: 'utf8'
  ) => Promise<{ signature: Uint8Array } | Uint8Array>;
}

interface PhantomProviderError {
  code?: number;
  message?: string;
}

interface CheckoutFormState {
  merchantId: string;
  merchantReference: string;
  destinationWallet: string;
  assetId: AssetId;
  customMint: string;
  customDecimals: string;
  amount: string;
  customerWallet: string;
  useCase: CheckoutUseCase;
  metadataNote: string;
}

interface WalletState {
  publicKey: string | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

const ASSET_OPTIONS: Array<{
  id: AssetId;
  label: string;
  symbol: string;
  mint: string | null;
  decimals: number;
  hint: string;
}> = [
  {
    id: 'usdc_devnet',
    label: 'USDC stablecoin (devnet demo)',
    symbol: 'USDC',
    mint: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
    decimals: 6,
    hint: '6 decimals, public SPL transfer',
  },
  {
    id: 'sol',
    label: 'SOL (devnet/local)',
    symbol: 'SOL',
    mint: null,
    decimals: 9,
    hint: '9 decimals, native SOL transfer',
  },
  {
    id: 'custom',
    label: 'Custom SPL mint',
    symbol: 'TOKEN',
    mint: '',
    decimals: 6,
    hint: 'Set mint and decimals before creating the session',
  },
];

const USE_CASE_LABELS: Record<CheckoutUseCase, string> = {
  virtual_card_funding: 'Virtual-card funding',
  merchant_checkout: 'Merchant checkout',
  remittance: 'Remittance',
};

function useHealthSnapshot() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetchHealth();
        if (!cancelled) setHealth(response);
      } catch {
        if (!cancelled) setHealth(INITIAL_HEALTH);
      }
    };
    void load();
    const interval = window.setInterval(load, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return health ?? INITIAL_HEALTH;
}

function getPhantomProvider(): PhantomProvider | null {
  if (typeof window === 'undefined') return null;
  const browserWindow = window as Window & {
    phantom?: { solana?: PhantomProvider };
    solana?: PhantomProvider;
  };
  const provider = browserWindow.phantom?.solana ?? browserWindow.solana;
  return provider?.isPhantom ? provider : null;
}

function isPhantomProviderError(error: unknown): error is PhantomProviderError {
  return typeof error === 'object' && error !== null && ('message' in error || 'code' in error);
}

function phantomErrorMessage(error: unknown, fallback: string) {
  if (!isPhantomProviderError(error)) return fallback;
  if (error.code === 4001) {
    return 'Phantom connection was cancelled. Approve the connection request to continue.';
  }
  if (error.code === -32002) {
    return 'Phantom already has a pending request. Open the extension and finish or reject it.';
  }
  if (error.code === -32603 || error.message?.toLowerCase().includes('unexpected')) {
    return 'Phantom returned an internal provider error. Unlock Phantom, refresh the page, and try again in Chrome/Brave/Edge with the Phantom extension enabled.';
  }
  return error.message || fallback;
}

function parseAmountToRawUnits(value: string, decimals: number): number {
  const normalized = value.trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error('Enter a positive decimal amount.');
  }

  const [whole, fraction = ''] = normalized.split('.');
  if (fraction.length > decimals) {
    throw new Error(`This asset supports at most ${decimals} decimal places.`);
  }

  const raw = `${whole}${fraction.padEnd(decimals, '0')}`.replace(/^0+(?=\d)/, '');
  const amount = Number(raw || '0');
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error('Amount must be greater than zero and fit in a safe demo range.');
  }
  return amount;
}

function checkoutTone(status: CheckoutSession['status']) {
  if (status === 'settled') return 'healthy';
  if (status === 'rejected' || status === 'failed' || status === 'expired') return 'danger';
  if (status === 'transfer_submitted') return 'warning';
  return 'neutral';
}

function selectedAsset(form: CheckoutFormState) {
  const option = ASSET_OPTIONS.find((asset) => asset.id === form.assetId) ?? ASSET_OPTIONS[0];
  if (option.id !== 'custom') return option;
  return {
    ...option,
    mint: form.customMint.trim(),
    decimals: Number(form.customDecimals) || 6,
  };
}

function formatRawAmount(amount: number, tokenMint?: string | null) {
  const symbol = getTokenSymbol(tokenMint);
  const divisor = symbol === 'SOL' ? 1_000_000_000 : 1_000_000;
  const normalized = amount / divisor;
  return `${normalized.toLocaleString('en-US', {
    minimumFractionDigits: normalized >= 1 ? 2 : 4,
    maximumFractionDigits: symbol === 'SOL' ? 6 : 4,
  })} ${symbol}`;
}

function buildPublicSigningMessage({
  fromAddress,
  toAddress,
  amount,
  tokenMint,
  nonce,
}: {
  fromAddress: string;
  toAddress: string;
  amount: number;
  tokenMint?: string | null;
  nonce: string;
}) {
  return `${fromAddress}:${toAddress}:${amount}:${tokenMint || 'SOL'}:${nonce}`;
}

function CheckoutHeader({ health }: { health: HealthResponse }) {
  return (
    <div className="flex flex-col gap-[16px] md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-[4px]">
        <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.48px] text-[#1c1b1b]">
          S1lkPay Checkout
        </h1>
        <p className="max-w-[760px] text-[13px] leading-[18px] text-[#47464a]">
          Stablecoin checkout and virtual-card funding demo with customer authorization,
          compliance screening, issuer treasury settlement, and audit evidence.
        </p>
      </div>
      <StatusChip label={`API: ${healthLabel(health.status, 'Healthy')}`} tone={statusTone(health.status)} />
    </div>
  );
}

function ArchitectureNotice() {
  return (
    <div className="grid gap-[12px] border border-[#c8c5ca] bg-white p-[12px] text-[12px] leading-4 text-[#47464a] md:grid-cols-3">
      <div className="flex items-start gap-[8px]">
        <Signature className="mt-[1px] h-[14px] w-[14px] shrink-0 text-[#1c1b1b]" aria-hidden="true" />
        <span>
          Phantom signs an authorization message for the relayer, not a wallet-spending
          Solana transaction.
        </span>
      </div>
      <div className="flex items-start gap-[8px]">
        <ShieldCheck className="mt-[1px] h-[14px] w-[14px] shrink-0 text-[#00714d]" aria-hidden="true" />
        <span>
          The backend verifies the signature, screens compliance, and records audit evidence.
        </span>
      </div>
      <div className="flex items-start gap-[8px]">
        <CreditCard className="mt-[1px] h-[14px] w-[14px] shrink-0 text-[#1c1b1b]" aria-hidden="true" />
        <span>
          Approved settlement is submitted by the configured issuer or relayer treasury key.
        </span>
      </div>
    </div>
  );
}

function CheckoutSessionForm({
  form,
  formError,
  isCreating,
  connectedWallet,
  onFormChange,
  onSubmit,
  onUseWallet,
}: {
  form: CheckoutFormState;
  formError: string | null;
  isCreating: boolean;
  connectedWallet: string | null;
  onFormChange: (patch: Partial<CheckoutFormState>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUseWallet: () => void;
}) {
  const asset = selectedAsset(form);
  const rawPreview = useMemo(() => {
    try {
      return parseAmountToRawUnits(form.amount, asset.decimals).toLocaleString('en-US');
    } catch {
      return 'Enter amount';
    }
  }, [asset.decimals, form.amount]);

  return (
    <Panel
      title="Create Checkout Session"
      action={<CreditCard className="h-[15px] w-[15px] text-[#47464a]" aria-hidden="true" />}
      bodyClassName="p-[16px]"
    >
      <form className="space-y-[16px]" onSubmit={onSubmit}>
        {formError && <ErrorBanner message={formError} />}

        <div className="grid gap-[12px] md:grid-cols-2">
          <div>
            <FieldLabel htmlFor="checkout-merchant-id">Merchant ID</FieldLabel>
            <TextInput
              id="checkout-merchant-id"
              value={form.merchantId}
              onChange={(event) => onFormChange({ merchantId: event.target.value })}
              autoComplete="organization"
              spellCheck={false}
              required
            />
          </div>
          <div>
            <FieldLabel htmlFor="checkout-reference">Merchant Reference</FieldLabel>
            <TextInput
              id="checkout-reference"
              value={form.merchantReference}
              onChange={(event) => onFormChange({ merchantReference: event.target.value })}
              autoComplete="off"
              spellCheck={false}
              required
            />
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="checkout-destination">Destination Wallet</FieldLabel>
          <TextInput
            id="checkout-destination"
            value={form.destinationWallet}
            onChange={(event) => onFormChange({ destinationWallet: event.target.value })}
            placeholder="Merchant settlement wallet"
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
            required
          />
        </div>

        <div className="grid gap-[12px] md:grid-cols-[minmax(0,1fr)_160px]">
          <div>
            <FieldLabel htmlFor="checkout-asset">Asset / Mint</FieldLabel>
            <select
              id="checkout-asset"
              value={form.assetId}
              onChange={(event) => onFormChange({ assetId: event.target.value as AssetId })}
              className="h-[36px] w-full rounded-[2px] border border-[#c8c5ca] bg-white px-[10px] text-[13px] leading-[18px] text-[#1c1b1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b]"
            >
              {ASSET_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-[6px] text-[12px] leading-4 text-[#71717a]">
              {asset.mint ? `Mint ${formatAddress(asset.mint, 6)} - ${asset.hint}` : asset.hint}
            </p>
          </div>
          <div>
            <FieldLabel htmlFor="checkout-amount">Amount</FieldLabel>
            <TextInput
              id="checkout-amount"
              value={form.amount}
              onChange={(event) => onFormChange({ amount: event.target.value })}
              placeholder="25.00"
              inputMode="decimal"
              autoComplete="off"
              className="font-mono"
              required
            />
            <p className="mt-[6px] font-mono text-[12px] leading-4 text-[#71717a]">
              Raw {rawPreview}
            </p>
          </div>
        </div>

        {form.assetId === 'custom' && (
          <div className="grid gap-[12px] md:grid-cols-[minmax(0,1fr)_140px]">
            <div>
              <FieldLabel htmlFor="checkout-custom-mint">Custom Token Mint</FieldLabel>
              <TextInput
                id="checkout-custom-mint"
                value={form.customMint}
                onChange={(event) => onFormChange({ customMint: event.target.value })}
                autoComplete="off"
                spellCheck={false}
                className="font-mono"
              />
            </div>
            <div>
              <FieldLabel htmlFor="checkout-custom-decimals">Decimals</FieldLabel>
              <TextInput
                id="checkout-custom-decimals"
                value={form.customDecimals}
                onChange={(event) => onFormChange({ customDecimals: event.target.value })}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
              />
            </div>
          </div>
        )}

        <div>
          <div className="mb-[6px] flex items-center justify-between gap-[10px]">
            <FieldLabel htmlFor="checkout-customer-wallet">Customer Wallet Optional</FieldLabel>
            {connectedWallet && (
              <button
                type="button"
                onClick={onUseWallet}
                className="text-[12px] font-medium text-[#1c1b1b] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b]"
              >
                Use connected wallet
              </button>
            )}
          </div>
          <TextInput
            id="checkout-customer-wallet"
            value={form.customerWallet}
            onChange={(event) => onFormChange({ customerWallet: event.target.value })}
            placeholder="Leave blank for demo signer fallback"
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
          />
        </div>

        <div className="grid gap-[12px] md:grid-cols-[240px_minmax(0,1fr)]">
          <div>
            <FieldLabel htmlFor="checkout-use-case">Use Case Metadata</FieldLabel>
            <select
              id="checkout-use-case"
              value={form.useCase}
              onChange={(event) => onFormChange({ useCase: event.target.value as CheckoutUseCase })}
              className="h-[36px] w-full rounded-[2px] border border-[#c8c5ca] bg-white px-[10px] text-[13px] leading-[18px] text-[#1c1b1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b]"
            >
              {Object.entries(USE_CASE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="checkout-note">Metadata Note</FieldLabel>
            <TextInput
              id="checkout-note"
              value={form.metadataNote}
              onChange={(event) => onFormChange({ metadataNote: event.target.value })}
              placeholder="Frontier demo card load"
              autoComplete="off"
            />
          </div>
        </div>

        <PrimaryButton type="submit" disabled={isCreating} className="w-full sm:w-auto">
          {isCreating ? (
            <Loader2 className="h-[13px] w-[13px] animate-spin" aria-hidden="true" />
          ) : (
            <CreditCard className="h-[13px] w-[13px]" aria-hidden="true" />
          )}
          Create Session
        </PrimaryButton>
      </form>
    </Panel>
  );
}

function WalletAuthorizationPanel({
  session,
  wallet,
  demoKeypair,
  signedMessage,
  submitError,
  isSubmitting,
  isGeneratingDemo,
  onConnect,
  onDisconnect,
  onGenerateDemoSigner,
  onUseDemoAsCustomer,
  onSubmitSignedTransfer,
}: {
  session: CheckoutSession | null;
  wallet: WalletState;
  demoKeypair: KeypairResult | null;
  signedMessage: string | null;
  submitError: string | null;
  isSubmitting: boolean;
  isGeneratingDemo: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onGenerateDemoSigner: () => void;
  onUseDemoAsCustomer: () => void;
  onSubmitSignedTransfer: (mode: SignerMode) => void;
}) {
  return (
    <Panel
      title="Authorization"
      action={<Signature className="h-[15px] w-[15px] text-[#47464a]" aria-hidden="true" />}
      bodyClassName="p-[16px]"
    >
      <div className="space-y-[16px]">
        {submitError && <ErrorBanner message={submitError} />}
        {wallet.error && <ErrorBanner message={wallet.error} />}

        <div className="rounded-[2px] border border-[#e4e4e7] bg-[#fafafa] p-[10px] text-[12px] leading-4 text-[#47464a]">
          The signer authorizes this checkout payload for compliance review. No seed
          phrase is requested, and Phantom is not asked to submit a token transfer.
        </div>

        <div className="flex flex-col gap-[10px] border border-[#e4e4e7] bg-white p-[12px]">
          <div className="flex items-center justify-between gap-[12px]">
            <div className="min-w-0">
              <div className="text-[13px] font-semibold leading-[18px] text-[#1c1b1b]">
                Phantom Wallet
              </div>
              <div className="font-mono text-[12px] leading-4 text-[#47464a]">
                {wallet.connected && wallet.publicKey
                  ? formatAddress(wallet.publicKey, 8)
                  : 'Disconnected'}
              </div>
            </div>
            {wallet.connected ? (
              <SecondaryButton onClick={onDisconnect} className="h-[34px] px-[10px]">
                <XCircle className="h-[13px] w-[13px]" aria-hidden="true" />
                Disconnect
              </SecondaryButton>
            ) : (
              <PrimaryButton onClick={onConnect} disabled={wallet.connecting} className="h-[34px] px-[12px]">
                {wallet.connecting ? (
                  <Loader2 className="h-[13px] w-[13px] animate-spin" aria-hidden="true" />
                ) : (
                  <Wallet className="h-[13px] w-[13px]" aria-hidden="true" />
                )}
                Connect Phantom
              </PrimaryButton>
            )}
          </div>
          <PrimaryButton
            onClick={() => onSubmitSignedTransfer('phantom')}
            disabled={!session || !wallet.connected || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2 className="h-[13px] w-[13px] animate-spin" aria-hidden="true" />
            ) : (
              <Signature className="h-[13px] w-[13px]" aria-hidden="true" />
            )}
            Sign Authorization With Phantom
          </PrimaryButton>
        </div>

        <div className="flex flex-col gap-[10px] border border-dashed border-[#c8c5ca] bg-[#fffdfd] p-[12px]">
          <div className="flex items-start justify-between gap-[12px]">
            <div className="min-w-0">
              <div className="text-[13px] font-semibold leading-[18px] text-[#1c1b1b]">
                Demo Signer Fallback
              </div>
              <div className="font-mono text-[12px] leading-4 text-[#47464a]">
                {demoKeypair ? formatAddress(demoKeypair.public_key, 8) : 'Generated browser identity'}
              </div>
            </div>
            <SecondaryButton
              onClick={onGenerateDemoSigner}
              disabled={isGeneratingDemo}
              className="h-[34px] px-[10px]"
            >
              {isGeneratingDemo ? (
                <Loader2 className="h-[13px] w-[13px] animate-spin" aria-hidden="true" />
              ) : (
                <KeyRound className="h-[13px] w-[13px]" aria-hidden="true" />
              )}
              Generate
            </SecondaryButton>
          </div>
          <p className="text-[12px] leading-4 text-[#71717a]">
            This fallback uses an ephemeral WASM keypair for local demos only. It is not a
            real customer wallet.
          </p>
          {demoKeypair && (
            <SecondaryButton onClick={onUseDemoAsCustomer} className="w-full">
              Use Demo Identity As Customer Wallet
            </SecondaryButton>
          )}
          <SecondaryButton
            onClick={() => onSubmitSignedTransfer('demo')}
            disabled={!session || isSubmitting}
            className="w-full"
          >
            <Signature className="h-[13px] w-[13px]" aria-hidden="true" />
            Submit With Demo Signer
          </SecondaryButton>
        </div>

        {signedMessage && (
          <div className="rounded-[2px] border border-[#e4e4e7] bg-[#fafafa] p-[10px]">
            <div className="mb-[6px] text-[11px] font-semibold uppercase leading-4 tracking-[0.55px] text-[#47464a]">
              Last Signed Message
            </div>
            <p className="break-all font-mono text-[12px] leading-5 text-[#1c1b1b]">
              {signedMessage}
            </p>
          </div>
        )}
      </div>
    </Panel>
  );
}

function SessionPanel({
  session,
  isRefreshing,
  refreshError,
  onRefresh,
}: {
  session: CheckoutSession | null;
  isRefreshing: boolean;
  refreshError: string | null;
  onRefresh: () => void;
}) {
  return (
    <Panel
      title="Checkout Session"
      action={
        <SecondaryButton onClick={onRefresh} disabled={!session || isRefreshing} className="h-[30px] px-[10px]">
          <RefreshCw className={`h-[12px] w-[12px] ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </SecondaryButton>
      }
      bodyClassName="p-[16px]"
    >
      {refreshError && <ErrorBanner message={refreshError} />}
      {!session ? (
        <EmptyState
          compact
          title="No checkout session"
          body="Create a session to produce a payable authorization payload."
        />
      ) : (
        <div className="space-y-[12px]">
          <div className="flex flex-wrap items-center gap-[8px]">
            <StatusChip label={titleCaseStatus(session.status)} tone={checkoutTone(session.status)} />
            <StatusChip label={getTokenSymbol(session.token_mint)} tone="neutral" />
          </div>
          <div>
            <KeyValue label="Session ID" value={session.id} mono />
            <KeyValue label="Merchant reference" value={session.merchant_reference} mono />
            <KeyValue label="Destination wallet" value={formatAddress(session.destination_wallet, 8)} mono />
            <KeyValue label="Customer wallet" value={session.customer_wallet ? formatAddress(session.customer_wallet, 8) : 'Not pinned'} mono />
            <KeyValue label="Token mint" value={session.token_mint ? formatAddress(session.token_mint, 8) : 'SOL'} mono />
            <KeyValue label="Amount" value={formatRawAmount(session.amount, session.token_mint)} mono />
            <KeyValue label="Expires" value={formatDateTime(session.expires_at)} />
            <KeyValue label="Transfer request" value={session.transfer_request_id ?? 'Not submitted'} mono />
          </div>
          {session.merchant_metadata && (
            <div className="rounded-[2px] border border-[#e4e4e7] bg-[#fafafa] p-[10px]">
              <div className="mb-[6px] text-[11px] font-semibold uppercase leading-4 tracking-[0.55px] text-[#47464a]">
                Metadata
              </div>
              <pre className="max-h-[140px] overflow-auto whitespace-pre-wrap break-words font-mono text-[12px] leading-5 text-[#1c1b1b]">
                {JSON.stringify(session.merchant_metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

function TransferAndAuditPanel({
  transfer,
  audit,
  auditLoading,
}: {
  transfer: TransferRequest | null;
  audit: TransferAuditReport | null;
  auditLoading: boolean;
}) {
  return (
    <Panel
      title="Transfer And Audit"
      action={
        transfer ? (
          <StatusChip
            label={titleCaseStatus(transfer.blockchain_status)}
            tone={statusTone(transfer.blockchain_status)}
          />
        ) : undefined
      }
      bodyClassName="p-[16px]"
    >
      {!transfer ? (
        <EmptyState
          compact
          title="No signed transfer"
          body="After authorization, the linked transfer and audit report appear here."
        />
      ) : (
        <div className="space-y-[14px]">
          <div>
            <KeyValue label="Transfer ID" value={transfer.id} mono />
            <KeyValue label="Sender" value={formatAddress(transfer.from_address, 8)} mono />
            <KeyValue label="Recipient" value={formatAddress(transfer.to_address, 8)} mono />
            <KeyValue label="Amount" value={formatTransferAmount(transfer)} mono />
            <KeyValue label="Compliance" value={complianceLabel(transfer.compliance_status)} />
            <KeyValue label="Settlement" value={<InlineStatus label={settlementLabel(transfer)} tone={settlementTone(transfer)} />} />
            <KeyValue label="Nonce" value={transfer.nonce ? formatAddress(transfer.nonce, 8) : 'Unavailable'} mono />
          </div>

          {transfer.blockchain_signature && (
            <a
              href={`https://explorer.solana.com/tx/${transfer.blockchain_signature}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-[34px] items-center gap-[8px] rounded-[2px] border border-[#c8c5ca] bg-white px-[10px] font-mono text-[12px] text-[#1c1b1b] hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b]"
            >
              {formatAddress(transfer.blockchain_signature, 6)}
              <ExternalLink className="h-[12px] w-[12px]" aria-hidden="true" />
            </a>
          )}

          {transfer.blockchain_last_error && (
            <div className="rounded-[2px] border border-[rgba(186,26,26,0.35)] bg-[#fff8f8] p-[10px] text-[12px] leading-4 text-[#ba1a1a]">
              <div className="mb-[4px] flex items-center gap-[6px] font-semibold">
                <AlertCircle className="h-[13px] w-[13px]" aria-hidden="true" />
                Last error
              </div>
              {transfer.blockchain_last_error}
            </div>
          )}

          <div className="h-px bg-[#e4e4e7]" />

          <div>
            <div className="mb-[8px] text-[12px] font-semibold uppercase leading-4 tracking-[0.55px] text-[#47464a]">
              Audit Report
            </div>
            {auditLoading ? (
              <div className="space-y-[8px]">
                <SkeletonBlock className="h-[28px]" />
                <SkeletonBlock className="h-[28px]" />
                <SkeletonBlock className="h-[28px]" />
              </div>
            ) : audit ? (
              <div>
                <KeyValue label="Decision" value={titleCaseStatus(audit.final_decision)} />
                <KeyValue label="Audit amount" value={formatAuditAmount(audit.amount, audit.token_mint)} mono />
                <KeyValue label="Risk summary" value={audit.risk_decision_summary} />
                <KeyValue label="Blocklist hits" value={audit.internal_blocklist_hits.length.toString()} mono />
                <KeyValue
                  label="Range risk"
                  value={audit.range_risk_score == null ? 'Unavailable' : `${audit.range_risk_score}/10`}
                  mono
                />
                <KeyValue label="Helius assets" value={audit.helius_asset_screening_status ?? 'Unavailable'} />
              </div>
            ) : (
              <EmptyState compact title="Audit pending" body="Audit evidence loads after the transfer is accepted." />
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

function ConfidentialCapabilityPanel() {
  return (
    <Panel
      title="Confidential Transfer Capability"
      action={<StatusChip label="Caveated" tone="warning" />}
      bodyClassName="p-[16px]"
    >
      <div className="flex flex-col gap-[10px] text-[12px] leading-4 text-[#47464a]">
        <p>
          Public SOL and SPL stablecoin checkout is the live demo path. Token-2022
          confidential transfers remain a backend/network capability, but they are not exposed
          as an interactive public checkout control here.
        </p>
        <a
          href="https://solana.com/docs/tokens/extensions/confidential-transfer"
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-[6px] text-[12px] font-medium text-[#1c1b1b] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b]"
        >
          Solana confidential transfer docs
          <ExternalLink className="h-[12px] w-[12px]" aria-hidden="true" />
        </a>
      </div>
    </Panel>
  );
}

export function CheckoutScreen() {
  const health = useHealthSnapshot();
  const [form, setForm] = useState<CheckoutFormState>({
    merchantId: 's1lkpay_frontier_demo',
    merchantReference: 'VCF-2026-00042',
    destinationWallet: '',
    assetId: 'usdc_devnet',
    customMint: '',
    customDecimals: '6',
    amount: '25.00',
    customerWallet: '',
    useCase: 'virtual_card_funding',
    metadataNote: 'Frontier virtual card funding demo',
  });
  const [wallet, setWallet] = useState<WalletState>({
    publicKey: null,
    connected: false,
    connecting: false,
    error: null,
  });
  const [demoKeypair, setDemoKeypair] = useState<KeypairResult | null>(null);
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [transfer, setTransfer] = useState<TransferRequest | null>(null);
  const [audit, setAudit] = useState<TransferAuditReport | null>(null);
  const [signedMessage, setSignedMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);

  const onFormChange = useCallback((patch: Partial<CheckoutFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
    setFormError(null);
  }, []);

  const loadAudit = useCallback(async (transferId: string) => {
    setAuditLoading(true);
    try {
      const report = await fetchTransferAuditReport(transferId);
      setAudit(report);
    } catch {
      setAudit(null);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const refreshCheckout = useCallback(async (showLoading = false) => {
    if (!session) return;
    if (showLoading) setIsRefreshing(true);
    setRefreshError(null);
    try {
      const latestSession = await fetchCheckoutSession(session.id);
      setSession(latestSession);
      if (latestSession.transfer_request_id) {
        const latestTransfer = await fetchLinkedTransfer(latestSession.transfer_request_id);
        setTransfer(latestTransfer);
        void loadAudit(latestTransfer.id);
      }
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : 'Checkout status unavailable');
    } finally {
      setIsRefreshing(false);
    }
  }, [loadAudit, session]);

  useEffect(() => {
    if (!session) return undefined;
    const interval = window.setInterval(() => refreshCheckout(false), 5_000);
    return () => window.clearInterval(interval);
  }, [refreshCheckout, session]);

  const handleConnectWallet = async () => {
    setWallet((current) => ({ ...current, connecting: true, error: null }));
    const provider = getPhantomProvider();

    if (!provider) {
      setWallet((current) => ({
        ...current,
        connecting: false,
        error: 'Phantom is not available in this browser. Use the demo signer fallback or install Phantom.',
      }));
      return;
    }

    try {
      const response = await provider.connect({ onlyIfTrusted: false });
      if (!response?.publicKey) {
        throw new Error('Phantom connected but did not return a public key.');
      }
      const publicKey = response.publicKey.toBase58();
      setWallet({
        publicKey,
        connected: true,
        connecting: false,
        error: null,
      });
      setForm((current) => ({
        ...current,
        customerWallet: current.customerWallet || publicKey,
      }));
    } catch (err) {
      setWallet((current) => ({
        ...current,
        connecting: false,
        error: phantomErrorMessage(err, 'Wallet connection rejected'),
      }));
    }
  };

  const handleDisconnectWallet = async () => {
    const provider = getPhantomProvider();
    await provider?.disconnect?.().catch(() => undefined);
    setWallet({
      publicKey: null,
      connected: false,
      connecting: false,
      error: null,
    });
  };

  const handleGenerateDemoSigner = async () => {
    setIsGeneratingDemo(true);
    setSubmitError(null);
    try {
      const keypair = await generateKeypair();
      setDemoKeypair(keypair);
      setForm((current) => ({
        ...current,
        customerWallet: current.customerWallet || keypair.public_key,
      }));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Demo signer could not be generated');
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  const handleCreateSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSubmitError(null);
    setRefreshError(null);

    const asset = selectedAsset(form);
    if (!form.merchantId.trim() || !form.merchantReference.trim() || !form.destinationWallet.trim()) {
      setFormError('Merchant ID, reference, and destination wallet are required.');
      return;
    }
    if (asset.id === 'custom' && !asset.mint) {
      setFormError('Custom SPL checkout requires a token mint.');
      return;
    }
    if (asset.id === 'custom' && (!Number.isInteger(asset.decimals) || asset.decimals < 0 || asset.decimals > 9)) {
      setFormError('Custom token decimals must be between 0 and 9.');
      return;
    }

    let rawAmount: number;
    try {
      rawAmount = parseAmountToRawUnits(form.amount, asset.decimals);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Invalid amount');
      return;
    }

    setIsCreating(true);
    try {
      const metadata: Record<string, unknown> = {
        use_case: form.useCase,
        use_case_label: USE_CASE_LABELS[form.useCase],
        channel: 's1lkpay_frontier_dashboard',
        settlement_model: 'issuer_relayer_treasury',
      };
      if (form.metadataNote.trim()) {
        metadata.note = form.metadataNote.trim();
      }

      const created = await createCheckoutSession({
        merchant_id: form.merchantId.trim(),
        merchant_reference: form.merchantReference.trim(),
        destination_wallet: form.destinationWallet.trim(),
        token_mint: asset.mint || null,
        amount: rawAmount,
        customer_wallet: form.customerWallet.trim() || wallet.publicKey || null,
        merchant_metadata: metadata,
      });
      setSession(created);
      setTransfer(null);
      setAudit(null);
      setSignedMessage(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Checkout session could not be created');
    } finally {
      setIsCreating(false);
    }
  };

  const createPhantomSignature = async (message: string) => {
    const provider = getPhantomProvider();
    if (!provider?.signMessage || !wallet.publicKey) {
      throw new Error('Connect Phantom before signing.');
    }
    try {
      const result = await provider.signMessage(new TextEncoder().encode(message), 'utf8');
      const signature = result instanceof Uint8Array ? result : result.signature;
      return bs58.encode(signature);
    } catch (err) {
      throw new Error(phantomErrorMessage(err, 'Phantom message signing failed'));
    }
  };

  const handleSubmitSignedTransfer = async (mode: SignerMode) => {
    if (!session) {
      setSubmitError('Create a checkout session before signing.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const nonce = uuidv7();
      let fromAddress: string;
      let signature: string;
      let message: string;

      if (mode === 'phantom') {
        if (!wallet.publicKey) throw new Error('Connect Phantom before signing.');
        fromAddress = wallet.publicKey;
        message = buildPublicSigningMessage({
          fromAddress,
          toAddress: session.destination_wallet,
          amount: session.amount,
          tokenMint: session.token_mint,
          nonce,
        });
        signature = await createPhantomSignature(message);
      } else {
        let keypair = demoKeypair;
        if (!keypair) {
          keypair = await generateKeypair();
          setDemoKeypair(keypair);
        }
        const result = await generatePublicTransfer(
          keypair.secret_key,
          session.destination_wallet,
          session.amount,
          session.token_mint ?? undefined,
          nonce
        );
        fromAddress = result.from_address;
        signature = result.signature;
        message = buildPublicSigningMessage({
          fromAddress,
          toAddress: session.destination_wallet,
          amount: session.amount,
          tokenMint: session.token_mint,
          nonce,
        });
      }

      if (session.customer_wallet && session.customer_wallet !== fromAddress) {
        throw new Error(
          `Session customer wallet is ${formatAddress(session.customer_wallet, 8)}, but signer is ${formatAddress(fromAddress, 8)}.`
        );
      }

      const body: SubmitTransferRequestBody = {
        from_address: fromAddress,
        to_address: session.destination_wallet,
        transfer_details: {
          type: 'public',
          amount: session.amount,
        },
        token_mint: session.token_mint ?? null,
        signature,
        nonce,
      };

      const response = await submitCheckoutTransfer(session.id, body);
      setSession(response.session);
      setTransfer(response.transfer_request);
      setSignedMessage(message);
      await loadAudit(response.transfer_request.id);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Signed transfer could not be submitted');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OperationsShell health={health}>
      <CheckoutHeader health={health} />
      <ArchitectureNotice />

      <div className="grid gap-[24px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <CheckoutSessionForm
          form={form}
          formError={formError}
          isCreating={isCreating}
          connectedWallet={wallet.publicKey}
          onFormChange={onFormChange}
          onSubmit={handleCreateSession}
          onUseWallet={() => {
            if (wallet.publicKey) onFormChange({ customerWallet: wallet.publicKey });
          }}
        />
        <WalletAuthorizationPanel
          session={session}
          wallet={wallet}
          demoKeypair={demoKeypair}
          signedMessage={signedMessage}
          submitError={submitError}
          isSubmitting={isSubmitting}
          isGeneratingDemo={isGeneratingDemo}
          onConnect={handleConnectWallet}
          onDisconnect={handleDisconnectWallet}
          onGenerateDemoSigner={handleGenerateDemoSigner}
          onUseDemoAsCustomer={() => {
            if (demoKeypair) onFormChange({ customerWallet: demoKeypair.public_key });
          }}
          onSubmitSignedTransfer={handleSubmitSignedTransfer}
        />
      </div>

      <div className="grid gap-[24px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <SessionPanel
          session={session}
          isRefreshing={isRefreshing}
          refreshError={refreshError}
          onRefresh={() => refreshCheckout(true)}
        />
        <TransferAndAuditPanel
          transfer={transfer}
          audit={audit}
          auditLoading={auditLoading}
        />
      </div>

      <ConfidentialCapabilityPanel />

      {session && (
        <div className="flex items-center gap-[8px] text-[12px] leading-4 text-[#71717a]">
          {transfer ? (
            <CheckCircle2 className="h-[13px] w-[13px] text-[#00714d]" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-[13px] w-[13px]" aria-hidden="true" />
          )}
          <span>
            Session sampled {formatDateTime(session.updated_at)} - backend status poll runs every 5 seconds while this screen is open.
          </span>
        </div>
      )}
    </OperationsShell>
  );
}
