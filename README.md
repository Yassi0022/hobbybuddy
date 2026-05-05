# 🎯 HobbyBuddy — Personality-Based Social Matching PWA

<p align="center">
  <strong>A full-stack social platform that matches users through Big Five personality compatibility, built with a decoupled microservice architecture and deployed on the cloud.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-Vercel_CDN-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel"/>
  <img src="https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="Render"/>
  <img src="https://img.shields.io/badge/Spring_Boot-3.3-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" alt="Spring Boot"/>
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/MySQL-Cloud-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL"/>
</p>

***

## 📖 About

HobbyBuddy connects people based on **personality compatibility** rather than superficial preferences. Users complete a **50-question IPIP Big Five questionnaire**; their answers are stored as five normalized trait scores (`openness`, `conscientiousness`, `extraversion`, `agreeableness`, `neuroticism`). A dedicated Python microservice ranks potential matches using **cosine similarity** on those personality vectors, returning a scored and sorted list in real time.

The platform is built as a **Progressive Web App (PWA)** — installable on mobile, no app store required.

***

## 🧠 Matching Engine

The matching logic is a standalone **FastAPI** microservice (`matching-engine/`), decoupled from the main backend.

Each user is represented as a 5-dimensional personality vector derived from their Big Five trait scores. When a match request arrives, the engine computes a compatibility score between the requesting user and all candidates, returning a ranked list sorted by affinity.

The Spring Boot backend calls /calculate-match via HTTP POST, passing the target user and the pool of candidates. Results are returned in milliseconds and rendered directly in the match feed.

Implementation details of the scoring algorithm are kept private.



***

## 🏗️ Architecture

```
┌──────────────────────────────────┐
│         MOBILE PWA               │  Vercel Edge CDN
│   Vanilla JS · HTML/CSS · SW     │
└───────────────┬──────────────────┘
                │ REST + STOMP/WebSocket
┌───────────────▼──────────────────┐
│      hobbybuddy-platform         │  Render
│   Spring Boot 3.3 · Java         │
│   JWT Auth · JPA · WebSocket     │
└──────────┬────────────┬──────────┘
           │ JDBC       │ HTTP POST /calculate-match
┌──────────▼───────┐  ┌─▼──────────────────────────┐
│  Aiven MySQL     │  │  matching-engine             │  Render
│  Cloud DB        │  │  FastAPI · scikit-learn      │
└──────────────────┘  └────────────────────────────┘
```

***

## ✨ Features

- 🔐 **JWT Authentication** — stateless session management with Spring Security; automatic 401/403 interception; token stored in `HttpOnly` cookie
- 💬 **Real-time Chat** — STOMP over SockJS WebSocket, message persistence on MySQL, automatic UI sync
- 🧠 **Personality Matching** — 50-question IPIP questionnaire → Big Five vector → cosine similarity ranking via FastAPI microservice
- 🎴 **Swipe UI** — gesture-based match feed with skeleton loading states
- 🔗 **Referral System** — `referredBy` / `referralCount` fields on the User entity; native Web Share API integration
- 📱 **PWA** — `manifest.json` + `service-worker.js` for offline caching and mobile installability

***

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JS (ES6+), HTML5/CSS3, PWA (manifest + service worker) |
| Backend | Java 21, Spring Boot 3.3, Spring Security, JWT (jjwt 0.11.5), Spring WebSocket (STOMP) |
| Matching Engine | Python 3.11, FastAPI 0.115, scikit-learn 1.5.2, NumPy 2.1, Pydantic 2.11 |
| Database | MySQL 8 (Aiven cloud) — JPA/Hibernate, Spring Data JPA |
| Containerization | Docker, docker-compose |
| Deployment | Vercel (frontend), Render (Spring Boot + FastAPI), Aiven (DB) |

***

## 📁 Project Structure

```
hobbybuddy/
├── hobbybuddy-platform/          # Spring Boot backend (Java)
│   └── src/main/java/com/example/demo/
│       ├── config/               # CORS, Security, WebSocket, DB cleanup
│       ├── controller/           # UserController, MessageController, EventController
│       ├── model/                # User, Message, Hobby, Event (JPA entities)
│       ├── dto/                  # LoginRequestDTO, UserResponseDTO
│       ├── repository/           # Spring Data JPA repositories
│       ├── security/             # JwtUtil, JWT filters
│       └── service/              # UserService, business logic
├── matching-engine/              # FastAPI microservice (Python)
│   ├── main.py                   # /calculate-match endpoint
│   └── requirements.txt
├── frontend/                     # PWA (static, served via Vercel)
│   ├── index.html / login.html / register.html
│   ├── quiz.html                 # 50-question Big Five questionnaire
│   ├── dashboard.html            # Match feed + swipe UI
│   ├── manifest.json
│   └── service-worker.js
├── docker-compose.yml
└── seed.sql                      # Sample users with trait scores
```

***

## 🚀 Local Setup

### Prerequisites
- Docker & docker-compose
- Java 21 + Maven

### 1. Environment variables

Create a `.env` file in the project root:

```env
AIVEN_URL=jdbc:mysql://<host>:<port>/<db>?ssl-mode=REQUIRED
AIVEN_USER=your_user
AIVEN_PASSWORD=your_password
```

### 2. Run with Docker

```bash
git clone https://github.com/Yassi0022/hobbybuddy.git
cd hobbybuddy
cd hobbybuddy-platform && mvn clean package -DskipTests && cd ..
docker-compose up --build
```

- **Backend**: `http://localhost:8080`
- **Matching engine**: `http://localhost:8001` (or remote Render URL)

### 3. Seed sample data

```bash
mysql -u <user> -p hobbybuddy_db < seed.sql
```

### 4. Frontend

Open `frontend/index.html` locally or deploy to Vercel with `vercel --prod`.

***

## 🌐 Live Demo

- **App**: [hobbybuddy.vercel.app](https://hobbybuddy.vercel.app)
- **API**: deployed on Render *(cold start ~30s on free tier)*

***

## 📄 License

MIT License — open source, free to use and modify.

<p align="center">
  <sub>Built by <a href="https://github.com/Yassi0022">Yassine Hatouf</a></sub>
</p>
