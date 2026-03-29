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

  // Display the canvas at a manageable CSS size (the canvas internal resolution is 813x1185)
  const displayWidth = 420;
  const displayHeight = Math.round(displayWidth * (height / width));

  return (
    <div className="card-canvas-wrapper" data-testid="card-canvas-wrapper">
      <canvas
        ref={canvasRef}
        data-testid="card-preview-canvas"
        style={{ width: `${displayWidth}px`, height: `${displayHeight}px`, borderRadius: "8px" }}
      />
    </div>
  );
});

export default CardCanvas;
