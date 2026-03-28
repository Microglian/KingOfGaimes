# Yu-Gi-Oh Card Creator - PRD

## Problem Statement
Web-based application for creating, editing, storing, searching, and exporting custom Yu-Gi-Oh-style cards with full customization.

## Architecture
- **Frontend**: React + Shadcn UI + HTML5 Canvas renderer + Tailwind CSS
- **Backend**: FastAPI (Python) + Motor (async MongoDB driver)
- **Database**: MongoDB
- **No Authentication** - Open access

## What's Been Implemented (March 2026)
### MVP (Initial)
- Full backend API: CRUD, search, import/export, image proxy
- Card Editor with form panel + live canvas preview
- Card renderer with type-specific frame colors, attribute icons, level/rank/link, ATK/DEF
- Collection page with search, delete, Export All, Import
- JSON import/export, PNG export
- Dark theme (blues/teals/aquas)

### Bug Fix Iteration 1
- Fixed image loading from URLs (proxy-first for CORS)
- Fixed PNG/JSON export (document.body.appendChild pattern)
- Fixed auto-render toggle (CardCanvas only depends on renderTrigger, not card)
- Made art box square (280x280)
- Increased description font size (14px base) with proper auto-scaling/re-wrapping
- Added archetype display on card canvas
- Added collection filters: archetype, set code, type line
- Added per-card PNG/JSON export in collection
- Fixed Export All download
- Made Import button visible via flex-wrap

## Prioritized Backlog
### P1
- High-resolution export toggle (2x/3x)
- Card image drag-to-reposition on canvas
- Pagination for large collections

### P2
- Card duplication
- Batch delete
- Card template presets
- Print-ready export (300 DPI)
