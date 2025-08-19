# Blueshift Staking dApp

A decentralized staking app for the Blueshift Validator. Built with Next.js and the Solana wallet adapter.

## Features

- **Wallet Integration**: Connect Phantom, Solflare, and other Solana wallets
- **Real-time Network Stats**: Live Solana network statistics and validator information
- **Staking Interface**: Native SOL staking and unstaking (coming soon)
- **Top Staking Pools**: View leading staking pools and their performance
- **Multi-language Support**: English and Traditional Chinese
- **Modern UI/UX**: Beautiful, responsive design with smooth animations

## Getting Started

### Prerequisites

- Node.js 22+ 
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/blueshift-gg/blueshift-stake
   cd blueshift-stake
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (optional):
   ```bash
   # Copy the example config, and edit the settings
   cp .env.example .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4
- **Wallet Integration**: Solana Wallet Adapter
- **State Management**: Zustand
- **Animations**: Motion (Framer Motion)
- **Internationalization**: next-intl

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── [locale]/          # Internationalized routes
│   └── content/           # Main app content
├── components/            # Reusable UI components
├── contexts/              # React contexts (WalletProvider)
└── utils/                 # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
