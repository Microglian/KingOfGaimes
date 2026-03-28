import { forwardRef, useEffect, useRef, useImperativeHandle } from "react";
import { renderCard, getCardDimensions } from "@/lib/cardRenderer";
import { getProxyImageUrl } from "@/lib/api";

const CardCanvas = forwardRef(function CardCanvas({ card, renderTrigger }, ref) {
  const canvasRef = useRef(null);

  useImperativeHandle(ref, () => canvasRef.current);

  useEffect(() => {
    if (canvasRef.current) {
      const proxyUrl = card.imageUrl ? getProxyImageUrl(card.imageUrl) : "";
      renderCard(canvasRef.current, card, { scale: 1, proxyUrl }).catch(() => {});
    }
  }, [renderTrigger, card]);

  const { width, height } = getCardDimensions();

  return (
    <div className="card-canvas-wrapper" data-testid="card-canvas-wrapper">
      <canvas
        ref={canvasRef}
        data-testid="card-preview-canvas"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: "8px",
        }}
      />
    </div>
  );
});

export default CardCanvas;
