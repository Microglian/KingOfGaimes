import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import CardForm from "@/components/CardForm";
import CardCanvas from "@/components/CardCanvas";
import { getDefaultCard } from "@/lib/constants";
import { createCard, updateCard, getCard, getProxyImageUrl } from "@/lib/api";
import { renderCard, clearImageCache } from "@/lib/cardRenderer";
import { toast } from "sonner";
import { Download, Save, RotateCcw, FileJson, Upload } from "lucide-react";

export default function CardEditorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get("id");
  const [card, setCard] = useState(getDefaultCard());
  const [cardId, setCardId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [autoRender, setAutoRender] = useState(true);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const canvasRef = useRef(null);
  const inactivityTimer = useRef(null);
  const autoRenderRef = useRef(autoRender);

  // Keep ref in sync
  autoRenderRef.current = autoRender;

  // Load card if editing
  useEffect(() => {
    if (editId) {
      getCard(editId)
        .then((data) => {
          setCard(data);
          setCardId(data.id);
          setRenderTrigger((t) => t + 1);
        })
        .catch(() => toast.error("Failed to load card"));
    }
  }, [editId]);

  // Initial render
  useEffect(() => {
    setRenderTrigger((t) => t + 1);
  }, []);

  const handleCardChange = useCallback((field, value) => {
    setCard((prev) => ({ ...prev, [field]: value }));

    // Only schedule auto-render if autoRender is currently on
    if (autoRenderRef.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        setRenderTrigger((t) => t + 1);
      }, 800);
    }
  }, []);

  const handleRender = useCallback(() => {
    setRenderTrigger((t) => t + 1);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      if (cardId) {
        await updateCard(cardId, card);
        toast.success("Card updated");
      } else {
        const created = await createCard(card);
        setCardId(created.id);
        toast.success("Card saved");
        navigate(`/?id=${created.id}`, { replace: true });
      }
    } catch {
      toast.error("Failed to save card");
    } finally {
      setSaving(false);
    }
  }, [card, cardId, navigate]);

  const handleNew = useCallback(() => {
    setCard(getDefaultCard());
    setCardId(null);
    clearImageCache();
    setRenderTrigger((t) => t + 1);
    navigate("/", { replace: true });
  }, [navigate]);

  const handleExportPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary high-res canvas for export
    const exportCanvas = document.createElement("canvas");
    const currentCard = card;
    const proxyUrl = currentCard.imageUrl ? getProxyImageUrl(currentCard.imageUrl) : "";

    renderCard(exportCanvas, currentCard, { scale: 2, proxyUrl }).then(() => {
      const dataUrl = exportCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${currentCard.name || "card"}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("PNG exported");
    }).catch(() => {
      toast.error("Failed to export PNG");
    });
  }, [card]);

  const handleExportJson = useCallback(() => {
    const jsonStr = JSON.stringify(card, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `${card.name || "card"}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("JSON exported");
  }, [card]);

  const handleImportJson = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setCard({ ...getDefaultCard(), ...data });
        setCardId(null);
        clearImageCache();
        setRenderTrigger((t) => t + 1);
        toast.success("Card imported from JSON");
      } catch {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  return (
    <div className="editor-layout" data-testid="editor-layout">
      {/* Left: Form Panel */}
      <div className="form-panel" data-testid="form-panel">
        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-[#162A3F]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-cyan flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs"
            data-testid="save-card-btn"
          >
            <Save size={14} />
            {saving ? "Saving..." : cardId ? "Update" : "Save"}
          </button>
          <button
            onClick={handleNew}
            className="btn-outline-dark flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs"
            data-testid="new-card-btn"
          >
            <RotateCcw size={14} />
            New
          </button>
          <button
            onClick={handleExportPng}
            className="btn-outline-dark flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs"
            data-testid="export-png-btn"
          >
            <Download size={14} />
            PNG
          </button>
          <button
            onClick={handleExportJson}
            className="btn-outline-dark flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs"
            data-testid="export-json-btn"
          >
            <FileJson size={14} />
            JSON
          </button>
          <label className="btn-outline-dark flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs cursor-pointer" data-testid="import-json-btn">
            <Upload size={14} />
            Import
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>
        </div>

        <CardForm card={card} onChange={handleCardChange} />
      </div>

      {/* Right: Preview Panel */}
      <div className="preview-panel" data-testid="preview-panel">
        <div className="flex flex-col items-center gap-4">
          <CardCanvas
            ref={canvasRef}
            card={card}
            renderTrigger={renderTrigger}
          />
          <div className="flex items-center gap-4 relative z-10">
            <label className="flex items-center gap-2 text-xs text-[#8BA0B2] cursor-pointer">
              <input
                type="checkbox"
                checked={autoRender}
                onChange={(e) => setAutoRender(e.target.checked)}
                className="accent-[#00E5FF]"
                data-testid="auto-render-checkbox"
              />
              Auto-render
            </label>
            {!autoRender && (
              <button
                onClick={handleRender}
                className="btn-cyan px-4 py-1.5 rounded-md text-xs"
                data-testid="render-btn"
              >
                Render
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
