# 🚀 Deploy MyPaisa — Step by Step

## Option 1: Railway (Recommended — Free + PostgreSQL)

### Step 1: Push to GitHub
```bash
cd budget-app
git init
git add .
git commit -m "MyPaisa initial commit"
# Create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/mypaisa.git
git push -u origin main
```

### Step 2: Deploy on Railway
1. Go to **https://railway.app** → Sign up with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `mypaisa` repo
4. Railway auto-detects Node.js

### Step 3: Add PostgreSQL Database
1. In your Railway project → Click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Click on the PostgreSQL service → **"Variables"** tab
3. Copy the `DATABASE_URL` value

### Step 4: Set Environment Variables
In your Railway app service → **"Variables"** tab, add:
```
NODE_ENV=production
JWT_SECRET=your_random_secret_here_make_it_long
DATABASE_URL=<paste the PostgreSQL URL from step 3>
PORT=5000
```

### Step 5: Set Build Command
In Railway app → **"Settings"** → **"Build"**:
- Build Command: `cd client && npm install && npm run build`
- Start Command: `cd server && npm install && npm start`

### Done! 🎉
Railway gives you a URL like `https://mypaisa-production.up.railway.app`

---

## Option 2: Render (Free tier)

### Step 1: Push to GitHub (same as above)

### Step 2: Create Web Service on Render
1. Go to **https://render.com** → Sign up
2. **"New"** → **"Web Service"** → Connect GitHub repo
3. Settings:
   - **Build Command:** `cd client && npm install && npm run build && cd ../server && npm install`
   - **Start Command:** `cd server && npm start`
   - **Environment:** Node

### Step 3: Add PostgreSQL
1. **"New"** → **"PostgreSQL"** → Create database
2. Copy the **"Internal Database URL"**

### Step 4: Environment Variables
Add in Render dashboard:
```
NODE_ENV=production
JWT_SECRET=your_random_secret_here
DATABASE_URL=<your PostgreSQL URL>
```

---

## Option 3: Supabase (Free PostgreSQL) + Vercel (Free hosting)

### Database: Supabase
1. Go to **https://supabase.com** → Create project
2. **Settings** → **Database** → Copy **"Connection string (URI)"**
3. Replace `[YOUR-PASSWORD]` with your actual password

### Backend: Vercel
1. Go to **https://vercel.com** → Import GitHub repo
2. Set root directory to `server`
3. Add environment variables (same as above)

### Frontend: Vercel (separate deployment)
1. Import same repo again
2. Set root directory to `client`
3. Set `VITE_API_URL` to your backend Vercel URL

---

## Local Development (unchanged)

```bash
# Terminal 1
cd budget-app/server
npm run dev

# Terminal 2  
cd budget-app/client
npm run dev
```

Or double-click `start.bat`

---

## Why data won't delete

- **SQLite (local):** Data stored in `server/db/app.db` — persists as long as file exists
- **PostgreSQL (production):** Data stored in cloud database — persists forever
- Railway/Render keep your database running 24/7
- Even if you redeploy the app, the database is separate and untouched

## Security checklist before going live

- [ ] Change `JWT_SECRET` to a long random string (32+ chars)
- [ ] Never commit `.env` to GitHub (it's in `.gitignore`)
- [ ] Use HTTPS (Railway/Render provide this automatically)
- [ ] Set `NODE_ENV=production`
