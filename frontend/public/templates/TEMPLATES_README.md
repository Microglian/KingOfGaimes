# Card Forge - Template Assets

This folder contains the PNG template images used to compose Yu-Gi-Oh cards.
All template images must be **813 x 1185 pixels** in RGBA PNG format (except the cropped star images).

## Required Files

### Card Frame Templates
| Filename | Description |
|----------|-------------|
| `FrameNormal.png` | Normal Monster frame |
| `FrameEffect.png` | Effect Monster frame |
| `FrameFusion.png` | Fusion Monster frame |
| `FrameSynchro.png` | Synchro Monster frame |
| `FrameXyz.png` | Xyz Monster frame |
| `FrameRitual.png` | Ritual Monster frame |
| `FrameLink.png` | Link Monster frame |
| `FrameToken.png` | Token Monster frame |
| `FrameSpell.png` | Spell Card frame |
| `FrameTrap.png` | Trap Card frame |
| `FrameRed.png` | Red Monster frame |
| `FrameSkill.png` | Skill Card frame |

### Card Border
| Filename | Description |
|----------|-------------|
| `Border.png` | Card outer border (used on all cards) |

### Attribute Icons (813x1185, pre-positioned)
| Filename | Description |
|----------|-------------|
| `AttributeDivine.png` | DIVINE attribute |
| `AttributeLight.png` | LIGHT attribute |
| `AttributeDark.png` | DARK attribute |
| `AttributeWind.png` | WIND attribute |
| `AttributeWater.png` | WATER attribute |
| `AttributeFire.png` | FIRE attribute |
| `AttributeEarth.png` | EARTH attribute |
| `AttributeSpell.png` | SPELL attribute |
| `AttributeTrap.png` | TRAP attribute |
| `AttributeSkill.png` | SKILL attribute |

### Level/Rank Stars (cropped, individual star images)
| Filename | Description |
|----------|-------------|
| `LevelStarCropped.png` | Level star (55x55) |
| `RankStarCropped.png` | Rank star (55x55) |

### Link Arrows (813x1185, pre-positioned)
| Filename | Description |
|----------|-------------|
| `LinkArrowUp.png` | Up arrow |
| `LinkArrowUpRight.png` | Up-Right arrow |
| `LinkArrowRight.png` | Right arrow |
| `LinkArrowRightDown.png` | Right-Down arrow |
| `LinkArrowDown.png` | Down arrow |
| `LinkArrowDownLeft.png` | Down-Left arrow |
| `LinkArrowLeft.png` | Left arrow |
| `LinkArrowLeftUp.png` | Left-Up arrow |

### Spell/Trap Type Labels (813x1185, pre-positioned)
| Filename | Description |
|----------|-------------|
| `SpellTypeBase.png` | Spell type bracket label (for typed Spells) |
| `TrapTypeBase.png` | Trap type bracket label (for typed Traps) |
| `SpellTypeUntyped.png` | Normal Spell label |
| `TrapTypeUntyped.png` | Normal Trap label |

### Spell/Trap Type Symbols (813x1185, pre-positioned)
| Filename | Description |
|----------|-------------|
| `STTypeContinuous.png` | Continuous symbol |
| `STTypeEquip.png` | Equip symbol |
| `STTypeField.png` | Field symbol |
| `STTypeRitual.png` | Ritual symbol |
| `STTypeFusion.png` | Fusion symbol |
| `STTypeQuick.png` | Quick-Play symbol |
| `STTypeCounter.png` | Counter symbol |

### ATK/DEF Elements (813x1185, pre-positioned)
| Filename | Description |
|----------|-------------|
| `ATKDEFDiv.png` | Divider line between effect text and ATK/DEF |
| `ATKLabel.png` | "ATK/" label |
| `DEFLabel.png` | "DEF/" label |
| `LINKLabel.png` | LINK label (replaces DEF for Link monsters) |

## Notes
- All 813x1185 templates are drawn at the same coordinates as the final card — they layer on top of each other.
- The art window in the frame templates is a 613x613 transparent square at position (100, 219).
- For print-ready exports, templates are scaled to 1626x2370 using nearest-neighbour interpolation.
