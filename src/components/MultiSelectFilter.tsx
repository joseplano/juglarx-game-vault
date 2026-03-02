"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectFilterProps {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  }

  const hasSelected = selected.length > 0;

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`input flex w-auto items-center gap-1.5 text-xs ${
          hasSelected ? "border-vault-500 bg-vault-50 text-vault-700" : ""
        }`}
      >
        <span>{label}</span>
        {hasSelected && (
          <span className="rounded-full bg-vault-600 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
            {selected.length}
          </span>
        )}
        <span className="text-gray-400 text-[10px]">{open ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 z-30 mt-1 min-w-[180px] rounded-lg border border-gray-200 bg-white shadow-xl">
          <ul className="max-h-60 overflow-auto py-1">
            {options.map((opt) => {
              const checked = selected.includes(opt.value);
              return (
                <li key={opt.value}>
                  <label
                    className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                      checked ? "bg-vault-50 text-vault-700" : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(opt.value)}
                      className="h-3.5 w-3.5 rounded border-gray-300 accent-vault-600"
                    />
                    {opt.label}
                  </label>
                </li>
              );
            })}
          </ul>

          {hasSelected && (
            <div className="border-t border-gray-100 px-3 py-1.5">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-vault-600 hover:underline"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
