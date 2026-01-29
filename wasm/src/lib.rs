//! WASM module for generating signed Solana transfer requests.
//!
//! This module mirrors the logic from the CLI tool `generate_transfer_request`
//! but runs entirely in the browser via WebAssembly.
//!
//! Exports:
//! - `generate_keypair()` - Generate a new Ed25519 keypair
//! - `generate_public_transfer()` - Generate a signed public transfer request JSON

use ed25519_dalek::{Signer, SigningKey};
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// ============================================================================
// Types matching backend API
// ============================================================================

/// Transfer details for a public transfer.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum TransferDetails {
    Public { amount: u64 },
}

/// A submit transfer request matching the backend API schema.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubmitTransferRequest {
    pub from_address: String,
    pub to_address: String,
    pub transfer_details: TransferDetails,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub token_mint: Option<String>,
    /// UUID nonce for replay protection and idempotency
    pub nonce: String,
    pub signature: String,
}

/// Result from keypair generation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeypairResult {
    /// Base58-encoded public key (Solana address)
    pub public_key: String,
    /// Base58-encoded secret key (64 bytes: 32 seed + 32 public)
    pub secret_key: String,
}

/// Result from transfer generation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferResult {
    /// The complete request JSON ready for API submission
    pub request_json: String,
    /// The from_address used
    pub from_address: String,
    /// The to_address used
    pub to_address: String,
    /// The UUID nonce used for this request
    pub nonce: String,
    /// The signature in Base58
    pub signature: String,
}

// ============================================================================
// WASM Exports
// ============================================================================

/// Generate a new Ed25519 keypair for transaction signing.
/// Returns JSON: `{ "public_key": "...", "secret_key": "..." }`
#[wasm_bindgen]
pub fn generate_keypair() -> Result<String, JsValue> {
    let mut csprng = OsRng;
    let signing_key = SigningKey::generate(&mut csprng);
    let verifying_key = signing_key.verifying_key();

    // Public key is 32 bytes
    let public_key_bs58 = bs58::encode(verifying_key.as_bytes()).into_string();

    // Secret key is the full 64 bytes (seed + public) for compatibility
    let secret_key_bs58 = bs58::encode(signing_key.to_keypair_bytes()).into_string();

    let result = KeypairResult {
        public_key: public_key_bs58,
        secret_key: secret_key_bs58,
    };

    serde_json::to_string(&result).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Generate a signed public transfer request.
///
/// # Arguments
/// * `secret_key_bs58` - Base58-encoded secret key (64 bytes)
/// * `to_address` - Recipient Solana address (Base58)
/// * `amount_lamports` - Amount in lamports (1 SOL = 1,000,000,000)
/// * `token_mint` - Optional SPL token mint address (null for native SOL)
/// * `nonce` - UUID nonce for replay protection (required for v2 API)
///
/// # Returns
/// JSON string with the complete transfer request ready for API submission.
#[wasm_bindgen]
pub fn generate_public_transfer(
    secret_key_bs58: &str,
    to_address: &str,
    amount_lamports: u64,
    token_mint: Option<String>,
    nonce: &str,
) -> Result<String, JsValue> {
    // 1. Decode the secret key
    let key_bytes = bs58::decode(secret_key_bs58)
        .into_vec()
        .map_err(|e| JsValue::from_str(&format!("Invalid secret key: {}", e)))?;

    // Handle both 32-byte seed and 64-byte full keypair formats
    let signing_key = if key_bytes.len() == 64 {
        // Full keypair format (seed + public)
        let seed: [u8; 32] = key_bytes[..32]
            .try_into()
            .map_err(|_| JsValue::from_str("Invalid key length"))?;
        SigningKey::from_bytes(&seed)
    } else if key_bytes.len() == 32 {
        // Seed-only format
        let seed: [u8; 32] = key_bytes
            .try_into()
            .map_err(|_| JsValue::from_str("Invalid key length"))?;
        SigningKey::from_bytes(&seed)
    } else {
        return Err(JsValue::from_str(&format!(
            "Invalid secret key length: expected 32 or 64 bytes, got {}",
            key_bytes.len()
        )));
    };

    let verifying_key = signing_key.verifying_key();
    let from_address = bs58::encode(verifying_key.as_bytes()).into_string();

    // 2. Construct the signing message (v2 API format)
    // Format: "{from_address}:{to_address}:{amount}:{token_mint|SOL}:{nonce}"
    let mint_str = token_mint.as_deref().unwrap_or("SOL");
    let message = format!(
        "{}:{}:{}:{}:{}",
        from_address, to_address, amount_lamports, mint_str, nonce
    );

    // 3. Sign the message
    let signature = signing_key.sign(message.as_bytes());
    let signature_bs58 = bs58::encode(signature.to_bytes()).into_string();

    // 4. Construct the request
    let request = SubmitTransferRequest {
        from_address: from_address.clone(),
        to_address: to_address.to_string(),
        transfer_details: TransferDetails::Public {
            amount: amount_lamports,
        },
        token_mint,
        nonce: nonce.to_string(),
        signature: signature_bs58.clone(),
    };

    // 5. Serialize to JSON
    let request_json =
        serde_json::to_string(&request).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let result = TransferResult {
        request_json,
        from_address,
        to_address: to_address.to_string(),
        nonce: nonce.to_string(),
        signature: signature_bs58,
    };

    serde_json::to_string(&result).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Generate a random Solana-compatible address (for testing).
/// Returns Base58-encoded 32-byte public key.
#[wasm_bindgen]
pub fn generate_random_address() -> String {
    let mut csprng = OsRng;
    let signing_key = SigningKey::generate(&mut csprng);
    let verifying_key = signing_key.verifying_key();
    bs58::encode(verifying_key.as_bytes()).into_string()
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_keypair() {
        let result = generate_keypair().unwrap();
        let parsed: KeypairResult = serde_json::from_str(&result).unwrap();
        assert!(!parsed.public_key.is_empty());
        assert!(!parsed.secret_key.is_empty());
    }

    #[test]
    fn test_generate_public_transfer() {
        // Generate a keypair first
        let keypair_json = generate_keypair().unwrap();
        let keypair: KeypairResult = serde_json::from_str(&keypair_json).unwrap();

        // Generate a transfer with nonce
        let to_address = generate_random_address();
        let nonce = "019470a4-7e7c-7d3e-8f1a-2b3c4d5e6f7a";
        let result = generate_public_transfer(
            &keypair.secret_key,
            &to_address,
            1_000_000_000, // 1 SOL
            None,
            nonce,
        )
        .unwrap();

        let parsed: TransferResult = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed.from_address, keypair.public_key);
        assert_eq!(parsed.to_address, to_address);
        assert_eq!(parsed.nonce, nonce);
        assert!(!parsed.signature.is_empty());
    }
}
