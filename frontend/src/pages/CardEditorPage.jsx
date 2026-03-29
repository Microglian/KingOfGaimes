import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import CardForm from "@/components/CardForm";
import CardCanvas from "@/components/CardCanvas";
import { getDefaultCard } from "@/lib/constants";
import { createCard, updateCard, getCard, getProxyImageUrl } from "@/lib/api";
import { renderCard, clearImageCache, generateThumbnail } from "@/lib/cardRenderer";
import { toast } from "sonner";
import { Download, Save, Copy, RotateCcw, FileJson, Upload, ChevronDown } from "lucide-react";

export default function CardEditorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get("id");
  const [card, setCard] = useState(getDefaultCard());
  const [cardId, setCardId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [autoRender, setAutoRender] = useState(true);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const [localImageData, setLocalImageData] = useState(null);
  const [saveImageData, setSaveImageData] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [fullscreenPreview, setFullscreenPreview] = useState(null);
  const canvasRef = useRef(null);
  const inactivityTimer = useRef(null);
  const autoRenderRef = useRef(autoRender);
  const localImageDataRef = useRef(localImageData);

  autoRenderRef.current = autoRender;
  localImageDataRef.current = localImageData;

  useEffect(() => {
    if (editId) {
      getCard(editId)
        .then((data) => {
          setCard(data);
          setCardId(data.id);
          setLocalImageData(null);
          setRenderTrigger((t) => t + 1);
        })
        .catch(() => toast.error("Failed to load card"));
    }
  }, [editId]);

  useEffect(() => {
    // Skip initial render if we're about to load a card from the API
    if (!editId) {
      setRenderTrigger((t) => t + 1);
    }
  }, [editId]);

  const handleCardChange = useCallback((field, value) => {
    setCard((prev) => ({ ...prev, [field]: value }));
    if (autoRenderRef.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => setRenderTrigger((t) => t + 1), 800);
    }
  }, []);

  const handleLocalImageChange = useCallback((dataUrl, fileName) => {
    setLocalImageData(dataUrl);
    // Store just the filename as a reference
    setCard((prev) => ({ ...prev, imageUrl: `file:${fileName}` }));
    if (autoRenderRef.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => setRenderTrigger((t) => t + 1), 400);
    }
  }, []);

  const handleRender = useCallback(() => setRenderTrigger((t) => t + 1), []);

  const doSave = useCallback(async (asNew) => {
    setSaving(true);
    try {
      const saveData = { ...card };
      // If "save image data" is checked and we have local data, embed it
      if (saveImageData && localImageData) {
        saveData.imageUrl = localImageData;
      }
      // Generate thumbnail from current canvas
      if (canvasRef.current) {
        try { saveData.thumbnail = generateThumbnail(canvasRef.current); } catch { /* ok */ }
      }

      if (cardId && !asNew) {
        await updateCard(cardId, saveData);
        toast.success("Card updated");
      } else {
        const created = await createCard(saveData);
        setCardId(created.id);
        toast.success(asNew ? "Saved as new card" : "Card saved");
        navigate(`/?id=${created.id}`, { replace: true });
      }
    } catch {
      toast.error("Failed to save card");
    } finally {
      setSaving(false);
    }
  }, [card, cardId, navigate, saveImageData, localImageData]);

  const handleNew = useCallback(() => {
    setCard(getDefaultCard());
    setCardId(null);
    setLocalImageData(null);
    clearImageCache();
    setRenderTrigger((t) => t + 1);
    navigate("/", { replace: true });
  }, [navigate]);

  const handleExportPng = useCallback((scale = 1) => {
    // For standard (1x = 813x1185): use existing canvas
    if (scale === 1) {
      const canvas = canvasRef.current;
      if (!canvas) { toast.error("No canvas available"); return; }
      try {
        const dataUrl = canvas.toDataURL("image/png");
        triggerDownload(dataUrl, `${card.name || "card"}.png`);
      } catch {
        toast.error("PNG export failed (canvas may be tainted by cross-origin image)");
      }
      return;
    }
    // Print-ready (2x = 1626x2370): render to a new canvas
    toast.info("Rendering print-ready image...");
    const exportCanvas = document.createElement("canvas");
    const proxyUrl = (card.imageUrl && !card.imageUrl.startsWith("file:") && !card.imageUrl.startsWith("data:"))
      ? getProxyImageUrl(card.imageUrl) : "";
    renderCard(exportCanvas, card, { scale: 2, proxyUrl, localImageData: localImageDataRef.current })
      .then(() => {
        try {
          const dataUrl = exportCanvas.toDataURL("image/png");
          triggerDownload(dataUrl, `${card.name || "card"}_print.png`);
          toast.success("Exported print-ready image (1626x2370)");
        } catch {
          toast.error("PNG export failed");
        }
      }).catch(() => toast.error("Render failed"));
  }, [card]);

  const handleExportJson = useCallback(() => {
    const exportCard = { ...card };
    // Don't export local image data references
    if (exportCard.imageUrl?.startsWith("file:")) {
      exportCard.imageUrl = "";
    }
    delete exportCard.thumbnail;
    const jsonStr = JSON.stringify(exportCard, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `${card.name || "card"}.json`);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
        setLocalImageData(null);
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

  const handleFullscreenPreview = useCallback(() => {
    const exportCanvas = document.createElement("canvas");
    const proxyUrl = (card.imageUrl && !card.imageUrl.startsWith("file:") && !card.imageUrl.startsWith("data:"))
      ? getProxyImageUrl(card.imageUrl) : "";
    renderCard(exportCanvas, card, { scale: 2, proxyUrl, localImageData: localImageDataRef.current })
      .then(() => {
        try {
          const dataUrl = exportCanvas.toDataURL("image/png");
          setFullscreenPreview(dataUrl);
        } catch {
          toast.error("Could not generate preview");
        }
      }).catch(() => toast.error("Render failed"));
  }, [card]);

  const showReuploadHint = card.imageUrl?.startsWith("file:") && !localImageData;

  return (
    <div className="editor-layout" data-testid="editor-layout">
      <div className="form-panel" data-testid="form-panel">
        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-[#162A3F]">
          <button onClick={() => doSave(false)} disabled={saving}
            className="btn-cyan flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs" data-testid="save-card-btn">
            <Save size={14} /> {saving ? "Saving..." : cardId ? "Update" : "Save"}
          </button>
          {cardId && (
            <button onClick={() => doSave(true)} disabled={saving}
              className="btn-outline-dark flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs" data-testid="save-as-new-btn"
              style={{ borderColor: '#00C9A7', color: '#00C9A7' }}>
              <Copy size={14} /> Save as New
            </button>
          )}
          <button onClick={handleNew}
            className="btn-outline-dark flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs" data-testid="new-card-btn">
            <RotateCcw size={14} /> New
          </button>
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn-outline-dark flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs" data-testid="export-png-btn">
              <Download size={14} /> PNG
              <ChevronDown size={10} />
            </button>
            {showExportMenu && (
              <div className="absolute z-50 top-full left-0 mt-1 rounded-md border border-[#162A3F] py-1 min-w-[180px]" style={{ background: '#0D1D2E' }}>
                <button onClick={() => { handleExportPng(1); setShowExportMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#E2E8F0] hover:bg-[#162A3F]" data-testid="export-png-1x">
                  Standard (813x1185)
                </button>
                <button onClick={() => { handleExportPng(2); setShowExportMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#00E5FF] hover:bg-[#162A3F] font-semibold" data-testid="export-png-2x">
                  Print Ready (1626x2370)
                </button>
              </div>
            )}
          </div>
          <button onClick={handleExportJson}
            className="btn-outline-dark flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs" data-testid="export-json-btn">
            <FileJson size={14} /> JSON
          </button>
          <label className="btn-outline-dark flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs cursor-pointer" data-testid="import-json-btn">
            <Upload size={14} /> Import
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>
        </div>

        {showReuploadHint && (
          <div className="mx-4 mt-3 p-2 rounded text-xs" style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: '#8BA0B2' }} data-testid="reupload-hint">
            Image file reference: <span className="text-[#00E5FF] font-mono">{card.imageUrl.replace("file:", "")}</span>
            <br/>Re-upload the file to see the image.
          </div>
        )}

        <CardForm
          card={card}
          onChange={handleCardChange}
          onLocalImageChange={handleLocalImageChange}
          saveImageData={saveImageData}
          onSaveImageDataChange={setSaveImageData}
          localImageData={localImageData}
        />
      </div>

      <div className="preview-panel" data-testid="preview-panel">
        <div className="flex flex-col items-center gap-4">
          <div onClick={handleFullscreenPreview} className="cursor-zoom-in" title="Click to view full resolution">
            <CardCanvas ref={canvasRef} card={card} renderTrigger={renderTrigger} localImageData={localImageData} />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <label className="flex items-center gap-2 text-xs text-[#8BA0B2] cursor-pointer">
              <input type="checkbox" checked={autoRender} onChange={(e) => setAutoRender(e.target.checked)}
                className="accent-[#00E5FF]" data-testid="auto-render-checkbox" />
              Auto-render
            </label>
            {!autoRender && (
              <button onClick={handleRender} className="btn-cyan px-4 py-1.5 rounded-md text-xs" data-testid="render-btn">
                Render
              </button>
            )}
          </div>
          <p className="text-[0.6rem] text-[#4A6478] relative z-10">Click card to view full resolution</p>
        </div>
      </div>

      {/* Fullscreen high-res preview */}
      {fullscreenPreview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setFullscreenPreview(null)}
          data-testid="fullscreen-preview-overlay"
        >
          <img
            src={fullscreenPreview}
            alt="High resolution card preview"
            className="max-h-[95vh] max-w-[95vw] object-contain rounded-lg"
            style={{ filter: "drop-shadow(0 0 60px rgba(0,85,255,0.3))" }}
            data-testid="fullscreen-preview-image"
          />
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white text-2xl font-bold transition-colors"
            onClick={() => setFullscreenPreview(null)}
            data-testid="fullscreen-close-btn"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function triggerDownload(href, filename) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // Remove after a short delay
  setTimeout(() => { try { document.body.removeChild(a); } catch {} }, 500);
}
