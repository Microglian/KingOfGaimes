import {
  CARD_TYPES, ATTRIBUTES, RARITIES, SPELL_TRAP_TYPES, OVERLAY_EFFECTS,
  isMonsterType, isXyz, isLink, isSpellTrap, isNoStatCard,
} from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import LinkArrowSelector from "@/components/LinkArrowSelector";
import TagInput from "@/components/TagInput";
import ImageControls from "@/components/ImageControls";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

const SYMBOLS = [
  "\u00AB", "\u00BB",  // « »
  "\u278A", "\u278B", "\u278C", "\u278D", "\u278E",  // ➊ ➋ ➌ ➍ ➎
  "\u3280", "\u3281", "\u3282", "\u3283", "\u3284", "\u3285", "\u3286", "\u3287", "\u3288",  // ㊀-㊈
  "\u25CF", "\u2605", "\u25C6", "\u25A0", "\u25B2", "\u2666", "\u221E",  // ● ★ ◆ ■ ▲ ♦ ∞
];

export default function CardForm({ card, onChange, onLocalImageChange, saveImageData, onSaveImageDataChange, localImageData }) {
  const [expandedSections, setExpandedSections] = useState({
    basic: true, stats: true, image: true, text: true, visual: false, meta: false,
  });

  const toggleSection = (key) => setExpandedSections((p) => ({ ...p, [key]: !p[key] }));

  const isMon = isMonsterType(card.type);
  const isST = isSpellTrap(card.type);
  const showStats = isMon && !isNoStatCard(card.type); // Hide stats for skill
  const isXyzType = isXyz(card.type);
  const isLinkType = isLink(card.type);

  const handleTypeChange = (val) => {
    onChange("type", val);
    if (isSpellTrap(val) || val === "skill") {
      onChange("level", null); onChange("rank", null); onChange("linkRating", null);
      onChange("linkArrows", []); onChange("atk", null); onChange("def", null);
      if (isSpellTrap(val)) {
        if (!card.spellTrapType) onChange("spellTrapType", "normal");
        if (val === "spell") onChange("attribute", "spell");
        if (val === "trap") onChange("attribute", "trap");
      }
      if (val === "skill") onChange("attribute", "skill");
    } else {
      onChange("spellTrapType", null);
      if (["spell", "trap", "skill"].includes(card.attribute)) onChange("attribute", "light");
      if (val === "xyz_monster") {
        onChange("level", null); onChange("linkRating", null); onChange("linkArrows", []);
        if (!card.rank) onChange("rank", 4);
      } else if (val === "link_monster") {
        onChange("level", null); onChange("rank", null); onChange("def", null);
        if (!card.linkRating) onChange("linkRating", 2);
      } else {
        onChange("rank", null); onChange("linkRating", null); onChange("linkArrows", []);
        if (!card.level) onChange("level", 4);
      }
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-56px-57px)]" data-testid="card-form">
      <div>
        {/* Basic Info */}
        <SectionHeader label="Basic Info" k="basic" expanded={expandedSections.basic} toggle={toggleSection} />
        {expandedSections.basic && (
          <div className="form-section space-y-3">
            <div>
              <label className="form-label">Card Name</label>
              <input type="text" value={card.name} onChange={(e) => onChange("name", e.target.value)}
                placeholder="Enter card name" className="form-input-dark w-full h-8 px-3 rounded-md text-sm border" data-testid="card-name-input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Card Type</label>
                <Select value={card.type} onValueChange={handleTypeChange}>
                  <SelectTrigger className="form-input-dark h-8 text-xs" data-testid="card-type-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CARD_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="form-label">Attribute</label>
                <Select value={card.attribute} onValueChange={(v) => onChange("attribute", v)}>
                  <SelectTrigger className="form-input-dark h-8 text-xs" data-testid="card-attribute-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ATTRIBUTES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isST && (
              <div>
                <label className="form-label">Spell/Trap Type</label>
                <Select value={card.spellTrapType || "normal"} onValueChange={(v) => onChange("spellTrapType", v)}>
                  <SelectTrigger className="form-input-dark h-8 text-xs" data-testid="spell-trap-type-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SPELL_TRAP_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {showStats && (
              <div>
                <label className="form-label">Type Line</label>
                <TagInput value={card.typeLine} onChange={(v) => onChange("typeLine", v)} placeholder="e.g. Dragon, Effect..." />
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <SectionHeader label="Stats" k="stats" expanded={expandedSections.stats} toggle={toggleSection} />
        {expandedSections.stats && (
          <div className="form-section space-y-3">
            {showStats && !isXyzType && !isLinkType && (
              <div>
                <label className="form-label">Level</label>
                <input type="number" value={card.level ?? ""} onChange={(e) => onChange("level", e.target.value ? parseInt(e.target.value) : null)}
                  min={0} max={13} className="form-input-dark w-full h-8 px-3 rounded-md text-sm border" data-testid="level-input" />
              </div>
            )}
            {isXyzType && (
              <div>
                <label className="form-label">Rank</label>
                <input type="number" value={card.rank ?? ""} onChange={(e) => onChange("rank", e.target.value ? parseInt(e.target.value) : null)}
                  min={0} max={13} className="form-input-dark w-full h-8 px-3 rounded-md text-sm border" data-testid="rank-input" />
              </div>
            )}
            {isLinkType && (
              <>
                <div>
                  <label className="form-label">Link Rating</label>
                  <input type="number" value={card.linkRating ?? ""} onChange={(e) => onChange("linkRating", e.target.value ? parseInt(e.target.value) : null)}
                    min={1} max={8} className="form-input-dark w-full h-8 px-3 rounded-md text-sm border" data-testid="link-rating-input" />
                </div>
                <div>
                  <label className="form-label">Link Arrows</label>
                  <LinkArrowSelector value={card.linkArrows} onChange={(v) => onChange("linkArrows", v)} />
                </div>
              </>
            )}
            {showStats && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">ATK</label>
                  <input type="number" value={card.atk ?? ""} onChange={(e) => onChange("atk", e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="?" className="form-input-dark w-full h-8 px-3 rounded-md text-sm border" data-testid="atk-input" />
                </div>
                {!isLinkType && (
                  <div>
                    <label className="form-label">DEF</label>
                    <input type="number" value={card.def ?? ""} onChange={(e) => onChange("def", e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="?" className="form-input-dark w-full h-8 px-3 rounded-md text-sm border" data-testid="def-input" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Image */}
        <SectionHeader label="Card Image" k="image" expanded={expandedSections.image} toggle={toggleSection} />
        {expandedSections.image && (
          <div className="form-section">
            <ImageControls card={card} onChange={onChange} onLocalImageChange={onLocalImageChange}
              saveImageData={saveImageData} onSaveImageDataChange={onSaveImageDataChange} localImageData={localImageData} />
          </div>
        )}

        {/* Text */}
        <SectionHeader label="Card Text" k="text" expanded={expandedSections.text} toggle={toggleSection} />
        {expandedSections.text && (
          <div className="form-section space-y-3">
            <div>
              <label className="form-label">Effect / Description</label>
              <textarea value={card.description} onChange={(e) => onChange("description", e.target.value)}
                placeholder="Enter card effect or flavor text..." rows={4}
                className="form-input-dark w-full px-3 py-2 rounded-md text-sm border resize-y min-h-[80px]" data-testid="description-input" />
            </div>
            <div>
              <label className="form-label">Insert Symbol</label>
              <div className="flex flex-wrap gap-1">
                {SYMBOLS.map((sym) => (
                  <button key={sym} type="button" className="symbol-btn"
                    onClick={() => onChange("description", card.description + sym)} data-testid={`symbol-${sym}`}>
                    {sym}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="form-label">
                Font Size: {card.descriptionFontSize ? `${card.descriptionFontSize}px (manual)` : "Auto"}
              </label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[card.descriptionFontSize || 14]}
                  onValueChange={([v]) => onChange("descriptionFontSize", v)}
                  min={7} max={24} step={1} className="flex-1"
                  data-testid="font-size-slider"
                />
                <button
                  type="button"
                  onClick={() => onChange("descriptionFontSize", null)}
                  className="text-[0.65rem] text-[#8BA0B2] hover:text-[#00E5FF] whitespace-nowrap"
                  data-testid="font-size-auto-btn"
                >
                  Auto
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Visual */}
        <SectionHeader label="Visual" k="visual" expanded={expandedSections.visual} toggle={toggleSection} />
        {expandedSections.visual && (
          <div className="form-section space-y-3">
            <div>
              <label className="form-label">Name Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={card.nameColor || "#000000"} onChange={(e) => onChange("nameColor", e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-[#162A3F] bg-transparent" data-testid="name-color-input" />
                <input type="text" value={card.nameColor || "#000000"} onChange={(e) => onChange("nameColor", e.target.value)}
                  className="form-input-dark flex-1 h-8 px-3 rounded-md text-sm border font-mono" data-testid="name-color-text" />
              </div>
            </div>
            <div>
              <label className="form-label">Overlay Effect</label>
              <Select value={card.overlays?.[0] || "none"} onValueChange={(v) => onChange("overlays", v === "none" ? [] : [v])}>
                <SelectTrigger className="form-input-dark h-8 text-xs" data-testid="overlay-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OVERLAY_EFFECTS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="form-label">Rarity</label>
              <Select value={card.rarity} onValueChange={(v) => onChange("rarity", v)}>
                <SelectTrigger className="form-input-dark h-8 text-xs" data-testid="rarity-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RARITIES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Meta */}
        <SectionHeader label="Set & Archetype" k="meta" expanded={expandedSections.meta} toggle={toggleSection} />
        {expandedSections.meta && (
          <div className="form-section space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Set Code</label>
                <input type="text" value={card.setCode} onChange={(e) => onChange("setCode", e.target.value)}
                  placeholder="e.g. LOB" className="form-input-dark w-full h-8 px-3 rounded-md text-sm border" data-testid="set-code-input" />
              </div>
              <div>
                <label className="form-label">Set Number</label>
                <input type="text" value={card.setNumber} onChange={(e) => onChange("setNumber", e.target.value)}
                  placeholder="e.g. EN001" className="form-input-dark w-full h-8 px-3 rounded-md text-sm border" data-testid="set-number-input" />
              </div>
            </div>
            <div>
              <label className="form-label">Archetypes</label>
              <TagInput value={card.archetypes} onChange={(v) => onChange("archetypes", v)} placeholder="Add archetype..." />
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function SectionHeader({ label, k, expanded, toggle }) {
  return (
    <button type="button" onClick={() => toggle(k)}
      className="w-full flex items-center justify-between px-5 py-2.5 text-left hover:bg-[#0D1D2E] transition-colors" data-testid={`section-${k}`}>
      <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#8BA0B2]" style={{ fontFamily: 'Outfit' }}>{label}</span>
      {expanded ? <ChevronDown size={14} className="text-[#4A6478]" /> : <ChevronRight size={14} className="text-[#4A6478]" />}
    </button>
  );
}
