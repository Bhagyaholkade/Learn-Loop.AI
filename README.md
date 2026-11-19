<div align="center">

# 🎓 LearnLoop AI

### AI-powered learning platform — create courses, generate quizzes, and track progress in one place.

<p>
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/MUI-007FFF?style=for-the-badge&logo=mui&logoColor=white" alt="Material UI" />
  <img src="https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Gemini AI" />
</p>

[Features](#-features) •
[Tech Stack](#-tech-stack) •
[Getting Started](#-getting-started) •
[API Docs](#-api-documentation) •
[Project Structure](#-project-structure)

</div>

---

## ✨ Overview

**LearnLoop AI** is a full-stack e-learning platform where admins build courses with the help of AI and students learn, take quizzes, and earn certificates. Course outlines, lesson content, and chapter quizzes can be generated automatically, so a full course can be ready in minutes.

---

## 🚀 Features

### 🤖 AI-Powered
| Feature | Description |
| --- | --- |
| **AI Course Creator** | Generate full course outlines and lesson content from a topic |
| **AI Quiz Generator** | Create quizzes for one chapter or every chapter at once |
| **Multi-provider fallback** | Google Gemini → Groq → OpenRouter, so generation keeps working if one provider fails |
| **Draft & review** | Review, edit, and approve AI drafts before publishing |

### 👨‍🎓 For Students
- 📚 Browse and enroll in courses
- 📖 Step-by-step lessons organized by chapters
- 📝 Timed quizzes with instant results and answer explanations
- 📈 Personal progress tracking
- 🔖 Bookmarks and ⭐ course reviews
- 🏆 Certificates on course completion

### 🛠️ For Admins
- 🗂️ Manage courses, chapters, lessons, and enrollments
- 👥 Manage students
- 🧠 Create, review, and manage quizzes and questions
- 📊 Analytics dashboard, quiz attempts, and progress reports

### 🔐 Security & Accounts
- JWT authentication with role-based access (Admin / Student)
- Email verification and password reset (SMTP or Resend)
- Password hashing with bcrypt
- Global request validation and error handling

---

## 🧰 Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 19, TypeScript, Vite, Material UI, React Router, Axios |
| **Backend** | NestJS, TypeScript, TypeORM, Passport JWT, class-validator |
| **Database** | MySQL with TypeORM migrations |
| **AI** | Google Gemini, Groq, OpenRouter |
| **Email** | Nodemailer (SMTP), Resend |
| **API Docs** | Swagger / OpenAPI |

---

## ⚡ Getting Started

### Prerequisites
- **Node.js** 20 or newer
- **MySQL** 8 or newer
- An API key for **Google Gemini** (Groq and OpenRouter are optional fallbacks)

### 1️⃣ Clone the repository
```bash
git clone https://github.com/Bhagyaholkade/Learn-Loop.AI.git
cd Learn-Loop.AI
```

### 2️⃣ Set up the backend
```bash
cd backend
npm install
cp .env.example .env      # then fill in your values
npm run migration:run     # create database tables
npm run start:dev         # http://localhost:3002
```

### 3️⃣ Set up the frontend
```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

> 💡 The frontend calls the API at `http://localhost:3002/api/v1` by default.

---

## 🔑 Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Description |
| --- | --- |
| `PORT` | Backend port (default `3002`) |
| `FRONTEND_URL` | Allowed CORS origin (default `http://localhost:5173`) |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` | MySQL connection |
| `JWT_SECRET` | Secret used to sign JWT tokens |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Google Gemini settings |
| `GROQ_API_KEY`, `OPENROUTER_API_KEY` | Optional AI fallbacks |
| `MAIL_PROVIDER`, `MAIL_*`, `RESEND_API_KEY` | Email settings |

> ⚠️ Never commit your real `.env` file.

---

## 📘 API Documentation

With the backend running, open the interactive Swagger docs:

**👉 http://localhost:3002/api/docs**

All endpoints use the base path `/api/v1`. Click **Authorize** in Swagger and paste a JWT token to try protected routes.

---

## 📂 Project Structure

```
Learn-Loop.AI/
├── backend/                 # NestJS REST API
│   └── src/
│       ├── ai-course/       # AI course outline & lesson generation
│       ├── ai-quiz/         # AI quiz generation (Gemini/Groq/OpenRouter)
│       ├── auth/            # JWT auth, roles, password reset
│       ├── email/           # Email service & templates
│       ├── courses/         # Courses
│       ├── chapters/        # Chapters
│       ├── lessons/         # Lessons
│       ├── quizzes/         # Quizzes, questions & attempts
│       ├── enrollments/     # Enrollments
│       ├── progress/        # Learning progress
│       ├── certificates/    # Certificates
│       ├── bookmarks/       # Bookmarks
│       ├── reviews/         # Course reviews
│       ├── students/        # Student management
│       ├── users/           # Users
│       └── migrations/      # Database migrations
│
└── frontend/                # React + Vite app
    └── src/
        ├── api/             # API clients
        ├── components/      # Shared components
        ├── pages/           # Student & admin pages
        └── types/           # TypeScript types
```

---

## 📜 Useful Scripts

**Backend** (`/backend`)
| Command | Description |
| --- | --- |
| `npm run start:dev` | Start in watch mode |
| `npm run build` | Build for production |
| `npm run start:prod` | Run the production build |
| `npm run migration:run` | Run database migrations |
| `npm run test` | Run unit tests |

**Frontend** (`/frontend`)
| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |

---

<div align="center">

### ⭐ If you like this project, give it a star!

</div>
