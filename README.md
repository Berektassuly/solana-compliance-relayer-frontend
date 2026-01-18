# Solana Compliance Relayer

Professional-grade DeFi interface for privacy-preserving asset transfers on the Solana network. This repository implements a high-fidelity relayer dashboard featuring compliance verification and confidential transaction processing.

## Technical Specifications

* **Framework**: Next.js 16.1.3 (App Router) utilizing the Turbopack build engine for optimized performance.
* **Library**: React 19 with native support for Server Components and improved state management.
* **Styling**: Tailwind CSS 4.1 using a high-performance engine and CSS-first configuration.
* **Language**: TypeScript 5.9.3 ensuring strict type safety and modern syntax support.
* **State Management**: Zustand 5.0 for lightweight and predictable client-side state.
* **Validation**: Zod 3.24 for runtime schema validation and data integrity.
* **Animations**: Framer Motion 12 for hardware-accelerated UI transitions.

## Core Features

* **Transfer Terminal**: Support for both standard Public transfers and ElGamal-encrypted Confidential transfers.
* **Transaction Monitor**: Real-time tracking interface with status management (Pending, Confirmed, Failed).
* **Architecture**: Modular implementation following Feature-Sliced Design (FSD) principles to separate business logic from UI components.
* **Quality Control**: Strict linting via ESLint 9 (Flat Config) and automated formatting with Prettier.

## Project Structure

```text
src/
├── app/          # Core routing and global layout definitions
├── components/   # Shared UI components and layout fragments
├── features/     # Encapsulated logic for Terminal and Monitor modules
├── services/     # Data Access Layer and external API client definitions
├── store/        # Global state definitions (Zustand)
└── lib/          # Shared utilities and global constants

```

## Installation and Setup

### Requirements

This project requires the pnpm package manager for efficient dependency resolution.

```bash
npm install -g pnpm

```

### Initializing the Workspace

1. Install the project dependencies:
```bash
pnpm install

```


2. Install the required PostCSS engine for Tailwind v4 compatibility:
```bash
pnpm add -D @tailwindcss/postcss

```



### Development Environment

Launch the development server:

```bash
pnpm dev

```

The application defaults to `http://localhost:3000`. If the port is occupied by another process, Next.js will scale to port `3001`.

## Development Standards

### Linting and Formatting

The project enforces code quality through automated checks. In MINGW64 (Git Bash) environments, path conversion may interfere with the lint command. Use the following syntax to execute linting:

```bash
MSYS_NO_PATHCONV=1 pnpm lint

```

For automated formatting and Tailwind class sorting:

```bash
pnpm format:fix
```

### CSS Architecture

Theme variables and Tailwind configurations are defined within `src/app/globals.css` using the `@theme` block. This project utilizes the CSS-first approach inherent in Tailwind CSS v4, moving configuration from JavaScript files directly into the stylesheet.

## License

Proprietary - All Rights Reserved.