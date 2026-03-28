import { FRAME_COLORS, FRAME_BORDER_COLORS, ATTRIBUTE_COLORS, isMonsterType, isXyz, isLink, isSpellTrap } from "./constants";

const CARD_W = 420;
const CARD_H = 614;
const BORDER = 12;
const NAME_H = 38;
const ATTR_SIZE = 30;

// Square art box: 280x280 centered
const IMG_SIZE = 280;
const IMG_PAD = (CARD_W - IMG_SIZE) / 2; // 70
const IMG_TOP = 82;

const TYPE_LINE_TOP = IMG_TOP + IMG_SIZE + 6;
const TYPE_LINE_H = 20;

const DESC_TOP = TYPE_LINE_TOP + TYPE_LINE_H + 6;
const STAT_H = 24;
const SET_H = 16;
const BOTTOM_PAD = 10;

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

  // 1. Outer border
  const borderColor = FRAME_BORDER_COLORS[card.type] || "#555";
  ctx.fillStyle = borderColor;
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 8);
  ctx.fill();

  // 2. Inner frame
  const frameColor = FRAME_COLORS[card.type] || "#C9B458";
  ctx.fillStyle = frameColor;
  roundRect(ctx, BORDER / 2, BORDER / 2, CARD_W - BORDER, CARD_H - BORDER, 6);
  ctx.fill();

  // 3. Inner card background
  ctx.fillStyle = darken(frameColor, 0.15);
  roundRect(ctx, BORDER, BORDER, CARD_W - BORDER * 2, CARD_H - BORDER * 2, 4);
  ctx.fill();

  drawNameBar(ctx, card);
  drawAttributeIcon(ctx, card);
  drawLevelIndicator(ctx, card);
  await drawImageBox(ctx, card, options);
  drawTypeLine(ctx, card);
  drawDescriptionBox(ctx, card);
  drawStats(ctx, card);
  drawSetInfo(ctx, card);
  drawOverlay(ctx, card);
  if (isLink(card.type)) drawLinkArrows(ctx, card);
}

function drawNameBar(ctx, card) {
  const y = BORDER + 6;
  const x = BORDER + 10;
  const maxW = CARD_W - BORDER * 2 - ATTR_SIZE - 30;

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  roundRect(ctx, BORDER + 4, y - 4, CARD_W - BORDER * 2 - 8, NAME_H, 3);
  ctx.fill();

  ctx.fillStyle = card.nameColor || "#FFFFFF";
  ctx.textBaseline = "middle";
  let fontSize = 22;
  ctx.font = `bold ${fontSize}px 'Outfit', sans-serif`;
  const name = card.name || "Card Name";
  const measured = ctx.measureText(name).width;
  if (measured > maxW) {
    fontSize = Math.max(12, Math.floor(22 * (maxW / measured)));
    ctx.font = `bold ${fontSize}px 'Outfit', sans-serif`;
  }
  ctx.fillText(name, x, y + NAME_H / 2, maxW);
}

