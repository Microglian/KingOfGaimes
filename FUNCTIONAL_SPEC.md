# Card Forge - Functional Specification

**Version:** 1.0
**Last Updated:** March 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Data Model](#3-data-model)
4. [Card Rendering Engine](#4-card-rendering-engine)
5. [User Interface](#5-user-interface)
6. [API Specification](#6-api-specification)
7. [Search and Filtering](#7-search-and-filtering)
8. [Image Handling](#8-image-handling)
9. [Export System](#9-export-system)
10. [Import System](#10-import-system)
11. [State Management](#11-state-management)
12. [Performance Considerations](#12-performance-considerations)
13. [Enumerated Values](#13-enumerated-values)

---

## 1. Overview

Card Forge is a web application that enables users to create, edit, store, search, and export custom Yu-Gi-Oh-style trading cards. The application provides a real-time canvas-based card renderer that produces output visually consistent with official Yu-Gi-Oh card layouts, and supports all major card types in the game.

### 1.1 Core Capabilities

- Create any Yu-Gi-Oh card variant (11 card types, 10 attributes, 7 spell/trap subtypes)
- Live in-browser card rendering via HTML5 Canvas
- Save and load cards from a persistent database with no data loss
- Search and filter large card collections with pagination
- Export cards as high-resolution PNG images (up to print-ready 3x)
- Import and export card data as JSON (individual or bulk)
- Fullscreen high-resolution card preview
- Card duplication via "Save as New"

### 1.2 Non-Goals (Current Version)

- User authentication or multi-user accounts
- Deck building or gameplay simulation
- Card game rule validation
- Animated card effects
- Server-side image storage (images are referenced by URL or loaded from local files at render time)

---

## 2. System Architecture

### 2.1 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 | UI framework |
| Styling | Tailwind CSS, Shadcn/UI | Component library and utility CSS |
| Rendering | HTML5 Canvas API | Card image generation |
| HTTP Client | Axios | Frontend-to-backend API calls |
| Routing | React Router v6 | Client-side navigation |
| Backend | FastAPI (Python) | REST API server |
| Database | MongoDB | Persistent card storage |
| DB Driver | Motor | Async MongoDB access from Python |
| Image Proxy | httpx | Server-side fetch of external images to avoid CORS |

### 2.2 Service Topology

```
Browser (port 3000)
  |
  |-- React SPA
  |     |-- Card Editor Page (/)
  |     |-- Collection Page (/collection)
  |
  |--> FastAPI Backend (port 8001)
         |-- /api/cards (CRUD + search)
         |-- /api/cards/meta/* (aggregations)
         |-- /api/cards/export/all
         |-- /api/cards/import
         |-- /api/proxy-image (CORS proxy)
         |
         |--> MongoDB (port 27017)
               |-- cards collection
```

### 2.3 Data Flow

1. User edits card properties in the form panel
2. On inactivity (800ms), the frontend triggers a canvas render
3. The Canvas API draws the card synchronously using the current card state
4. On save, card data (excluding large local image data by default) is sent to the backend
5. A thumbnail (168x245 JPEG) is generated from the canvas and included in the save payload
6. The backend stores the document in MongoDB
7. The collection page fetches card data without heavy `imageUrl` fields for fast loading

---

## 3. Data Model

### 3.1 Card Object Schema

```
Card {
  id:                  string         UUID v4, assigned server-side on creation
  name:                string         Card name displayed on the card (default: "")
  type:                string         One of CARD_TYPES enum (default: "normal_monster")
  attribute:           string         One of ATTRIBUTES enum (default: "light")
  typeLine:            string[]       Monster type tags, e.g. ["Dragon", "Effect"] (default: [])
  level:               int | null     Monster level, 0-13 (default: null)
  rank:                int | null     Xyz monster rank, 0-13 (default: null)
  linkRating:          int | null     Link monster rating, 1-8 (default: null)
  linkArrows:          string[]       Active link arrow directions (default: [])
  atk:                 int | null     Attack points (default: null; null renders as "?")
  def:                 int | null     Defence points (default: null; null renders as "?")
  spellTrapType:       string | null  Spell/Trap subtype (default: null)
  description:         string         Card effect or flavour text (default: "")
  imageUrl:            string         Image source: HTTP URL, "data:..." base64, or "file:filename" (default: "")
  imageOffset:         {x, y}         Pixel offset for image positioning (default: {x:0, y:0})
  imageCrop:           {zoom}         Zoom multiplier for image (default: {zoom:1.0})
  frameStyle:          string         Reserved for future use (default: "auto")
  nameColor:           string         Hex colour for the card name text (default: "#000000")
  overlays:            string[]       Visual overlay effects applied to the card (default: [])
  archetypes:          string[]       Archetype tags, e.g. ["Blue-Eyes", "Dragon"] (default: [])
  setCode:             string         Set identifier, e.g. "LOB" (default: "")
  setNumber:           string         Card number within set, e.g. "EN001" (default: "")
  rarity:              string         One of RARITIES enum (default: "common")
  descriptionFontSize: int | null     Manual font size override (7-24px); null = auto (default: null)
  thumbnail:           string | null  Base64 JPEG thumbnail (168x245px) for collection display (default: null)
  createdAt:           string         ISO 8601 UTC timestamp, set server-side
  updatedAt:           string         ISO 8601 UTC timestamp, updated server-side on every save
}
```

### 3.2 Conditional Field Logic

The card type determines which fields are relevant:

| Card Type | Level | Rank | Link Rating | Link Arrows | ATK | DEF | Spell/Trap Type |
|-----------|-------|------|-------------|-------------|-----|-----|-----------------|
| Normal Monster | Yes | - | - | - | Yes | Yes | - |
| Effect Monster | Yes | - | - | - | Yes | Yes | - |
| Ritual Monster | Yes | - | - | - | Yes | Yes | - |
| Fusion Monster | Yes | - | - | - | Yes | Yes | - |
| Synchro Monster | Yes | - | - | - | Yes | Yes | - |
| Xyz Monster | - | Yes | - | - | Yes | Yes | - |
| Link Monster | - | - | Yes | Yes | Yes | - | - |
| Spell | - | - | - | - | - | - | Yes |
| Trap | - | - | - | - | - | - | Yes |
| Deckmaster | Yes | - | - | - | Yes | Yes | - |
| Skill | - | - | - | - | - | - | - |

When the user changes card type, irrelevant fields are automatically reset to null/empty and hidden from the form.

### 3.3 Database Indexes

The following fields are indexed in MongoDB for efficient querying:

- `name` (text search with regex)
- `type` (exact match)
- `attribute` (exact match)
- `rarity` (exact match)
- `archetypes` (array, regex search)
- `setCode` (regex search)

### 3.4 List Query Optimisation

The card list endpoint (`GET /api/cards`) uses a MongoDB projection that **excludes** the `imageUrl` field entirely. This prevents large base64-encoded image data from being transferred when browsing the collection. Full card data including `imageUrl` is only fetched by the single-card endpoint (`GET /api/cards/:id`).

---

## 4. Card Rendering Engine

### 4.1 Canvas Configuration

- **Base dimensions:** 420 x 614 pixels (ratio ~0.684, matching real Yu-Gi-Oh card proportions of 59mm x 86mm)
- **Rendering engine:** HTML5 Canvas 2D context
- **Scale support:** 1x (standard), 2x (high res), 3x (print ready)
- **Fonts:** Outfit (headings/name), Manrope (body/description), loaded via Google Fonts CDN

### 4.2 Card Layout (pixel positions at 1x scale)

```
+--[420 x 614]-----------------------------+
|  BORDER (10px)                            |
|  +--------------------------------------+ |
|  | NAME BAR (y:12, h:40)        [ATTR]  | |  Card name left-aligned, attribute icon right
|  +--------------------------------------+ |
|  | LEVEL/RANK STARS (y:54, h:22)        | |  Right-aligned for monsters, left for Xyz
|  +--------------------------------------+ |
|  |                                      | |
|  |         ART BOX (y:78)               | |  376 x 308 px (wider than tall)
|  |         Padding: 22px each side      | |  Gold/frame-colour inner border
|  |                                      | |
|  +--------------------------------------+ |
|  | SET CODE (y: art_bottom+3)     right | |
|  +--------------------------------------+ |
|  | DESCRIPTION BOX (cream background)   | |
|  |   [Type Line] bold, auto-scale       | |  e.g. [Dragon/Normal] or [SPELL CARD FIELD]
|  |   ----------------------------------  | |
|  |   Effect/flavour text                | |  Auto-scaling font (14px base, min 7px)
|  |   Multi-line word wrap               | |  Or manual override (7-24px)
|  |   ----------------------------------  | |  Separator line (monsters only)
|  |   ATK/3000  DEF/2500          right  | |  Monsters only; Link shows ATK only
|  +--------------------------------------+ |
|  | ARCHETYPES (below box, small text)   | |
|  | RARITY SYMBOL                  right | |
|  +--------------------------------------+ |
|  | BOTTOM INFO (set code, small)        | |
|  +--------------------------------------+ |
+-------------------------------------------+
```

### 4.3 Frame Colours

Each card type renders with a distinct frame colour:

| Card Type | Frame Colour | Border Colour |
|-----------|-------------|---------------|
| Normal Monster | #C9B458 (gold) | #8B7D3C |
| Effect Monster | #C46628 (orange) | #8B4513 |
| Ritual Monster | #3B6BA5 (blue) | #264573 |
| Fusion Monster | #7B4F9D (purple) | #553570 |
| Synchro Monster | #CCCCCC (silver) | #999999 |
| Xyz Monster | #1A1A1A (black) | #333333 |
| Link Monster | #1B6BA5 (blue) | #134D73 |
| Spell | #1D9E74 (teal) | #146B4F |
| Trap | #BC3A7C (magenta) | #852956 |
| Deckmaster | #4A3B6B (dark purple) | #332A4B |
| Skill | #4169AA (steel blue) | #2D4A76 |

### 4.4 Attribute Icon Colours

| Attribute | Colour |
|-----------|--------|
| LIGHT | #FFD700 (gold) |
| DARK | #8B00FF (violet) |
| FIRE | #FF4500 (red-orange) |
| WATER | #1E90FF (blue) |
| EARTH | #8B6914 (brown) |
| WIND | #32CD32 (green) |
| DIVINE | #FFD700 (gold) |
| SPELL | #1D9E74 (teal) |
| TRAP | #BC3A7C (magenta) |
| SKILL | #4169AA (steel blue) |

### 4.5 Level Star Rendering

- **Normal/Effect/Ritual/Fusion/Synchro Monsters:** Gold five-pointed stars with red circular backing, **right-aligned** (stars fill from the right edge towards the left)
- **Xyz Monsters:** Dark stars with gold outline, **left-aligned**
- **Link Monsters:** Text label "LINK-N" in cyan

### 4.6 Description Text Engine

The description text renderer supports:

- **Auto-scaling:** Starting at 14px, the engine tries progressively smaller font sizes (down to 7px minimum) until the wrapped text fits within the available height. At each font size, text is **re-wrapped** to fill the full width, preventing narrow columns at small sizes.
- **Manual override:** User can set a fixed font size (7-24px) via a slider. In manual mode, text that overflows is clipped.
- **Word wrap:** Text is split on spaces with proper line breaking. Paragraphs (newline characters) are preserved.
- **Normal monster italic:** Normal monster descriptions render in italic (flavour text style).
- **Clipping:** A canvas clip rect is applied to the description box boundaries to prevent any overflow from rendering outside the box.

### 4.7 Overlay Effects

Visual overlays are rendered using canvas composite operations on top of the completed card:

| Overlay | Technique |
|---------|-----------|
| Super Foil | Linear gradient, `overlay` blend mode |
| Ultra Foil | Gold-tinted linear gradient, `overlay` blend mode |
| Secret Foil | Multi-band rainbow gradients, `overlay` blend mode |
| Ultimate Foil | Radial gradient, `soft-light` blend mode |
| Holographic | Rainbow linear gradient, `color-dodge` blend mode |

### 4.8 Link Arrows

For Link Monsters, directional arrow indicators are drawn at 8 positions around the art box. Active arrows are rendered as red triangles with gold outlines, rotated to point in the correct direction. The 8 positions are: top-left, top, top-right, left, right, bottom-left, bottom, bottom-right.

### 4.9 Thumbnail Generation

After rendering a card at 1x scale, a 168x245 pixel JPEG thumbnail is generated by drawing the canvas onto a smaller canvas. This thumbnail is stored in the database alongside the card data and used for fast collection page rendering without needing to re-render each card.

---

## 5. User Interface

### 5.1 Application Shell

- **Navigation bar:** Sticky top bar with "CARD FORGE" brand and two navigation links: Editor, Collection
- **Theme:** Dark mode with blue/teal/aqua accent colours
- **Fonts:** Outfit (headings), Manrope (body), JetBrains Mono (code/monospace)
- **Component library:** Shadcn/UI (Select, Slider, Dialog, ScrollArea, Tabs, Sheet, Sonner toasts)

### 5.2 Card Editor Page (Route: `/`)

The editor uses a two-panel layout:

**Left Panel: Form (380px fixed width, scrollable)**

The form is divided into collapsible sections:

1. **Basic Info** (expanded by default)
   - Card Name: text input
   - Card Type: dropdown (11 types)
   - Attribute: dropdown (10 attributes)
   - Spell/Trap Type: dropdown, visible only for spell/trap types (7 subtypes)
   - Type Line: tag input with add/remove, visible only for monster types

2. **Stats** (expanded by default)
   - Level: number input (0-13), visible for non-Xyz non-Link monsters
   - Rank: number input (0-13), visible only for Xyz monsters
   - Link Rating: number input (1-8), visible only for Link monsters
   - Link Arrows: 3x3 grid selector, visible only for Link monsters
   - ATK: number input, visible for all monsters
   - DEF: number input, visible for non-Link monsters

3. **Card Image** (expanded by default)
   - Image URL: text input for external image URLs
   - Choose File: local file upload button
   - Save Image Data to DB: checkbox (default unchecked)
   - Zoom slider: 0.5x to 3.0x
   - X Offset slider: -200 to +200 pixels
   - Y Offset slider: -200 to +200 pixels

4. **Card Text** (expanded by default)
   - Effect/Description: multi-line textarea
   - Insert Symbol: clickable symbol buttons (●, ★, ◆, ■, ▲, ♦, ①-⑤, ∞)
   - Font Size: slider (7-24px) with "Auto" reset button

5. **Visual** (collapsed by default)
   - Name Colour: colour picker + hex text input
   - Overlay Effect: dropdown (6 options)
   - Rarity: dropdown (8 options)

6. **Set & Archetype** (collapsed by default)
   - Set Code: text input
   - Set Number: text input
   - Archetypes: tag input with add/remove

**Action Bar (above form, wrapping):**
- Save / Update: saves card to database
- Save as New: visible only when editing an existing card; creates a copy
- New: resets form to default blank card
- PNG: dropdown with Standard / High Res 2x / Print Ready 3x
- JSON: exports current card as JSON file
- Import: file picker to import a card from JSON

**Re-upload Hint:** When a card is loaded from the database and its `imageUrl` is a `file:` reference (meaning the image was uploaded locally but not saved to the DB), a hint bar appears showing the original filename and prompting the user to re-upload.

**Right Panel: Card Preview (flexible width, centered)**

- Canvas displaying the rendered card at 1x scale (420x614 CSS pixels)
- Dot-grid background with subtle blue radial glow
- Drop shadow on the card for depth
- Hover scale effect (1.02x)
- **Click to fullscreen:** Clicking the card renders a 3x version and displays it in a fullscreen overlay with dark backdrop blur. Click anywhere or the close button to dismiss.
- Auto-render checkbox: when checked (default), card re-renders after 800ms of inactivity. When unchecked, a manual "Render" button appears.
- "Click card to view full resolution" hint text below the card

### 5.3 Collection Page (Route: `/collection`)

**Header:**
- "Collection" title with total card count
- Export All button: downloads entire collection as JSON
- Import button: file picker to import cards from JSON

**Search Bar:**
- Text input with search icon for name filtering (partial match, case-insensitive)
- Filters toggle button (highlights when filters are active)

**Filter Panel (expandable):**
- Card Type: Shadcn Select dropdown
- Attribute: Shadcn Select dropdown
- Rarity: Shadcn Select dropdown
- Sort By: Shadcn Select dropdown (Last Updated, Created, Name, Rarity)
- Archetype: searchable dropdown (fetches distinct values from DB, type to filter)
- Set Code: searchable dropdown (fetches distinct values from DB, type to filter)
- Type Line: text input (regex partial match)
- Clear All button

**Card Grid:**
- Responsive CSS grid: `repeat(auto-fill, minmax(200px, 1fr))` with 20px gap
- Each card tile shows:
  - Canvas preview (using saved thumbnail or 0.4x render fallback)
  - Card name (truncated)
  - Card type badge (coloured by frame colour)
  - Action buttons: Export PNG, Export JSON, Edit, Delete

**Pagination:**
- 24 cards per page
- Previous / Next buttons with disabled state at boundaries
- "Page X of Y" counter
- Auto-scrolls to top on page change
- Resets to page 1 when any filter changes

**Delete Confirmation:**
- Modal dialog with card name, Cancel and Delete buttons

### 5.4 Searchable Dropdown Component

Used for Archetype and Set Code filters. Features:
- Click to open dropdown panel
- Text search input at top with magnifying glass icon
- Scrollable list of options (max height 160px)
- Options filtered in real-time as user types
- Currently selected option highlighted in cyan
- Clear button (X) to deselect
- Click outside to close

---

## 6. API Specification

All endpoints are prefixed with `/api`. The backend runs on port 8001.

### 6.1 Health Check

```
GET /api/
Response: { "message": "Yu-Gi-Oh Card Creator API" }
```

### 6.2 Create Card

```
POST /api/cards
Content-Type: application/json
Body: CardCreate object (all card fields except id, createdAt, updatedAt)
Response: 201, CardResponse (full card with generated id and timestamps)
```

### 6.3 List / Search Cards

```
GET /api/cards
Query Parameters:
  name       string   Partial match, case-insensitive regex
  type       string   Exact match against card type enum
  attribute  string   Exact match against attribute enum
  rarity     string   Exact match against rarity enum
  archetype  string   Partial match within archetypes array, case-insensitive regex
  setCode    string   Partial match, case-insensitive regex
  typeLine   string   Partial match within typeLine array, case-insensitive regex
  sort       string   Field to sort by: name | createdAt | updatedAt | rarity (default: updatedAt)
  order      string   asc | desc (default: desc)
  skip       int      Pagination offset (default: 0)
  limit      int      Page size, 1-200 (default: 50)

Response: {
  cards: CardResponse[]    (imageUrl field EXCLUDED for performance)
  total: int               (total matching cards, for pagination)
}
```

### 6.4 Get Single Card

```
GET /api/cards/:id
Response: CardResponse (FULL card data including imageUrl)
404 if not found
```

### 6.5 Update Card

```
PUT /api/cards/:id
Content-Type: application/json
Body: CardUpdate object
Response: CardResponse (updated card)
404 if not found
```

### 6.6 Delete Card

```
DELETE /api/cards/:id
Response: { "message": "Card deleted", "id": "..." }
404 if not found
```

### 6.7 Get Distinct Archetypes

```
GET /api/cards/meta/archetypes
Response: string[]   (sorted alphabetically, up to 500)
```

Uses MongoDB aggregation: unwind archetypes array, group by value, sort, limit.

### 6.8 Get Distinct Set Codes

```
GET /api/cards/meta/set-codes
Response: string[]   (sorted alphabetically, up to 500, excludes empty strings)
```

### 6.9 Export All Cards

```
GET /api/cards/export/all
Response: CardResponse[]   (all cards, thumbnails EXCLUDED to reduce payload)
```

### 6.10 Import Cards

```
POST /api/cards/import
Content-Type: application/json
Body: CardCreate[]
Response: 201, CardResponse[]   (each card gets a new id and timestamps)
```

### 6.11 Image Proxy

```
GET /api/proxy-image?url=<encoded_url>
Response: StreamingResponse with original content-type
Cache-Control: public, max-age=86400
400 if fetch fails
```

Used by the frontend canvas renderer to load external images without CORS restrictions. Responses are cached by the browser for 24 hours.

---

## 7. Search and Filtering

### 7.1 Filter Types

| Filter | Method | Field | Matching |
|--------|--------|-------|----------|
| Name | Text input | `name` | Case-insensitive regex partial match |
| Card Type | Select dropdown | `type` | Exact match |
| Attribute | Select dropdown | `attribute` | Exact match |
| Rarity | Select dropdown | `rarity` | Exact match |
| Archetype | Searchable dropdown | `archetypes` (array) | Case-insensitive regex within array elements |
| Set Code | Searchable dropdown | `setCode` | Case-insensitive regex partial match |
| Type Line | Text input | `typeLine` (array) | Case-insensitive regex within array elements |

### 7.2 Sort Options

| Option | Field | Description |
|--------|-------|-------------|
| Last Updated | `updatedAt` | Most recently edited first (default) |
| Created | `createdAt` | Most recently created first |
| Name | `name` | Alphabetical |
| Rarity | `rarity` | By rarity string value |

### 7.3 Pagination

- Page size: 24 cards
- Implemented via `skip` and `limit` query parameters
- Total count returned separately for page calculation
- UI shows Previous/Next buttons and "Page X of Y"

### 7.4 Filter Combination

All active filters are combined with AND logic. For example, filtering by type=`spell` AND rarity=`rare` returns only cards matching both criteria.

### 7.5 Debouncing

Text-based filter changes (name, archetype typed manually, set code typed manually, type line) are debounced by 300ms to avoid excessive API calls while typing.

---

## 8. Image Handling

### 8.1 Image Sources

Cards support three image source types:

1. **External URL** (e.g. `https://example.com/dragon.png`)
   - Entered in the Image URL text field
   - Loaded via the image proxy to avoid CORS issues and canvas tainting
   - Stored as-is in the database

2. **Local file upload** (e.g. user selects `my_dragon.png` from their computer)
   - Read into memory as a base64 data: URL via FileReader
   - Stored in React state (`localImageData`) — **not** in the card's `imageUrl` field by default
   - The card's `imageUrl` field stores only a file reference: `file:my_dragon.png`
   - Image is available for rendering and export as long as the editor session is active

3. **Saved base64 data** (when "Save image data to DB" is checked)
   - The full data: URL is stored in the card's `imageUrl` field in the database
   - Allows the image to persist across sessions without re-uploading
   - Trade-off: significantly increases document size and save/load times

### 8.2 Image Positioning

- **Zoom:** Multiplier from 0.5x to 3.0x, applied uniformly to the image within the art box
- **X/Y Offset:** Pixel offset from -200 to +200, shifts the image within the art box
- The image is fitted to cover the art box (maintaining aspect ratio) before zoom and offset are applied
- A canvas clip rect prevents the image from rendering outside the art box

### 8.3 Image Loading Strategy

The canvas renderer uses the following priority for loading images:

1. `localImageData` (in-memory data: URL from current session file upload) — loaded directly, no CORS issues
2. Image proxy URL (for external HTTP URLs) — loaded via `/api/proxy-image` with `crossOrigin="anonymous"`, avoids canvas tainting
3. Direct URL (fallback if proxy fails) — may cause canvas tainting, preventing PNG export
4. `file:` references — not loadable; a placeholder "Image could not be loaded" is shown

Results are cached in a `Map` keyed by URL for the duration of the browser session.

### 8.4 Re-upload Flow

When a card is loaded from the database and its `imageUrl` begins with `file:`:
1. A hint bar appears in the editor showing the original filename
2. The card renders with a placeholder in the art box
3. The user can re-upload the same file via the Choose File button
4. Once uploaded, the image appears in the card and is available for rendering and export

---

## 9. Export System

### 9.1 PNG Export

Available from both the Editor and Collection pages.

**Editor (PNG dropdown menu):**
- **Standard (420x614):** Uses the already-rendered canvas via `canvas.toDataURL("image/png")`. Synchronous, fast.
- **High Res 2x (840x1228):** Renders to a temporary canvas at 2x scale, then exports.
- **Print Ready 3x (1260x1842):** Renders to a temporary canvas at 3x scale, then exports. Text and vector elements scale cleanly; raster image quality depends on source resolution.

**Collection (per-card):** Renders at 2x scale to a temporary canvas, then exports.

**Download mechanism:** Creates a temporary `<a>` element with `download` attribute, appends to `document.body`, triggers `click()`, and removes after 500ms.

### 9.2 JSON Export

**Single card (Editor):** Serialises the current card state as formatted JSON. File references (`file:...`) are cleared to empty string. Thumbnail data is excluded.

**Single card (Collection):** Same as above, from the stored card data.

**Export All (Collection):** Fetches all cards via `/api/cards/export/all` (which excludes thumbnails), serialises as a JSON array.

### 9.3 Fullscreen Preview

Clicking the rendered card in the Editor triggers:
1. A 3x scale render to a temporary canvas
2. The canvas is converted to a PNG data URL
3. A fullscreen overlay appears with the image centered on a dark blurred backdrop
4. Click anywhere or the ✕ button to dismiss

---

## 10. Import System

### 10.1 Single Card Import (Editor)

- User clicks Import and selects a `.json` file
- The file is parsed as JSON
- The parsed data is merged with default card values (`{ ...getDefaultCard(), ...importedData }`)
- The card ID is cleared (a new ID will be assigned on save)
- The form populates with the imported data and the canvas re-renders

### 10.2 Bulk Import (Collection)

- User clicks Import and selects a `.json` file
- The file is parsed; if it's a single object, it's wrapped in an array
- The array is sent to `POST /api/cards/import`
- Each card receives a new UUID and timestamps server-side
- The collection refreshes after import
- Archetype and set code dropdown options are refreshed

---

## 11. State Management

### 11.1 Editor State

| State Variable | Type | Purpose |
|---------------|------|---------|
| `card` | Object | Current card data being edited |
| `cardId` | string \| null | ID of the card being edited (null for new cards) |
| `autoRender` | boolean | Whether to auto-render on inactivity |
| `renderTrigger` | number | Incremented to trigger a canvas re-render |
| `localImageData` | string \| null | Base64 data URL of uploaded local image (not persisted) |
| `saveImageData` | boolean | Whether to include image data in DB saves |
| `saving` | boolean | Loading state for save operations |
| `showExportMenu` | boolean | PNG dropdown visibility |
| `fullscreenPreview` | string \| null | Data URL for fullscreen overlay (null = hidden) |

### 11.2 Auto-Render Mechanism

- A ref (`autoRenderRef`) tracks the current auto-render preference
- On any card field change, if auto-render is enabled, a 800ms debounce timer starts
- When the timer fires, `renderTrigger` is incremented
- The `CardCanvas` component watches only `renderTrigger` (not the card object) to avoid unwanted re-renders
- The canvas reads the latest card data from a ref at render time

### 11.3 Collection State

| State Variable | Type | Purpose |
|---------------|------|---------|
| `cards` | Array | Current page of cards |
| `total` | number | Total matching cards across all pages |
| `filters` | Object | Current filter values |
| `page` | number | Current page index (0-based) |
| `showFilters` | boolean | Filter panel visibility |
| `deleteTarget` | Object \| null | Card pending deletion (null = dialog hidden) |
| `archetypeOptions` | string[] | Distinct archetypes for dropdown |
| `setCodeOptions` | string[] | Distinct set codes for dropdown |

---

## 12. Performance Considerations

### 12.1 Collection Loading

- The list endpoint excludes `imageUrl` from the MongoDB projection, preventing multi-megabyte base64 strings from being transferred
- Thumbnails (168x245 JPEG at 60% quality, typically 2-5KB each) are stored in the card document and used for collection display
- Cards without thumbnails fall back to a 0.4x scale canvas render (no image, since imageUrl is not available in list data)
- Page size of 24 limits the number of cards rendered simultaneously

### 12.2 Image Caching

- The canvas renderer maintains an in-memory `Map` cache of loaded `Image` objects keyed by URL
- Subsequent renders of the same card reuse cached images without network requests
- The cache is cleared when creating a new card or importing

### 12.3 Render Debouncing

- Auto-render is debounced by 800ms of inactivity to avoid rendering on every keystroke
- Each render call increments a render ID; stale renders (where a newer render was triggered) are discarded on completion

### 12.4 Meta Endpoint Caching

- Archetype and set code lists are fetched once on collection page mount
- They are refreshed after imports and deletions (which may change the available values)

---

## 13. Enumerated Values

### 13.1 Card Types

| Value | Display Label |
|-------|--------------|
| `normal_monster` | Normal Monster |
| `effect_monster` | Effect Monster |
| `ritual_monster` | Ritual Monster |
| `fusion_monster` | Fusion Monster |
| `synchro_monster` | Synchro Monster |
| `xyz_monster` | Xyz Monster |
| `link_monster` | Link Monster |
| `spell` | Spell |
| `trap` | Trap |
| `deckmaster` | Deckmaster |
| `skill` | Skill |

### 13.2 Attributes

`light`, `dark`, `fire`, `water`, `earth`, `wind`, `divine`, `spell`, `trap`, `skill`

### 13.3 Spell/Trap Subtypes

`normal`, `quick_play`, `continuous`, `field`, `equip`, `ritual`, `counter`

### 13.4 Rarities

| Value | Display Label | Indicator |
|-------|--------------|-----------|
| `common` | Common | (none) |
| `uncommon` | Uncommon | U |
| `rare` | Rare | R |
| `super_rare` | Super Rare | SR |
| `ultra_rare` | Ultra Rare | UR |
| `secret_rare` | Secret Rare | ScR |
| `ultimate_rare` | Ultimate Rare | UtR |
| `holographic_rare` | Holographic Rare | HgR |

### 13.5 Link Arrow Directions

`top_left`, `top`, `top_right`, `left`, `right`, `bottom_left`, `bottom`, `bottom_right`

### 13.6 Overlay Effects

`none`, `super_foil`, `ultra_foil`, `secret_foil`, `ultimate_foil`, `holographic`

### 13.7 Insertable Symbols

`●`, `★`, `◆`, `■`, `▲`, `♦`, `①`, `②`, `③`, `④`, `⑤`, `∞`
