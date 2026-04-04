# Client Handoff

## Project Summary

Nyra is a jewellery storefront tailored for the Nepali market. The delivered build includes a branded frontend, seeded product catalogue, pricing and delivery calculations, and a lightweight backend layer for catalogue and order flow demonstrations.

## Core Features Delivered

- Responsive luxury storefront for desktop and mobile
- Branded Nyra experience using the supplied logo
- Gold, silver, diamond, bridal, heritage, everyday, and gifting collections
- Search, sort, filter, spotlight view, and merchandising sections
- Shopping bag with quote totals, VAT, shipping threshold logic, and checkout flow
- Structured API endpoints for storefront data, products, quotes, and orders

## How To Run

### Development

```bash
npm install
npm run dev
```

### Production-style local run

```bash
npm run build
npm start
```

## Important Files

- `src/App.tsx` main storefront UI
- `src/App.css` storefront styling
- `src/api.ts` API request layer
- `server/index.mjs` application server
- `server/lib/storefront-service.mjs` catalogue and order logic
- `server/catalog-db.json` seeded inventory data

## Current Boundaries

- Product data is seeded locally rather than managed from a live admin dashboard
- Checkout creates order records in the application flow, but does not connect to a payment gateway
- Authentication, customer accounts, and persistent database storage are not yet implemented

## Recommended Next Phase

- Connect catalogue to a real database or CMS
- Add payment integration such as eSewa, Khalti, or card processor support
- Add admin inventory management and order persistence
- Add real product photography per SKU
- Add deployment pipeline and environment-based configuration
