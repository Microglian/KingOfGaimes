import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchCards, deleteCard, exportAllCards, importCards } from "@/lib/api";
import { CARD_TYPES, ATTRIBUTES, RARITIES, FRAME_COLORS } from "@/lib/constants";
import { renderCard } from "@/lib/cardRenderer";
import { toast } from "sonner";
import { Search, Trash2, Edit, Download, Upload, X, SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CollectionPage() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    name: "", type: "", attribute: "", rarity: "", sort: "updatedAt", order: "desc",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const searchTimer = useRef(null);

  const fetchCards = useCallback(async (f) => {
    setLoading(true);
    try {
      const params = {};
      if (f.name) params.name = f.name;
      if (f.type) params.type = f.type;
      if (f.attribute) params.attribute = f.attribute;
      if (f.rarity) params.rarity = f.rarity;
      params.sort = f.sort;
      params.order = f.order;
      params.limit = 100;
      const result = await searchCards(params);
      setCards(result.cards);
      setTotal(result.total);
    } catch (e) {
      toast.error("Failed to load cards");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards(filters);
  }, []);

  const handleFilterChange = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchCards(next), 300);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCard(deleteTarget.id);
      toast.success("Card deleted");
      setDeleteTarget(null);
      fetchCards(filters);
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleEdit = (card) => {
    navigate(`/?id=${card.id}`);
  };

  const handleExportAll = async () => {
    try {
      const allCards = await exportAllCards();
      const blob = new Blob([JSON.stringify(allCards, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.download = "yugioh_collection.json";
      link.href = URL.createObjectURL(blob);
      link.click();
      toast.success(`Exported ${allCards.length} cards`);
    } catch {
      toast.error("Export failed");
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const arr = Array.isArray(data) ? data : [data];
        await importCards(arr);
        toast.success(`Imported ${arr.length} card(s)`);
        fetchCards(filters);
      } catch {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="p-6 md:p-8" data-testid="collection-page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }} data-testid="collection-title">
              Collection
            </h2>
            <p className="text-sm text-[#8BA0B2] mt-1">{total} card{total !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportAll} className="btn-outline-dark flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs" data-testid="export-all-btn">
              <Download size={14} /> Export All
            </button>
            <label className="btn-cyan flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs cursor-pointer" data-testid="import-collection-btn">
              <Upload size={14} /> Import
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A6478]" />
              <input
                type="text"
                placeholder="Search cards by name..."
                value={filters.name}
                onChange={(e) => handleFilterChange("name", e.target.value)}
                className="search-input"
                data-testid="search-input"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-outline-dark flex items-center gap-1.5 px-3 py-2 rounded-md text-xs ${showFilters ? '!border-[#00E5FF] !text-[#00E5FF]' : ''}`}
              data-testid="toggle-filters-btn"
            >
              <SlidersHorizontal size={14} /> Filters
            </button>
          </div>
          
          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 animate-fade-in p-4 rounded-md" style={{ background: '#08131F', border: '1px solid #162A3F' }}>
              <div className="w-40">
                <Select value={filters.type || "all"} onValueChange={(v) => handleFilterChange("type", v === "all" ? "" : v)}>
                  <SelectTrigger className="form-input-dark h-8 text-xs" data-testid="filter-type">
                    <SelectValue placeholder="Card Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {CARD_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-36">
                <Select value={filters.attribute || "all"} onValueChange={(v) => handleFilterChange("attribute", v === "all" ? "" : v)}>
                  <SelectTrigger className="form-input-dark h-8 text-xs" data-testid="filter-attribute">
                    <SelectValue placeholder="Attribute" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Attributes</SelectItem>
                    {ATTRIBUTES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-36">
                <Select value={filters.rarity || "all"} onValueChange={(v) => handleFilterChange("rarity", v === "all" ? "" : v)}>
                  <SelectTrigger className="form-input-dark h-8 text-xs" data-testid="filter-rarity">
                    <SelectValue placeholder="Rarity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rarities</SelectItem>
                    {RARITIES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-36">
                <Select value={filters.sort} onValueChange={(v) => handleFilterChange("sort", v)}>
                  <SelectTrigger className="form-input-dark h-8 text-xs" data-testid="filter-sort">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updatedAt">Last Updated</SelectItem>
                    <SelectItem value="createdAt">Created</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="rarity">Rarity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <button
                onClick={() => {
                  const reset = { name: "", type: "", attribute: "", rarity: "", sort: "updatedAt", order: "desc" };
                  setFilters(reset);
                  fetchCards(reset);
                }}
                className="text-xs text-[#8BA0B2] hover:text-[#00E5FF] transition-colors flex items-center gap-1"
                data-testid="clear-filters-btn"
              >
                <X size={12} /> Clear
              </button>
            </div>
          )}
        </div>

        {/* Card Grid */}
        {loading ? (
          <div className="text-center py-20 text-[#8BA0B2]" data-testid="loading-indicator">Loading...</div>
        ) : cards.length === 0 ? (
          <div className="text-center py-20" data-testid="empty-collection">
            <p className="text-[#8BA0B2] text-lg">No cards found</p>
            <p className="text-[#4A6478] text-sm mt-2">Create your first card in the Editor</p>
          </div>
        ) : (
          <div className="collection-grid" data-testid="collection-grid">
            {cards.map((c) => (
              <CollectionCard key={c.id} card={c} onEdit={handleEdit} onDelete={setDeleteTarget} />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="bg-[#08131F] border-[#162A3F]" data-testid="delete-dialog">
          <DialogHeader>
            <DialogTitle>Delete Card</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.name || "Untitled"}"? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setDeleteTarget(null)} className="btn-outline-dark px-4 py-2 rounded-md text-sm">Cancel</button>
            <button onClick={handleDelete} className="px-4 py-2 rounded-md text-sm bg-red-600 text-white hover:bg-red-500 transition-colors" data-testid="confirm-delete-btn">Delete</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CollectionCard({ card, onEdit, onDelete }) {
  const canvasRef = useRef(null);
  const rendered = useRef(false);

  useEffect(() => {
    if (canvasRef.current && !rendered.current) {
      rendered.current = true;
      renderCard(canvasRef.current, card, { scale: 0.5 }).catch(() => {});
    }
  }, [card]);

  const frameColor = FRAME_COLORS[card.type] || "#555";

  return (
    <div className="collection-card" data-testid={`collection-card-${card.id}`}>
      <div className="collection-card-preview" onClick={() => onEdit(card)}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
      <div className="collection-card-info">
        <p className="text-sm font-semibold text-[#E2E8F0] truncate" style={{ fontFamily: 'Outfit' }}>
          {card.name || "Untitled"}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span
            className="text-[0.65rem] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded"
            style={{ background: frameColor + "22", color: frameColor, border: `1px solid ${frameColor}44` }}
          >
            {card.type?.replace(/_/g, " ")}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(card)}
              className="p-1 text-[#8BA0B2] hover:text-[#00E5FF] transition-colors"
              data-testid={`edit-card-${card.id}`}
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => onDelete(card)}
              className="p-1 text-[#8BA0B2] hover:text-red-400 transition-colors"
              data-testid={`delete-card-${card.id}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
