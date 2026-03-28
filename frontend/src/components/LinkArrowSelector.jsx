import { LINK_ARROWS, LINK_ARROW_LABELS } from "@/lib/constants";

export default function LinkArrowSelector({ value = [], onChange }) {
  const toggle = (arrow) => {
    if (!arrow) return;
    const next = value.includes(arrow)
      ? value.filter((a) => a !== arrow)
      : [...value, arrow];
    onChange(next);
  };

  return (
    <div className="link-arrow-grid" data-testid="link-arrow-grid">
      {LINK_ARROWS.map((arrow, i) => {
        if (arrow === "") {
          return <div key={i} className="link-arrow-cell center" />;
        }
        const isActive = value.includes(arrow);
        return (
          <button
            key={arrow}
            type="button"
            onClick={() => toggle(arrow)}
            className={`link-arrow-cell ${isActive ? "active" : ""}`}
            data-testid={`link-arrow-${arrow}`}
          >
            {LINK_ARROW_LABELS[arrow]}
          </button>
        );
      })}
    </div>
  );
}
