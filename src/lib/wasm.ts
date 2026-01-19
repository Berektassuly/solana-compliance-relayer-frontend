/**
 * WASM module loader for Solana transfer generation.
 * Handles async initialization and provides typed wrappers.
 */

import type { KeypairResult, TransferResult } from '@/types/transfer-request';

// Re-export types for convenience
export type { KeypairResult, TransferResult };

// WASM module type
interface WasmExports {
  generate_keypair: () => string;
  generate_public_transfer: (
    secretKey: string,
    toAddress: string,
    amountLamports: bigint,
    tokenMint?: string | null
  ) => string;
  generate_random_address: () => string;
}

let wasmModule: WasmExports | null = null;
let initPromise: Promise<WasmExports> | null = null;

/**
 * Initialize the WASM module (lazy-loaded, only once).
 * Only works in the browser - throws if called on the server.
 */
export async function initWasm(): Promise<WasmExports> {
  // Only run in browser
  if (typeof window === 'undefined') {
    throw new Error('WASM can only be initialized in the browser');
  }
  
  if (wasmModule) return wasmModule;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Dynamically import the JS bindings
    const wasmBgJs = await import('../../wasm/pkg/solana_transfer_wasm_bg.js');
    
    // Fetch and instantiate the WASM binary at runtime
    const wasmResponse = await fetch('/wasm/solana_transfer_wasm_bg.wasm');
    const wasmBytes = await wasmResponse.arrayBuffer();
    const wasmInstance = await WebAssembly.instantiate(wasmBytes, {
      './solana_transfer_wasm_bg.js': wasmBgJs,
    });

    // Set the wasm instance exports
    wasmBgJs.__wbg_set_wasm(wasmInstance.instance.exports);

    // Call the start function if it exists
    if (typeof wasmInstance.instance.exports.__wbindgen_start === 'function') {
      (wasmInstance.instance.exports.__wbindgen_start as () => void)();
    }

    wasmModule = {
      generate_keypair: wasmBgJs.generate_keypair,
      generate_public_transfer: wasmBgJs.generate_public_transfer,
      generate_random_address: wasmBgJs.generate_random_address,
    };

    return wasmModule;
  })();

  return initPromise;
}

/**
 * Generate a new Ed25519 keypair.
 * @returns Keypair with Base58-encoded public and secret keys
 */
export async function generateKeypair(): Promise<KeypairResult> {
  const wasm = await initWasm();
  const result = wasm.generate_keypair();
  return JSON.parse(result);
}

/**
 * Generate a signed public transfer request.
 * @param secretKey - Base58-encoded secret key
 * @param toAddress - Recipient Solana address
 * @param amountLamports - Amount in lamports (1 SOL = 1e9)
 * @param tokenMint - Optional SPL token mint (null for native SOL)
 */
export async function generatePublicTransfer(
  secretKey: string,
  toAddress: string,
  amountLamports: number,
  tokenMint?: string
): Promise<TransferResult> {
  const wasm = await initWasm();
  const result = wasm.generate_public_transfer(
    secretKey,
    toAddress,
    BigInt(amountLamports),
    tokenMint ?? null
  );
  return JSON.parse(result);
}

/**
 * Generate a random Solana-compatible address.
 */
export async function generateRandomAddress(): Promise<string> {
  const wasm = await initWasm();
  return wasm.generate_random_address();
}
