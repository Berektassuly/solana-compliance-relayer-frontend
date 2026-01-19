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
 */
export async function initWasm(): Promise<WasmExports> {
  if (wasmModule) return wasmModule;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // For wasm-pack --target web, we need to use the _bg.js bindings
    // and initialize with the wasm binary
    const wasmBgJs = await import('../../wasm/pkg/solana_transfer_wasm_bg.js');
    const wasmBinary = await import('../../wasm/pkg/solana_transfer_wasm_bg.wasm');

    // Set the wasm instance
    wasmBgJs.__wbg_set_wasm(wasmBinary);

    // Call the start function if it exists
    if (typeof wasmBinary.__wbindgen_start === 'function') {
      wasmBinary.__wbindgen_start();
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
