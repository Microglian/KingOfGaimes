import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchCards, deleteCard, exportAllCards, importCards, getProxyImageUrl } from "@/lib/api";
import { CARD_TYPES, ATTRIBUTES, RARITIES, SPELL_TRAP_TYPES, FRAME_COLORS } from "@/lib/constants";
import { renderCard } from "@/lib/cardRenderer";
import { toast } from "sonner";
import { Search, Trash2, Edit, Download, Upload, X, SlidersHorizontal, FileJson, Image as ImageIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const INITIAL_FILTERS = {
  name: "", type: "", attribute: "", rarity: "", archetype: "", setCode: "", typeLine: "",
  sort: "updatedAt", order: "desc",
};

export default function CollectionPage() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
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
      if (f.archetype) params.archetype = f.archetype;
      if (f.setCode) params.setCode = f.setCode;
      if (f.typeLine) params.typeLine = f.typeLine;
      params.sort = f.sort;
      params.order = f.order;
      params.limit = 200;
      const result = await searchCards(params);
      setCards(result.cards);
      setTotal(result.total);
    } catch {
      toast.error("Failed to load cards");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCards(filters); }, []);

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

  const handleEdit = (card) => navigate(`/?id=${card.id}`);

  const handleExportAll = async () => {
    try {
      const allCards = await exportAllCards();
      if (!allCards || allCards.length === 0) {
        toast.error("No cards to export");
        return;
      }
      const blob = new Blob([JSON.stringify(allCards, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "yugioh_collection.json";
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${allCards.length} cards`);
    } catch {
      toast.error("Export failed");
    }
  };

  const handleExportCardJson = (card) => {
    const blob = new Blob([JSON.stringify(card, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `${card.name || "card"}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Card JSON exported");
  };

  const handleExportCardPng = async (card) => {
    try {
      const exportCanvas = document.createElement("canvas");
      const proxyUrl = card.imageUrl ? getProxyImageUrl(card.imageUrl) : "";
      await renderCard(exportCanvas, card, { scale: 2, proxyUrl });
      const dataUrl = exportCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${card.name || "card"}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Card PNG exported");
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

  const hasActiveFilters = filters.type || filters.attribute || filters.rarity || filters.archetype || filters.setCode || filters.typeLine;

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
              className={`btn-outline-dark flex items-center gap-1.5 px-3 py-2 rounded-md text-xs ${showFilters || hasActiveFilters ? '!border-[#00E5FF] !text-[#00E5FF]' : ''}`}
              data-testid="toggle-filters-btn"
            >
              <SlidersHorizontal size={14} /> Filters {hasActiveFilters && `(active)`}
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-end gap-3 animate-fade-in p-4 rounded-md" style={{ background: '#08131F', border: '1px solid #162A3F' }}>
              <FilterSelect label="Card Type" value={filters.type} onChange={(v) => handleFilterChange("type", v)} testId="filter-type"
                options={CARD_TYPES} allLabel="All Types" />
              <FilterSelect label="Attribute" value={filters.attribute} onChange={(v) => handleFilterChange("attribute", v)} testId="filter-attribute"
                options={ATTRIBUTES} allLabel="All Attributes" />
              <FilterSelect label="Rarity" value={filters.rarity} onChange={(v) => handleFilterChange("rarity", v)} testId="filter-rarity"
                options={RARITIES} allLabel="All Rarities" />
              <FilterSelect label="Sort By" value={filters.sort} onChange={(v) => handleFilterChange("sort", v)} testId="filter-sort"
                options={[
                  { value: "updatedAt", label: "Last Updated" },
                  { value: "createdAt", label: "Created" },
                  { value: "name", label: "Name" },
                  { value: "rarity", label: "Rarity" },
                ]} />

              <div className="w-36">
                <label className="form-label">Archetype</label>
                <input
                  type="text"
                  value={filters.archetype}
                  onChange={(e) => handleFilterChange("archetype", e.target.value)}
                  placeholder="e.g. Blue-Eyes"
                  className="form-input-dark w-full h-8 px-2 rounded-md text-xs border"
                  data-testid="filter-archetype"
                />
              </div>
              <div className="w-32">
                <label className="form-label">Set Code</label>
                <input
                  type="text"
                  value={filters.setCode}
                  onChange={(e) => handleFilterChange("setCode", e.target.value)}
                  placeholder="e.g. LOB"
                  className="form-input-dark w-full h-8 px-2 rounded-md text-xs border"
                  data-testid="filter-set-code"
                />
              </div>
              <div className="w-36">
                <label className="form-label">Type Line</label>
                <input
                  type="text"
                  value={filters.typeLine}
                  onChange={(e) => handleFilterChange("typeLine", e.target.value)}
                  placeholder="e.g. Dragon"
                  className="form-input-dark w-full h-8 px-2 rounded-md text-xs border"
                  data-testid="filter-type-line"
                />
              </div>

              <button
                onClick={() => { setFilters(INITIAL_FILTERS); fetchCards(INITIAL_FILTERS); }}
                className="text-xs text-[#8BA0B2] hover:text-[#00E5FF] transition-colors flex items-center gap-1 pb-1"
                data-testid="clear-filters-btn"
              >
                <X size={12} /> Clear All
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
              <CollectionCard
                key={c.id}
                card={c}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                onExportJson={handleExportCardJson}
                onExportPng={handleExportCardPng}
              />
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
              Are you sure you want to delete &quot;{deleteTarget?.name || "Untitled"}&quot;? This cannot be undone.
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

function FilterSelect({ label, value, onChange, options, allLabel, testId }) {
  return (
    <div className="w-36">
      <label className="form-label">{label}</label>
      <Select value={value || (allLabel ? "all" : options[0]?.value)} onValueChange={(v) => onChange(v === "all" ? "" : v)}>
        <SelectTrigger className="form-input-dark h-8 text-xs" data-testid={testId}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allLabel && <SelectItem value="all">{allLabel}</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function CollectionCard({ card, onEdit, onDelete, onExportJson, onExportPng }) {
  const canvasRef = useRef(null);
  const rendered = useRef(false);

  useEffect(() => {
    if (canvasRef.current && !rendered.current) {
      rendered.current = true;
      const proxyUrl = card.imageUrl ? getProxyImageUrl(card.imageUrl) : "";
      renderCard(canvasRef.current, card, { scale: 0.5, proxyUrl }).catch(() => {});
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
            className="text-[0.6rem] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded"
            style={{ background: frameColor + "22", color: frameColor, border: `1px solid ${frameColor}44` }}
          >
            {card.type?.replace(/_/g, " ")}
          </span>
          <div className="flex items-center gap-0.5">
            <button onClick={() => onExportPng(card)} className="p-1 text-[#8BA0B2] hover:text-[#00E5FF] transition-colors" title="Export PNG" data-testid={`export-png-${card.id}`}>
              <ImageIcon size={13} />
            </button>
            <button onClick={() => onExportJson(card)} className="p-1 text-[#8BA0B2] hover:text-[#00E5FF] transition-colors" title="Export JSON" data-testid={`export-json-${card.id}`}>
              <FileJson size={13} />
            </button>
            <button onClick={() => onEdit(card)} className="p-1 text-[#8BA0B2] hover:text-[#00E5FF] transition-colors" title="Edit" data-testid={`edit-card-${card.id}`}>
              <Edit size={13} />
            </button>
            <button onClick={() => onDelete(card)} className="p-1 text-[#8BA0B2] hover:text-red-400 transition-colors" title="Delete" data-testid={`delete-card-${card.id}`}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
