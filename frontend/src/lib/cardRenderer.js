import {
  FRAME_TEMPLATE_MAP, ATTRIBUTE_TEMPLATE_MAP, LINK_ARROW_TEMPLATE_MAP,
  ST_TYPE_TEMPLATE_MAP, isMonsterType, isXyz, isLink, isSpellTrap, isSkill, isNoStatCard,
} from "./constants";

// ─── Card dimensions (template native at 1x) ────────────────────────────────
const CARD_W = 813;
const CARD_H = 1185;

// ─── Art window (from FrameNormal alpha analysis) ────────────────────────────
const ART_X = 100;
const ART_Y = 219;
const ART_SIZE = 613; // Square: 613x613 at 1x, 1226x1226 at 2x

// ─── Description box (cream area in frame) ───────────────────────────────────
const DESC_X = 73;
const DESC_Y = 889;
const DESC_W = 668;
const DESC_H = 222;

// ─── Star row ────────────────────────────────────────────────────────────────
const STAR_IMG_SIZE = 55;
const STAR_Y_CENTER = 171;   // Was 173, moved up 2px
const STAR_ROW_LEFT = 86;
const STAR_ROW_WIDTH = 642;
const MAX_STARS = 13;

// ─── Text positions (at 1x) ─────────────────────────────────────────────────
const NAME_X = 57;
const NAME_Y_CENTER = 89;     // Was 96, moved up 7px
const NAME_MAX_W = 612;       // Was 640, reduced 28px to avoid attribute symbol

const SET_CODE_RIGHT_X = 735;
const SET_CODE_Y = 861;       // Centered between art bottom (832) and desc top (889)
const RARITY_LEFT_X = 73;     // Left-aligned, opposite side of set code

// Link monsters: move set code/rarity inward to avoid link arrow overlap
const LINK_SET_CODE_RIGHT_X = 659;
const LINK_RARITY_LEFT_X = 157;

// Rarity mark styling
const RARITY_MARKS = {
  uncommon:         { text: "U",   color: "#228B22" },
  rare:             { text: "R",   color: "#2266CC" },
  super_rare:       { text: "SR",  color: "#8844CC" },
  ultra_rare:       { text: "UR",  color: "#DAA520" },
  secret_rare:      { text: "ScR", color: "#CC2222" },
  ultimate_rare:    { text: "UtR", color: "#FF69B4" },
  holographic_rare: { text: "HLR", color: "#00CED1" },
};

const TYPE_LINE_X = 73;
const TYPE_LINE_Y = 915;
const TYPE_LINE_MAX_W = 650;

const EFFECT_X = 73;
const EFFECT_Y_MONSTER = 920;
const EFFECT_Y_SPELLTRAP = 897;
const EFFECT_W = 668;

// ATK/DEF: template labels + dynamic value text
const STAT_VALUE_Y = 1105;
const STAT_RIGHT_X = 741;     // Right edge of desc box
const ATK_LABEL_RIGHT = 507;  // Right edge of "ATK/" in template
const DEF_LABEL_LEFT = 600;   // Left edge of "DEF/" in template
const DEF_LABEL_RIGHT = 672;  // Right edge of "DEF/" in template
const STAT_VAL_GAP = 3;       // Gap between label and value
const STAT_SECTION_GAP = 12;  // Gap between ATK section and DEF section

const ARCHETYPE_RIGHT_X = 740;
const ARCHETYPE_Y_CENTER = 1136; // Centered between desc bottom (1111) and border (1150)

// ─── Font families ───────────────────────────────────────────────────────────
const FALLBACK_SERIF = "'Palatino Linotype', Palatino, Georgia, serif";
const FONT_NAME = `'CardName', ${FALLBACK_SERIF}`;        // Matrix Regular Small Caps
const FONT_TYPE = `'CardType', ${FALLBACK_SERIF}`;        // Matrix Bold Small Caps
const FONT_NORMAL_TEXT = `'NormalText', ${FALLBACK_SERIF}`;// Matrix Book (italic for normal monsters)
const FONT_EFFECT_TEXT = `'EffectText', ${FALLBACK_SERIF}`;// Matrix Book
const FONT_STAT = `'CardType', ${FALLBACK_SERIF}`;        // Matrix Bold Small Caps (ATK/DEF)
const FONT_SET_CODE = `'CardName', ${FALLBACK_SERIF}`;    // Matrix Regular Small Caps
const FONT_ARCHETYPE = `'CardType', ${FALLBACK_SERIF}`;   // Matrix Bold Small Caps
const FONT_BRACKET = FALLBACK_SERIF;                      // Fallback serif for [] brackets

