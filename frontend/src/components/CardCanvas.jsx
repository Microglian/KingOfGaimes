import { forwardRef, useEffect, useRef, useImperativeHandle } from "react";
import { renderCard, getCardDimensions } from "@/lib/cardRenderer";
import { getProxyImageUrl } from "@/lib/api";

const CardCanvas = forwardRef(function CardCanvas({ card, renderTrigger, localImageData }, ref) {
  const canvasRef = useRef(null);
  const cardRef = useRef(card);
  const localRef = useRef(localImageData);
  const renderIdRef = useRef(0);

  cardRef.current = card;
  localRef.current = localImageData;

  useImperativeHandle(ref, () => canvasRef.current);

  useEffect(() => {
    if (!canvasRef.current) return;
    const myRenderId = ++renderIdRef.current;
    const c = cardRef.current;
    const local = localRef.current;
    const proxyUrl = (c.imageUrl && !c.imageUrl.startsWith("file:") && !c.imageUrl.startsWith("data:"))
      ? getProxyImageUrl(c.imageUrl) : "";

    renderCard(canvasRef.current, c, { scale: 1, proxyUrl, localImageData: local })
      .then(() => { if (renderIdRef.current !== myRenderId) return; })
      .catch(() => {});
  }, [renderTrigger]);

  const { width, height } = getCardDimensions();

  return (
    <div className="card-canvas-wrapper" data-testid="card-canvas-wrapper">
      <canvas
        ref={canvasRef}
        data-testid="card-preview-canvas"
        style={{ width: `${width}px`, height: `${height}px`, borderRadius: "8px" }}
      />
    </div>
  );
});

export default CardCanvas;
