import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";

const TYPE_COLORS = {
  normal_monster: "#C9B458",
  effect_monster: "#C46628",
  ritual_monster: "#3B6BA5",
  fusion_monster: "#7B4F9D",
  synchro_monster: "#CCCCCC",
  xyz_monster: "#E8E8E8",
  link_monster: "#1B8FD1",
  red_monster: "#CC3333",
  token_monster: "#999",
  spell: "#1D9E74",
  trap: "#BC3A7C",
  skill: "#4169AA",
};

const RARITY_LABELS = {
  common: null,
  uncommon: { text: "U", color: "#228B22" },
  rare: { text: "R", color: "#2266CC" },
  super_rare: { text: "SR", color: "#8844CC" },
  ultra_rare: { text: "UR", color: "#DAA520" },
  secret_rare: { text: "ScR", color: "#CC2222" },
  ultimate_rare: { text: "UtR", color: "#FF69B4" },
  holographic_rare: { text: "HLR", color: "#00CED1" },
};

// Session-persistent recent cards list
let recentCardsList = [];

export function addRecentCard(card) {
  if (!card || !card.id) return;
  // Remove duplicate if already in list
  recentCardsList = recentCardsList.filter((c) => c.id !== card.id);
  // Add to front
  recentCardsList.unshift({
    id: card.id,
    name: card.name || "Untitled",
    type: card.type,
    setCode: card.setCode,
    setNumber: card.setNumber,
    rarity: card.rarity,
    archetypes: card.archetypes || [],
    updatedAt: Date.now(),
  });
  // Keep max 30
  if (recentCardsList.length > 30) recentCardsList.length = 30;
}

export default function RecentCards({ refreshKey }) {
  const navigate = useNavigate();
  const [cards, setCards] = useState(recentCardsList);

  useEffect(() => {
    setCards([...recentCardsList]);
  }, [refreshKey]);

  const handleClick = useCallback((id) => {
    navigate(`/?id=${id}`);
  }, [navigate]);

  if (cards.length === 0) {
    return (
      <div className="recent-panel" data-testid="recent-cards-panel">
        <div className="p-4 border-b border-[#162A3F]">
          <h3 className="text-xs font-bold text-[#8BA0B2] uppercase tracking-widest flex items-center gap-2">
            <Clock size={13} /> Recent Cards
          </h3>
        </div>
        <div className="p-6 text-center text-[#4A6478] text-xs">
          Saved cards will appear here
        </div>
      </div>
    );
  }

  return (
    <div className="recent-panel" data-testid="recent-cards-panel">
      <div className="p-4 border-b border-[#162A3F]">
        <h3 className="text-xs font-bold text-[#8BA0B2] uppercase tracking-widest flex items-center gap-2">
          <Clock size={13} /> Recent Cards
        </h3>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 56px - 50px)" }}>
        {cards.map((c) => {
          const setStr = [c.setCode, c.setNumber].filter(Boolean).join("-");
          const rarityInfo = RARITY_LABELS[c.rarity];
          const nameColor = TYPE_COLORS[c.type] || "#E2E8F0";

          return (
            <button
              key={c.id}
              onClick={() => handleClick(c.id)}
              className="w-full text-left px-4 py-2.5 border-b border-[#162A3F]/50 hover:bg-[#0D1D2E] transition-colors group"
              data-testid={`recent-card-${c.id}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-sm font-semibold truncate flex-1"
                  style={{ color: nameColor }}
                >
                  {c.name}
                </span>
                {rarityInfo && (
                  <span
                    className="text-[0.6rem] font-bold shrink-0"
                    style={{ color: rarityInfo.color }}
                  >
                    {rarityInfo.text}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {setStr && (
                  <span className="text-[0.6rem] text-[#6A8090] font-mono">{setStr}</span>
                )}
                {c.archetypes.length > 0 && (
                  <span className="text-[0.6rem] text-[#4A6478] truncate">
                    {c.archetypes.join(" / ")}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
