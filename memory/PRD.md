# Card Forge - PRD

## Original Problem Statement
A web-based application for creating, editing, storing, searching, and exporting custom Yu-Gi-Oh-style cards with full customization. Uses an HTML5 Canvas-based template compositing engine to replicate exact card layouts from PNG template images.

## Core Architecture
- **Frontend**: React 18 + Tailwind CSS + Shadcn/UI + HTML5 Canvas template compositing
- **Backend**: FastAPI + Motor (async MongoDB) + Pydantic
- **Database**: MongoDB

## What's Been Implemented

### Phase 1 - MVP (Complete)
- Full CRUD backend API with optimized search/pagination
- Card editor with live canvas preview
- Image upload/URL loading with zoom/offset controls
- Collection gallery with search, filters, pagination
- PNG/JSON export and import
- Fullscreen high-res preview
- Dark mode theme (blues/teals/aquas)
- Documentation (README, FUNCTIONAL_SPEC)

### Phase 2 - Template Rendering (Complete - March 2026)
- Complete rewrite of cardRenderer.js to template-based compositing
- Cards composed by layering PNG template images (813x1185) for authentic appearance
- Layer order: user art → frame → attribute → stars → link arrows → spell/trap labels → ATK/DEF → border → overlays → text
- Art window: 613x613 square at (100,219), rendered at 1226x1226 for print quality
- Export: Standard 813x1185, Print-Ready 1626x2370 (2x nearest-neighbour templates)
- Dynamic font loading: CardName, CardType, NormalText, EffectText with serif fallbacks
- Added card types: Red Monster, Token
- Added spell subtype: Fusion
- Template infrastructure: frontend/public/templates/ and frontend/public/fonts/
- .env.example files for easy local setup
- README fully updated with template/font setup instructions

## Template Files Status
Currently uploaded templates:
- Frames: FrameNormal, FrameSpell, FrameTrap, FrameXyz, FrameToken, FrameSkill
- Other: Border, AttributeLight, LevelStarCropped, RankStarCropped
- Labels: SpellTypeBase, SpellTypeUntyped, STTypeQuick
- ATK/DEF: ATKDEFDiv, ATKLabel, DEFLabel
- Arrows: LinkArrowDown
- **User needs to add remaining**: FrameEffect, FrameFusion, FrameSynchro, FrameRitual, FrameLink, FrameRed, all remaining Attributes, Link Arrows, TrapTypeBase, TrapTypeUntyped, remaining STType symbols, LINKLabel

### Phase 3 - Font & Text Refinement (Complete - March 2026)
- Installed Matrix font family: Regular Small Caps (name, set code), Bold Small Caps (type line, stats, archetypes), Book (effect text)
- Card name (70px) and type line (29px) use horizontal squishing instead of font size reduction for long text
- Type line brackets `[]` rendered in serif fallback font (Matrix Bold doesn't have correct brackets)
- ATK/DEF uses template labels with dynamic shift for overflow; values in Matrix Bold Small Caps (31px) matching label height
- Set code 50% bigger (26px), vertically centered between art and desc box
- Archetypes 12% bigger (18px), wrapped in «» brackets, vertically centered between desc box bottom and card border
- Insert symbol buttons: «», ➊-➎, ㊀-㊈, plus original symbols
- All position fine-tuning: stars Y=171, name Y=96, set code Y=861 (middle baseline), archetype Y=1131 (middle baseline)

## Backlog
### P1
- Drag-to-reposition image art on canvas (click-and-drag in art window)
### P2
- Card template presets for common archetypes
- Batch operations (bulk delete/export)
- Undo/redo in editor
