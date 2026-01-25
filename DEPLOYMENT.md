# Deployment Guide

This guide will help you deploy your Perle application to production using Railway (database + backend) and Vercel (frontend).

## Prerequisites

- GitHub account with your code pushed
- Railway account (sign up at [railway.app](https://railway.app))
- Vercel account (you already have this)

---

## Step 1: Deploy Database to Railway

### 1.1 Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will detect your Dockerfile

### 1.2 Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway automatically creates a PostgreSQL database
4. Wait ~1 minute for database to be ready

### 1.3 Get Database Connection String

1. Click on the **Postgres** service in your Railway project
2. Go to **Variables** tab
3. You'll see these auto-generated variables:
   - `PGHOST` - Database host
   - `PGPORT` - Port (usually 5432)
   - `PGUSER` - Username (postgres)
   - `PGPASSWORD` - Password
   - `PGDATABASE` - Database name (railway)
   - `DATABASE_URL` - Full connection string

4. Copy the `DATABASE_URL` value - it looks like:
   ```
   postgresql://postgres:password@host.railway.app:5432/railway
   ```

**Note**: Railway's PostgreSQL is fully managed with automatic backups!

---

## Step 2: Deploy Backend to Railway

Your backend service should already be created from Step 1.1. Now we'll configure it.

### 2.1 Configure Root Directory

Since your backend is in a subdirectory:

1. Click on your **backend service** (not the Postgres service)
2. Go to **Settings** tab
3. Scroll to **Service Settings** → **Root Directory**
4. Set it to: `backend`
5. Click **"Update"**

### 2.2 Link Database to Backend

1. In your backend service, go to **Variables** tab
2. Click **"+ New Variable"** → **"Add Reference"**
3. Select your **Postgres** service
4. Choose `DATABASE_URL` variable
5. Railway automatically injects `${{Postgres.DATABASE_URL}}`

**Alternative**: Manually add:
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### 2.3 Add Other Environment Variables

Add these additional variables:

```
BACKEND_CORS_ORIGINS=["https://your-app.vercel.app"]
UPLOAD_DIR=/app/uploads
SANITY_PROJECT_ID=your_sanity_project_id
SANITY_DATASET=production
SANITY_API_TOKEN=your_sanity_api_token
SANITY_API_VERSION=2024-12-16
SANITY_WEBHOOK_SECRET=your_webhook_secret
REPLICATE_API_TOKEN=your_replicate_token
SECRET_KEY=your_secret_key_for_jwt
```

**Important**:
- You'll update `BACKEND_CORS_ORIGINS` after deploying to Vercel
- Get Sanity credentials from your Sanity project dashboard
- Generate a strong `SECRET_KEY` for JWT authentication

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
2. Verify database service is running in Railway
3. Check that `DATABASE_URL` is correctly linked to Postgres service
4. Ensure migrations ran successfully (check logs for "Database migrations completed")

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
DATABASE_URL=${{Postgres.DATABASE_URL}}
BACKEND_CORS_ORIGINS=["https://your-app.vercel.app"]
UPLOAD_DIR=/app/uploads
SANITY_PROJECT_ID=qpdup7gv
SANITY_DATASET=production
SANITY_API_TOKEN=***
SANITY_API_VERSION=2024-12-16
SANITY_WEBHOOK_SECRET=***
REPLICATE_API_TOKEN=***
SECRET_KEY=***
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

### Railway Database
- Click on Postgres service → **Data** tab to view tables
- Use **Query** tab to run SQL queries directly
- **Metrics** tab shows database performance

---

## Next Steps

1. ✅ Set up custom domain in Vercel (optional)
2. ✅ Add SSL certificates (automatic with Vercel)
3. ✅ Set up monitoring and alerts
4. ✅ Add Vipps payment integration (when ready)
5. ✅ Configure email notifications with Resend

---

## Costs

- **Railway**: $5 credit/month for free trial, then usage-based pricing
  - PostgreSQL: ~$5-10/month depending on storage and usage
  - Backend service: ~$5-10/month depending on traffic
- **Vercel Free Tier**: Unlimited deployments, 100GB bandwidth
- **Sanity**: Free tier includes 100k API requests/month

---

## Support

If you run into issues:
1. Check the troubleshooting section above
2. Review Railway/Vercel deployment logs
3. Verify all environment variables are set correctly
4. Ensure GitHub repo is up to date with latest code
