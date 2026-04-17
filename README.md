# Tanya's PA — BTS-Themed Personal Assistant

A custom-built personal assistant featuring AI chat, task management, email drafting, meeting notes, research tools, and more — all with a BTS theme.

## Features

- **AI Chat** — Chat with GLM 4.7 using 7 BTS member personas or standard mode
- **Tasks** — Eisenhower Matrix (4-quadrant) task manager with drag-and-drop
- **Email Drafter** — AI-powered email generation with tone control
- **Meeting Notes** — Audio transcription + AI-structured notes
- **Research** — Structured AI research assistant
- **News Feed** — K-pop news aggregation
- **BA/PM Tools** — Status reports, user stories, RACI matrix, risk register, requirements, decision log
- **BTS Theme** — Dark purple & gold design with concert countdown timer

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS v4 + Framer Motion
- **Backend**: Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL 15
- **Auth**: JWT (bcrypt + jsonwebtoken)
- **AI**: GLM 4.7, Gemini 2.0 Flash, OpenAI Whisper, Tavily

## Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL 15+
- npm or yarn

### Installation

1. Clone and navigate:
```bash
cd "d:/Project/TD's Personal Assistant"
```

2. Install dependencies:
```bash
cd server && npm install
cd ../client && npm install
```

3. Set up environment:
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Set up database:
```bash
cd server
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
```

5. Run dev servers:
```bash
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client
cd client && npm run dev
```

6. Open http://localhost:5173

### Demo Accounts

- Email: `tanya.devgan@example.com` / Password: `BTS#Purple2025`
- Email: `td.assistant@example.com` / Password: `AssistantMode123`

## Docker Deployment

```bash
# Copy environment file
cp .env.example .env
# Add your API keys

# Start all services
docker-compose up -d

# Access at http://localhost:3000
```

## Production Deployment (Coolify)

1. Push code to GitHub
2. In Coolify, create new project → Docker Compose
3. Link repository
4. Set environment variables
5. Deploy

## API Keys Required

- **GLM 4.7** — Text generation (chat, email, research, BA tools)
- **Gemini** — Image generation (BTS images)
- **OpenAI** — Whisper transcription (meeting notes)
- **Tavily** — Web search & news feeds

## Project Structure

```
├── client/          # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── stores/
│   │   └── services/
│   ├── Dockerfile
│   └── nginx.conf
├── server/          # Express backend
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── services/
│   ├── prisma/
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

## License

MIT

---

Built with 💜 for Tanya Devgan
