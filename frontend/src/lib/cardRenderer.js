import { FRAME_COLORS, FRAME_BORDER_COLORS, ATTRIBUTE_COLORS, isMonsterType, isXyz, isLink, isSpellTrap } from "./constants";

// Card dimensions matching real Yu-Gi-Oh proportions
const CARD_W = 420;
const CARD_H = 614;
const BORDER = 10;

// Name bar
const NAME_Y = BORDER + 2;
const NAME_H = 40;

// Stars
const STAR_Y = NAME_Y + NAME_H + 2;
const STAR_SIZE = 17;

// Art box - WIDER than tall (matching real cards)
const ART_PAD = 22;
const ART_TOP = 78;
const ART_W = CARD_W - ART_PAD * 2; // 376
const ART_H = Math.round(ART_W * 0.82); // ~308, wider than tall
const ART_BOTTOM = ART_TOP + ART_H;

// Set code area
const SET_CODE_Y = ART_BOTTOM + 3;

// Description box (contains type line + text + ATK/DEF)
const DESC_PAD = ART_PAD;
const DESC_TOP = ART_BOTTOM + 18;
const DESC_W = CARD_W - DESC_PAD * 2;
const DESC_BOTTOM = CARD_H - BORDER - 22;
const DESC_H = DESC_BOTTOM - DESC_TOP;

// Type line inside desc box
const TYPE_LINE_H = 18;

// ATK/DEF inside desc box
const STAT_H = 22;

export function getCardDimensions() {
  return { width: CARD_W, height: CARD_H };
}

export async function renderCard(canvas, card, options = {}) {
  const ctx = canvas.getContext("2d");
  const scale = options.scale || 1;
  canvas.width = CARD_W * scale;
  canvas.height = CARD_H * scale;
  ctx.scale(scale, scale);
  ctx.clearRect(0, 0, CARD_W, CARD_H);

  const borderColor = FRAME_BORDER_COLORS[card.type] || "#555";
  ctx.fillStyle = borderColor;
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 8);
  ctx.fill();

  const frameColor = FRAME_COLORS[card.type] || "#C9B458";
  ctx.fillStyle = frameColor;
  roundRect(ctx, BORDER / 2, BORDER / 2, CARD_W - BORDER, CARD_H - BORDER, 6);
  ctx.fill();

  ctx.fillStyle = darken(frameColor, 0.08);
  roundRect(ctx, BORDER, BORDER, CARD_W - BORDER * 2, CARD_H - BORDER * 2, 4);
  ctx.fill();

  drawNameBar(ctx, card);
  drawAttributeIcon(ctx, card);
  drawLevelIndicator(ctx, card);
  await drawImageBox(ctx, card, options);
  drawSetCode(ctx, card);
  drawDescriptionArea(ctx, card);
  drawOverlay(ctx, card);
  if (isLink(card.type)) drawLinkArrows(ctx, card);
}

function drawNameBar(ctx, card) {
  const x = BORDER + 8;
  const maxW = CARD_W - BORDER * 2 - 50;

  // Dark translucent bar behind name
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  roundRect(ctx, BORDER + 3, NAME_Y - 2, CARD_W - BORDER * 2 - 6, NAME_H + 2, 3);
  ctx.fill();

  // Thin gold/frame color line at bottom of name bar
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(BORDER + 3, NAME_Y + NAME_H - 2, CARD_W - BORDER * 2 - 6, 1);

  ctx.fillStyle = card.nameColor || "#000000";
  ctx.textBaseline = "middle";
  let fontSize = 24;
  ctx.font = `bold ${fontSize}px 'Outfit', sans-serif`;
  const name = card.name || "Card Name";
  const measured = ctx.measureText(name).width;
  if (measured > maxW) {
    fontSize = Math.max(12, Math.floor(24 * (maxW / measured)));
    ctx.font = `bold ${fontSize}px 'Outfit', sans-serif`;
  }
  ctx.fillText(name, x, NAME_Y + NAME_H / 2, maxW);
  ctx.textBaseline = "alphabetic";
}

