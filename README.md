# Scentora – Complete Perfume Brand Management & E-Commerce Platform

A full-stack Next.js implementation of the New Tech Softs Task #05 requirements. It includes a customer-facing perfume store and an authenticated admin dashboard connected to PostgreSQL through Prisma.

## Stack
- Next.js 15 App Router
- React 19
- JavaScript
- Tailwind CSS v4
- Prisma ORM 6
- PostgreSQL
- JWT-style HTTP-only cookie authentication with `jose`
- Recharts for sales analytics
- Lucide icons

## Main Features
### Customer
Home, product catalog, search/filter, categories, product details, branch availability, cart, checkout, order history, account, about and contact pages.

### Admin
Dashboard, product CRUD, categories, branches, branch inventory, stock updates, orders/status management, customers, sales analytics, reviews, users/roles and settings.

### Database
Products, categories, branches, inventory, customers, orders, order items, reviews, users and settings are modeled in Prisma/PostgreSQL. Order creation uses a transaction and deducts inventory from the selected branch.

## Setup
1. Install Node.js 20+ and PostgreSQL.
2. Copy `.env.example` to `.env`.
3. Set `DATABASE_URL` to your PostgreSQL connection string.
4. Set a strong `AUTH_SECRET`.
5. Run:

```powershell
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

## Demo Admin
Email: `admin@scentora.com`
Password: `Admin@123`

Change the password before deployment.

## Production
Use a managed PostgreSQL provider such as Neon/Supabase/Railway, set the production `DATABASE_URL` and `AUTH_SECRET`, run `npx prisma migrate deploy` when using migrations, then deploy the Next.js application to Vercel or another Node-compatible host.

## Requirement Coverage
The implementation follows the task brief's required customer pages, admin pages, product fields, branch management, branch-wise availability, search/filtering, shopping/order flow, inventory, authentication/roles, analytics, responsive UI, database integration, CRUD APIs and documentation.
