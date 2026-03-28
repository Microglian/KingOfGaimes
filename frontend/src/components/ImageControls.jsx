import { Slider } from "@/components/ui/slider";
import { Image, Link } from "lucide-react";

export default function ImageControls({ card, onChange }) {
  return (
    <div className="space-y-3" data-testid="image-controls">
      {/* Image URL */}
      <div>
        <label className="form-label">Image URL</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={card.imageUrl || ""}
            onChange={(e) => onChange("imageUrl", e.target.value)}
            placeholder="https://example.com/image.png"
            className="form-input-dark flex-1 h-8 px-3 rounded-md text-sm border"
            data-testid="image-url-input"
          />
        </div>
      </div>

      {/* Local file upload */}
      <div>
        <label className="form-label">Or Upload File</label>
        <label className="btn-outline-dark flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs cursor-pointer w-fit">
          <Image size={14} />
          Choose File
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => onChange("imageUrl", ev.target.result);
                reader.readAsDataURL(file);
              }
            }}
            data-testid="image-file-input"
          />
        </label>
      </div>

      {/* Zoom */}
      <div>
        <label className="form-label">Zoom: {(card.imageCrop?.zoom || 1).toFixed(2)}x</label>
        <Slider
          value={[card.imageCrop?.zoom || 1]}
          onValueChange={([v]) => onChange("imageCrop", { ...card.imageCrop, zoom: v })}
          min={0.5}
          max={3}
          step={0.05}
          className="mt-1"
          data-testid="image-zoom-slider"
        />
      </div>

      {/* X Offset */}
      <div>
        <label className="form-label">X Offset: {card.imageOffset?.x || 0}px</label>
        <Slider
          value={[card.imageOffset?.x || 0]}
          onValueChange={([v]) => onChange("imageOffset", { ...card.imageOffset, x: v })}
          min={-200}
          max={200}
          step={1}
          className="mt-1"
          data-testid="image-x-offset-slider"
        />
      </div>

      {/* Y Offset */}
      <div>
        <label className="form-label">Y Offset: {card.imageOffset?.y || 0}px</label>
        <Slider
          value={[card.imageOffset?.y || 0]}
          onValueChange={([v]) => onChange("imageOffset", { ...card.imageOffset, y: v })}
          min={-200}
          max={200}
          step={1}
          className="mt-1"
          data-testid="image-y-offset-slider"
        />
      </div>
    </div>
  );
}
