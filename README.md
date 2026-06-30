# HonorHub

HonorHub is a React, TypeScript, and Vite app for creating, printing, downloading, sharing, and tracking certificates of recognition.

## Run Locally

```bash
npm install
npm run dev
```

## Verify Before Deploy

```bash
npm run lint
npm run build
```

## Deploy

The app is self-contained in this folder. Use `honorhub` as the project root for Vercel or push from inside this directory:

```bash
cd honorhub
git status
git add .
git commit -m "Prepare HonorHub for live deploy"
git push origin main
```

## Environment

Local Supabase settings belong in `.env.local`, which is ignored by Git. The app can still run in demo mode when Supabase variables are not configured.
