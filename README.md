# Nyra Jewellery Storefront

Nyra is a Nepal-focused jewellery storefront built with React, TypeScript, Vite, and a lightweight Node API. It showcases gold, silver, diamond, bridal, heritage, and gifting collections with a polished frontend experience and a structured backend layer for catalogue, quote, and order flows.

## What Is Included

- Premium responsive storefront branded for Nyra
- Nepal-market catalogue with seeded jewellery inventory data
- Search, sorting, department filtering, featured collections, and product spotlight
- Bag drawer with live pricing summary, VAT, and insured shipping logic
- Local API for storefront data, product filtering, quote generation, and order creation
- Clean project structure suitable for extension into a full commerce product

## Stack

- React 19
- TypeScript
- Vite
- Node.js HTTP server
- ESLint

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the app in development:

```bash
npm run dev
```

3. Open the local URL printed by Vite in your terminal.

## Production Build

Build the client and run the integrated server:

```bash
npm run build
npm start
```

## Available Scripts

- `npm run dev` starts the frontend and backend together
- `npm run dev:client` starts only the Vite frontend
- `npm run dev:server` starts only the Node API
- `npm run build` creates the production build
- `npm run lint` checks the codebase with ESLint

## Project Structure

- `src/` frontend application and design system
- `src/api.ts` frontend API client
- `server/` Node API and seeded catalogue data
- `server/catalog-db.json` seeded inventory and merchandising data
- `scripts/dev.mjs` local development runner

## Delivery Notes

This project is packaged as a handoff-ready storefront foundation. It includes seeded data and a local API so the full flow can be demonstrated and extended, but it does not yet connect to real payment gateways, authentication, CMS tooling, or persistent order storage.

See [CLIENT-HANDOFF.md](./CLIENT-HANDOFF.md) for a concise delivery summary.
