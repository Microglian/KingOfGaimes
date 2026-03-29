# Card Forge - Yu-Gi-Oh Card Creator

A full-stack web application for creating, editing, storing, searching, and exporting custom Yu-Gi-Oh-style cards with full visual customization. Cards are rendered using an authentic template image compositing system.

## Features

- **Template-based card rendering**: Cards are composed by layering official-style PNG template images (frame, border, attribute, stars, labels) for authentic appearance
- **All card types**: Normal/Effect/Ritual/Fusion/Synchro/Xyz/Link/Red/Token Monsters, Spells, Traps, Skill cards
- **Image support**: Load card art from URL or upload local files, with zoom and offset controls
- **High-resolution export**: Standard (813x1185) or Print Ready (1626x2370, nearest-neighbour upscaled templates)
- **Custom font support**: Uses custom card fonts (MatrixBoldCaps, MatrixBook style) when provided, with serif fallbacks
- **JSON import/export** for individual cards and entire collections
- **Card collection** with search, multi-filter (type, attribute, rarity, archetype, set code, type line), and pagination
- **Fullscreen preview**: Click the rendered card to view a high-resolution version
- **Save as New**: Duplicate existing cards to quickly create variants
- **Visual customization**: Name colour, overlay foil effects, rarity indicators

---

