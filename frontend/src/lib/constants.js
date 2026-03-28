export const CARD_TYPES = [
  { value: "normal_monster", label: "Normal Monster" },
  { value: "effect_monster", label: "Effect Monster" },
  { value: "ritual_monster", label: "Ritual Monster" },
  { value: "fusion_monster", label: "Fusion Monster" },
  { value: "synchro_monster", label: "Synchro Monster" },
  { value: "xyz_monster", label: "Xyz Monster" },
  { value: "link_monster", label: "Link Monster" },
  { value: "spell", label: "Spell" },
  { value: "trap", label: "Trap" },
  { value: "deckmaster", label: "Deckmaster" },
  { value: "skill", label: "Skill" },
];

export const ATTRIBUTES = [
  { value: "light", label: "LIGHT" },
  { value: "dark", label: "DARK" },
  { value: "fire", label: "FIRE" },
  { value: "water", label: "WATER" },
  { value: "earth", label: "EARTH" },
  { value: "wind", label: "WIND" },
  { value: "divine", label: "DIVINE" },
  { value: "spell", label: "SPELL" },
  { value: "trap", label: "TRAP" },
  { value: "skill", label: "SKILL" },
];

export const SPELL_TRAP_TYPES = [
  { value: "normal", label: "Normal" },
  { value: "quick_play", label: "Quick-Play" },
  { value: "continuous", label: "Continuous" },
  { value: "field", label: "Field" },
  { value: "equip", label: "Equip" },
  { value: "ritual", label: "Ritual" },
  { value: "counter", label: "Counter" },
];

export const RARITIES = [
  { value: "common", label: "Common" },
  { value: "uncommon", label: "Uncommon" },
  { value: "rare", label: "Rare" },
  { value: "super_rare", label: "Super Rare" },
  { value: "ultra_rare", label: "Ultra Rare" },
  { value: "secret_rare", label: "Secret Rare" },
  { value: "ultimate_rare", label: "Ultimate Rare" },
  { value: "holographic_rare", label: "Holographic Rare" },
];

export const LINK_ARROWS = [
  "top_left", "top", "top_right",
  "left", "", "right",
  "bottom_left", "bottom", "bottom_right",
];

export const LINK_ARROW_LABELS = {
  top_left: "TL", top: "T", top_right: "TR",
  left: "L", right: "R",
  bottom_left: "BL", bottom: "B", bottom_right: "BR",
};

export const OVERLAY_EFFECTS = [
  { value: "none", label: "No Effect" },
  { value: "super_foil", label: "Super Foil" },
  { value: "ultra_foil", label: "Ultra Foil" },
  { value: "secret_foil", label: "Secret Foil" },
  { value: "ultimate_foil", label: "Ultimate Foil" },
  { value: "holographic", label: "Holographic Shader" },
];

export const FRAME_COLORS = {
  normal_monster: "#C9B458",
  effect_monster: "#C46628",
  ritual_monster: "#3B6BA5",
  fusion_monster: "#7B4F9D",
  synchro_monster: "#CCCCCC",
  xyz_monster: "#1A1A1A",
  link_monster: "#1B6BA5",
  spell: "#1D9E74",
  trap: "#BC3A7C",
  deckmaster: "#4A3B6B",
  skill: "#4169AA",
};

export const FRAME_BORDER_COLORS = {
  normal_monster: "#8B7D3C",
  effect_monster: "#8B4513",
  ritual_monster: "#264573",
  fusion_monster: "#553570",
  synchro_monster: "#999999",
  xyz_monster: "#333333",
  link_monster: "#134D73",
  spell: "#146B4F",
  trap: "#852956",
  deckmaster: "#332A4B",
  skill: "#2D4A76",
};

export const ATTRIBUTE_COLORS = {
  light: "#FFD700",
  dark: "#8B00FF",
  fire: "#FF4500",
  water: "#1E90FF",
  earth: "#8B6914",
  wind: "#32CD32",
  divine: "#FFD700",
  spell: "#1D9E74",
  trap: "#BC3A7C",
  skill: "#4169AA",
};

export function isMonsterType(type) {
  return type.includes("monster") || type === "deckmaster";
}

export function isXyz(type) {
  return type === "xyz_monster";
}

export function isLink(type) {
  return type === "link_monster";
}

export function isSpellTrap(type) {
  return type === "spell" || type === "trap";
}

export function getDefaultCard() {
  return {
    name: "",
    type: "normal_monster",
    attribute: "light",
    typeLine: [],
    level: 4,
    rank: null,
    linkRating: null,
    linkArrows: [],
    atk: null,
    def: null,
    spellTrapType: null,
    description: "",
    imageUrl: "",
    imageOffset: { x: 0, y: 0 },
    imageCrop: { zoom: 1.0 },
    frameStyle: "auto",
    nameColor: "#FFFFFF",
    overlays: [],
    archetypes: [],
    setCode: "",
    setNumber: "",
    rarity: "common",
  };
}
