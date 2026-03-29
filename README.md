# Card Forge - Yu-Gi-Oh Card Creator

A full-stack web application for creating, editing, storing, searching, and exporting custom Yu-Gi-Oh-style cards with full visual customization.

## Features

- **Card Editor** with live HTML5 Canvas preview matching real Yu-Gi-Oh card layout
- **All card types**: Normal/Effect/Ritual/Fusion/Synchro/Xyz/Link Monsters, Spells, Traps, Deckmaster, Skill
- **Image support**: Load from URL or upload local files, with zoom and offset controls
- **Export**: PNG at Standard (420x614), High Res 2x (840x1228), or Print Ready 3x (1260x1842)
- **JSON import/export** for individual cards and entire collections
- **Card collection** with search, multi-filter (type, attribute, rarity, archetype, set code, type line), and pagination
- **Fullscreen preview**: Click the rendered card to view a high-resolution version
- **Save as New**: Duplicate existing cards to quickly create variants
- **Visual customization**: Name colour, overlay foil effects, rarity indicators

---

## Prerequisites

Ensure the following are installed on your machine:

| Dependency | Version   | Install Guide |
|------------|-----------|---------------|
| **Python** | 3.10+     | [python.org](https://www.python.org/downloads/) |
| **Node.js**| 18+       | [nodejs.org](https://nodejs.org/) |
| **Yarn**   | 1.22+     | `npm install -g yarn` |
| **MongoDB**| 6.0+      | [mongodb.com/docs/manual/installation](https://www.mongodb.com/docs/manual/installation/) |

---

## Project Structure

```
card-forge/
├── backend/
│   ├── server.py              # FastAPI application (all API routes)
│   ├── requirements.txt       # Python dependencies
│   └── .env.example           # Backend environment variables template (copy to .env)
├── frontend/
│   ├── src/
│   │   ├── App.js             # Main React app with routing
│   │   ├── App.css            # Custom styles
│   │   ├── index.css          # Theme variables and base styles
│   │   ├── pages/
│   │   │   ├── CardEditorPage.jsx   # Card editor (form + canvas)
│   │   │   └── CollectionPage.jsx   # Card collection browser
│   │   ├── components/
│   │   │   ├── CardForm.jsx         # Card property form
│   │   │   ├── CardCanvas.jsx       # Canvas preview wrapper
│   │   │   ├── ImageControls.jsx    # Image URL/upload controls
│   │   │   ├── LinkArrowSelector.jsx# Link arrow grid picker
│   │   │   ├── TagInput.jsx         # Tag input for type line/archetypes
│   │   │   ├── SearchableDropdown.jsx # Searchable filter dropdown
│   │   │   └── ui/                  # Shadcn UI components
│   │   └── lib/
│   │       ├── api.js               # API client (axios)
│   │       ├── constants.js         # Enums, defaults, helpers
│   │       └── cardRenderer.js      # HTML5 Canvas rendering engine
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env.example           # Frontend environment variables template (copy to .env)
└── README.md
```

---

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repo-url> card-forge
cd card-forge
```

### 2. Start MongoDB

Make sure MongoDB is running locally on the default port (27017).

**macOS (Homebrew):**
```bash
brew services start mongodb-community
```

**Linux (systemd):**
```bash
sudo systemctl start mongod
```

**Windows:**
```bash
net start MongoDB
```

**Docker (alternative):**
```bash
docker run -d -p 27017:27017 --name cardforge-mongo mongo:6
```

Verify MongoDB is running:
```bash
mongosh --eval "db.runCommand({ ping: 1 })"
```

### 3. Set up the backend

```bash
cd backend
```

**Create a Python virtual environment (recommended):**
```bash
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
# or: venv\Scripts\activate     # Windows
```

**Install dependencies:**
```bash
pip install fastapi uvicorn motor python-dotenv pydantic httpx
```

> The full `requirements.txt` contains many packages from the build environment. The above are the only ones needed to run this application. If you prefer, you can install everything with `pip install -r requirements.txt`.

**Configure environment variables:**

Copy the example file and edit as needed:
```bash
cp .env.example .env
```

Default values in `.env.example`:
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="cardforge"
CORS_ORIGINS="http://localhost:3000"
```

- `MONGO_URL` — MongoDB connection string. Change if your MongoDB runs on a different host/port.
- `DB_NAME` — Name of the MongoDB database. Can be anything you like.
- `CORS_ORIGINS` — Comma-separated list of allowed origins. Must include your frontend URL.

**Start the backend server:**
```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

The API will be available at **http://localhost:8001**. Verify:
```bash
curl http://localhost:8001/api/
# Should return: {"message":"Yu-Gi-Oh Card Creator API"}
```

### 4. Set up the frontend

Open a **new terminal** and navigate to the frontend directory:

```bash
cd frontend
```

**Install dependencies:**
```bash
yarn install
```

**Configure environment variables:**

Copy the example file and edit as needed:
```bash
cp .env.example .env
```

Default value in `.env.example`:
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

- `REACT_APP_BACKEND_URL` — Points the frontend to your local backend. All API calls use this value.

> Remove or ignore `WDS_SOCKET_PORT` and `ENABLE_HEALTH_CHECK` — these are only used in the hosted deployment environment.

**Start the frontend dev server:**
```bash
yarn start
```

The app will open in your browser at **http://localhost:3000**.

---

## Usage

### Creating a Card

1. Open **http://localhost:3000** in your browser
2. Fill in card properties in the left panel:
   - **Basic Info**: Card name, type, attribute, type line tags
   - **Stats**: Level/Rank/Link Rating, ATK/DEF
   - **Card Image**: Paste a URL or upload a local file
   - **Card Text**: Effect description, insert symbols
   - **Visual**: Name colour, overlay effects, rarity
   - **Set & Archetype**: Set code, set number, archetype tags
3. The card preview renders automatically on the right (toggle auto-render off for manual control)
4. Click **Save** to store to the database

### Exporting Cards

- **PNG**: Click the **PNG** dropdown button and choose resolution:
  - Standard (420x614)
  - High Res 2x (840x1228)
  - Print Ready 3x (1260x1842)
- **JSON**: Click **JSON** to download the card data
- **Fullscreen**: Click the rendered card preview to see a high-resolution fullscreen view

### Managing Your Collection

1. Navigate to the **Collection** tab
2. Use the search bar and filter panel (Card Type, Attribute, Rarity, Archetype, Set Code, Type Line)
3. Each card has buttons for: Export PNG, Export JSON, Edit, Delete
4. Use **Export All** to download your entire collection as a JSON file
5. Use **Import** to load cards from a JSON file

### Duplicating Cards

1. Load an existing card in the editor (click Edit from the collection)
2. Make your changes
3. Click **Save as New** to create a copy instead of overwriting the original

---

## API Endpoints

All endpoints are prefixed with `/api`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/` | Health check |
| `POST` | `/api/cards` | Create a new card |
| `GET` | `/api/cards` | Search/list cards (supports `name`, `type`, `attribute`, `rarity`, `archetype`, `setCode`, `typeLine`, `sort`, `order`, `skip`, `limit` query params) |
| `GET` | `/api/cards/meta/archetypes` | List all distinct archetypes |
| `GET` | `/api/cards/meta/set-codes` | List all distinct set codes |
| `GET` | `/api/cards/export/all` | Export all cards as JSON |
| `POST` | `/api/cards/import` | Import cards from JSON array |
| `GET` | `/api/cards/:id` | Get a single card by ID |
| `PUT` | `/api/cards/:id` | Update a card |
| `DELETE` | `/api/cards/:id` | Delete a card |
| `GET` | `/api/proxy-image?url=...` | Proxy an external image (avoids CORS) |

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URL` | Yes | MongoDB connection string |
| `DB_NAME` | Yes | MongoDB database name |
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins (e.g. `http://localhost:3000`) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_BACKEND_URL` | Yes | Backend API base URL (e.g. `http://localhost:8001`) |

---

## Troubleshooting

**Backend won't start:**
- Check MongoDB is running: `mongosh --eval "db.runCommand({ ping: 1 })"`
- Ensure port 8001 is free: `lsof -i :8001`
- Check `backend/.env` exists and has correct `MONGO_URL` (copy from `.env.example` if missing)

**Frontend won't connect to backend:**
- Verify `REACT_APP_BACKEND_URL` in `frontend/.env` matches your backend URL
- Check backend CORS allows your frontend origin
- Restart the frontend after changing `.env` (env vars are baked at build time)

**Images don't load from URLs:**
- External images may be blocked by CORS. The app uses a proxy endpoint (`/api/proxy-image`) to work around this. Ensure the backend is running.

**PNG export fails:**
- If using cross-origin images, they must load through the proxy to avoid canvas tainting. Images uploaded as local files always work.

---

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, Shadcn/UI, HTML5 Canvas, Axios, React Router
- **Backend**: Python 3, FastAPI, Motor (async MongoDB driver), Pydantic, httpx
- **Database**: MongoDB
- **Fonts**: Outfit, Manrope, JetBrains Mono (loaded from Google Fonts)
