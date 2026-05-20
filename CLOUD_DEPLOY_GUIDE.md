# ☁️ HobbyBuddy — Cloud Deployment Guide

## Architecture

HobbyBuddy is now a **fully integrated full-stack app**:
- **Frontend**: React 19 + Vite 8 (built into Spring Boot static resources)
- **Backend**: Spring Boot 3.3.4 + Java 21
- **Database**: MySQL (Aiven or ClearDB on Render)
- **AI Matching**: Python FastAPI (separate service)
- **Deployment**: Single JAR on Render (frontend + backend together)

---

## 1. Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. **Repository name:** `hobbybuddy`
3. **Visibility:** Public (for portfolio) or Private
4. **DO NOT** add README, .gitignore, or license (we already have them)
5. Click **Create repository**
6. Copy the HTTPS URL

Then run:
```bash
cd C:\hobbybuddy
git remote add origin https://github.com/YOUR_USERNAME/hobbybuddy.git
git push -u origin main
```

---

## 2. Deploy to Render

### Option A: Using render.yaml (Recommended)

1. Go to [render.com](https://render.com) and sign up/login
2. Click **New +** → **Web Service**
3. Connect your GitHub repo
4. Render will auto-detect `render.yaml`
5. Add environment variables:
   - `SPRING_DATASOURCE_URL` — MySQL connection string
   - `SPRING_DATASOURCE_USERNAME` — DB username
   - `SPRING_DATASOURCE_PASSWORD` — DB password
   - `FASTAPI_URL` — Python matching service URL
6. Click **Create Web Service**

### Option B: Manual Setup

1. **New Web Service** → Connect GitHub repo
2. **Runtime:** Java
3. **Build Command:**
   ```bash
   cd frontend_v2 && npm install && npm run build && cd ../hobbybuddy-platform && mvn package -DskipTests
   ```
4. **Start Command:**
   ```bash
   java -jar hobbybuddy-platform/target/demo-0.0.1-SNAPSHOT.jar
   ```
5. **Plan:** Free or Starter
6. Add environment variables as above

---

## 3. Database Setup (MySQL)

### Option A: Aiven MySQL (Recommended)
1. Go to [aiven.io](https://aiven.io)
2. Create MySQL service
3. Copy connection string, username, password
4. Add to Render environment variables

### Option B: ClearDB on Render
1. In Render dashboard, go to your service
2. Click **Environment** → **Add Environment Variable**
3. Add ClearDB connection details

---

## 4. Python Matching Service (Optional)

If you want AI-powered matching:

1. Deploy the FastAPI service separately on Render
2. Set `FASTAPI_URL` in your main service
3. The service should expose `POST /match` endpoint

---

## 5. Verify Deployment

After deployment, check:
- `https://your-app.onrender.com/` — Landing page loads
- `https://your-app.onrender.com/api/health` — Returns `{"status":"ok"}`
- `https://your-app.onrender.com/register` — Registration page works
- `https://your-app.onrender.com/dashboard` — Dashboard loads (redirects to login if not auth)

---

## 6. Custom Domain (Optional)

1. In Render dashboard, go to your service
2. Click **Settings** → **Custom Domain**
3. Add your domain and configure DNS

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port (auto-set by Render) | `8080` |
| `SPRING_DATASOURCE_URL` | MySQL JDBC URL | `jdbc:mysql://host:3306/hobbybuddy_db` |
| `SPRING_DATASOURCE_USERNAME` | DB username | `admin` |
| `SPRING_DATASOURCE_PASSWORD` | DB password | `secret` |
| `FASTAPI_URL` | Python matching service | `https://hobbybuddy-ai.onrender.com` |

---

## Build Commands

### Full build (frontend + backend):
```bash
cd frontend_v2 && npm install && npm run build && cd ../hobbybuddy-platform && mvn package -DskipTests
```

### Frontend only:
```bash
cd frontend_v2 && npm run build
```

### Backend only:
```bash
cd hobbybuddy-platform && mvn package -DskipTests
```

### Run locally:
```bash
cd hobbybuddy-platform && mvn spring-boot:run
```
Then open http://localhost:8080
