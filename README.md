# Daily Bag

A gamified family chore management app with points, levels, and rewards.

## Features

- **Household Management** - Create and manage family groups
- **Chore Tracking** - Assign tasks with points and due dates
- **Gamification** - Earn points, level up, maintain streaks
- **Leaderboards** - Compete with family members
- **Point Redemption** - Cash out earned points
- **Premium Subscriptions** - Monthly and yearly plans with Stripe
- **PWA Support** - Install as a mobile app

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Convex (real-time serverless)
- **Auth**: Convex Auth
- **UI**: Radix UI, Tailwind CSS, Framer Motion
- **Payments**: Stripe (Payment Links)
- **PWA**: Service Worker, Offline Support

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Convex account
- Stripe account (for payments)

### Installation

```bash
# Install dependencies
npm install

# Start Convex backend
npx convex dev

# Start frontend (in another terminal)
npm run dev
```

### Environment Variables

Create `.env.local`:

```bash
# Convex
CONVEX_DEPLOYMENT=dev:your-deployment
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Stripe (Publishable Key - safe for frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Optional: For local scripts only (NOT exposed to frontend)
STRIPE_SECRET_KEY=sk_test_...

# One Gateway — for AI scripts (scripts/imagen.mjs, marketing/*)
# Never call Google / OpenRouter / OpenAI directly; route via One Gateway.
# https://github.com/abrown84/one-gateway
# Defaults: public gateway URL + gemini-3.8-flash; token optional (omit for public).
# ONE_GATEWAY_URL=https://brwnindustries.com/labs/one-gateway
# ONE_GATEWAY_MODEL=gemini-3.8-flash
# ONE_GATEWAY_TOKEN=your_openclaw_gateway_token
# ONE_GATEWAY_IMAGE_MODEL=gemini-3.8-flash
```

**Important**: Secret keys should be set in Convex Dashboard, not in `.env.local`. See [docs/SECURITY_FEATURES.md](docs/SECURITY_FEATURES.md) for details.

## Project Structure

```
├── src/              # Frontend React application
├── convex/           # Backend Convex functions
├── public/           # Static assets
├── scripts/          # Utility scripts
└── docs/             # Additional documentation
```

## Documentation

- [Migration Guide](docs/MIGRATION_GUIDE.md) - Data migration instructions
- [Stripe Configuration](docs/STRIPE_PRICE_MAPPING.md) - Payment setup
- [Security Features](docs/SECURITY_FEATURES.md) - Security best practices

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npx convex dev` - Start Convex backend
- `node scripts/imagen.mjs --prompt "..."` - Image gen via One Gateway (chat completions)

## License

Private