function drawAttributeIcon(ctx, card) {
  const size = 32;
  const x = CARD_W - BORDER - size - 8;
  const y = NAME_Y + (NAME_H - size) / 2;
  const color = ATTRIBUTE_COLORS[card.attribute] || "#999";

  // Circle background
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner highlight
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#FFF";
  ctx.font = "bold 9px 'Outfit', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(card.attribute?.toUpperCase()?.substring(0, 4) || "", x + size / 2, y + size / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawLevelIndicator(ctx, card) {
  if (isXyz(card.type) && card.rank) {
    // Xyz: Rank stars LEFT-aligned
    const count = Math.min(card.rank, 13);
    const startX = BORDER + 14;
    for (let i = 0; i < count; i++) {
      drawStar(ctx, startX + i * STAR_SIZE + STAR_SIZE / 2, STAR_Y + STAR_SIZE / 2, STAR_SIZE / 2 - 1, "#1A1A1A", "#DAA520");
    }
  } else if (isLink(card.type) && card.linkRating) {
    ctx.fillStyle = "#00BCD4";
    ctx.font = "bold 14px 'Outfit', sans-serif";
    ctx.fillText(`LINK-${card.linkRating}`, BORDER + 14, STAR_Y + 14);
  } else if (isMonsterType(card.type) && card.level) {
    // Normal/Effect: Stars RIGHT-aligned (like real cards)
    const count = Math.min(card.level, 13);
    const startX = CARD_W - BORDER - 10 - count * STAR_SIZE;
    for (let i = 0; i < count; i++) {
      drawLevelStar(ctx, startX + i * STAR_SIZE + STAR_SIZE / 2, STAR_Y + STAR_SIZE / 2, STAR_SIZE / 2 - 1);
    }
  }
}

function drawLevelStar(ctx, cx, cy, r) {
  // Outer circle (red/orange gradient look)
  ctx.beginPath();
  ctx.arc(cx, cy, r + 1, 0, Math.PI * 2);
  ctx.fillStyle = "#B22222";
  ctx.fill();

  // Inner star
  ctx.beginPath();
  const points = 5;
  const outerR = r;
  const innerR = r * 0.45;
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = "#FFD700";
  ctx.fill();
  ctx.strokeStyle = "#DAA520";
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

function drawStar(ctx, cx, cy, r, fill, stroke) {
  ctx.beginPath();
  const points = 5;
  const outerR = r;
  const innerR = r * 0.45;
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();
}

async function drawImageBox(ctx, card, options) {
  const x = ART_PAD;
  const y = ART_TOP;

  // Image border
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(x - 3, y - 3, ART_W + 6, ART_H + 6);
  ctx.fillStyle = "#C0B080";
  ctx.fillRect(x - 2, y - 2, ART_W + 4, ART_H + 4);

  // Background
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(x, y, ART_W, ART_H);

  // Determine which image source to use
  const localData = options.localImageData;
  const imageUrl = localData || card.imageUrl;

  if (imageUrl) {
    try {
      const img = await loadImage(imageUrl, options);
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, ART_W, ART_H);
        ctx.clip();

        const zoom = card.imageCrop?.zoom || 1;
        const offX = card.imageOffset?.x || 0;
        const offY = card.imageOffset?.y || 0;

        const imgRatio = img.width / img.height;
        const boxRatio = ART_W / ART_H;
        let drawW, drawH;
        if (imgRatio > boxRatio) {
          drawH = ART_H * zoom;
          drawW = drawH * imgRatio;
        } else {
          drawW = ART_W * zoom;
          drawH = drawW / imgRatio;
        }
        const drawX = x + (ART_W - drawW) / 2 + offX;
        const drawY = y + (ART_H - drawH) / 2 + offY;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();
        return; // success
      }
    } catch {
      // Fall through to placeholder
    }
    // Image failed to load - draw placeholder
    drawImagePlaceholder(ctx, x, y, ART_W, ART_H, "Image could not be loaded");
  } else {
    drawImagePlaceholder(ctx, x, y, ART_W, ART_H, "No Image");
  }
}

function drawImagePlaceholder(ctx, x, y, w, h, text) {
  ctx.fillStyle = "#2a2a3e";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#666";
  ctx.font = "14px 'Manrope', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + w / 2, y + h / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawSetCode(ctx, card) {
  if (card.setCode || card.setNumber) {
    const setStr = [card.setCode, card.setNumber].filter(Boolean).join("-");
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.font = "9px 'Manrope', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(setStr, CARD_W - ART_PAD, SET_CODE_Y + 8);
    ctx.textAlign = "left";
  }
}

