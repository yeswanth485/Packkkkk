# Render Deployment Guide — PackAI

## Overview
You will deploy 3 services on Render:
1. PostgreSQL Database
2. Backend (FastAPI — Python Web Service)
3. Frontend (Next.js — Node Web Service)

Free tier works. Paid ($7/mo per service) removes cold-start delays.

---

## STEP 1 — Push Code to GitHub

```bash
# From the ai-packaging-platform/ folder

git init
git add .
git commit -m "initial: PackAI full stack"
git branch -M main

# Create a new repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/packai.git
git push -u origin main
```

---

## STEP 2 — Create PostgreSQL Database on Render

1. Go to https://dashboard.render.com
2. Click **New +** → **PostgreSQL**
3. Fill in:
   - Name: `packai-db`
   - Database: `packaging_db`
   - User: `packai_user`
   - Region: Singapore (closest to Chennai)
   - Plan: **Free**
4. Click **Create Database**
5. Wait ~1 min. Then copy the **Internal Database URL**
   - Looks like: `postgresql://packai_user:xxxx@dpg-xxxxx/packaging_db`
   - **Save this** — you need it in Step 3

---

## STEP 3 — Deploy Backend (FastAPI)

1. Click **New +** → **Web Service**
2. Connect your GitHub repo → select `packai` repo
3. Fill in:
   - **Name**: `packai-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```
     pip install -r requirements.txt && python ml_engine/train_model.py
     ```
   - **Start Command**:
     ```
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Plan**: Free

4. Click **Advanced** → **Add Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | *(paste Internal DB URL from Step 2)* |
   | `SECRET_KEY` | *(generate a random 32+ char string)* |
   | `ML_MODEL_PATH` | `ml_engine/packaging_model.pkl` |
   | `SHIPPING_RATE_PER_KG` | `45.0` |
   | `DIM_WEIGHT_DIVISOR` | `5000.0` |
   | `DEBUG` | `false` |
   | `PYTHON_VERSION` | `3.11.0` |

5. Click **Create Web Service**
6. Wait for build (~3-5 min — it trains the ML model)
7. Once deployed, copy your backend URL:
   - Example: `https://packai-backend.onrender.com`
8. Test it: visit `https://packai-backend.onrender.com/health`
   - Should return: `{"status":"healthy","database":"connected",...}`

---

## STEP 4 — Deploy Frontend (Next.js)

1. Click **New +** → **Web Service**
2. Connect same GitHub repo
3. Fill in:
   - **Name**: `packai-frontend`
   - **Root Directory**: `frontend`
   - **Runtime**: `Node`
   - **Build Command**:
     ```
     npm install && npm run build
     ```
   - **Start Command**:
     ```
     npm start
     ```
   - **Plan**: Free

4. Click **Advanced** → **Add Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://packai-backend.onrender.com` |
   | `NEXT_PUBLIC_WS_URL` | `wss://packai-backend.onrender.com` |
   | `NODE_VERSION` | `20.11.0` |

5. Click **Create Web Service**
6. Wait for build (~3-4 min)
7. Your app is live at:
   - Example: `https://packai-frontend.onrender.com`

---

## STEP 5 — Final Verification

Open your frontend URL and:
1. ✅ Landing page loads with live demo calculator
2. ✅ Register an account
3. ✅ Upload a CSV → orders appear with optimization results
4. ✅ Click Pack Now → modal shows box + costs
5. ✅ Check Analytics page → charts show data

Visit backend docs: `https://packai-backend.onrender.com/docs`

---

## Troubleshooting

### Backend build fails
```
Check Render Logs tab for errors.
Most common: ML training fails → check ml_engine/train_model.py logs
```

### Database connection error
```
Make sure you used Internal Database URL (not External)
Internal URL only works within Render's network
```

### Frontend shows "Failed to fetch"
```
Set NEXT_PUBLIC_API_URL correctly — no trailing slash
Must be https:// (not http://) in production
```

### Cold starts (free tier)
```
Free tier services sleep after 15 min of inactivity.
First request takes 30-60 seconds to wake up.
Upgrade to Starter ($7/mo) for always-on.
```

### WebSocket not connecting
```
Free tier supports WebSocket. 
Make sure NEXT_PUBLIC_WS_URL uses wss:// not ws://
```

---

## Generate SECRET_KEY

Run this locally to get a secure key:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## Update After Code Changes

```bash
git add .
git commit -m "your change description"
git push origin main
# Render auto-deploys on push
```