// ─── Dynamic font loading (gracefully handles missing fonts) ─────────────────
let fontsLoaded = false;
const FONT_FILES = [
  { family: "CardName", file: "CardName" },
  { family: "CardType", file: "CardType" },
  { family: "NormalText", file: "NormalText" },
  { family: "EffectText", file: "EffectText" },
];

async function ensureFontsLoaded() {
  if (fontsLoaded) return;
  fontsLoaded = true;
  for (const { family, file } of FONT_FILES) {
    try {
      // Try .woff2 first, then .ttf
      let font;
      try {
        font = new FontFace(family, `url(/fonts/${file}.woff2)`);
        await font.load();
      } catch {
        font = new FontFace(family, `url(/fonts/${file}.ttf)`);
        await font.load();
      }
      document.fonts.add(font);
    } catch {
      // Font not available - fallback will be used
    }
  }
}

// ─── Template image cache ────────────────────────────────────────────────────
const templateCache = new Map();
const userImageCache = new Map();

function loadTemplateImage(name) {
  const url = `/templates/${name}.png`;
  if (templateCache.has(url)) return templateCache.get(url);
  const promise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
  templateCache.set(url, promise);
  return promise;
}

function loadUserImage(url, options = {}) {
  if (!url) return Promise.resolve(null);
  if (url.startsWith("file:")) return Promise.resolve(null);
  const cacheKey = url;
  if (userImageCache.has(cacheKey)) return Promise.resolve(userImageCache.get(cacheKey));
  return new Promise((resolve) => {
    if (url.startsWith("data:")) {
      const img = new Image();
      img.onload = () => { userImageCache.set(cacheKey, img); resolve(img); };
      img.onerror = () => resolve(null);
      img.src = url;
      return;
    }
    if (options.proxyUrl) {
      const proxyImg = new Image();
      proxyImg.crossOrigin = "anonymous";
      proxyImg.onload = () => { userImageCache.set(cacheKey, proxyImg); resolve(proxyImg); };
      proxyImg.onerror = () => {
        const directImg = new Image();
        directImg.crossOrigin = "anonymous";
        directImg.onload = () => { userImageCache.set(cacheKey, directImg); resolve(directImg); };
        directImg.onerror = () => resolve(null);
        directImg.src = url;
      };
      proxyImg.src = options.proxyUrl;
    } else {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { userImageCache.set(cacheKey, img); resolve(img); };
      img.onerror = () => resolve(null);
      img.src = url;
    }
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function getCardDimensions() {
  return { width: CARD_W, height: CARD_H };
}

export function clearImageCache() {
  userImageCache.clear();
}

/**
 * Render a card to a canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {object} card
 * @param {object} options - { scale: 1|2, proxyUrl, localImageData }
 *   scale=1: editor preview (813x1185)
 *   scale=2: print-ready (1626x2370, templates use nearest-neighbour)
 */
export async function renderCard(canvas, card, options = {}) {
  await ensureFontsLoaded();
  const scale = options.scale || 1;
  const cw = CARD_W * scale;
  const ch = CARD_H * scale;
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");

  // Clear to black
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cw, ch);

  // 1. Draw user art image (behind everything, in the art window)
  await drawUserArt(ctx, card, options, scale);

  // 2. Draw card frame template (has transparent art window)
  await drawTemplate(ctx, FRAME_TEMPLATE_MAP[card.type], scale);

  // 3. Draw attribute icon template
  await drawTemplate(ctx, ATTRIBUTE_TEMPLATE_MAP[card.attribute], scale);

  // 4. Draw level/rank stars
  await drawStars(ctx, card, scale);

  // 5. Draw link arrows (for link monsters)
  if (isLink(card.type) && card.linkArrows?.length > 0) {
    for (const arrow of card.linkArrows) {
      const templateName = LINK_ARROW_TEMPLATE_MAP[arrow];
      if (templateName) await drawTemplate(ctx, templateName, scale);
    }
  }

  // 6. Draw spell/trap/skill type labels
  await drawCardTypeLabel(ctx, card, scale);

  // 7. Draw ATK/DEF divider (for monsters only, not spell/trap/skill)
  if (!isNoStatCard(card.type) && isMonsterType(card.type)) {
    await drawTemplate(ctx, "ATKDEFDiv", scale);
  }

  // 8. Draw card border (on top of everything)
  await drawTemplate(ctx, "Border", scale);

  // 9. Draw overlay effects
  drawOverlay(ctx, card, cw, ch);

  // 10. Draw all text elements
  await drawAllText(ctx, card, scale);
}

// ─── Template drawing ────────────────────────────────────────────────────────

async function drawTemplate(ctx, templateName, scale) {
  if (!templateName) return;
  const img = await loadTemplateImage(templateName);
  if (!img) return;

  ctx.save();
  if (scale !== 1) {
    // Nearest-neighbour for template upscaling (exact 2x doubling)
    ctx.imageSmoothingEnabled = false;
  }
  ctx.drawImage(img, 0, 0, CARD_W * scale, CARD_H * scale);
  ctx.restore();
}

// ─── User art image ──────────────────────────────────────────────────────────

async function drawUserArt(ctx, card, options, scale) {
  const localData = options.localImageData;
  const imageUrl = localData || card.imageUrl;
  if (!imageUrl) {
    drawArtPlaceholder(ctx, scale);
    return;
  }

  try {
    const img = await loadUserImage(imageUrl, options);
    if (!img) {
      drawArtPlaceholder(ctx, scale, "Image could not be loaded");
      return;
    }

    const artTargetSize = ART_SIZE * scale; // 613 at 1x, 1226 at 2x
    const artX = ART_X * scale;
    const artY = ART_Y * scale;

    // Scale image so its smallest dimension = artTargetSize (1226 at 2x, 613 at 1x)
    const imgW = img.width;
    const imgH = img.height;
    const minDim = Math.min(imgW, imgH);
    const baseScale = artTargetSize / minDim;

    // Apply user zoom
    const zoom = (card.imageCrop?.zoom || 1) * baseScale;
    const drawW = imgW * zoom;
    const drawH = imgH * zoom;

    // Center in the art square, then apply user offset
    const offX = (card.imageOffset?.x || 0) * scale;
    const offY = (card.imageOffset?.y || 0) * scale;
    const drawX = artX + (artTargetSize - drawW) / 2 + offX;
    const drawY = artY + (artTargetSize - drawH) / 2 + offY;

    // Use high-quality smoothing for user images
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
  } catch {
    drawArtPlaceholder(ctx, scale, "Image error");
  }
}

function drawArtPlaceholder(ctx, scale, text) {
  const x = ART_X * scale;
  const y = ART_Y * scale;
  const size = ART_SIZE * scale;
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(x, y, size, size);
  if (text) {
    ctx.fillStyle = "#666";
    ctx.font = `${14 * scale}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + size / 2, y + size / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
}

// ─── Star drawing ────────────────────────────────────────────────────────────

async function drawStars(ctx, card, scale) {
  if (isNoStatCard(card.type)) return; // No stars for spell/trap/skill
  if (isLink(card.type)) return;

  const isXyzType = isXyz(card.type);
  const count = isXyzType ? Math.min(card.rank || 0, MAX_STARS) : Math.min(card.level || 0, MAX_STARS);
  if (count <= 0) return;

  const templateName = isXyzType ? "RankStarCropped" : "LevelStarCropped";
  const starImg = await loadTemplateImage(templateName);
  if (!starImg) return;

  const starSize = STAR_IMG_SIZE * scale;
  const slotWidth = (STAR_ROW_WIDTH * scale) / MAX_STARS;
  const rowLeft = STAR_ROW_LEFT * scale;
  const yCenter = STAR_Y_CENTER * scale;
  const yTop = yCenter - starSize / 2;

  ctx.save();
  // Use nearest-neighbour for star template scaling
  if (scale !== 1) {
    ctx.imageSmoothingEnabled = false;
  }

  for (let i = 0; i < count; i++) {
    let xCenter;
    if (isXyzType) {
      // Rank stars: left-aligned
      xCenter = rowLeft + slotWidth * i + slotWidth / 2;
    } else {
      // Level stars: right-aligned
      xCenter = rowLeft + STAR_ROW_WIDTH * scale - slotWidth * (count - i) + slotWidth / 2;
    }
    const xTop = xCenter - starSize / 2;
    ctx.drawImage(starImg, xTop, yTop, starSize, starSize);
  }
  ctx.restore();
}

// ─── Spell/Trap/Skill type labels ────────────────────────────────────────────

async function drawCardTypeLabel(ctx, card, scale) {
  // Skill cards: always use SkillTypeUntyped
  if (isSkill(card.type)) {
    await drawTemplate(ctx, "SkillTypeUntyped", scale);
    return;
  }

  if (!isSpellTrap(card.type)) return;

  const subtype = card.spellTrapType || "normal";

  if (subtype === "normal") {
    const untypedName = card.type === "spell" ? "SpellTypeUntyped" : "TrapTypeUntyped";
    await drawTemplate(ctx, untypedName, scale);
  } else {
    const baseName = card.type === "spell" ? "SpellTypeBase" : "TrapTypeBase";
    await drawTemplate(ctx, baseName, scale);

    const symbolName = ST_TYPE_TEMPLATE_MAP[subtype];
    if (symbolName) {
      await drawTemplate(ctx, symbolName, scale);
    }
  }
}

// ─── Overlay effects ─────────────────────────────────────────────────────────

function drawOverlay(ctx, card, cw, ch) {
  if (!card.overlays || card.overlays.length === 0) return;
  for (const overlay of card.overlays) {
    if (overlay === "none") continue;
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    if (overlay === "super_foil") {
      const g = ctx.createLinearGradient(0, 0, cw, ch);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.3, "rgba(255,255,255,0.08)");
      g.addColorStop(0.5, "rgba(200,200,255,0.12)");
      g.addColorStop(0.7, "rgba(255,255,255,0.08)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cw, ch);
    } else if (overlay === "ultra_foil") {
      const g = ctx.createLinearGradient(0, 0, cw, ch);
      g.addColorStop(0, "rgba(255,215,0,0)");
      g.addColorStop(0.25, "rgba(255,215,0,0.1)");
      g.addColorStop(0.5, "rgba(255,255,255,0.15)");
      g.addColorStop(0.75, "rgba(255,215,0,0.1)");
      g.addColorStop(1, "rgba(255,215,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cw, ch);
    } else if (overlay === "secret_foil") {
      for (let i = 0; i < 6; i++) {
        const g = ctx.createLinearGradient(0, i * (ch / 6), cw, (i + 1) * (ch / 6));
        const hue = (i * 60) % 360;
        g.addColorStop(0, `hsla(${hue},80%,60%,0)`);
        g.addColorStop(0.5, `hsla(${hue},80%,60%,0.08)`);
        g.addColorStop(1, `hsla(${(hue + 60) % 360},80%,60%,0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, cw, ch);
      }
    }
    ctx.restore();
  }
}