function drawDescriptionArea(ctx, card) {
  const x = DESC_PAD;
  const y = DESC_TOP;
  const w = DESC_W;
  const h = DESC_H;
  const isMon = isMonsterType(card.type);

  // Cream/beige description box
  ctx.fillStyle = "rgba(245, 240, 225, 0.95)";
  roundRect(ctx, x, y, w, h, 3);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 3);
  ctx.stroke();

  // Clip all text to box
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 1, y + 1, w - 2, h - 2);
  ctx.clip();

  const pad = 7;
  let cursorY = y + pad;

  // --- Type line ---
  let typeText = "";
  if (isSpellTrap(card.type)) {
    const subtype = card.spellTrapType ? ` ${card.spellTrapType.replace(/_/g, "-").toUpperCase()}` : "";
    typeText = `[${card.type.toUpperCase()} CARD${subtype}]`;
  } else {
    const parts = card.typeLine?.length > 0 ? card.typeLine : ["???"];
    typeText = `[${parts.join("/")}]`;
  }

  ctx.fillStyle = "#111";
  let typeFontSize = 13;
  ctx.font = `bold ${typeFontSize}px 'Manrope', sans-serif`;
  const typeMaxW = w - pad * 2;
  const typeMeasured = ctx.measureText(typeText).width;
  if (typeMeasured > typeMaxW) {
    typeFontSize = Math.max(8, Math.floor(13 * (typeMaxW / typeMeasured)));
    ctx.font = `bold ${typeFontSize}px 'Manrope', sans-serif`;
  }
  cursorY += typeFontSize;
  ctx.fillText(typeText, x + pad, cursorY, typeMaxW);
  cursorY += 4;

  // --- Effect/Description text ---
  const textTopY = cursorY;
  const statReserved = isMon ? STAT_H + 6 : 0;
  const textBottomY = y + h - pad - statReserved;
  const textH = textBottomY - textTopY;
  const textW = w - pad * 2;

  if (card.description) {
    const isNormalMonster = card.type === "normal_monster";
    const fontStyle = isNormalMonster ? "italic" : "normal";
    const manualSize = card.descriptionFontSize;
    const baseFontSize = manualSize || 14;

    ctx.fillStyle = "#111";
    wrapText(ctx, card.description, x + pad, textTopY, textW, textH, baseFontSize, fontStyle, !!manualSize);
  }

  // --- ATK/DEF separator and stats ---
  if (isMon) {
    const statY = y + h - pad - STAT_H;

    // Separator line
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + pad, statY - 2);
    ctx.lineTo(x + w - pad, statY - 2);
    ctx.stroke();

    ctx.fillStyle = "#111";
    ctx.font = "bold 15px 'Outfit', sans-serif";
    ctx.textAlign = "right";

    if (isLink(card.type)) {
      const atkStr = card.atk != null ? String(card.atk) : "?";
      ctx.fillText(`ATK/${atkStr}`, x + w - pad, statY + 14);
    } else {
      const atkStr = card.atk != null ? String(card.atk) : "?";
      const defStr = card.def != null ? String(card.def) : "?";
      ctx.fillText(`ATK/${atkStr}  DEF/${defStr}`, x + w - pad, statY + 14);
    }
    ctx.textAlign = "left";
  }

  ctx.restore(); // Unclip

  // --- Archetypes below the box ---
  if (card.archetypes?.length > 0) {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.font = "bold 8px 'Manrope', sans-serif";
    ctx.fillText(card.archetypes.join(" / "), x + 4, y + h + 10, w - 8);
  }

  // --- Rarity indicator ---
  if (card.rarity && card.rarity !== "common") {
    const raritySymbols = {
      uncommon: "U", rare: "R", super_rare: "SR", ultra_rare: "UR",
      secret_rare: "ScR", ultimate_rare: "UtR", holographic_rare: "HgR",
    };
    ctx.fillStyle = getRarityColor(card.rarity);
    ctx.font = "bold 9px 'Outfit', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(raritySymbols[card.rarity] || "", x + w, y + h + 10);
    ctx.textAlign = "left";
  }

  // --- Bottom serial area ---
  const bottomY = CARD_H - BORDER - 10;
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.font = "8px 'Manrope', sans-serif";
  if (card.setCode) {
    ctx.fillText(card.setCode, BORDER + 8, bottomY);
  }
}

