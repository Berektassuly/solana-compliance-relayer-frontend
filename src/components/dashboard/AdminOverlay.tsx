'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  X,
  Settings,
} from 'lucide-react';
import {
  fetchBlocklist,
  addToBlocklist,
  removeFromBlocklist,
} from '@/services/blocklist';
import type { BlocklistEntry, ListBlocklistResponse } from '@/services/blocklist';

// ============================================================================
// Types
// ============================================================================

interface AdminOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

// ============================================================================
// Toast Component
// ============================================================================

function Toast({ toast }: { toast: ToastState }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
        toast.type === 'success'
          ? 'bg-green-500/20 border border-green-500/30 text-green-400'
          : 'bg-red-500/20 border border-red-500/30 text-red-400'
      }`}
    >
      {toast.type === 'success' ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      <span className="text-sm">{toast.message}</span>
    </motion.div>
  );
}

// ============================================================================
// Admin Overlay Component
// ============================================================================

export function AdminOverlay({ isOpen, onClose }: AdminOverlayProps) {
  const [adminKey, setAdminKey] = useState('');
  const [address, setAddress] = useState('');
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);

  // Blocklist state
  const [blocklist, setBlocklist] = useState<ListBlocklistResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingAddress, setDeletingAddress] = useState<string | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // Fetch blocklist
  const loadBlocklist = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchBlocklist();
      setBlocklist(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blocklist');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load when opened
  useEffect(() => {
    if (isOpen) {
      loadBlocklist();
    }
  }, [isOpen, loadBlocklist]);

  // Handle add address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !reason.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await addToBlocklist(address.trim(), reason.trim());
      showToast('success', result.message);
      setAddress('');
      setReason('');
      loadBlocklist();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to add address');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle remove address
  const handleRemove = async (entryAddress: string) => {
    if (!confirm(`Remove ${entryAddress} from blocklist?`)) return;

    setDeletingAddress(entryAddress);
    try {
      const result = await removeFromBlocklist(entryAddress);
      showToast('success', result.message);
      loadBlocklist();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to remove address');
    } finally {
      setDeletingAddress(null);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl z-50 overflow-y-auto bg-panel border-l border-border shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-panel/95 backdrop-blur-sm border-b border-border px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Admin: Blocklist Manager
                    </h2>
                    <p className="text-sm text-muted">
                      Manage blocked wallet addresses
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-panel-hover transition-colors"
                >
                  <X className="h-5 w-5 text-muted" />
                </button>
              </div>

              {/* Admin Key Input */}
              <div className="mt-4 flex items-center gap-3">
                <label className="text-xs text-muted whitespace-nowrap">Admin Key:</label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter admin key..."
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Warning Banner */}
              {!adminKey && (
                <div className="mt-3 flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>
                    No admin key provided. Operations may fail if authentication is required.
                  </span>
                </div>
              )}
            </div>

            {/* Toast */}
            <div className="fixed top-4 right-4 z-50">
              <AnimatePresence>
                {toast && <Toast toast={toast} />}
              </AnimatePresence>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Add to Blocklist Form */}
              <div className="rounded-xl border border-border bg-background/50 p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />
                  Add Address to Blocklist
                </h3>

                <form onSubmit={handleAddAddress} className="space-y-4">
                  <div>
                    <label className="block text-xs text-muted mb-2">
                      Wallet Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. 4oS78GPe66RqBduuAeiMF..."
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-2">
                      Reason for Blocking
                    </label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Suspected phishing activity"
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !address || !reason}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Shield className="h-4 w-4" />
                    )}
                    Block Address
                  </button>
                </form>
              </div>

              {/* Blocklist Table */}
              <div className="rounded-xl border border-border bg-background/50 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-red-400" />
                    Current Blocklist
                    {blocklist && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">
                        {blocklist.count} entries
                      </span>
                    )}
                  </h3>
                  <button
                    onClick={loadBlocklist}
                    disabled={isLoading}
                    className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {/* Error State */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm mb-4">
                    <XCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Loading State */}
                {isLoading && !blocklist && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted" />
                  </div>
                )}

                {/* Empty State */}
                {!isLoading && blocklist?.entries.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted">
                    <Shield className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">No addresses blocked yet</p>
                  </div>
                )}

                {/* Table */}
                {blocklist && blocklist.entries.length > 0 && (
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-background/95 backdrop-blur-sm">
                        <tr className="border-b border-border">
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">
                            Address
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">
                            Reason
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-muted uppercase tracking-wider w-20">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {blocklist.entries.map((entry: BlocklistEntry, index: number) => (
                          <motion.tr
                            key={entry.address}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="group hover:bg-panel-hover/50 transition-colors"
                          >
                            <td className="px-3 py-3">
                              <span className="font-mono text-xs text-foreground truncate block max-w-[200px]" title={entry.address}>
                                {entry.address.slice(0, 8)}...{entry.address.slice(-6)}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-xs text-muted line-clamp-1">
                                {entry.reason}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <button
                                onClick={() => handleRemove(entry.address)}
                                disabled={deletingAddress === entry.address}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50"
                                title="Remove from blocklist"
                              >
                                {deletingAddress === entry.address ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Admin Toggle Button (for use in SystemHealthBar)
// ============================================================================

interface AdminToggleProps {
  onClick: () => void;
}

export function AdminToggle({ onClick }: AdminToggleProps) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded-md hover:bg-panel-hover transition-colors group"
      title="Admin Panel"
    >
      <Settings className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
    </button>
  );
}