function drawAttributeIcon(ctx, card) {
  const x = CARD_W - BORDER - ATTR_SIZE - 10;
  const y = BORDER + 10;
  const color = ATTRIBUTE_COLORS[card.attribute] || "#999";

  ctx.beginPath();
  ctx.arc(x + ATTR_SIZE / 2, y + ATTR_SIZE / 2, ATTR_SIZE / 2, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#FFF";
  ctx.font = "bold 10px 'Outfit', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(card.attribute?.toUpperCase()?.substring(0, 4) || "", x + ATTR_SIZE / 2, y + ATTR_SIZE / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawLevelIndicator(ctx, card) {
  const y = BORDER + NAME_H + 14;

  if (isXyz(card.type) && card.rank) {
    const count = Math.min(card.rank, 13);
    const starSize = 16;
    const totalW = count * starSize;
    const startX = BORDER + 14;
    for (let i = 0; i < count; i++) {
      drawStar(ctx, startX + i * starSize + starSize / 2, y + 8, starSize / 2 - 1, "#1A1A1A", "#DAA520");
    }
    ctx.fillStyle = "#DAA520";
    ctx.font = "bold 10px 'Manrope', sans-serif";
    ctx.fillText("RANK", startX + totalW + 6, y + 11);
  } else if (isLink(card.type) && card.linkRating) {
    ctx.fillStyle = "#00BCD4";
    ctx.font = "bold 14px 'Outfit', sans-serif";
    ctx.fillText(`LINK-${card.linkRating}`, BORDER + 14, y + 12);
  } else if (isMonsterType(card.type) && card.level) {
    const count = Math.min(card.level, 13);
    const starSize = 16;
    const totalW = count * starSize;
    const startX = CARD_W - BORDER - 14 - totalW;
    for (let i = 0; i < count; i++) {
      drawStar(ctx, startX + i * starSize + starSize / 2, y + 8, starSize / 2 - 1, "#FFD700", "#B8860B");
    }
  }
}

function drawStar(ctx, cx, cy, r, fill, stroke) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
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
  const x = IMG_PAD;
  const y = IMG_TOP;
  const w = IMG_SIZE;
  const h = IMG_SIZE;

  // Image frame border
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);

  // Background
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(x, y, w, h);

  const imageUrl = card.imageUrl;
  if (imageUrl) {
    try {
      const img = await loadImage(imageUrl, options);
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();

        const zoom = card.imageCrop?.zoom || 1;
        const offX = card.imageOffset?.x || 0;
        const offY = card.imageOffset?.y || 0;

        const imgRatio = img.width / img.height;
        const boxRatio = w / h;
        let drawW, drawH;
        if (imgRatio > boxRatio) {
          drawH = h * zoom;
          drawW = drawH * imgRatio;
        } else {
          drawW = w * zoom;
          drawH = drawW / imgRatio;
        }
        const drawX = x + (w - drawW) / 2 + offX;
        const drawY = y + (h - drawH) / 2 + offY;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();
      } else {
        drawImagePlaceholder(ctx, x, y, w, h, "Image failed to load");
      }
    } catch {
      drawImagePlaceholder(ctx, x, y, w, h, "Image error");
    }
  } else {
    drawImagePlaceholder(ctx, x, y, w, h, "No Image");
  }
}

function drawImagePlaceholder(ctx, x, y, w, h, text) {
  ctx.fillStyle = "#555";
  ctx.font = "14px 'Manrope', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + w / 2, y + h / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawTypeLine(ctx, card) {
  const y = TYPE_LINE_TOP;
  const x = IMG_PAD + 4;
  const maxW = IMG_SIZE - 8;

  let text = "";
  if (isSpellTrap(card.type)) {
    const subtype = card.spellTrapType ? ` ${card.spellTrapType.replace(/_/g, "-").toUpperCase()}` : "";
    text = `[${card.type.toUpperCase()} CARD${subtype}]`;
  } else {
    const parts = card.typeLine?.length > 0 ? card.typeLine : ["???"];
    text = `[${parts.join(" / ")}]`;
  }

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  roundRect(ctx, IMG_PAD, y - 2, IMG_SIZE, TYPE_LINE_H, 2);
  ctx.fill();

  ctx.fillStyle = "#111";
  let fontSize = 12;
  ctx.font = `bold ${fontSize}px 'Manrope', sans-serif`;
  const measured = ctx.measureText(text).width;
  if (measured > maxW) {
    fontSize = Math.max(7, Math.floor(12 * (maxW / measured)));
    ctx.font = `bold ${fontSize}px 'Manrope', sans-serif`;
  }
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + TYPE_LINE_H / 2, maxW);
  ctx.textBaseline = "alphabetic";
}

