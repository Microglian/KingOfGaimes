import { forwardRef, useEffect, useRef, useImperativeHandle, useCallback } from "react";
import { renderCard, getCardDimensions } from "@/lib/cardRenderer";
import { getProxyImageUrl } from "@/lib/api";

const CardCanvas = forwardRef(function CardCanvas({ card, renderTrigger }, ref) {
  const canvasRef = useRef(null);
  const cardRef = useRef(card);
  const renderIdRef = useRef(0);

  // Always keep cardRef current
  cardRef.current = card;

  useImperativeHandle(ref, () => canvasRef.current);

  useEffect(() => {
    if (!canvasRef.current) return;
    // Increment render ID to cancel stale renders
    const myRenderId = ++renderIdRef.current;
    const currentCard = cardRef.current;
    const proxyUrl = currentCard.imageUrl ? getProxyImageUrl(currentCard.imageUrl) : "";

    renderCard(canvasRef.current, currentCard, { scale: 1, proxyUrl }).then(() => {
      // If a newer render was triggered, this one is stale - ignore
      if (renderIdRef.current !== myRenderId) return;
    }).catch(() => {});
  }, [renderTrigger]); // Only re-render when renderTrigger changes

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
