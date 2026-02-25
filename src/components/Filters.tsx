"use client";

import { PLATFORMS, REGIONS, CONDITIONS, COMPLETENESS_OPTIONS } from "@/lib/constants";

interface FiltersProps {
  filters: {
    platform: string;
    condition: string;
    completeness: string;
    region: string;
    search: string;
  };
  onChange: (filters: FiltersProps["filters"]) => void;
}

export default function Filters({ filters, onChange }: FiltersProps) {
  function update(key: string, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <input
        type="search"
        className="input"
        placeholder="Search by title..."
        value={filters.search}
        onChange={(e) => update("search", e.target.value)}
      />

      {/* Filter dropdowns */}
      <div className="flex flex-wrap gap-2">
        <select
          className="input w-auto text-xs"
          value={filters.platform}
          onChange={(e) => update("platform", e.target.value)}
        >
          <option value="">All Platforms</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          className="input w-auto text-xs"
          value={filters.region}
          onChange={(e) => update("region", e.target.value)}
        >
          <option value="">All Regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          className="input w-auto text-xs"
          value={filters.condition}
          onChange={(e) => update("condition", e.target.value)}
        >
          <option value="">All Conditions</option>
          {CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          className="input w-auto text-xs"
          value={filters.completeness}
          onChange={(e) => update("completeness", e.target.value)}
        >
          <option value="">All Completeness</option>
          {COMPLETENESS_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        {(filters.platform ||
          filters.region ||
          filters.condition ||
          filters.completeness) && (
          <button
            onClick={() =>
              onChange({
                search: filters.search,
                platform: "",
                condition: "",
                completeness: "",
                region: "",
              })
            }
            className="text-xs text-vault-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
