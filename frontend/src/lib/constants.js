export const CARD_TYPES = [
  { value: "normal_monster", label: "Normal Monster" },
  { value: "effect_monster", label: "Effect Monster" },
  { value: "ritual_monster", label: "Ritual Monster" },
  { value: "fusion_monster", label: "Fusion Monster" },
  { value: "synchro_monster", label: "Synchro Monster" },
  { value: "xyz_monster", label: "Xyz Monster" },
  { value: "link_monster", label: "Link Monster" },
  { value: "red_monster", label: "Red Monster" },
  { value: "token_monster", label: "Token" },
  { value: "spell", label: "Spell" },
  { value: "trap", label: "Trap" },
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
  { value: "fusion", label: "Fusion" },
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

// Template file mappings
export const FRAME_TEMPLATE_MAP = {
  normal_monster: "FrameNormal",
  effect_monster: "FrameEffect",
  ritual_monster: "FrameRitual",
  fusion_monster: "FrameFusion",
  synchro_monster: "FrameSynchro",
  xyz_monster: "FrameXyz",
  link_monster: "FrameLink",
  red_monster: "FrameRed",
  token_monster: "FrameToken",
  spell: "FrameSpell",
  trap: "FrameTrap",
  skill: "FrameSkill",
};

export const ATTRIBUTE_TEMPLATE_MAP = {
  divine: "AttributeDivine",
  light: "AttributeLight",
  dark: "AttributeDark",
  wind: "AttributeWind",
  water: "AttributeWater",
  fire: "AttributeFire",
  earth: "AttributeEarth",
  spell: "AttributeSpell",
  trap: "AttributeTrap",
  skill: "AttributeSkill",
};

export const LINK_ARROW_TEMPLATE_MAP = {
  top: "LinkArrowUp",
  top_right: "LinkArrowUpRight",
  right: "LinkArrowRight",
  bottom_right: "LinkArrowRightDown",
  bottom: "LinkArrowDown",
  bottom_left: "LinkArrowDownLeft",
  left: "LinkArrowLeft",
  top_left: "LinkArrowLeftUp",
};

export const ST_TYPE_TEMPLATE_MAP = {
  continuous: "STTypeContinuous",
  equip: "STTypeEquip",
  field: "STTypeField",
  ritual: "STTypeRitual",
  fusion: "STTypeFusion",
  quick_play: "STTypeQuick",
  counter: "STTypeCounter",
};

export function isMonsterType(type) {
  return type && type.includes("monster");
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

export function isSkill(type) {
  return type === "skill";
}

// Cards without type line, stars, or ATK/DEF
export function isNoStatCard(type) {
  return isSpellTrap(type) || isSkill(type);
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
    nameColor: "#000000",
    overlays: [],
    archetypes: [],
    setCode: "",
    setNumber: "",
    rarity: "common",
    descriptionFontSize: null,
    thumbnail: null,
  };
}
