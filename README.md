# Order Management System

A comprehensive order management system that integrates with Shopify and provides tools for managing orders, inventory, and staff.

## Features

- Shopify order integration
- Calendar view with daily order counts
- Real-time order management
- Stock and inventory management
- Staff time tracking
- Admin dashboard with analytics

## Prerequisites

- Node.js 18.x or later
- PostgreSQL database
- Shopify store with API access

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   - Copy `.env.example` to `.env`
   - Update the variables with your credentials

4. Set up the database:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `/src/app/calendar` - Calendar view with daily orders
- `/src/app/realtime-orders` - Real-time order management
- `/src/app/all-orders` - Complete order database
- `/src/app/stock` - Stock and inventory management
- `/src/app/admin` - Admin dashboard
- `/src/app/staff` - Staff time tracking
- `/src/app/ordercard` - Order card component

## Development

The project uses:
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL database

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

Proprietary - All rights reserved
