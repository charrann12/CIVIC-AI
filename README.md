# 🏙️ CivicAI

> **An AI-powered urban operations platform that enables intelligent civic issue management through agentic AI, predictive infrastructure analytics, and geospatial visualization.**

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Express](https://img.shields.io/badge/Express.js-black?logo=express)
![Google Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?logo=google)
![Vite](https://img.shields.io/badge/Vite-7-purple?logo=vite)

---

## 📌 Overview

CivicAI is a full-stack AI-powered platform designed to modernize urban infrastructure management. It enables citizens to report civic issues while providing municipal authorities with intelligent decision support through AI agents, predictive analytics, and scenario-based infrastructure forecasting.

Unlike traditional complaint portals, CivicAI leverages **Google Gemini** to analyze reported incidents, recommend operational actions, forecast infrastructure deterioration, and assist authorities in making proactive maintenance decisions.

---

## ✨ Key Features

### 👥 Citizen Portal
- Report civic issues with descriptions and images
- Upvote and verify community reports
- Comment on reported issues
- Track issue progress

### 🤖 Agentic AI Command Center
Specialized AI agents assist municipal authorities:

- **TriageBot** – Classifies issues and assesses severity
- **RouteBot** – Recommends optimal resource allocation
- **AuditBot** – Reviews compliance and operational quality
- **Coalition Mode** – Combines multiple AI perspectives for decision support

### 📊 Predictive Urban Intelligence
- Infrastructure Health Index
- AI-generated future scenario simulations
- Forecast infrastructure degradation
- Cascading failure analysis
- Preventive maintenance recommendations
- Estimated repair cost and savings
- High-risk zone identification

### 🗺️ Interactive Urban Map
- Live issue visualization
- AI heatmap overlay
- Risk zone monitoring
- Geographic issue distribution

### 🏢 Operations Dashboard
- Manage issue lifecycle
- Update issue status
- Monitor city-wide operations
- AI-assisted municipal workflows

---

# 🧠 AI Capabilities

Google Gemini powers:

- Intelligent issue classification
- Severity assessment
- Risk scoring
- Infrastructure health evaluation
- Predictive scenario simulation
- Preventive engineering recommendations
- Multi-agent decision support

---

# 🏗️ Architecture

```text
                    User
                      │
                      ▼
               React Frontend
                 (App.tsx)
                      │
 ┌───────────┬────────┼───────────┬────────────┐
 ▼           ▼        ▼           ▼            ▼
Citizen   VibeMap  OpsDesk  Predictive AI  Agentic AI
Portal
 │           │        │           │            │
 └───────────┴────────┴───────────┴────────────┘
                      │
                REST API Calls
                      │
                      ▼
               Express Backend
                (server.ts)
                      │
      ┌───────────────┴────────────────┐
      ▼                                ▼
 Google Gemini API               Local Data Store
```

---

# 🔄 Application Workflow

```text
Citizen reports an issue
            │
            ▼
Backend receives request
            │
            ▼
Gemini analyzes issue
            │
            ▼
Category • Severity • Risk Score
            │
            ▼
Issue stored
            │
            ▼
Municipal dashboard updated
            │
            ▼
AI Agents generate recommendations
            │
            ▼
Predictive engine forecasts future impact
```

---

# 🚀 Tech Stack

## Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Motion
- Lucide React

## Backend
- Express.js
- Node.js

## AI
- Google Gemini API

---

# 📈 Predictive Simulation

The Predictive Insights module performs AI-driven **scenario-based forecasting**.

Based on:

- Current unresolved issues
- Issue severity
- Infrastructure health
- High-risk zones
- Forecast duration

Gemini generates:

- Future infrastructure health
- Estimated repair costs
- Preventive savings
- Expected new incidents
- Cascading infrastructure failures
- Recommended preventive actions

> **Note:** Forecasts are AI-generated planning simulations and should not be interpreted as exact predictions.

---

# 📂 Project Structure

```text
src/
│
├── components/
│   ├── CitizenPortal.tsx
│   ├── OpsDesk.tsx
│   ├── PredictiveInsights.tsx
│   ├── AgenticCommandCenter.tsx
│   └── VibeMap.tsx
│
├── App.tsx
├── server.ts
├── types.ts
└── main.tsx
```

---

# ⚙️ Installation

```bash
git clone https://github.com/yourusername/civic-ai.git

cd civic-ai

npm install

npm run dev
```

---

# 🔑 Environment Variables

Create a `.env` file and add:

```env
GEMINI_API_KEY=your_api_key
```

---

# 🌟 Future Enhancements

- Multi-agent orchestration
- Real-time weather integration
- Google Maps integration
- Firebase authentication
- Firestore database
- Crew optimization engine
- Duplicate issue detection
- Live notification system

---

# 📜 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Sai Charan Nethi**

B.Tech Computer Science Engineering  
National Institute of Technology Durgapur

---

⭐ If you found this project interesting, consider giving it a star!
