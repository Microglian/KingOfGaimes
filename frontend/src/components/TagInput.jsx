import { useState, useRef } from "react";
import { X } from "lucide-react";

export default function TagInput({ value = [], onChange, placeholder = "Add tag..." }) {
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  const addTag = (tag) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };

  const removeTag = (tag) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="tag-input-wrapper" onClick={() => inputRef.current?.focus()} data-testid="tag-input">
      {value.map((tag) => (
        <span key={tag} className="tag-badge">
          {tag}
          <button type="button" onClick={() => removeTag(tag)} className="tag-remove" data-testid={`remove-tag-${tag}`}>
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input) addTag(input); }}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[80px] bg-transparent border-none outline-none text-sm text-[#E2E8F0] placeholder:text-[#4A6478]"
        data-testid="tag-input-field"
      />
    </div>
  );
}
