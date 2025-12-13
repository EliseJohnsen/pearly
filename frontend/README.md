# Perle Pattern Frontend

Next.js frontend for generating bead patterns from images.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your backend API URL:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

1. Push your code to GitHub
2. Import project to Vercel
3. Vercel will auto-detect Next.js
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your Railway backend URL
5. Deploy!

## Features

- Upload images
- Convert to bead patterns with customizable grid size
- Display color palette with bead counts
- Download pattern images
- Share patterns via unique URLs
- Integration with Vipps for payment (coming soon)
