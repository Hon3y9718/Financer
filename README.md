# Brim India — Personal Finance App

A personal finance tracker built with React + Vite + Supabase.

## Setup

1. Clone / download this project
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```
4. Run locally:
   ```bash
   npm run dev
   ```
5. Build for production:
   ```bash
   npm run build
   ```

## Deploy to Vercel
```bash
npm i -g vercel
vercel
```

## Deploy to Netlify
```bash
npm i -g netlify-cli
netlify deploy --build
```

## Supabase Setup
Run the SQL in `schema.sql` in your Supabase SQL Editor before first use.
