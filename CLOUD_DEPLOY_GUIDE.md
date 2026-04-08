# ☁️ HobbyBuddy — Cloud Deployment Guide

Follow these steps **in order** after completing the Git setup.

---

## 1. Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. **Repository name:** `hobbybuddy`
3. **Visibility:** Public (for portfolio) or Private
4. **DO NOT** add README, .gitignore, or license (we already have them)
5. Click **Create repository**
6. Copy the HTTPS URL (e.g. `https://github.com/YOUR_USERNAME/hobbybuddy.git`)

Then run in your terminal:

```bash
cd C:\hobbybuddy
git remote add origin https://github.com/YOUR_USERNAME/hobbybuddy.git
git push -u origin main
```

---

## 2. Frontend → Vercel (Already deployed via CLI)

After `vercel --prod` completes, you'll get a production URL like:
```
https://hobbybuddy-XXXX.vercel.app
```

### Update the backend CORS config

Open `hobbybuddy-platform/src/main/java/com/example/demo/config/CorsConfig.java` and replace:
```java
"https://hobbybuddy.vercel.app"
```
with your actual Vercel URL. Then rebuild and push.

### Update the frontend API URL

Open `frontend/js/hobbybuddy.js` (and the copy in `hobbybuddy-platform/src/main/resources/static/js/`) and replace:
```javascript
const API_BASE_URL = IS_LOCAL ? '' : 'https://hobbybuddy-backend.onrender.com';
const WS_BASE_URL  = IS_LOCAL ? '' : 'https://hobbybuddy-backend.onrender.com';
```
with your actual Render Spring Boot URL once you have it.

---

## 3. Database → Aiven (Free MySQL)

1. Go to [console.aiven.io](https://console.aiven.io) → Sign up (free)
2. Click **Create Service** → **MySQL** → **Free Plan (Hobbyist)**
3. **Cloud/Region:** Choose closest to you (e.g. `google-europe-west1`)
4. Wait for the service to be **Running**
5. From the **Overview** page, copy these values:

| Field | What to copy |
|-------|-------------|
| **Host** | e.g. `mysql-xxxx.aivencloud.com` |
| **Port** | e.g. `12345` |
| **User** | e.g. `avnadmin` |
| **Password** | (shown once, save it!) |
| **Database** | `defaultdb` (or create `hobbybuddy`) |

Build the **JDBC URL:**
```
jdbc:mysql://HOST:PORT/DATABASE?sslMode=REQUIRED
```

Example:
```
jdbc:mysql://mysql-xxxx.aivencloud.com:12345/defaultdb?sslMode=REQUIRED
```

---

## 4. Backend (Spring Boot) → Render

1. Go to [render.com](https://render.com) → Sign up → **New Web Service**
2. Connect your **GitHub** account and select `hobbybuddy` repo
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `hobbybuddy-backend` |
| **Root Directory** | `hobbybuddy-platform` |
| **Runtime** | `Docker` or `Java` |
| **Build Command** | `mvn clean package -DskipTests` |
| **Start Command** | `java -jar target/demo-0.0.1-SNAPSHOT.jar` |
| **Plan** | **Free** |

4. Add **Environment Variables:**

| Key | Value |
|-----|-------|
| `PORT` | (leave empty, Render auto-sets it) |
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://HOST:PORT/DATABASE?sslMode=REQUIRED` |
| `SPRING_DATASOURCE_USERNAME` | Your Aiven MySQL username |
| `SPRING_DATASOURCE_PASSWORD` | Your Aiven MySQL password |
| `FASTAPI_URL` | `https://hobbybuddy-matching.onrender.com` (from Step 5) |

5. Click **Create Web Service** → wait for build (~5 min)
6. Copy the Render URL (e.g. `https://hobbybuddy-backend.onrender.com`)

---

## 5. Backend (FastAPI) → Render

1. On Render → **New Web Service** again
2. Same GitHub repo, configure:

| Setting | Value |
|---------|-------|
| **Name** | `hobbybuddy-matching` |
| **Root Directory** | `matching-engine` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `python main.py` |
| **Plan** | **Free** |

3. No extra environment variables needed (PORT is auto-injected)
4. Copy the URL → paste it as `FASTAPI_URL` in the Spring Boot service (Step 4)

---

## 6. Final Wiring (After all services are up)

Once you have all three URLs:

| Service | Example URL |
|---------|-------------|
| **Vercel (Frontend)** | `https://hobbybuddy.vercel.app` |
| **Render (Spring Boot)** | `https://hobbybuddy-backend.onrender.com` |
| **Render (FastAPI)** | `https://hobbybuddy-matching.onrender.com` |

### Update these 3 places:

1. **`frontend/js/hobbybuddy.js`** — Replace the Render placeholder URL:
   ```javascript
   const API_BASE_URL = IS_LOCAL ? '' : 'https://hobbybuddy-backend.onrender.com';
   const WS_BASE_URL  = IS_LOCAL ? '' : 'https://hobbybuddy-backend.onrender.com';
   ```

2. **`CorsConfig.java`** — Add your Vercel URL to allowed origins

3. **Render Dashboard** — Set `FASTAPI_URL` env var on the Spring Boot service to the FastAPI Render URL

Then:
```bash
git add -A && git commit -m "wire production URLs" && git push
```

Vercel auto-redeploys on push. Render auto-redeploys on push. Done! 🚀

---

## ⚠️ Free Tier Limitations

| Service | Limitation | Workaround |
|---------|-----------|------------|
| **Render** | Free services spin down after 15min idle | First request takes ~30s (cold start) |
| **Aiven** | 1GB storage, single node | Plenty for MVP |
| **Vercel** | 100GB bandwidth/mo | More than enough for launch |

> **Pro tip:** To keep Render from sleeping, use [UptimeRobot](https://uptimerobot.com) (free) to ping your backend URL every 14 minutes.
