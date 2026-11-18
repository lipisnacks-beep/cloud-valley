# Cloud Valley Resort, Samalbong

Full-stack web application for **Cloud Valley Resort** in Samalbong Khasmahal (Sinji), Kalimpong, West Bengal — featuring a public resort showcase, real-time room availability and tariff calculator (`EP`, `CP`, `MAP`, `AP`), customer authentication and booking portal, and an admin management dashboard & CMS.

## Features

- **Public Resort Showcase**: Home page, Accommodations (`Deluxe Room`, `Premium Room`, `Four Bedded Room`), Multi-Cuisine Restaurant & Open-Air Tea/Coffee Bar, 9 Sightseeing Experiences, Photo Gallery with lightbox & category filters, About, Contact, and policy pages.
- **Meal Plan & Tariff Calculator**: Automatic calculation across `EP` (Room Only), `CP` (With Breakfast), `MAP` (Breakfast + 1 Meal), and `AP` (All Meals), including Extra Person (`>12 yrs`) pricing and live date availability checks.
- **Customer Authentication & Portal (`/account`)**: Registration, login, profile updates, reservation history, and online cancellation requests.
- **Admin Dashboard & CMS (`/admin`)**: Booking status workflow, room & blocked-dates management, gallery, dining, sightseeing experiences, reviews, FAQs, contact inbox, site settings, and CMS content editing.
- **Flexible Persistence & Media**: Connects to MongoDB Atlas via Mongoose (`MONGODB_URI`) and gracefully falls back to a local `.data/cloud_valley.json` store when no database URI is configured. Supports Cloudinary image uploads with local `/uploads` fallback.

## Tech Stack

- **Frontend**: React 19, TypeScript, React Router, Tailwind CSS v4, TanStack Query, Lucide Icons, Motion, Recharts
- **Backend**: Node.js, Express, Mongoose (MongoDB Atlas), JWT + HTTP-only cookies, Zod validation, Multer, Nodemailer
- **Build & Tooling**: Vite 8, `tsx`

## Prerequisites

- **Node.js** `>= 20.0.0` (Node `>= 22.6` recommended for running `node server.ts` directly in production)
- **npm** (or Bun)
- Optional: **MongoDB Atlas** connection string, **Cloudinary** credentials, and **SMTP** credentials

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <your-github-repo-url>
   cd cloud-valley-resort
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set at minimum `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET`, and `COOKIE_SECRET` (plus `MONGODB_URI` if using MongoDB Atlas).

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The app and API run together on `http://localhost:3000`.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Express + Vite development server on port `3000` |
| `npm run build` | Builds the production frontend bundle into `dist/` |
| `npm run start` | Runs the production Express server (`node server.ts`) |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm run clean` | Removes build output artifacts |

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | Server port (defaults to `3000`) |
| `NODE_ENV` | No | `development` or `production` |
| `APP_URL` / `CLIENT_URL` | No | Public URL of the app (defaults to `http://localhost:3000`) |
| `MONGODB_URI` | No | MongoDB Atlas connection string (uses `.data/cloud_valley.json` if omitted) |
| `JWT_SECRET` | Recommended | Secret for signing auth tokens |
| `COOKIE_SECRET` | Recommended | Secret for signed HTTP-only cookies |
| `ADMIN_EMAIL` | Recommended | Initial admin login email seeded on first boot |
| `ADMIN_PASSWORD` | Recommended | Initial admin login password seeded on first boot |
| `CLOUDINARY_*` | No | Cloudinary credentials for image uploads |
| `SMTP_*` | No | SMTP server details for booking notification emails |

## Project Structure

```text
├── src/               # React frontend (pages, components, contexts, services, HD image assets)
├── server/            # Express API routes, Mongoose models, auth middleware, datastore & seeding
├── shared/            # Shared TypeScript types, Zod schemas, and resort constants
├── server.ts          # Full-stack Express + Vite server entry point
├── index.html         # HTML entry point & SEO meta tags
├── vite.config.ts     # Vite bundler & static asset copy configuration
└── .env.example       # Environment variable template
```

## License

Licensed under the [Apache License 2.0](./LICENSE).
