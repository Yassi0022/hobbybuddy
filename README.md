# 🎯 HobbyBuddy — AI-Powered Social Matching PWA

<p align="center">
  <strong>The next-generation social platform connecting people through deep psychological compatibility, powered by AI and built for viral scalability.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-Vercel_CDN-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel"/>
  <img src="https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="Render"/>
  <img src="https://img.shields.io/badge/Spring_Boot-3.3-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" alt="Spring Boot"/>
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/MySQL-Cloud-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL"/>
</p>

---

## 📖 Mission
HobbyBuddy transforms how we form connections. By moving beyond superficial swipes, it utilizes the **IPIP Big Five personality model** and a custom **AI Cosine-Similarity engine** to match individuals on a scientific level. Our **Progressive Web App (PWA)** architecture ensures a native-like mobile experience with zero-friction onboarding—no app stores, just one link to find your vibe.

---

## ✨ Enterprise-Grade Features

- 🔐 **JWT Stateless Authentication**: Secure, scalable session management with automatic 401/403 interception and token-based protection.
- 💬 **STOMP WebSockets Chat**: Low-latency, real-time messaging with message persistence and automatic UI sync.
- 🧠 **ML Big Five Personality Engine**: A Python-based microservice that processes 50 validated psychometric points into high-precision compatibility rankings.
- 🎴 **Tinder-style Swipe UI**: Responsive, gesture-based interface with physics animations, debounce protection, and skeleton loading states.
- 🚀 **Viral Share Loops**: Native **Web Share API** integration allowing users to share personality "vibes" and invite friends directly from the mobile OS share sheet.

---

## 🏗️ Decoupled Serverless Architecture

To achieve **infinite scalability with zero initial overhead**, HobbyBuddy utilizes a modern, distributed architecture:

```text
    ┌───────────────────────────┐
    │       MOBILE PWA          │  Hosted on Vercel Edge CDN
    │  (HTML5, CSS3, ES6+)      │  (Zero-latency global delivery)
    └─────────────┬─────────────┘
                  │
        ┌─────────┴─────────┐
        │  RENDER CLOUD     │  Microservices Layer
        │  (Java & Python)  │  (Independent horizontal scaling)
        └─────────┬─────────┘
                  │
        ┌─────────┴─────────┐
        │   AIVEN CLOUD     │  Managed Storage
        │   (MySQL 8.0)     │  (Production-grade persistence)
        └───────────────────┘
```

*   **Frontend (Vercel):** Lightning-fast asset delivery via global CDN.
*   **Backend (Render):** Spring Boot handles business logic and security; FastAPI handles AI computations.
*   **Persistence (Aiven):** Cloud-native MySQL ensures high availability and secure backups.

---

## 🛠️ Tech Stack

- **Backend:** Java 21, Spring Boot 3.3, Spring Security (JWT), Spring WebSocket.
- **AI Engine:** Python 3.11, FastAPI, scikit-learn, NumPy (Cosine Similarity).
- **Communication:** STOMP over SockJS (WebSockets).
- **Frontend:** Vanilla JS (ES6+), CSS3 (Custom Design System), HTML5.
- **DevOps:** Docker, Docker Compose, GitHub Actions, Vercel CLI.

---

## 🚀 Quickstart (Local Development)

Get HobbyBuddy running on your machine in under 2 minutes using Docker:

### 1. Prerequisites
- Docker & Docker Compose
- Java 21 + Maven (for builds)

### 2. Implementation
```bash
# 1. Clone the repository
git clone https://github.com/Yassi0022/hobbybuddy.git
cd hobbybuddy

# 2. Build the Spring Boot JAR
cd hobbybuddy-platform
mvn clean package -DskipTests
cd ..

# 3. Spin up the cluster
docker-compose up -d --build
```

### 3. Access
- **Application:** `http://localhost:8080`
- **AI Matching Engine:** `http://localhost:8001`
- **Database:** `localhost:3306`

---

## 📄 License
This project is open-source and available under the **MIT License**.

<p align="center">
  <sub>Built with ❤️ by Yassi and Antigravity AI</sub>
</p>
