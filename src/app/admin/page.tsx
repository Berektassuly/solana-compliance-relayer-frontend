'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import {
  fetchBlocklist,
  addToBlocklist,
  removeFromBlocklist,
} from '@/services/blocklist';
import type { BlocklistEntry, ListBlocklistResponse } from '@/services/blocklist';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [address, setAddress] = useState('');
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

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

  // Initial load
  useEffect(() => {
    loadBlocklist();
  }, [loadBlocklist]);

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
      loadBlocklist(); // Refresh list
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
      loadBlocklist(); // Refresh list
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to remove address');
    } finally {
      setDeletingAddress(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-panel/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold text-foreground">
                Admin: Blocklist Manager
              </h1>
            </div>
          </div>

          {/* Admin Key Input */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted">Admin Key:</label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter admin key..."
              className="w-40 px-3 py-1.5 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </header>

      {/* Warning Banner */}
      {!adminKey && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 py-3">
          <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 text-yellow-400 text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>
              No admin key provided. Operations may fail if authentication is
              required on the server.
            </span>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-24 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
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
      )}

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Add to Blocklist Card */}
        <div className="rounded-xl border border-border bg-panel p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add Address to Blocklist
          </h2>

          <form onSubmit={handleAddAddress} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted mb-2">
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
                <label className="block text-sm text-muted mb-2">
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
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !address || !reason}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
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
        <div className="rounded-xl border border-border bg-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-400" />
              Current Blocklist
              {blocklist && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">
                  {blocklist.count} entries
                </span>
              )}
            </h2>
            <button
              onClick={loadBlocklist}
              disabled={isLoading}
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm mb-4">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !blocklist && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && blocklist?.entries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted">
              <Shield className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No addresses blocked yet</p>
            </div>
          )}

          {/* Table */}
          {blocklist && blocklist.entries.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {blocklist.entries.map((entry: BlocklistEntry, index: number) => (
                    <motion.tr
                      key={entry.address}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group hover:bg-panel-hover transition-colors"
                    >
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm text-foreground">
                          {entry.address}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-muted">
                          {entry.reason}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => handleRemove(entry.address)}
                          disabled={deletingAddress === entry.address}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors disabled:opacity-50"
                          title="Remove from blocklist"
                        >
                          {deletingAddress === entry.address ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          Remove
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