// ─── Text rendering ──────────────────────────────────────────────────────────

async function drawAllText(ctx, card, scale) {
  const s = scale;

  // Card name
  drawCardName(ctx, card, s);

  // Set code (right-aligned, between art and description)
  drawSetCode(ctx, card, s);

  // Type line
  drawTypeLine(ctx, card, s);

  // Effect/description text
  drawEffectText(ctx, card, s);

  // ATK/DEF values (only for monsters, not spell/trap/skill)
  if (!isNoStatCard(card.type) && isMonsterType(card.type)) {
    await drawStatValues(ctx, card, s);
  }

  // Archetypes (right-aligned below description box)
  drawArchetypes(ctx, card, s);
}

function drawCardName(ctx, card, s) {
  const name = card.name || "";
  if (!name) return;

  const x = NAME_X * s;
  const yCenter = NAME_Y_CENTER * s;
  const maxW = NAME_MAX_W * s;
  const fontSize = 70 * s; // 40% bigger than 50

  ctx.save();
  ctx.fillStyle = card.nameColor || "#000000";
  ctx.textBaseline = "middle";
  ctx.font = `${fontSize}px ${FONT_NAME}`;

  const measured = ctx.measureText(name).width;
  if (measured > maxW) {
    // Squish horizontally instead of reducing font size
    const scaleX = maxW / measured;
    ctx.translate(x, yCenter);
    ctx.scale(scaleX, 1);
    ctx.fillText(name, 0, 0);
  } else {
    ctx.fillText(name, x, yCenter);
  }
  ctx.restore();
}