## Prerequisites

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
│   ├── public/
│   │   ├── templates/         # Card template PNG images (see Template Setup)
│   │   └── fonts/             # Custom card fonts (see Font Setup)
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
│   │       ├── constants.js         # Enums, defaults, template mappings
│   │       └── cardRenderer.js      # Template compositing engine
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env.example           # Frontend environment variables template (copy to .env)
└── README.md
```

---

## Template Setup

The card renderer composites cards by layering PNG template images. All template images must be placed in `frontend/public/templates/`.

### Template Dimensions
- All full-card templates: **813 x 1185 pixels**, RGBA PNG format
- Cropped star images: **55 x 55 pixels**, RGBA PNG

### Required Template Files

**Card Frames** (one per card type, transparent art window at position 100,219 size 613x613):
| Filename | Card Type |
|----------|-----------|
| `FrameNormal.png` | Normal Monster |
| `FrameEffect.png` | Effect Monster |
| `FrameFusion.png` | Fusion Monster |
| `FrameSynchro.png` | Synchro Monster |
| `FrameXyz.png` | Xyz Monster |
| `FrameRitual.png` | Ritual Monster |
| `FrameLink.png` | Link Monster |
| `FrameToken.png` | Token |
| `FrameSpell.png` | Spell Card |
| `FrameTrap.png` | Trap Card |
| `FrameRed.png` | Red Monster |
| `FrameSkill.png` | Skill Card |

**Card Border** (applied to all cards):
| Filename | Description |
|----------|-------------|
| `Border.png` | Outer card border |

**Attribute Icons** (813x1185, pre-positioned):
| Filename | Attribute |
|----------|-----------|
| `AttributeDivine.png` | DIVINE |
| `AttributeLight.png` | LIGHT |
| `AttributeDark.png` | DARK |
| `AttributeWind.png` | WIND |
| `AttributeWater.png` | WATER |
| `AttributeFire.png` | FIRE |
| `AttributeEarth.png` | EARTH |
| `AttributeSpell.png` | SPELL |
| `AttributeTrap.png` | TRAP |
| `AttributeSkill.png` | SKILL |

**Level/Rank Stars** (cropped, 55x55 individual stars):
| Filename | Use |
|----------|-----|
| `LevelStarCropped.png` | Level stars (right-aligned) |
| `RankStarCropped.png` | Rank stars (left-aligned, Xyz monsters) |

**Link Arrows** (813x1185, pre-positioned):
| Filename | Direction |
|----------|-----------|
| `LinkArrowUp.png` | Up |
| `LinkArrowUpRight.png` | Up-Right |
| `LinkArrowRight.png` | Right |
| `LinkArrowRightDown.png` | Right-Down |
| `LinkArrowDown.png` | Down |
| `LinkArrowDownLeft.png` | Down-Left |
| `LinkArrowLeft.png` | Left |
| `LinkArrowLeftUp.png` | Left-Up |

**Spell/Trap Type Labels** (813x1185, pre-positioned):
| Filename | Use |
|----------|-----|
| `SpellTypeBase.png` | Bracket label for typed Spells (contains symbol slot) |
| `TrapTypeBase.png` | Bracket label for typed Traps (contains symbol slot) |
| `SpellTypeUntyped.png` | Label for Normal Spells |
| `TrapTypeUntyped.png` | Label for Normal Traps |

**Spell/Trap Type Symbols** (813x1185, pre-positioned):
| Filename | Type |
|----------|------|
| `STTypeContinuous.png` | Continuous |
| `STTypeEquip.png` | Equip |
| `STTypeField.png` | Field |
| `STTypeRitual.png` | Ritual |
| `STTypeFusion.png` | Fusion |
| `STTypeQuick.png` | Quick-Play |
| `STTypeCounter.png` | Counter |

**ATK/DEF Elements** (813x1185, pre-positioned):
| Filename | Description |
|----------|-------------|
| `ATKDEFDiv.png` | Divider line between effect text and ATK/DEF |
| `ATKLabel.png` | "ATK/" label |
| `DEFLabel.png` | "DEF/" label |
| `LINKLabel.png` | LINK label (replaces DEF for Link monsters) |

### Rendering Layer Order

Templates are drawn in this order (back to front):
1. User card art image (in the 613x613 art window)
2. Card frame template
3. Attribute icon template
4. Level/Rank stars
5. Link arrows (Link monsters only)
6. Spell/Trap type label + symbol
7. ATK/DEF divider and labels (monsters only)
8. Card border (topmost template layer)
9. Overlay effects
10. All text (name, type line, description, stats, set code, archetypes)

---

## Font Setup

Place custom font files in `frontend/public/fonts/` for authentic Yu-Gi-Oh text rendering.

| Filename | Used For | Ideal Font |
|----------|----------|------------|
| `CardName.ttf` (or `.woff2`) | Card name text | Matrix Bold Small Caps |
| `CardType.ttf` (or `.woff2`) | Type line, stat labels | Matrix Bold Small Caps |
| `NormalText.ttf` (or `.woff2`) | Normal monster flavor text | Matrix Book (italic) |
| `EffectText.ttf` (or `.woff2`) | Effect descriptions | Matrix Book |

If font files are not present, the app gracefully falls back to system serif fonts (Palatino Linotype > Palatino > Georgia > serif).

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

- `MONGO_URL` -- MongoDB connection string. Change if your MongoDB runs on a different host/port.
- `DB_NAME` -- Name of the MongoDB database. Can be anything you like.
- `CORS_ORIGINS` -- Comma-separated list of allowed origins. Must include your frontend URL.

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

- `REACT_APP_BACKEND_URL` -- Points the frontend to your local backend. All API calls use this value.

> Remove or ignore `WDS_SOCKET_PORT` and `ENABLE_HEALTH_CHECK` -- these are only used in the hosted deployment environment.

### 5. Add template images and fonts

Copy your template PNG files into `frontend/public/templates/` (see **Template Setup** above for the complete file list and naming requirements).

Optionally, copy your font files (`.ttf` or `.woff2`) into `frontend/public/fonts/` (see **Font Setup** above).

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

### Card Art Image Handling

- **Art window**: 613x613 pixels at standard resolution (1226x1226 at print resolution)
- When an image is uploaded, it is scaled so its smallest dimension equals 1226px (the print resolution), using high-quality interpolation
- This 1226px master image is shrunk to 613px for the editor preview
- For print export, the full 1226px version is used directly (no upscaling = maximum quality)
- Use the **Zoom** and **X/Y Offset** sliders to position the art within the card window
- Rectangular images are not cropped -- the card frame naturally hides anything outside the art window

### Exporting Cards

- **PNG**: Click the **PNG** dropdown button and choose resolution:
  - Standard (813x1185) -- native template size
  - Print Ready (1626x2370) -- 2x nearest-neighbour upscaled templates, 1226x1226 card art
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

**Templates not rendering:**
- Ensure all required PNG files are in `frontend/public/templates/` with the exact filenames listed above
- File names are case-sensitive
- Templates must be 813x1185 pixels in RGBA PNG format
- Check the browser console for 404 errors on template image requests

**Custom fonts not applying:**
- Font files must be in `frontend/public/fonts/` named exactly `CardName.ttf` (or `.woff2`), `CardType.ttf`, `NormalText.ttf`, `EffectText.ttf`
- The app falls back to serif fonts if custom fonts are missing -- this is expected behaviour
- Clear your browser cache after adding font files

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

- **Frontend**: React 18, Tailwind CSS, Shadcn/UI, HTML5 Canvas (template compositing), Axios, React Router
- **Backend**: Python 3, FastAPI, Motor (async MongoDB driver), Pydantic, httpx
- **Database**: MongoDB
- **Fonts**: Custom card fonts (user-provided) with Palatino/Georgia serif fallbacks; UI uses Outfit, Manrope, JetBrains Mono
