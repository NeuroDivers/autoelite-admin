# AutoElite Admin Dashboard

Admin dashboard for the AutoElite vehicle inventory management system.

## Features

- User management
- Dealer management
- Vehicle inventory management
- Image upload and management
- Facebook Marketplace integration

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start
```

## Deployment

```bash
# Build for production
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy build --project-name autoelite
```

## Environment Variables

Create a `.env` file with the following variables:

```
REACT_APP_API_URL=https://api.autoelite.io
REACT_APP_CF_IMAGE_DELIVERY_URL=https://imagedelivery.net
REACT_APP_CF_ACCOUNT_HASH=your-account-hash
```

## Dependencies

This project uses the `@autoelite/shared` package for shared components and services.
