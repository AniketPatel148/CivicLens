# 🏘️ Neighborhood Issue Reporter

AI-powered civic issue reporting. Snap a photo → get instant classification → see it on the map.

**Built for TidalHack 2026** | [Demo Video](#) | [Live Site](#)

## ✨ Features

- 📷 **Photo Upload** — Snap or upload an image of any neighborhood issue
- 🤖 **AI Classification** — Featherless.ai vision model identifies issue type
- 📝 **Smart Summaries** — Google Gemini generates human-readable summaries
- 🗺️ **Live Map** — See all reported issues on an interactive map
- 🎯 **Auto-Routing** — Each report is routed to the appropriate city department

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite |
| Backend | Express.js |
| Database | MongoDB Atlas |
| Vision AI | Featherless.ai |
| Language AI | Google Gemini |
| Maps | Leaflet + OpenStreetMap |
| Hosting | DigitalOcean App Platform |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- API keys for Featherless.ai and Google Gemini

### Setup

```bash
# Clone the repo
git clone https://github.com/your-username/neighborhood-issue-reporter.git
cd neighborhood-issue-reporter

# Install all dependencies
npm run install:all

# Copy environment template
cp server/.env.example server/.env
# Edit server/.env with your API keys

# Seed demo data (optional)
npm run seed

# Start development servers
npm run dev
```

App runs at `http://localhost:5173`

## 🔑 Environment Variables

Create `server/.env`:

```bash
MONGODB_URI=mongodb+srv://...
FEATHERLESS_API_KEY=fl_...
FEATHERLESS_BASE_URL=https://api.featherless.ai/v1
FEATHERLESS_MODEL=llava-1.5-7b-hf
GEMINI_API_KEY=AIza...
PORT=3001
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports` | Create new report |
| GET | `/api/reports` | List reports (supports `?bbox=`) |
| GET | `/api/reports/:id` | Get single report |
| PATCH | `/api/reports/:id/status` | Update status |

## 🏆 Sponsor Integrations

- **Google Gemini** — Multimodal summary generation
- **MongoDB Atlas** — Report storage with geospatial queries
- **DigitalOcean** — App Platform deployment
- **Featherless.ai** — Serverless vision inference

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.jsx         # Main app
│   │   └── index.css       # Styles
│   └── vite.config.js
├── server/                 # Express backend
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   ├── services/           # AI service integrations
│   └── scripts/            # Seed scripts
└── package.json            # Root scripts
```

## 👥 Team

Built with ☕ by RevRage

---

*"Turn your phone into a 'fix-it' lens: one snap, and AI tells the city what's broken—and why it matters."*
