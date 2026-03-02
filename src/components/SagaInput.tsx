"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SagaInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SagaInput({
  value,
  onChange,
  placeholder = "Saga / Franchise",
}: SagaInputProps) {
  const [allSagas, setAllSagas] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch all sagas once on mount
  useEffect(() => {
    fetch("/api/sagas")
      .then((r) => r.json())
      .then((data) => setAllSagas(data.sagas ?? []))
      .catch(() => {});
  }, []);

  // Filter suggestions when value changes
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const q = value.trim().toLowerCase();
    const matches = allSagas.filter((s) => s.toLowerCase().includes(q));
    setSuggestions(matches);
    setOpen(matches.length > 0 || value.trim().length > 0);
    setHighlightIndex(-1);
  }, [value, allSagas]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, -1));
      } else if (e.key === "Enter" && highlightIndex >= 0) {
        e.preventDefault();
        onChange(suggestions[highlightIndex]);
        setOpen(false);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [open, suggestions, highlightIndex, onChange]
  );

  const isNewSaga =
    value.trim() &&
    !allSagas.some((s) => s.toLowerCase() === value.trim().toLowerCase());

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (value.trim()) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
      />

      {open && (suggestions.length > 0 || isNewSaga) && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {suggestions.map((s, idx) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(s);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm ${
                  idx === highlightIndex
                    ? "bg-vault-50 text-vault-700"
                    : "hover:bg-gray-50"
                }`}
              >
                {s}
              </button>
            </li>
          ))}

          {isNewSaga && (
            <li>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-green-700 hover:bg-green-50"
              >
                + Crear nueva saga &quot;{value.trim()}&quot;
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
