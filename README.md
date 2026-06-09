# ApexcifyTechnologies — Multi-Vendor E-Commerce Platform

A premium, neon-styled multi-vendor e-commerce platform built with **Node.js**, **Express**, **Prisma ORM**, and **PostgreSQL**. It connects buyers, independent vendor stores, and an admin management dashboard through a clean REST API and a vanilla HTML/CSS/JS frontend.

## Features

### Buyers / Customers
- Register, log in, and manage their account
- Browse products across all vendor stores
- Filter products by category
- Add to cart and place orders
- Leave reviews and ratings on purchased products
- View order history and status

### Vendors
- Register a store (pending admin approval)
- Manage their product catalogue — add, edit, delete products with multiple image uploads
- View their own dashboard with order stats
- Track orders routed to their store

### Admin
- Approve or suspend vendor stores
- Full visibility over all users, vendors, products, and orders
- Manage platform-wide operations from the admin dashboard

## Default Admin Account (after seeding)
 Email:  admin@multivendor.com
 Password: Admin@1234
 

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Runtime    | Node.js                                         |
| Framework  | Express 4                                       |
| ORM        | Prisma 5                                        |
| Database   | PostgreSQL                                      |
| Auth       | JWT (HTTP-only cookies) + bcryptjs              |
| Validation | express-validator                               |
| Uploads    | Multer (local disk, max 5 MB per file)          |
| Email      | Nodemailer (Mailtrap / Gmail compatible)        |
| Frontend   | Vanilla HTML · CSS · JavaScript (no framework) |

## Database Models

- **User** — customers, vendors, and admins (role-based)
- **Vendor** — store profile linked to a user; status: `PENDING | APPROVED | SUSPENDED`
- **Product** — belongs to a vendor; supports multiple image URLs, category, stock, ratings
- **Cart / CartItem** — per-customer cart with line items
- **Order / OrderItem** — immutable order snapshot with price-at-purchase
- **Review** — one review per customer per product; auto-updates product rating average

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

### . Configure environment variables

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
PORT=5000
NODE_ENV=development

DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/multivendor_db"

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d

COOKIE_SECRET=replace_with_another_random_secret

SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
EMAIL_FROM="MultiVendor Store <no-reply@multivendor.com>"

UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=5

CLIENT_URL=http://localhost:3000
```

### . Install dependencies

```bash
cd backend
npm install
```

### . Run database migrations

```bash
npm run db:migrate
```

### 5. (Optional) Seed demo data

```bash
npm run db:seed
```

### 6. Start the server

bash
# Development (hot reload)
npm run dev

# Production
npm start

The API will be available at `http://localhost:5000`.

### . Open the frontend

Open `frontend/index.html` directly in your browser, or serve it with any static file server:

bash
npx serve frontend


## API Reference

All routes are prefixed with `/api/v1`.

| Method | Endpoint                      | Access        | Description                        |
|--------|-------------------------------|---------------|------------------------------------|
| POST   | `/auth/register`              | Public        | Register a customer account        |
| POST   | `/auth/login`                 | Public        | Log in and receive JWT cookie      |
| POST   | `/auth/logout`                | Auth          | Clear auth cookie                  |
| POST   | `/auth/vendor-register`       | Public        | Register a vendor store            |
| GET    | `/products`                   | Public        | List all products (with filters)   |
| GET    | `/products/:id`               | Public        | Get single product details         |
| POST   | `/products`                   | Vendor        | Create a product                   |
| PUT    | `/products/:id`               | Vendor        | Update a product                   |
| DELETE | `/products/:id`               | Vendor        | Delete a product                   |
| GET    | `/vendors`                    | Public        | List all approved vendors          |
| GET    | `/vendors/:id/products`       | Public        | Get products by vendor             |
| GET    | `/cart`                       | Customer      | Get current cart                   |
| POST   | `/cart`                       | Customer      | Add item to cart                   |
| DELETE | `/cart/:itemId`               | Customer      | Remove item from cart              |
| POST   | `/orders`                     | Customer      | Place an order                     |
| GET    | `/orders`                     | Customer      | Get own orders                     |
| GET    | `/orders/:id`                 | Customer      | Get order details                  |
| POST   | `/reviews`                    | Customer      | Submit a product review            |
| GET    | `/admin/users`                | Admin         | List all users                     |
| GET    | `/admin/vendors`              | Admin         | List all vendors                   |
| PATCH  | `/admin/vendors/:id/status`   | Admin         | Approve / suspend a vendor         |
| GET    | `/admin/orders`               | Admin         | View all orders                    |


## Scripts

| Command              | Description                          |
|----------------------|--------------------------------------|
| `npm run dev`        | Start server with nodemon (hot reload) |
| `npm start`          | Start server in production mode      |
| `npm run db:migrate` | Run Prisma migrations                |
| `npm run db:generate`| Regenerate Prisma client             |
| `npm run db:seed`    | Seed the database with demo data     |