function drawDescriptionBox(ctx, card) {
  const x = IMG_PAD;
  const y = DESC_TOP;
  const w = IMG_SIZE;

  // Calculate available height: from DESC_TOP to bottom area
  const isMon = isMonsterType(card.type);
  const bottomReserved = isMon ? STAT_H + SET_H + BOTTOM_PAD + 4 : SET_H + BOTTOM_PAD + 4;
  const h = CARD_H - BORDER - y - bottomReserved;

  // Box background
  ctx.fillStyle = "rgba(245, 240, 228, 0.95)";
  roundRect(ctx, x, y, w, h, 3);
  ctx.fill();

  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 3);
  ctx.stroke();

  // Text with clipping
  const padding = 8;
  const textX = x + padding;
  const textY = y + padding;
  const textW = w - padding * 2;
  const textH = h - padding * 2;
  const text = card.description || "";

  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 2, y + 2, w - 4, h - 4);
  ctx.clip();

  ctx.fillStyle = "#111";
  const isNormalMonster = card.type === "normal_monster";
  const baseFontSize = 14;
  const fontStyle = isNormalMonster ? "italic" : "normal";

  wrapText(ctx, text, textX, textY, textW, textH, baseFontSize, fontStyle);
  ctx.restore();

  // Draw archetypes below description box if any
  if (card.archetypes?.length > 0) {
    const archY = y + h + 2;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.font = "bold 8px 'Manrope', sans-serif";
    const archText = card.archetypes.join(" / ");
    ctx.fillText(archText, x + 4, archY + 8, w - 8);
  }
}

