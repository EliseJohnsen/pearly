# Deployment Guide

This guide will help you deploy your Perle application to production using Supabase (database), Railway (backend), and Vercel (frontend).

## Prerequisites

- GitHub account with your code pushed
- Supabase account (free tier works)
- Railway account (sign up at [railway.app](https://railway.app))
- Vercel account (you already have this)

---

## Step 1: Deploy Database to Supabase

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New project"**
3. Fill in:
   - **Name**: `perle` (or your preferred name)
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"**
5. Wait ~2 minutes for setup to complete

### 1.2 Get Connection String

1. In your Supabase project, go to **Settings** (gear icon) → **Database**
2. Scroll to **Connection string** section
3. Select **URI** tab
4. Copy the connection string (looks like):
   ```
   postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with the actual password you created in step 1.1

### 1.3 Important Note on Connection String Format

Railway needs the connection string with `+psycopg` driver:
```
postgresql+psycopg://postgres.xxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

Keep both versions handy!

---

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **"Login"** → **"Login with GitHub"**
3. Authorize Railway to access your GitHub

### 2.2 Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: `EliseJohnsen/pearly`
4. Railway will detect your Dockerfile automatically

### 2.3 Configure Root Directory

Since your backend is in a subdirectory:

1. Click on your service
2. Go to **Settings** tab
3. Scroll to **Service Settings** → **Root Directory**
4. Set it to: `backend`
5. Click **"Update"**

### 2.4 Add Environment Variables

1. Go to **Variables** tab
2. Click **"+ New Variable"** and add these:

```
DATABASE_URL=postgresql+psycopg://postgres.xxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
BACKEND_CORS_ORIGINS=["https://your-app.vercel.app"]
UPLOAD_DIR=/app/uploads
```

**Important**:
- Replace the `DATABASE_URL` with your actual Supabase connection string
- You'll update `BACKEND_CORS_ORIGINS` after deploying to Vercel

### 2.5 Deploy

1. Railway will automatically deploy after you add variables
2. Wait for build to complete (~3-5 minutes)
3. Once deployed, go to **Settings** → **Networking**
4. Click **"Generate Domain"** to get a public URL
5. Copy this URL (e.g., `https://your-backend.up.railway.app`)

### 2.6 Verify Deployment

Visit your Railway URL + `/docs` (e.g., `https://your-backend.up.railway.app/docs`)
You should see the FastAPI Swagger documentation.

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Import Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `EliseJohnsen/pearly`

### 3.2 Configure Build Settings

Vercel should auto-detect Next.js. Configure these:

1. **Framework Preset**: Next.js (auto-detected)
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build` (default)
4. **Install Command**: `npm install` (default)

### 3.3 Add Environment Variables

Before deploying, add these environment variables:

```
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
RESEND_API_KEY=re_your_api_key_here
```

**Important**:
- Replace `your-backend.up.railway.app` with your actual Railway URL
- If you're using Resend for emails, add your API key. Otherwise, leave it empty for now.

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Once deployed, Vercel will give you a URL like: `https://pearly.vercel.app`

---

## Step 4: Update CORS Settings

Now that you have your Vercel URL, update Railway backend CORS:

1. Go back to Railway
2. Click on your backend service
3. Go to **Variables** tab
4. Update `BACKEND_CORS_ORIGINS`:
   ```
   ["https://pearly.vercel.app","https://www.pearly.vercel.app"]
   ```
   Replace with your actual Vercel URL(s)
5. Railway will automatically redeploy

---

## Step 5: Test Your Deployment

1. Visit your Vercel URL: `https://pearly.vercel.app`
2. Try uploading an image
3. Verify the pattern generation works
4. Check Railway logs if anything fails

---

## Troubleshooting

### Backend Not Connecting to Database

1. Check Railway logs: Click your service → **Deployments** → Latest deployment → **View Logs**
2. Verify `DATABASE_URL` format is correct with `+psycopg`
3. Ensure Supabase project is active and password is correct

### Frontend Can't Reach Backend

1. Check `NEXT_PUBLIC_API_URL` in Vercel environment variables
2. Verify Railway backend is deployed and public URL is accessible
3. Check CORS settings in Railway backend

### Image Upload Fails

1. Check Railway logs for errors
2. Verify `/app/uploads` directory permissions
3. Railway has persistent storage - images are temporary in the free tier

### Build Failures

**Railway**:
- Check Dockerfile syntax
- Verify `requirements.txt` has all dependencies
- Check build logs for specific errors

**Vercel**:
- Verify `package.json` has correct dependencies
- Check Node.js version compatibility
- Ensure `frontend` directory structure is correct

---

## Environment Variables Summary

### Railway (Backend)
```
DATABASE_URL=postgresql+psycopg://postgres.xxx:[PASSWORD]@...supabase.com:6543/postgres
BACKEND_CORS_ORIGINS=["https://your-app.vercel.app"]
UPLOAD_DIR=/app/uploads
```

### Vercel (Frontend)
```
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
RESEND_API_KEY=re_your_api_key_here
```

---

## Monitoring and Logs

### Railway Logs
- Go to your service → **Deployments** → Click latest deployment → **View Logs**
- Real-time logs help debug issues

### Vercel Logs
- Go to your project → Click deployment → **Functions** tab
- Shows Next.js server logs and errors

### Supabase
- Dashboard shows database activity
- **SQL Editor** lets you query your database directly

---

## Next Steps

1. ✅ Set up custom domain in Vercel (optional)
2. ✅ Add SSL certificates (automatic with Vercel)
3. ✅ Set up monitoring and alerts
4. ✅ Add Vipps payment integration (when ready)
5. ✅ Configure email notifications with Resend

---

## Costs

- **Supabase Free Tier**: 500MB database, 50,000 rows
- **Railway Free Trial**: $5 credit/month (then ~$5-10/month depending on usage)
- **Vercel Free Tier**: Unlimited deployments, 100GB bandwidth

---

## Support

If you run into issues:
1. Check the troubleshooting section above
2. Review Railway/Vercel deployment logs
3. Verify all environment variables are set correctly
4. Ensure GitHub repo is up to date with latest code