function wrapText(ctx, text, x, y, maxW, maxH, baseFontSize, fontStyle, isManual) {
  if (!text) return;
  let fontSize = baseFontSize;
  const minFontSize = 7;

  if (isManual) {
    // Manual mode: use exact font size, clip overflow
    ctx.font = `${fontStyle} ${fontSize}px 'Manrope', sans-serif`;
    const lineH = fontSize + 3;
    const lines = computeLines(ctx, text, maxW);
    let curY = y + fontSize;
    for (const line of lines) {
      if (curY > y + maxH) break;
      ctx.fillText(line, x, curY, maxW);
      curY += lineH;
    }
    return;
  }

  // Auto mode: find best font size that fits
  while (fontSize >= minFontSize) {
    ctx.font = `${fontStyle} ${fontSize}px 'Manrope', sans-serif`;
    const lineH = fontSize + 3;
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
    fontSize--;
  }

  // At minimum, draw what fits
  fontSize = minFontSize;
  ctx.font = `${fontStyle} ${fontSize}px 'Manrope', sans-serif`;
  const lineH = fontSize + 3;
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

function getRarityColor(rarity) {
  const colors = {
    uncommon: "#708090", rare: "#C0C0C0", super_rare: "#4169E1",
    ultra_rare: "#FFD700", secret_rare: "#FF69B4",
    ultimate_rare: "#FF4500", holographic_rare: "#00CED1",
  };
  return colors[rarity] || "#999";
}

function drawOverlay(ctx, card) {
  if (!card.overlays || card.overlays.length === 0) return;
  for (const overlay of card.overlays) {
    if (overlay === "none") continue;
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    if (overlay === "super_foil") {
      const g = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
      g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.3, "rgba(255,255,255,0.08)");
      g.addColorStop(0.5, "rgba(200,200,255,0.12)"); g.addColorStop(0.7, "rgba(255,255,255,0.08)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, CARD_W, CARD_H);
    } else if (overlay === "ultra_foil") {
      const g = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
      g.addColorStop(0, "rgba(255,215,0,0)"); g.addColorStop(0.25, "rgba(255,215,0,0.1)");
      g.addColorStop(0.5, "rgba(255,255,255,0.15)"); g.addColorStop(0.75, "rgba(255,215,0,0.1)");
      g.addColorStop(1, "rgba(255,215,0,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, CARD_W, CARD_H);
    } else if (overlay === "secret_foil") {
      for (let i = 0; i < 6; i++) {
        const g = ctx.createLinearGradient(0, i * (CARD_H / 6), CARD_W, (i + 1) * (CARD_H / 6));
        const hue = (i * 60) % 360;
        g.addColorStop(0, `hsla(${hue},80%,60%,0)`); g.addColorStop(0.5, `hsla(${hue},80%,60%,0.08)`);
        g.addColorStop(1, `hsla(${(hue + 60) % 360},80%,60%,0)`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, CARD_W, CARD_H);
      }
    }
    ctx.restore();
  }
}

function drawLinkArrows(ctx, card) {
  if (!card.linkArrows || card.linkArrows.length === 0) return;
  const cY = ART_TOP + ART_H / 2;
  const pos = {
    top_left: { x: ART_PAD, y: ART_TOP, a: -135 },
    top: { x: CARD_W / 2, y: ART_TOP - 4, a: -90 },
    top_right: { x: CARD_W - ART_PAD, y: ART_TOP, a: -45 },
    left: { x: ART_PAD - 4, y: cY, a: 180 },
    right: { x: CARD_W - ART_PAD + 4, y: cY, a: 0 },
    bottom_left: { x: ART_PAD, y: ART_BOTTOM, a: 135 },
    bottom: { x: CARD_W / 2, y: ART_BOTTOM + 4, a: 90 },
    bottom_right: { x: CARD_W - ART_PAD, y: ART_BOTTOM, a: 45 },
  };
  for (const arrow of card.linkArrows) {
    const p = pos[arrow]; if (!p) continue;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.a * Math.PI) / 180);
    ctx.fillStyle = "#FF4444"; ctx.beginPath();
    ctx.moveTo(10, 0); ctx.lineTo(-5, -6); ctx.lineTo(-5, 6); ctx.closePath();
    ctx.fill(); ctx.strokeStyle = "#FFD700"; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function darken(hex, amount) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.floor(((num >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.floor(((num >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.floor((num & 255) * (1 - amount)));
  return `rgb(${r},${g},${b})`;
}

const imageCache = new Map();

function loadImage(url, options = {}) {
  if (!url) return Promise.resolve(null);
  // Don't try to load "file:" references
  if (url.startsWith("file:")) return Promise.resolve(null);

  const cacheKey = url;
  if (imageCache.has(cacheKey)) return Promise.resolve(imageCache.get(cacheKey));

  return new Promise((resolve) => {
    if (url.startsWith("data:")) {
      const img = new Image();
      img.onload = () => { imageCache.set(cacheKey, img); resolve(img); };
      img.onerror = () => resolve(null);
      img.src = url;
      return;
    }
    // External URL: try proxy first
    if (options.proxyUrl) {
      const proxyImg = new Image();
      proxyImg.crossOrigin = "anonymous";
      proxyImg.onload = () => { imageCache.set(cacheKey, proxyImg); resolve(proxyImg); };
      proxyImg.onerror = () => {
        const directImg = new Image();
        directImg.crossOrigin = "anonymous";
        directImg.onload = () => { imageCache.set(cacheKey, directImg); resolve(directImg); };
        directImg.onerror = () => resolve(null);
        directImg.src = url;
      };
      proxyImg.src = options.proxyUrl;
    } else {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { imageCache.set(cacheKey, img); resolve(img); };
      img.onerror = () => resolve(null);
      img.src = url;
    }
  });
}

export function clearImageCache() { imageCache.clear(); }

export function generateThumbnail(canvas) {
  const thumbCanvas = document.createElement("canvas");
  const tw = 84;
  const th = 123;
  thumbCanvas.width = tw;
  thumbCanvas.height = th;
  const tCtx = thumbCanvas.getContext("2d");
  tCtx.drawImage(canvas, 0, 0, tw, th);
  return thumbCanvas.toDataURL("image/jpeg", 0.5);
}
