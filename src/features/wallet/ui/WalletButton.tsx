/**
 * WalletButton - Wallet connection component
 */
'use client';

import { useState } from 'react';
import { Wallet, LogOut, ChevronDown, Shield, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useWalletStore, 
  useTruncatedPublicKey,
  type ComplianceTier,
} from '../model/store';

interface WalletButtonProps {
  className?: string;
}

export function WalletButton({ className = '' }: WalletButtonProps) {
  const { connected, connecting, setConnecting, disconnect, complianceTier, setComplianceTier } = useWalletStore();
  const truncatedKey = useTruncatedPublicKey();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const handleConnect = async () => {
    setConnecting(true);
    
    // Check for Phantom wallet
    const phantom = (window as unknown as { solana?: { isPhantom?: boolean; connect: () => Promise<{ publicKey: { toBase58: () => string } }>; signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }> } }).solana;
    
    if (!phantom?.isPhantom) {
      window.open('https://phantom.app/', '_blank');
      setConnecting(false);
      return;
    }
    
    try {
      const response = await phantom.connect();
      const publicKey = response.publicKey.toBase58();
      
      // Create sign message wrapper
      const signMessage = async (message: Uint8Array): Promise<Uint8Array> => {
        const result = await phantom.signMessage(message);
        return result.signature;
      };
      
      useWalletStore.getState().connect(publicKey, signMessage);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setConnecting(false);
    }
  };
  
  const handleDisconnect = () => {
    disconnect();
    setShowDropdown(false);
  };
  
  const handleTierChange = (tier: ComplianceTier) => {
    setComplianceTier(tier);
    setShowDropdown(false);
  };
  
  if (!connected) {
    return (
      <button
        onClick={handleConnect}
        disabled={connecting}
        className={`
          flex items-center gap-2 px-4 py-2 
          bg-gradient-primary rounded-lg
          text-white font-medium text-sm
          hover:opacity-90 transition-opacity
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {connecting ? (
          <>
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </>
        )}
      </button>
    );
  }
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`
          flex items-center gap-2 px-4 py-2
          bg-panel border border-border rounded-lg
          text-foreground font-medium text-sm
          hover:bg-panel-hover transition-colors
          ${className}
        `}
      >
        {complianceTier === 'enterprise' ? (
          <ShieldCheck className="h-4 w-4 text-primary" />
        ) : (
          <Shield className="h-4 w-4 text-muted" />
        )}
        <span className="font-mono">{truncatedKey}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 top-full mt-2 w-56 bg-panel border border-border rounded-lg shadow-xl z-50 overflow-hidden"
          >
            {/* Compliance Tier Selection */}
            <div className="p-2 border-b border-border">
              <p className="text-xs text-muted px-2 pb-2">Compliance Tier</p>
              <button
                onClick={() => handleTierChange('basic')}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm
                  ${complianceTier === 'basic' ? 'bg-panel-hover text-foreground' : 'text-muted hover:bg-panel-hover'}
                `}
              >
                <Shield className="h-4 w-4" />
                <div className="text-left">
                  <p className="font-medium">Basic</p>
                  <p className="text-xs text-muted">Public transfers</p>
                </div>
              </button>
              <button
                onClick={() => handleTierChange('enterprise')}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm
                  ${complianceTier === 'enterprise' ? 'bg-panel-hover text-foreground' : 'text-muted hover:bg-panel-hover'}
                `}
              >
                <ShieldCheck className="h-4 w-4 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Enterprise</p>
                  <p className="text-xs text-muted">Confidential transfers</p>
                </div>
              </button>
            </div>
            
            {/* Disconnect */}
            <div className="p-2">
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-status-failed hover:bg-panel-hover"
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
