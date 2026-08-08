# Mandir Setu Web Application

This is a Next.js full-stack web application built for the Mandir Setu project. 
It uses **Next.js** for the frontend and API routes, **Prisma** as the ORM, and **PostgreSQL** as the database.

## System Requirements
- **Node.js** (v18 or higher recommended)
- **npm** or **pnpm** package manager
- **PostgreSQL** database (Local or hosted)
- Git for version control

## Setup Instructions

### 1. Clone the repository
Clone the repository to your new PC and navigate to the Web directory:
`ash
git clone <repository-url>
cd Msetuu/Web
`

### 2. Install dependencies
Install the required Node.js packages using npm:
`ash
npm install
`

### 3. Environment Variables
You need to configure your environment variables. 
Copy the provided .env.example file and rename it to .env:
`ash
cp .env.example .env
`
Open the .env file and fill in the necessary values. The most important ones are:
- DATABASE_URL: Your PostgreSQL connection string.
- NEXTAUTH_SECRET: Generate a random string using 
ode -e "console.log(require('crypto').randomBytes(32).toString('hex'))".
- SETTINGS_ENCRYPTION_KEY: A 32-byte hex string used to encrypt sensitive keys (SMTP/SMS/Razorpay) in the database. Generate using the same command above.

### 4. Database Setup & Prisma Migrations
Once your DATABASE_URL is configured, push the Prisma schema to your database to create all the necessary tables:

`ash
# Push the schema to the database
npx prisma db push

# Generate the Prisma client
npx prisma generate
`

*(Note: If you have a database dump, you can import it directly into your PostgreSQL server).*

### 5. Running the Development Server
Start the Next.js development server:

`ash
npm run dev
`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 6. Admin Setup & Test Accounts
To access the Admin panel, you can use the test admin account:
- **Email**: dev@mandirsetuu.com
- **OTP**: 223344 (This is a static OTP assigned for testing to bypass actual email OTP sending during development and Play Store review).

## Production Deployment
If deploying this to a production environment (like Coolify or Vercel):
1. Ensure all environment variables from .env are added to your hosting provider's configuration.
2. The build script is 
pm run build which will compile the Next.js app.
3. Make sure to run 
px prisma generate and 
px prisma db push (or migrate deploy) before starting the server.

---

## APIs and Mobile App Integration
Check the docs/ folder in the root repository for details on the REST API structure and endpoints for Mobile Application integration.
