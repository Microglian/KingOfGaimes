import { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown } from "lucide-react";

export default function SearchableDropdown({ options = [], value, onChange, placeholder = "Select...", testId }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleSelect = (opt) => {
    onChange(opt);
    setSearch("");
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setSearch("");
  };

  return (
    <div ref={wrapperRef} className="relative" data-testid={testId}>
      <div
        className="form-input-dark flex items-center gap-1 h-8 px-2 rounded-md text-xs border cursor-pointer"
        onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 50); }}
      >
        {value ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <span className="truncate text-[#E2E8F0]">{value}</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); handleClear(); }} className="text-[#8BA0B2] hover:text-[#00E5FF] shrink-0">
              <X size={12} />
            </button>
          </div>
        ) : (
          <span className="text-[#4A6478] flex-1">{placeholder}</span>
        )}
        <ChevronDown size={12} className="text-[#4A6478] shrink-0" />
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border border-[#162A3F] shadow-lg" style={{ background: '#0D1D2E' }}>
          {/* Search input */}
          <div className="p-1.5 border-b border-[#162A3F]">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#4A6478]" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to search..."
                className="w-full bg-[#08131F] border border-[#162A3F] rounded px-2 pl-6 py-1 text-xs text-[#E2E8F0] placeholder:text-[#4A6478] outline-none focus:border-[#00E5FF]"
                data-testid={`${testId}-search`}
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-40 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[#4A6478]">No matches</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#162A3F] transition-colors ${
                    opt === value ? "text-[#00E5FF] bg-[#162A3F]" : "text-[#E2E8F0]"
                  }`}
                  data-testid={`${testId}-option-${opt}`}
                >
                  {opt}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
