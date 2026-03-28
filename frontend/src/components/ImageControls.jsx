import { Slider } from "@/components/ui/slider";
import { Image as ImageIcon } from "lucide-react";

export default function ImageControls({ card, onChange, onLocalImageChange, saveImageData, onSaveImageDataChange, localImageData }) {
  const hasLocalImage = !!localImageData;
  const isFileRef = card.imageUrl?.startsWith("file:");

  return (
    <div className="space-y-3" data-testid="image-controls">
      {/* Image URL */}
      <div>
        <label className="form-label">Image URL</label>
        <input
          type="text"
          value={isFileRef ? "" : (card.imageUrl || "")}
          onChange={(e) => onChange("imageUrl", e.target.value)}
          placeholder="https://example.com/image.png"
          className="form-input-dark w-full h-8 px-3 rounded-md text-sm border"
          data-testid="image-url-input"
        />
      </div>

      {/* Local file upload */}
      <div>
        <label className="form-label">Or Upload File</label>
        <div className="flex items-center gap-3">
          <label className="btn-outline-dark flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs cursor-pointer">
            <ImageIcon size={14} />
            Choose File
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    if (onLocalImageChange) onLocalImageChange(ev.target.result, file.name);
                  };
                  reader.readAsDataURL(file);
                }
                e.target.value = "";
              }}
              data-testid="image-file-input"
            />
          </label>
          {hasLocalImage && (
            <span className="text-[0.65rem] text-[#00C9A7]">Image loaded in memory</span>
          )}
        </div>
      </div>

      {/* Save image data checkbox */}
      <div>
        <label className="flex items-center gap-2 text-xs text-[#8BA0B2] cursor-pointer" data-testid="save-image-data-label">
          <input
            type="checkbox"
            checked={saveImageData}
            onChange={(e) => onSaveImageDataChange(e.target.checked)}
            className="accent-[#00E5FF]"
            data-testid="save-image-data-checkbox"
          />
          Save image data to DB (large files = slower saves)
        </label>
        <p className="text-[0.6rem] text-[#4A6478] mt-1 ml-5">
          When unchecked, only the filename is stored. Re-upload needed after loading.
        </p>
      </div>

      {/* Zoom */}
      <div>
        <label className="form-label">Zoom: {(card.imageCrop?.zoom || 1).toFixed(2)}x</label>
        <Slider
          value={[card.imageCrop?.zoom || 1]}
          onValueChange={([v]) => onChange("imageCrop", { ...card.imageCrop, zoom: v })}
          min={0.5} max={3} step={0.05} className="mt-1"
          data-testid="image-zoom-slider"
        />
      </div>

      {/* X Offset */}
      <div>
        <label className="form-label">X Offset: {card.imageOffset?.x || 0}px</label>
        <Slider
          value={[card.imageOffset?.x || 0]}
          onValueChange={([v]) => onChange("imageOffset", { ...card.imageOffset, x: v })}
          min={-200} max={200} step={1} className="mt-1"
          data-testid="image-x-offset-slider"
        />
      </div>

      {/* Y Offset */}
      <div>
        <label className="form-label">Y Offset: {card.imageOffset?.y || 0}px</label>
        <Slider
          value={[card.imageOffset?.y || 0]}
          onValueChange={([v]) => onChange("imageOffset", { ...card.imageOffset, y: v })}
          min={-200} max={200} step={1} className="mt-1"
          data-testid="image-y-offset-slider"
        />
      </div>
    </div>
  );
}
