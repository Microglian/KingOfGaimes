import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import CardForm from "@/components/CardForm";
import CardCanvas from "@/components/CardCanvas";
import { getDefaultCard } from "@/lib/constants";
import { createCard, updateCard, getCard } from "@/lib/api";
import { toast } from "sonner";
import { Download, Save, RotateCcw, FileJson } from "lucide-react";

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

  const handleCardChange = useCallback(
    (field, value) => {
      setCard((prev) => {
        const updated = { ...prev, [field]: value };
        return updated;
      });
      if (autoRender) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = setTimeout(() => {
          setRenderTrigger((t) => t + 1);
        }, 800);
      }
    },
    [autoRender]
  );

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
    } catch (e) {
      toast.error("Failed to save card");
    } finally {
      setSaving(false);
    }
  }, [card, cardId, navigate]);

  const handleNew = useCallback(() => {
    setCard(getDefaultCard());
    setCardId(null);
    setRenderTrigger((t) => t + 1);
    navigate("/", { replace: true });
  }, [navigate]);

  const handleExportPng = useCallback(
    (highRes = false) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Re-render at desired scale then export
      const link = document.createElement("a");
      link.download = `${card.name || "card"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    },
    [card.name]
  );

  const handleExportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(card, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.download = `${card.name || "card"}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
  }, [card]);

  const handleImportJson = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          setCard({ ...getDefaultCard(), ...data });
          setCardId(null);
          setRenderTrigger((t) => t + 1);
          toast.success("Card imported from JSON");
        } catch {
          toast.error("Invalid JSON file");
        }
      };
      reader.readAsText(file);
    },
    []
  );

  return (
    <div className="editor-layout" data-testid="editor-layout">
      {/* Left: Form Panel */}
      <div className="form-panel" data-testid="form-panel">
        {/* Action bar */}
        <div className="flex items-center gap-2 p-4 border-b border-[#162A3F]">
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
            onClick={() => handleExportPng(false)}
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
            <FileJson size={14} />
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
