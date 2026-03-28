# Yu-Gi-Oh Card Creator - PRD

## Architecture
- Frontend: React + Shadcn UI + HTML5 Canvas + Tailwind CSS
- Backend: FastAPI + Motor (async MongoDB)
- Database: MongoDB, No Authentication

## What's Been Implemented

### MVP (Initial)
- Full CRUD API, search with multi-param filters, import/export
- Card Editor: form panel + live canvas preview
- Canvas renderer with type-specific frames, attributes, level/rank/link indicators
- Collection page with search/filter/sort/delete
- Dark theme (blues/teals/aquas)

### Iteration 1 - Bug Fixes
- Fixed image loading, PNG/JSON exports, auto-render toggle
- Square art box, larger description font, collection filters

### Iteration 2 - Feature Update
- Save as New button for card duplication workflow
- Card layout matching real Yu-Gi-Oh reference (wider-than-tall art box, cream desc box with type line + text + ATK/DEF + separator)
- Image memory management: local uploads stay in memory, only filename stored in DB
- "Save image data" checkbox for optional full data persistence
- Manual font size adjuster with Auto fallback
- Thumbnail generation for fast collection display
- Re-upload hint for file-referenced images
- Per-card PNG/JSON export in collection
- Proper star rendering (red-backed gold stars)
- Robust download mechanism (synchronous toDataURL, Blob + createObjectURL)

## Prioritized Backlog
### P1
- High-res export toggle (3x scale for print)
- Drag-to-reposition image on canvas
- Pagination for large collections

### P2
- Batch operations (delete, export)
- Card template presets
- Undo/redo
