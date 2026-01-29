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
    tokenMint: string | null | undefined,
    nonce: string
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
    // Fetch the JS bindings source and execute it
    const jsResponse = await fetch('/wasm/solana_transfer_wasm_bg.js');
    const jsCode = await jsResponse.text();
    
    // Create a module-like object to capture exports
    const wasmBgJs: Record<string, unknown> = {};
    
    // Execute the JS code in a way that captures exports
    // Convert ES module exports to object property assignments
    const moduleCode = jsCode
      // export function name(...) { -> wasmBgJs.name = function name(...) {
      .replace(/^export function (\w+)/gm, 'wasmBgJs.$1 = function $1')
      // export const name = ... -> wasmBgJs.name = ...
      .replace(/^export const (\w+)\s*=/gm, 'wasmBgJs.$1 =')
      // export let name = ... -> wasmBgJs.name = ...
      .replace(/^export let (\w+)\s*=/gm, 'wasmBgJs.$1 =')
      // Remove any remaining bare exports
      .replace(/^export\s+/gm, '');
    
    const moduleFactory = new Function('wasmBgJs', moduleCode);
    moduleFactory(wasmBgJs);
    
    // Fetch and instantiate the WASM binary at runtime
    const wasmResponse = await fetch('/wasm/solana_transfer_wasm_bg.wasm');
    const wasmBytes = await wasmResponse.arrayBuffer();
    const wasmInstance = await WebAssembly.instantiate(wasmBytes, {
      './solana_transfer_wasm_bg.js': wasmBgJs as WebAssembly.ModuleImports,
    });

    // Set the wasm instance exports
    (wasmBgJs.__wbg_set_wasm as (val: WebAssembly.Exports) => void)(wasmInstance.instance.exports);

    // Call the start function if it exists
    if (typeof wasmInstance.instance.exports.__wbindgen_start === 'function') {
      (wasmInstance.instance.exports.__wbindgen_start as () => void)();
    }

    wasmModule = {
      generate_keypair: wasmBgJs.generate_keypair as () => string,
      generate_public_transfer: wasmBgJs.generate_public_transfer as (
        secretKey: string,
        toAddress: string,
        amountLamports: bigint,
        tokenMint?: string | null
      ) => string,
      generate_random_address: wasmBgJs.generate_random_address as () => string,
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
 * @param nonce - UUID nonce for replay protection (required for v2 API)
 */
export async function generatePublicTransfer(
  secretKey: string,
  toAddress: string,
  amountLamports: number,
  tokenMint: string | undefined,
  nonce: string
): Promise<TransferResult> {
  const wasm = await initWasm();
  const result = wasm.generate_public_transfer(
    secretKey,
    toAddress,
    BigInt(amountLamports),
    tokenMint ?? null,
    nonce
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
