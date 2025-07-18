# Enterprise Accounting System

A comprehensive accounting system built with Next.js 14, TypeScript, and Prisma.

## Setup Instructions

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/accounting_db
```

### Deployment to Vercel

1. Push your code to GitHub
2. Import project to Vercel
3. Add the following environment variables in Vercel dashboard:
   - `NEXTAUTH_URL` - Set to your Vercel deployment URL (e.g., https://your-app.vercel.app)
   - `NEXTAUTH_SECRET` - Generate a secure secret using: `openssl rand -base64 32`
   - `DATABASE_URL` - Your production database connection string

### Generate NextAuth Secret

To generate a secure secret for production:

```bash
openssl rand -base64 32
```

Or use this Node.js command:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Features

- User authentication with role-based access control
- Customer management
- Invoice creation and management
- Payment tracking
- Financial reporting
- User profile management
- Granular permissions system

## Tech Stack

- Next.js 14
- TypeScript
- Prisma ORM
- PostgreSQL
- NextAuth.js
- Tailwind CSS