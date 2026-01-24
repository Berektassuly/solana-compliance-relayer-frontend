<div align="center">

# Solana Compliance Relayer Frontend

### Real-time dashboard for privacy-preserving Solana transfers with integrated compliance monitoring.

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Rust WASM](https://img.shields.io/badge/Rust_WASM-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](LICENSE)
[![Author](https://img.shields.io/badge/Author-Berektassuly.com-F97316?style=for-the-badge)](https://berektassuly.com)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Technical Stack](#technical-stack)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Pages](#pages)
- [Widgets](#widgets)
- [WASM Module](#wasm-module)
- [CSS Architecture](#css-architecture)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)
- [Contact](#contact)
- [License](#license)

---

## Overview

This is the official frontend interface for the Solana Compliance Relayer. It provides a DeFi-grade dashboard with comprehensive analytics and operational monitoring:

| Section | Description |
|---------|-------------|
| **Analytics Overview** | Real-time transaction volume charts, success rate gauges, and security flag monitoring |
| **Metrics Row** | Key operational KPIs: total transfers, success rate, latency, and compliance breakdown |
| **Terminal** | Submit public or confidential transfers with client-side WASM signing |
| **Monitor** | Real-time transaction tracking with status updates and retry functionality |
| **Risk Scanner** | Interactive wallet compliance checker with animated analysis visualization |
| **Admin Panel** | Blocklist management with overlay interface |

The application connects to the Rust backend via REST API and uses WebAssembly for secure client-side cryptographic operations.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    SystemHealthBar (Sticky)                     │    │
│  │  Logo + Brand • Database Status • Blockchain • Range API        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    AnalyticsOverview Widget                     │    │
│  │  24h Volume Chart │ 7-Day Bar Chart │ Success Gauge │ Flags    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                       MetricsRow Widget                         │    │
│  │  Total Transfers │ Success Rate │ Avg Latency │ Compliance      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─────────────────┐    ┌──────────────────┐    ┌───────────────────┐   │
│  │  Terminal Panel │    │  WASM Signer     │    │   Monitor Panel   │   │
│  │  - Public Mode  │───>│  (Ed25519-dalek) │    │   - Status Table  │   │
│  │  - Confidential │    │  - Client-side   │    │   - 5s Polling    │   │
│  └─────────────────┘    └────────┬─────────┘    │   - Retry Action  │   │
│                                  │              └───────────────────┘   │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                       Risk Scanner (Overlay)                    │    │
│  │  Pre-flight compliance check  •  Animated 3-step analysis       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                  │                                      │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     API Layer (services/)                       │    │
│  │  transfer-requests.ts  •  risk-check.ts  •  blocklist.ts        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                  │                                      │
└──────────────────────────────────┼──────────────────────────────────────┘
                                   │ REST API
                                   ▼
                     ┌─────────────────────────┐
                     │   Backend (Axum/Rust)   │
                     │   Railway Deployment    │
                     └─────────────────────────┘
```

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Main unified dashboard
│   ├── dashboard/          # Dedicated analytics page
│   │   ├── page.tsx        # Analytics + Metrics view
│   │   └── layout.tsx      # Dashboard layout
│   ├── admin/              # Admin: Blocklist Manager
│   │   └── page.tsx
│   ├── (landing)/          # Landing page route group
│   │   └── page.tsx
│   ├── globals.css         # Tailwind v4 configuration
│   └── layout.tsx          # Root layout with providers
├── components/             # Shared UI components
│   ├── ui/                 # Button, Input, Select primitives
│   ├── shared/             # Header, Footer, SystemHealthBar
│   └── dashboard/          # AdminOverlay
├── features/               # Feature modules (Feature-Sliced Design)
│   ├── terminal/           # Transfer form and mode switching
│   ├── monitor/            # Transaction table and status badges
│   ├── risk-scanner/       # Interactive wallet compliance checker
│   ├── transfer/           # Transfer submission logic + Zustand store
│   └── wallet/             # Wallet utilities + store
├── widgets/                # Composite UI widgets
│   ├── AnalyticsOverview/  # Charts + gauges + security flags
│   ├── MetricsRow/         # KPI metric cards
│   └── OperationalDashboard/ # Full operational view
├── hooks/                  # Custom React hooks
│   ├── useDashboardAnalytics.ts  # Unified analytics data hook
│   └── useHydrated.ts      # SSR hydration helper
├── lib/                    # Utilities and constants
│   ├── constants.ts        # Theme colors, asset definitions
│   ├── utils.ts            # Helper functions (cn, formatAddress)
│   └── wasm.ts             # WASM module loader
├── services/               # API layer
│   ├── transfer-requests.ts # Transfer CRUD operations
│   ├── risk-check.ts       # Wallet risk check API
│   ├── blocklist.ts        # Admin blocklist API
│   └── transactions.ts     # Transaction queries
├── shared/                 # Shared utilities and API client
│   ├── api/                # Centralized API client
│   └── lib/                # Notifications, wallet utilities
├── store/                  # Global Zustand stores
│   └── useUIStore.ts       # UI state management
└── types/                  # TypeScript definitions
    ├── analytics.types.ts  # Analytics data types
    ├── transaction.ts      # Transaction types
    └── transfer-request.ts # Transfer request types
```

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Analytics Dashboard** | Real-time charts using Recharts: 24h volume area chart, 7-day bar chart, radial success gauge |
| **Operational Metrics** | Live KPI cards showing total transfers, success rate, average latency, compliance breakdown |
| **Interactive Risk Scanner** | Pre-flight wallet compliance check with animated 3-step analysis |
| **Client-Side WASM Signing** | Ed25519 signatures generated via Rust/WASM - private keys never leave the browser |
| **Dual Transfer Modes** | Public (standard SPL) and Confidential (Token-2022 ElGamal) transfer support |
| **Real-Time Monitoring** | 5-second polling with animated status transitions |
| **System Health Bar** | Sticky header with branded logo, database/blockchain/API health indicators |
| **Admin Overlay** | Slide-in panel for blocklist management |
| **Dark Theme** | Professional dark navy UI with glassmorphism effects |
| **Responsive Design** | Optimized for desktop with mobile-friendly fallbacks |

---

## Technical Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js (App Router) | 16.1.x |
| Runtime | React (Server Components) | 19.1.x |
| Styling | Tailwind CSS | 4.1.x |
| Language | TypeScript | 5.x |
| State | Zustand | 5.0.x |
| Validation | Zod | 4.0.x |
| Animations | Framer Motion | 12.x |
| Charts | Recharts | 3.7.x |
| WASM | Rust + wasm-pack | 1.x |
| Linting | ESLint (Flat Config) | 9.x |
| Architecture | Feature-Sliced Design | - |

---

## Getting Started

### Prerequisites

- Node.js 20.x or later
- pnpm 9.x (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Berektassuly/solana-compliance-relayer-frontend.git
cd solana-compliance-relayer-frontend

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The application will be available at `http://localhost:3000`.

---

## Environment Configuration

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend relayer API endpoint | Yes |

---

## Pages

### Home Dashboard (/)

The unified main page with three sections:

1. **Analytics Overview** - Volume charts, success gauge, security flags
2. **Metrics Row** - Key operational KPIs in card format
3. **Execution & Monitoring** - Terminal panel + Monitor table with action buttons

Features:
- "Generate Public" button for quick test transfers
- "Risk Scanner" button opens the compliance checker overlay
- Admin panel accessible via settings icon in header

### Analytics Dashboard (/dashboard)

Dedicated analytics page with expanded metrics view:

- Full-width AnalyticsOverview widget
- Detailed MetricsRow with loading states
- Suspense-based loading skeletons

### Admin (/admin)

Blocklist management interface:

| Feature | Description |
|---------|-------------|
| **Add Address** | Block a wallet address with reason |
| **View Blocklist** | Table of all blocked addresses |
| **Remove Address** | Unblock addresses, allowing retries of previously rejected transfers |

---

## Widgets

### AnalyticsOverview

Displays high-level metrics in a responsive grid:

| Panel | Description |
|-------|-------------|
| **Volume Chart** | 24-hour transaction volume (Area chart) |
| **Distribution Chart** | Last 7 days by day (Bar chart) |
| **Status Gauge** | Success rate radial gauge with color thresholds |
| **Security Flags** | Recent blocklist flags with severity indicators |

### MetricsRow

Four metric cards in a responsive grid:

| Metric | Description |
|--------|-------------|
| **Total Transfers** | All-time transfer count |
| **Success Rate** | Percentage with trend indicator |
| **Avg. Latency** | Processing time in seconds |
| **Compliance** | Approved/Rejected/Pending breakdown |

### Risk Scanner

Interactive wallet compliance checker:

| State | Description |
|-------|-------------|
| **Initial** | Address input with Base58 validation, quick-scan demo buttons |
| **Scanning** | Animated 3-step progress (Blocklist → Range Protocol → Helius DAS) |
| **Blocked** | Red alert with rejection reason |
| **Analyzed** | Risk gauge (0-10), per-source breakdown, Explorer link |

Demo addresses for testing:
- Clean wallet: `HvwC9QSAzwEXkUkwqNNGhfNHoVqXJYfPvPZfQvJmHWcF`
- Blocked wallet: `4oS78GPe66RqBduuAeiMFANf27FpmgXNwokZ3ocN4z1B`

---

## WASM Module

The frontend includes a Rust-based WebAssembly module for secure client-side transaction signing.

### Architecture

```
wasm/
├── Cargo.toml              # Rust dependencies
├── src/lib.rs              # WASM-exported functions
└── pkg/                    # Build output

public/wasm/                # Runtime files (committed)
├── solana_transfer_wasm_bg.wasm
└── solana_transfer_wasm_bg.js
```

### Exported Functions

| Function | Description |
|----------|-------------|
| `generate_keypair()` | Generate Ed25519 keypair (Base58) |
| `generate_public_transfer(secretKey, toAddress, amount, tokenMint?)` | Create signed transfer request |
| `generate_random_address()` | Generate random Solana address |

### Building

```bash
# Prerequisites: Rust + wasm-pack
cargo install wasm-pack

# Build
cd wasm
wasm-pack build --target web --out-dir pkg

# Copy to public folder
cp pkg/solana_transfer_wasm_bg.wasm ../public/wasm/
cp pkg/solana_transfer_wasm_bg.js ../public/wasm/
```

### Usage

```typescript
import { generateKeypair, generatePublicTransfer } from '@/lib/wasm';

const keypair = await generateKeypair();
const transfer = await generatePublicTransfer(
  keypair.secret_key,
  destinationAddress,
  1_000_000_000  // 1 SOL in lamports
);
```

---

## CSS Architecture

This project uses Tailwind CSS v4 with CSS-first configuration.

### Theme Configuration

```typescript
// tailwind.config.ts
colors: {
  background: "#0b0f14",
  panel: "#111722",
  primary: {
    DEFAULT: "#7c3aed",
    dark: "#5b21b6",
  },
  status: {
    pending: "#eab308",
    confirmed: "#22c55e",
    failed: "#ef4444",
  },
}
```

### PostCSS Setup

```javascript
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server (Turbopack) |
| `pnpm build` | Create production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint checks |

---

## Troubleshooting

### Windows MINGW64 Path Conversion

On Windows with Git Bash, path conversion may cause issues. Use:

```bash
MSYS_NO_PATHCONV=1 pnpm lint
```

### Port Conflicts

If port 3000 is occupied, Next.js automatically selects the next available port. Check terminal output for the active URL.

### WASM Loading Errors

Ensure WASM files exist in `public/wasm/` directory. If missing, rebuild the WASM module.

### Recharts SSR Warnings

The application uses client-side mounting detection to prevent Recharts dimension warnings during SSR.

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
