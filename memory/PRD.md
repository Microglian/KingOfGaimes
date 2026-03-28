# Yu-Gi-Oh Card Creator - PRD

## Problem Statement
Web-based application for creating, editing, storing, searching, and exporting custom Yu-Gi-Oh-style cards with full customization.

## Architecture
- **Frontend**: React + Shadcn UI + HTML5 Canvas renderer + Tailwind CSS
- **Backend**: FastAPI (Python) + Motor (async MongoDB driver)
- **Database**: MongoDB
- **No Authentication** - Open access

## User Personas
- Yu-Gi-Oh card game fans wanting to create custom cards
- Card game designers prototyping card ideas
- Artists creating card art mockups

## Core Requirements
- Full card creation with all Yu-Gi-Oh card types (Normal/Effect/Ritual/Fusion/Synchro/Xyz/Link monsters, Spells, Traps)
- Canvas-based live card rendering with accurate layout
- Save/load cards from MongoDB
- Search & filter with multi-parameter queries
- Export as PNG, JSON import/export
- Image URL/file upload with zoom/offset controls

## What's Been Implemented (March 2026)
- Full backend API: CRUD, search, import/export, image proxy
- Card Editor page with form panel + live canvas preview
- Card renderer with frame colors, attribute icons, level/rank/link stars, type line, description, ATK/DEF
- Collection page with search, filters, sort, delete
- JSON import/export, PNG export
- Dark theme (blues/teals/aquas)
- Auto-render with inactivity timer
- Conditional fields (type-specific inputs)
- Symbol insertion for card text
- Tag inputs for type line and archetypes
- Overlay effects (foil shaders)
- MongoDB indexes for efficient search

## Prioritized Backlog
### P0 (Critical)
- None remaining

### P1 (High Priority)
- High-resolution export option (2x/3x scale)
- Card image drag-to-reposition (mouse drag on canvas)
- Better card art loading with proxy fallback

### P2 (Nice to Have)
- Card duplication feature
- Pagination for large collections
- Batch delete operations
- Card template presets
- Print-ready export (300 DPI)

## Next Tasks
- Add high-resolution export toggle
- Implement canvas-based image drag positioning
- Add card duplication in collection
- Add pagination for collection page
