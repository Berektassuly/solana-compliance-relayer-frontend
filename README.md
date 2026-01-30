<div align="center">

# Solana Compliance Relayer Frontend

### Real-time dashboard for privacy-preserving Solana transfers with client-side WASM signing.

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![WebAssembly](https://img.shields.io/badge/WebAssembly-654FF0?style=for-the-badge&logo=webassembly&logoColor=white)](https://webassembly.org/)
[![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Solana](https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](LICENSE)
[![Author](https://img.shields.io/badge/Author-Berektassuly.com-F97316?style=for-the-badge)](https://berektassuly.com)

</div>

---

## Why This Exists

Compliance dashboards for privacy protocols face a critical UX paradox: **operators need real-time visibility**, but **cryptographic signing must remain client-side**. This frontend resolves that tension through a unified dashboard with embedded WebAssembly cryptography.

| Challenge | Solution |
|-----------|----------|
| Visualizing complex compliance data | Real-time analytics with Recharts: volume charts, success gauges, and security flags |
| Client-side signing without key exposure | Rust/WASM Ed25519 module—private keys never leave the browser |
| Real-time transaction monitoring | 3-second polling with animated status transitions and retry actions |
| Interactive compliance validation | Pre-flight Risk Scanner with animated 3-step analysis visualization |

> **Core Guarantee:** All cryptographic operations (keypair generation, message signing) execute **locally in WebAssembly**. The backend never receives private keys.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **WASM Ed25519 Signer** | Client-side Rust module (`ed25519-dalek`) for secure transaction signing with nonce-based replay protection |
| **Interactive Terminal** | Submit public or confidential transfers with real-time validation and signature generation |
| **Analytics Dashboard** | 24h volume charts, 7-day distribution, success rate gauge, and security flag monitoring |
| **Real-Time Monitor** | Transaction table with 3s polling, status badges, and one-click retry functionality |
| **Risk Scanner** | Pre-flight wallet compliance checker with animated Blocklist → Range → Helius analysis |
| **Admin Blocklist** | Overlay panel for managing blocked addresses with CRUD operations |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                            │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      UI Components                              │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐     │    │
│  │  │ Terminal     │  │ Analytics    │  │ Monitor            │     │    │
│  │  │ (TransferUI) │  │ (Recharts)   │  │ (Status Polling)   │     │    │
│  │  └──────────────┘  └──────────────┘  └────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                 │                                       │
│  ┌──────────────────────────────▼──────────────────────────────────┐    │
│  │                     Client-Side Signing                         │    │
│  │  ┌────────────────────────────────────────────────────────┐     │    │
│  │  │  WASM Module (ed25519-dalek)                           │     │    │
│  │  │  generate_keypair() • generate_public_transfer(nonce)  │     │    │
│  │  │  Message: {from}:{to}:{amount}:{mint}:{nonce}          │     │    │
│  │  └────────────────────────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                 │                                       │
│  ┌──────────────────────────────▼──────────────────────────────────┐    │
│  │                      API Layer (services/)                      │    │
│  │  transfer-requests • risk-check • blocklist • transactions      │    │
│  └─────────────────────────────────┬───────────────────────────────┘    │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │ REST API + Idempotency-Key
                                     ▼
                       ┌─────────────────────────┐
                       │   Backend (Axum/Rust)   │
                       │   Range • Helius • Jito │
                       └─────────────────────────┘
```

---

## Backend

The backend API powering this frontend is a separate repository:

- **Repository:** [solana-compliance-relayer](https://github.com/Berektassuly/solana-compliance-relayer)
- **Live demo:** [solana-compliance-relayer.railway.app](https://solana-compliance-relayer.railway.app)

It provides the compliance engine (Range Protocol), MEV protection (Jito Bundles), transaction processing worker, and Helius webhook integration. Built with Rust, Axum, SQLx, and PostgreSQL.

---

## Quick Start

### Prerequisites

- Node.js 20+ and pnpm 9+
- Rust 1.70+ and wasm-pack (for WASM compilation)

### Installation

```bash
# Clone the repository
git clone https://github.com/berektassuly/solana-compliance-relayer-frontend.git
cd solana-compliance-relayer-frontend

# Install dependencies
pnpm install

# Build the WASM module (required before first run)
cd wasm && wasm-pack build --target web --out-dir pkg

# Copy WASM artifacts to public directory
cp pkg/solana_transfer_wasm_bg.wasm ../public/wasm/
cp pkg/solana_transfer_wasm_bg.js ../public/wasm/

# Return to root and start development server
cd .. && pnpm dev
```

The application runs on `http://localhost:3000`. Configure the backend URL via `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

---

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19 (Server Components)
- **Styling:** Tailwind CSS 4.1, Framer Motion 12
- **State:** Zustand 5, Zod 4 (validation)
- **Charts:** Recharts 3.7
- **Cryptography:** Rust/WASM (ed25519-dalek), TweetNaCl, bs58, uuid v7
- **Architecture:** Feature-Sliced Design

---

## Documentation

| Document | Description |
|----------|-------------|
| [Backend Repository](https://github.com/Berektassuly/solana-compliance-relayer) | Rust backend with full architecture, API reference, and deployment guides |
| [Backend Operations Guide](https://github.com/Berektassuly/solana-compliance-relayer/blob/main/docs/OPERATIONS.md) | Helius webhooks, Range Protocol, database operations |

---

## Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| 1–3 | Terminal, Monitor, WASM signing | ✅ Complete |
| 4–6 | Analytics dashboard, Risk Scanner, Admin panel | ✅ Complete |
| 7–10 | Nonce/v2 API, real-time metrics, system health bar | ✅ Complete |

---

## Contact

**Mukhammedali Berektassuly**

> This project was built with 💜 by a 17-year-old developer from Kazakhstan

- Website: [berektassuly.com](https://berektassuly.com)
- Email: [mukhammedali@berektassuly.com](mailto:mukhammedali@berektassuly.com)
- X/Twitter: [@berektassuly](https://x.com/berektassuly)

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