function wrapText(ctx, text, x, y, maxW, maxH, baseFontSize, fontStyle) {
  if (!text) return;

  let fontSize = baseFontSize;
  const minFontSize = 7;

  // Binary search for the best font size that fits
  while (fontSize >= minFontSize) {
    ctx.font = `${fontStyle} ${fontSize}px 'Manrope', sans-serif`;
    const lineH = fontSize + 3;

    const lines = computeLines(ctx, text, maxW);
    const totalH = lines.length * lineH;

    if (totalH <= maxH) {
      // Fits! Draw the lines.
      let curY = y + fontSize; // first baseline
      for (const line of lines) {
        ctx.fillText(line, x, curY, maxW);
        curY += lineH;
      }
      return;
    }
    // Doesn't fit, try smaller
    fontSize--;
  }

  // At minimum font size, just draw what fits
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
    if (para.trim() === "") {
      lines.push("");
      continue;
    }
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

function drawStats(ctx, card) {
  if (!isMonsterType(card.type)) return;

  const y = CARD_H - BORDER - SET_H - STAT_H - BOTTOM_PAD;
  const rightX = CARD_W - IMG_PAD - 4;

  ctx.fillStyle = "#111";
  ctx.font = "bold 14px 'Outfit', sans-serif";
  ctx.textAlign = "right";

  if (isLink(card.type)) {
    const atkStr = card.atk != null ? String(card.atk) : "?";
    ctx.fillText(`ATK/${atkStr}`, rightX, y + 16);
  } else {
    const atkStr = card.atk != null ? String(card.atk) : "?";
    const defStr = card.def != null ? String(card.def) : "?";
    ctx.fillText(`ATK/${atkStr}  DEF/${defStr}`, rightX, y + 16);
  }
  ctx.textAlign = "left";
}

function drawSetInfo(ctx, card) {
  const y = CARD_H - BORDER - BOTTOM_PAD;

  if (card.setCode || card.setNumber) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.font = "10px 'Manrope', sans-serif";
    const setStr = [card.setCode, card.setNumber].filter(Boolean).join("-");
    ctx.fillText(setStr, IMG_PAD, y);
  }

  if (card.rarity && card.rarity !== "common") {
    const raritySymbols = {
      uncommon: "U", rare: "R", super_rare: "SR",
      ultra_rare: "UR", secret_rare: "ScR",
      ultimate_rare: "UtR", holographic_rare: "HgR",
    };
    ctx.fillStyle = getRarityColor(card.rarity);
    ctx.font = "bold 10px 'Outfit', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(raritySymbols[card.rarity] || "", CARD_W - IMG_PAD, y);
    ctx.textAlign = "left";
  }
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
      const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(0.3, "rgba(255,255,255,0.08)");
      grad.addColorStop(0.5, "rgba(200,200,255,0.12)");
      grad.addColorStop(0.7, "rgba(255,255,255,0.08)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CARD_W, CARD_H);
    } else if (overlay === "ultra_foil") {
      const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
      grad.addColorStop(0, "rgba(255,215,0,0)");
      grad.addColorStop(0.25, "rgba(255,215,0,0.1)");
      grad.addColorStop(0.5, "rgba(255,255,255,0.15)");
      grad.addColorStop(0.75, "rgba(255,215,0,0.1)");
      grad.addColorStop(1, "rgba(255,215,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CARD_W, CARD_H);
    } else if (overlay === "secret_foil") {
      for (let i = 0; i < 6; i++) {
        const grad = ctx.createLinearGradient(0, i * (CARD_H / 6), CARD_W, (i + 1) * (CARD_H / 6));
        const hue = (i * 60) % 360;
        grad.addColorStop(0, `hsla(${hue}, 80%, 60%, 0)`);
        grad.addColorStop(0.5, `hsla(${hue}, 80%, 60%, 0.08)`);
        grad.addColorStop(1, `hsla(${(hue + 60) % 360}, 80%, 60%, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CARD_W, CARD_H);
      }
    } else if (overlay === "ultimate_foil") {
      ctx.globalCompositeOperation = "soft-light";
      const grad = ctx.createRadialGradient(CARD_W / 2, CARD_H / 3, 0, CARD_W / 2, CARD_H / 3, CARD_W);
      grad.addColorStop(0, "rgba(255,255,255,0.15)");
      grad.addColorStop(0.5, "rgba(200,200,255,0.08)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CARD_W, CARD_H);
    } else if (overlay === "holographic") {
      ctx.globalCompositeOperation = "color-dodge";
      const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
      ["#ff000010", "#ff880010", "#ffff0010", "#00ff0010", "#0088ff10", "#8800ff10"].forEach((c, i, a) =>
        grad.addColorStop(i / (a.length - 1), c)
      );
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CARD_W, CARD_H);
    }
    ctx.restore();
  }
}

function drawLinkArrows(ctx, card) {
  if (!card.linkArrows || card.linkArrows.length === 0) return;
  const imgCenterY = IMG_TOP + IMG_SIZE / 2;
  const arrowPositions = {
    top_left: { x: IMG_PAD - 2, y: IMG_TOP - 2, angle: -135 },
    top: { x: CARD_W / 2, y: IMG_TOP - 4, angle: -90 },
    top_right: { x: CARD_W - IMG_PAD + 2, y: IMG_TOP - 2, angle: -45 },
    left: { x: IMG_PAD - 4, y: imgCenterY, angle: 180 },
    right: { x: CARD_W - IMG_PAD + 4, y: imgCenterY, angle: 0 },
    bottom_left: { x: IMG_PAD - 2, y: IMG_TOP + IMG_SIZE + 2, angle: 135 },
    bottom: { x: CARD_W / 2, y: IMG_TOP + IMG_SIZE + 4, angle: 90 },
    bottom_right: { x: CARD_W - IMG_PAD + 2, y: IMG_TOP + IMG_SIZE + 2, angle: 45 },
  };

  for (const arrow of card.linkArrows) {
    const pos = arrowPositions[arrow];
    if (!pos) continue;
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate((pos.angle * Math.PI) / 180);
    ctx.fillStyle = "#FF4444";
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-5, -6);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}

// --- Utility ---

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
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

  const cacheKey = url;
  if (imageCache.has(cacheKey)) {
    return Promise.resolve(imageCache.get(cacheKey));
  }

  return new Promise((resolve) => {
    // For data: URIs, load directly
    if (url.startsWith("data:")) {
      const img = new Image();
      img.onload = () => { imageCache.set(cacheKey, img); resolve(img); };
      img.onerror = () => resolve(null);
      img.src = url;
      return;
    }

    // For external URLs, try proxy first (avoids CORS / canvas taint)
    if (options.proxyUrl) {
      const proxyImg = new Image();
      proxyImg.crossOrigin = "anonymous";
      proxyImg.onload = () => { imageCache.set(cacheKey, proxyImg); resolve(proxyImg); };
      proxyImg.onerror = () => {
        // Fallback: try direct
        const directImg = new Image();
        directImg.crossOrigin = "anonymous";
        directImg.onload = () => { imageCache.set(cacheKey, directImg); resolve(directImg); };
        directImg.onerror = () => resolve(null);
        directImg.src = url;
      };
      proxyImg.src = options.proxyUrl;
    } else {
      // No proxy available, try direct
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { imageCache.set(cacheKey, img); resolve(img); };
      img.onerror = () => resolve(null);
      img.src = url;
    }
  });
}

export function clearImageCache() {
  imageCache.clear();
}
