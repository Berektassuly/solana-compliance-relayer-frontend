# Solana Compliance Relayer Frontend

A high-performance dashboard for privacy-preserving asset transfers on Solana with integrated compliance verification.

---

## Technical Specifications

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js (App Router + Turbopack) | 16.1.3 |
| Runtime | React (Server Components, Concurrent Mode) | 19.1.0 |
| Styling | Tailwind CSS (Rust-based engine) | 4.1.x |
| Language | TypeScript | 5.9.x |
| State Management | Zustand | 5.0.x |
| Schema Validation | Zod | 3.24.x |
| Linting | ESLint (Flat Config) | 9.17.x |
| Architecture | Feature-Sliced Design (FSD) | — |

---

## Core Features

### Dual-Mode Terminal

The transfer terminal supports two operational modes:

- **PUBLIC Mode**: Standard SPL token transfers with full on-chain visibility.
- **CONFIDENTIAL Mode**: ElGamal-encrypted transfers via the Token-2022 Confidential Transfers extension, preserving transaction privacy while maintaining compliance.

Mode switching is seamless with real-time UI feedback indicating the active privacy level.

### Real-Time Transaction Monitor

An advanced transaction tracking panel with:

- Animated status transitions across `Pending`, `Confirmed`, and `Failed` states.
- Automatic polling and state synchronization via Zustand stores.
- Optimistic UI updates with rollback on failure.

---

## Project Structure

This project follows **Feature-Sliced Design (FSD)** principles for scalable architecture:

```
src/
├── app/                    # Next.js App Router (layouts, pages, global styles)
│   ├── globals.css         # Tailwind v4 CSS-first configuration
│   ├── layout.tsx          # Root layout with providers
│   └── page.tsx            # Main dashboard page
├── components/             # Shared UI primitives
│   └── ui/                 # Button, Input, Select, etc.
├── features/               # Feature modules (FSD slices)
│   ├── terminal/           # Transfer form and mode switching
│   └── monitor/            # Transaction table and status display
├── hooks/                  # Custom React hooks
│   └── useHydrated.ts      # SSR hydration safety hook
├── lib/                    # Utilities and constants
│   ├── constants.ts        # Asset definitions, mode labels
│   └── utils.ts            # Helper functions (cn, etc.)
├── services/               # API layer and external integrations
│   ├── transfer.ts         # Transfer submission logic
│   └── transactions.ts     # Transaction fetching
├── store/                  # Zustand state management
│   └── useUIStore.ts       # UI state (transactions, mode, loading)
└── types/                  # TypeScript type definitions
    └── transaction.ts      # Transaction interfaces
```

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

### Environment Variables

Create a `.env.local` file in the project root:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_RELAYER_API_URL` | Backend relayer API endpoint | Yes |

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with Turbopack |
| `pnpm build` | Create production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint checks |

---

## CSS Architecture

This project uses **Tailwind CSS v4** with its CSS-first configuration approach.

### Key Differences from Tailwind v3

Tailwind v4 replaces JavaScript configuration with native CSS:

```css
/* src/app/globals.css */
@import "tailwindcss";
@config "../../tailwind.config.ts";
```

The `@config` directive loads theme extensions from `tailwind.config.ts`, enabling custom colors, fonts, and utilities:

```typescript
// tailwind.config.ts (theme excerpt)
colors: {
  background: "#0b0f14",
  panel: "#111722",
  primary: {
    DEFAULT: "#7c3aed",
    dark: "#5b21b6",
    light: "#a78bfa",
  },
  status: {
    pending: "#eab308",
    confirmed: "#22c55e",
    failed: "#ef4444",
  },
}
```

### PostCSS Bridge

Tailwind v4 requires the dedicated PostCSS plugin:

```javascript
// postcss.config.mjs
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
```

---

## Troubleshooting

### Windows / MINGW64: `next lint` Path Conversion Error

On Windows with Git Bash (MINGW64), running `next lint` may produce:

```
Invalid project directory provided, no such directory: C:\...\lint
```

This occurs due to MSYS path conversion. The project uses `eslint .` directly instead of `next lint` to avoid this issue. If you need to run Next.js lint commands manually, prefix with:

```bash
MSYS_NO_PATHCONV=1 pnpm lint
```

### Port Already in Use

If port 3000 is occupied, Next.js will automatically select the next available port (3001, 3002, etc.). Check the terminal output for the active URL.

---

## Author

**Mukhammedali Berektassuly**

- GitHub: [Berektassuly](https://github.com/Berektassuly)
- LinkedIn: [mukhammedali-berektassuly](https://www.linkedin.com/in/mukhammedali-berektassuly)
- Blog: [berektassuly.com](https://berektassuly.com/)

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.