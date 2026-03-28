# Yu-Gi-Oh Card Creator - PRD

## Architecture
- Frontend: React + Shadcn UI + HTML5 Canvas + Tailwind CSS
- Backend: FastAPI + Motor (async MongoDB)
- Database: MongoDB, No Authentication

## Implemented Features

### MVP
- Full CRUD API, search, import/export, image proxy
- Card Editor with form + live canvas preview
- Canvas renderer: type-specific frames, attributes, level/rank/link indicators
- Collection page with search/filter/sort/delete
- Dark theme (blues/teals/aquas)

### Iteration 1 - Bug Fixes
- Image loading, PNG/JSON exports, auto-render toggle, collection filters

### Iteration 2 - Features
- Save as New, card layout matching reference, image memory management,
  font size adjuster, thumbnails, per-card export, re-upload hints

### Iteration 3 - Performance & Print
- Fast collection loading (imageUrl stripped from list queries, 25KB/139ms for 11 cards)
- Searchable archetype/set code filter dropdowns (meta API endpoints)
- High-res PNG export (Standard/2x/3x print-ready)
- Larger collection thumbnails (168x245)

## Backlog
### P1
- Drag-to-reposition image on canvas
- Pagination for large collections
### P2
- Batch operations, card templates, undo/redo