function drawSetCode(ctx, card, s) {
  const setStr = [card.setCode, card.setNumber].filter(Boolean).join("-");
  const isLinkType = isLink(card.type);
  const y = SET_CODE_Y * s;
  const fontSize = 26 * s;
  const nameColor = card.nameColor || "#000000";

  const codeRightX = (isLinkType ? LINK_SET_CODE_RIGHT_X : SET_CODE_RIGHT_X) * s;
  const rarityLeftX = (isLinkType ? LINK_RARITY_LEFT_X : RARITY_LEFT_X) * s;

  // Draw set code (right-aligned, same color as name)
  if (setStr) {
    ctx.save();
    ctx.fillStyle = nameColor;
    ctx.font = `${fontSize}px ${FONT_SET_CODE}`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(setStr, codeRightX, y);
    ctx.restore();
  }

  // Draw rarity mark (left-aligned, with black outline)
  const rarityInfo = RARITY_MARKS[card.rarity];
  if (rarityInfo) {
    ctx.save();
    ctx.font = `bold ${fontSize}px ${FONT_SET_CODE}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    // Black outline
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3 * s;
    ctx.lineJoin = "round";
    ctx.strokeText(rarityInfo.text, rarityLeftX, y);
    // Colored fill
    ctx.fillStyle = rarityInfo.color;
    ctx.fillText(rarityInfo.text, rarityLeftX, y);
    ctx.restore();
  }
}

function drawTypeLine(ctx, card, s) {
  if (isNoStatCard(card.type)) return; // No type line for spell/trap/skill

  const parts = card.typeLine?.length > 0 ? card.typeLine : [];
  if (parts.length === 0) return;
  const innerText = parts.join(" / ");

  const x = TYPE_LINE_X * s;
  const y = TYPE_LINE_Y * s;
  const maxW = TYPE_LINE_MAX_W * s;
  const fontSize = 29 * s; // Was 26, +12%

  ctx.save();
  ctx.fillStyle = "#111";
  ctx.textBaseline = "alphabetic";

  // Measure total width: brackets in fallback font + inner text in Matrix Bold
  ctx.font = `bold ${fontSize}px ${FONT_BRACKET}`;
  const bracketLW = ctx.measureText("[").width;
  const bracketRW = ctx.measureText("]").width;
  ctx.font = `bold ${fontSize}px ${FONT_TYPE}`;
  const innerW = ctx.measureText(innerText).width;
  const totalW = bracketLW + innerW + bracketRW;

  if (totalW > maxW) {
    // Squish horizontally
    const scaleX = maxW / totalW;
    ctx.translate(x, y);
    ctx.scale(scaleX, 1);
    // Draw bracket in fallback font
    ctx.font = `bold ${fontSize}px ${FONT_BRACKET}`;
    ctx.fillText("[", 0, 0);
    const bLW = ctx.measureText("[").width;
    // Draw inner text in Matrix Bold
    ctx.font = `bold ${fontSize}px ${FONT_TYPE}`;
    ctx.fillText(innerText, bLW, 0);
    // Draw closing bracket in fallback font
    ctx.font = `bold ${fontSize}px ${FONT_BRACKET}`;
    ctx.fillText("]", bLW + ctx.measureText(innerText).width, 0);
  } else {
    // Draw bracket in fallback font
    let curX = x;
    ctx.font = `bold ${fontSize}px ${FONT_BRACKET}`;
    ctx.fillText("[", curX, y);
    curX += bracketLW;
    // Draw inner text in Matrix Bold
    ctx.font = `bold ${fontSize}px ${FONT_TYPE}`;
    ctx.fillText(innerText, curX, y);
    curX += innerW;
    // Draw closing bracket in fallback font
    ctx.font = `bold ${fontSize}px ${FONT_BRACKET}`;
    ctx.fillText("]", curX, y);
  }
  ctx.restore();
}

function drawEffectText(ctx, card, s) {
  const text = card.description;
  if (!text) return;

  const x = EFFECT_X * s;
  const maxW = EFFECT_W * s;

  const isMon = !isNoStatCard(card.type) && isMonsterType(card.type);
  const isSTrapOrSkill = isNoStatCard(card.type);

  // Spell/Trap/Skill: start at top of desc box (no type line, no ATK/DEF)
  // Monster: start below type line, reserve space for ATK/DEF
  const yStart = isSTrapOrSkill ? EFFECT_Y_SPELLTRAP * s : EFFECT_Y_MONSTER * s;
  const statReserve = isMon ? 50 * s : 5 * s;
  const maxH = (DESC_Y + DESC_H) * s - yStart - statReserve;

  const isNormalMonster = card.type === "normal_monster";
  const fontFamily = isNormalMonster ? FONT_NORMAL_TEXT : FONT_EFFECT_TEXT;
  const fontStyle = isNormalMonster ? "italic" : "normal";

  const manualSize = card.descriptionFontSize;
  const baseFontSize = (manualSize || 18) * s;

  ctx.save();
  ctx.fillStyle = "#111";
  wrapText(ctx, text, x, yStart, maxW, maxH, baseFontSize, fontStyle, fontFamily, !!manualSize);
  ctx.restore();
}

async function drawStatValues(ctx, card, s) {
  const y = STAT_VALUE_Y * s;
  const rightEdge = STAT_RIGHT_X * s;
  const fontSize = 37 * s; // Produces ~22px cap height to match template labels

  ctx.save();
  ctx.fillStyle = "#111";
  ctx.font = `bold ${fontSize}px ${FONT_STAT}`;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  const atkStr = card.atk != null ? String(card.atk) : "?";
  const isLinkType = isLink(card.type);
  const defStr = isLinkType
    ? (card.linkRating != null ? String(card.linkRating) : "?")
    : (card.def != null ? String(card.def) : "?");

  const atkValW = ctx.measureText(atkStr).width;
  const defValW = ctx.measureText(defStr).width;

  // Pad short values (< 4 digits) with one character width of right margin
  // Exception: link rating is never padded
  const padW = ctx.measureText("0").width;
  const defPad = (!isLinkType && defStr.length < 4) ? padW : 0;
  const atkPad = atkStr.length < 4 ? padW : 0;

  // Calculate dynamic layout (right to left)
  const valGap = STAT_VAL_GAP * s;
  const secGap = STAT_SECTION_GAP * s;

  // DEF value right-aligned at right edge (with padding for short values)
  const defValX = rightEdge - defValW - defPad;
  // DEF label positioned before DEF value
  const idealDefLabelRight = defValX - valGap;
  const defLabelShift = Math.min(0, (idealDefLabelRight / s) - DEF_LABEL_RIGHT);
  const actualDefLabelLeft = (DEF_LABEL_LEFT + defLabelShift) * s;

  // ATK value positioned before DEF label with gap (with padding for short values)
  const atkValX = actualDefLabelLeft - secGap - atkValW - atkPad;
  // ATK label positioned before ATK value
  const idealAtkLabelRight = atkValX - valGap;
  const atkLabelShift = Math.min(0, (idealAtkLabelRight / s) - ATK_LABEL_RIGHT);

  // Draw ATKLabel template with shift
  const atkLabelImg = await loadTemplateImage("ATKLabel");
  if (atkLabelImg) {
    ctx.imageSmoothingEnabled = (s === 1);
    if (s !== 1) ctx.imageSmoothingEnabled = false;
    ctx.drawImage(atkLabelImg, atkLabelShift * s, 0, CARD_W * s, CARD_H * s);
  }

  // Draw DEFLabel or LINKLabel template with shift
  const defLabelName = isLinkType ? "LINKLabel" : "DEFLabel";
  const defLabelImg = await loadTemplateImage(defLabelName);
  if (defLabelImg) {
    if (s !== 1) ctx.imageSmoothingEnabled = false;
    ctx.drawImage(defLabelImg, defLabelShift * s, 0, CARD_W * s, CARD_H * s);
  }

  // Draw ATK value text
  ctx.imageSmoothingEnabled = true;
  ctx.fillText(atkStr, atkValX, y);

  // Draw DEF value text
  ctx.fillText(defStr, defValX, y);

  ctx.restore();
}

function drawArchetypes(ctx, card, s) {
  if (!card.archetypes || card.archetypes.length === 0) return;

  const text = `\u00AB${card.archetypes.join("/")}\u00BB`; // «archetypes»
  const x = ARCHETYPE_RIGHT_X * s;
  const y = ARCHETYPE_Y_CENTER * s;

  ctx.save();
  ctx.fillStyle = card.nameColor || "#000000";
  ctx.font = `bold ${18 * s}px ${FONT_ARCHETYPE}`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ─── Text wrapping utility ───────────────────────────────────────────────────

function wrapText(ctx, text, x, y, maxW, maxH, baseFontSize, fontStyle, fontFamily, isManual) {
  if (!text) return;
  let fontSize = baseFontSize;
  const minFontSize = 10;

  if (isManual) {
    ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`;
    const lineH = fontSize * 1.25;
    const lines = computeLines(ctx, text, maxW);
    let curY = y + fontSize;
    for (const line of lines) {
      if (curY > y + maxH) break;
      ctx.fillText(line, x, curY, maxW);
      curY += lineH;
    }
    return;
  }

  // Auto-fit: find best font size
  while (fontSize >= minFontSize) {
    ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`;
    const lineH = fontSize * 1.25;
    const lines = computeLines(ctx, text, maxW);
    const totalH = lines.length * lineH;
    if (totalH <= maxH) {
      let curY = y + fontSize;
      for (const line of lines) {
        ctx.fillText(line, x, curY, maxW);
        curY += lineH;
      }
      return;
    }
    fontSize -= 0.5;
  }

  // At minimum font, draw what fits
  fontSize = minFontSize;
  ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`;
  const lineH = fontSize * 1.25;
  const lines = computeLines(ctx, text, maxW);
  let curY = y + fontSize;
  for (const line of lines) {
    if (curY > y + maxH) break;
    ctx.fillText(line, x, curY, maxW);
    curY += lineH;
  }
}

function computeLines(ctx, text, maxW) {
  const lines = [];
  const paragraphs = text.split("\n");
  for (const para of paragraphs) {
    if (para.trim() === "") { lines.push(""); continue; }
    const words = para.split(" ");
    let currentLine = "";
    for (const word of words) {
      const testLine = currentLine ? currentLine + " " + word : word;
      if (ctx.measureText(testLine).width > maxW && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
  }
  return lines;
}

// ─── Thumbnail generation ────────────────────────────────────────────────────

export function generateThumbnail(canvas) {
  const thumbCanvas = document.createElement("canvas");
  const tw = 168;
  const th = Math.round(tw * (CARD_H / CARD_W)); // ~245
  thumbCanvas.width = tw;
  thumbCanvas.height = th;
  const tCtx = thumbCanvas.getContext("2d");
  tCtx.imageSmoothingEnabled = true;
  tCtx.imageSmoothingQuality = "high";
  tCtx.drawImage(canvas, 0, 0, tw, th);
  return thumbCanvas.toDataURL("image/jpeg", 0.6);
}
