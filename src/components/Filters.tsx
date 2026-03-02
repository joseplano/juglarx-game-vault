"use client";

import { PLATFORMS, REGIONS, CONDITIONS, COMPLETENESS_OPTIONS } from "@/lib/constants";

interface FiltersProps {
  filters: {
    platform: string;
    condition: string;
    completeness: string;
    region: string;
    search: string;
    saga: string;
    genre: string;
  };
  onChange: (filters: FiltersProps["filters"]) => void;
  sagas: string[];
  genres: string[];
}

export default function Filters({ filters, onChange, sagas, genres }: FiltersProps) {
  function update(key: string, value: string) {
    onChange({ ...filters, [key]: value });
  }

  const hasActiveFilters =
    filters.platform ||
    filters.region ||
    filters.condition ||
    filters.completeness ||
    filters.saga ||
    filters.genre;

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
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {sagas.length > 0 && (
          <select
            className="input w-auto text-xs"
            value={filters.saga}
            onChange={(e) => update("saga", e.target.value)}
          >
            <option value="">All Sagas</option>
            {sagas.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}

        {genres.length > 0 && (
          <select
            className="input w-auto text-xs"
            value={filters.genre}
            onChange={(e) => update("genre", e.target.value)}
          >
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        )}

        <select
          className="input w-auto text-xs"
          value={filters.region}
          onChange={(e) => update("region", e.target.value)}
        >
          <option value="">All Regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <select
          className="input w-auto text-xs"
          value={filters.condition}
          onChange={(e) => update("condition", e.target.value)}
        >
          <option value="">All Conditions</option>
          {CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <select
          className="input w-auto text-xs"
          value={filters.completeness}
          onChange={(e) => update("completeness", e.target.value)}
        >
          <option value="">All Completeness</option>
          {COMPLETENESS_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={() =>
              onChange({
                search: filters.search,
                platform: "",
                condition: "",
                completeness: "",
                region: "",
                saga: "",
                genre: "",
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
