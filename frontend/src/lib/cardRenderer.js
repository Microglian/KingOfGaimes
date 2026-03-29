import {
  FRAME_TEMPLATE_MAP, ATTRIBUTE_TEMPLATE_MAP, LINK_ARROW_TEMPLATE_MAP,
  ST_TYPE_TEMPLATE_MAP, isMonsterType, isXyz, isLink, isSpellTrap,
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
const DESC_Y = 893;
const DESC_W = 668;
const DESC_H = 210;

// ─── Star row ────────────────────────────────────────────────────────────────
const STAR_IMG_SIZE = 55;
const STAR_Y_CENTER = 160;
const STAR_ROW_LEFT = ART_X;
const STAR_ROW_WIDTH = ART_SIZE;
const MAX_STARS = 13;

// ─── Text positions (at 1x) ─────────────────────────────────────────────────
const NAME_X = 57;
const NAME_Y_CENTER = 70;
const NAME_MAX_W = 640;

const SET_CODE_RIGHT_X = 735;
const SET_CODE_Y = 858;

const TYPE_LINE_X = 73;
const TYPE_LINE_Y = 915;
const TYPE_LINE_MAX_W = 650;

const EFFECT_X = 73;
const EFFECT_Y_START = 938;
const EFFECT_W = 668;

const ATK_VALUE_X = 530;
const DEF_VALUE_X = 685;
const STAT_VALUE_Y = 1090;

const ARCHETYPE_RIGHT_X = 740;
const ARCHETYPE_Y = 1140;

// ─── Font families ───────────────────────────────────────────────────────────
const FALLBACK_SERIF = "'Palatino Linotype', Palatino, Georgia, serif";
const FONT_NAME = `'CardName', ${FALLBACK_SERIF}`;
const FONT_TYPE = `'CardType', ${FALLBACK_SERIF}`;
const FONT_NORMAL_TEXT = `'NormalText', ${FALLBACK_SERIF}`;
const FONT_EFFECT_TEXT = `'EffectText', ${FALLBACK_SERIF}`;
const FONT_STAT = `'CardType', ${FALLBACK_SERIF}`;

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

  // 6. Draw spell/trap type labels
  await drawSpellTrapType(ctx, card, scale);

  // 7. Draw ATK/DEF divider and labels (for monsters)
  if (isMonsterType(card.type) && !isSpellTrap(card.type)) {
    await drawTemplate(ctx, "ATKDEFDiv", scale);
    await drawTemplate(ctx, "ATKLabel", scale);
    if (isLink(card.type)) {
      await drawTemplate(ctx, "LINKLabel", scale);
    } else {
      await drawTemplate(ctx, "DEFLabel", scale);
    }
  }

  // 8. Draw card border (on top of everything)
  await drawTemplate(ctx, "Border", scale);

  // 9. Draw overlay effects
  drawOverlay(ctx, card, cw, ch);

  // 10. Draw all text elements
  drawAllText(ctx, card, scale);
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
  if (isSpellTrap(card.type)) return;
  if (isLink(card.type)) return; // Link monsters don't have stars

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

// ─── Spell/Trap type ─────────────────────────────────────────────────────────

async function drawSpellTrapType(ctx, card, scale) {
  if (!isSpellTrap(card.type)) return;

  const subtype = card.spellTrapType || "normal";

  if (subtype === "normal") {
    // Normal Spell/Trap: use the untyped label
    const untypedName = card.type === "spell" ? "SpellTypeUntyped" : "TrapTypeUntyped";
    await drawTemplate(ctx, untypedName, scale);
  } else {
    // Typed Spell/Trap: draw the base label + type symbol
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

function drawAllText(ctx, card, scale) {
  const s = scale;

  // Card name
  drawCardName(ctx, card, s);

  // Set code (right-aligned, between art and description)
  drawSetCode(ctx, card, s);

  // Type line
  drawTypeLine(ctx, card, s);

  // Effect/description text
  drawEffectText(ctx, card, s);

  // ATK/DEF values
  if (isMonsterType(card.type) && !isSpellTrap(card.type)) {
    drawStatValues(ctx, card, s);
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
  let fontSize = 50 * s;

  ctx.save();
  ctx.fillStyle = card.nameColor || "#000000";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${fontSize}px ${FONT_NAME}`;

  // Shrink font if name is too wide
  let measured = ctx.measureText(name).width;
  if (measured > maxW) {
    fontSize = Math.max(20 * s, fontSize * (maxW / measured));
    ctx.font = `bold ${fontSize}px ${FONT_NAME}`;
  }

  ctx.fillText(name, x, yCenter, maxW);
  ctx.restore();
}

function drawSetCode(ctx, card, s) {
  const setStr = [card.setCode, card.setNumber].filter(Boolean).join("-");
  if (!setStr) return;

  ctx.save();
  ctx.fillStyle = "#111";
  ctx.font = `${14 * s}px ${FONT_EFFECT_TEXT}`;
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(setStr, SET_CODE_RIGHT_X * s, SET_CODE_Y * s);
  ctx.restore();
}

function drawTypeLine(ctx, card, s) {
  let typeText = "";
  if (isSpellTrap(card.type)) {
    // For spell/trap, the type is rendered via template images, not text
    // But we could add the bracket text if no template is available
    return;
  }

  // Monster type line: [Dragon/Xyz/Pendulum/Effect]
  const parts = card.typeLine?.length > 0 ? card.typeLine : [];
  if (parts.length === 0) return;
  typeText = `[${parts.join(" / ")}]`;

  const x = TYPE_LINE_X * s;
  const y = TYPE_LINE_Y * s;
  const maxW = TYPE_LINE_MAX_W * s;
  let fontSize = 22 * s;

  ctx.save();
  ctx.fillStyle = "#111";
  ctx.font = `bold ${fontSize}px ${FONT_TYPE}`;
  ctx.textBaseline = "alphabetic";

  // Shrink if too wide
  const measured = ctx.measureText(typeText).width;
  if (measured > maxW) {
    fontSize = Math.max(12 * s, fontSize * (maxW / measured));
    ctx.font = `bold ${fontSize}px ${FONT_TYPE}`;
  }
  ctx.fillText(typeText, x, y, maxW);
  ctx.restore();
}

function drawEffectText(ctx, card, s) {
  const text = card.description;
  if (!text) return;

  const x = EFFECT_X * s;
  const yStart = EFFECT_Y_START * s;
  const maxW = EFFECT_W * s;

  // Calculate available height: from effect start to stat area (or bottom of desc box)
  const isMon = isMonsterType(card.type) && !isSpellTrap(card.type);
  const statReserve = isMon ? 50 * s : 10 * s;
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

function drawStatValues(ctx, card, s) {
  const y = STAT_VALUE_Y * s;
  const fontSize = 24 * s;

  ctx.save();
  ctx.fillStyle = "#111";
  ctx.font = `bold ${fontSize}px ${FONT_STAT}`;
  ctx.textBaseline = "alphabetic";

  // ATK value
  const atkStr = card.atk != null ? String(card.atk) : "?";
  ctx.textAlign = "center";
  ctx.fillText(atkStr, ATK_VALUE_X * s, y);

  // DEF or LINK value
  if (isLink(card.type)) {
    const linkStr = card.linkRating != null ? String(card.linkRating) : "?";
    ctx.fillText(linkStr, DEF_VALUE_X * s, y);
  } else {
    const defStr = card.def != null ? String(card.def) : "?";
    ctx.fillText(defStr, DEF_VALUE_X * s, y);
  }

  ctx.restore();
}

function drawArchetypes(ctx, card, s) {
  if (!card.archetypes || card.archetypes.length === 0) return;

  const text = card.archetypes.join("/");
  const x = ARCHETYPE_RIGHT_X * s;
  const y = ARCHETYPE_Y * s;

  ctx.save();
  ctx.fillStyle = "#111";
  ctx.font = `bold ${16 * s}px ${FONT_EFFECT_TEXT}`;
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
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
