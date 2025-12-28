# Flusso - Personal Finance Tracker

A mobile-first personal finance tracking web application built with React + Firebase.

## Features

- 🔐 Email/Password Authentication
- 📊 Dashboard with Balance Overview
- 💳 Multi-Wallet Support (Cash, Bank, E-Wallet)
- 📝 Income/Expense Tracking
- 📈 Category-based Reports with Charts
- 📱 Mobile-First Responsive Design
- 🎨 Beautiful UI with Custom Color Palette

## Tech Stack

- **Frontend**: React 18 + Vite
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Charts**: Recharts
- **Deployment**: Docker + Nginx

## Quick Start

### Prerequisites

- Node.js 18+
- Firebase Project

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

### Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** → Email/Password
3. Enable **Firestore Database**
4. Add Firestore Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. Update `src/services/firebase.js` with your config

## Docker Deployment

### Build & Run

```bash
# Build and start
docker compose up -d --build

# View logs
docker compose logs -f

# Stop
docker compose down
```

The app will be available at `http://localhost`

### Production Build

```bash
# Build production image
docker build -t flusso .

# Run container
docker run -d -p 80:80 --name flusso flusso
```

## Project Structure

```
flusso/
├── src/
│   ├── components/      # Reusable UI components
│   ├── context/         # React Context (Auth)
│   ├── pages/           # Page components
│   ├── services/        # Firebase services
│   └── utils/           # Helper functions
├── Dockerfile           # Multi-stage Docker build
├── docker-compose.yml   # Docker Compose config
└── nginx.conf          # Nginx production config
```

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Cream | `#FFECC0` | Background |
| Peach | `#FFC29B` | Accent |
| Coral | `#F39F9F` | Secondary |
| Berry | `#B95E82` | Primary |

## License

MIT
# flusso
