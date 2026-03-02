"use client";

import { PLATFORMS, REGIONS, CONDITIONS, COMPLETENESS_OPTIONS } from "@/lib/constants";
import MultiSelectFilter from "@/components/MultiSelectFilter";

export interface FiltersState {
  search: string;
  platform: string[];
  saga: string[];
  genre: string[];
  region: string[];
  condition: string[];
  completeness: string[];
}

export const EMPTY_FILTERS: FiltersState = {
  search: "",
  platform: [],
  saga: [],
  genre: [],
  region: [],
  condition: [],
  completeness: [],
};

interface FiltersProps {
  filters: FiltersState;
  onChange: (filters: FiltersState) => void;
  sagas: string[];
  genres: string[];
}

export default function Filters({ filters, onChange, sagas, genres }: FiltersProps) {
  function update<K extends keyof FiltersState>(key: K, value: FiltersState[K]) {
    onChange({ ...filters, [key]: value });
  }

  const hasActiveFilters =
    filters.platform.length > 0 ||
    filters.saga.length > 0 ||
    filters.genre.length > 0 ||
    filters.region.length > 0 ||
    filters.condition.length > 0 ||
    filters.completeness.length > 0;

  // Selected chips (all active filters as removable tags)
  const activeChips: { label: string; key: keyof FiltersState; value: string }[] = [
    ...filters.platform.map((v) => ({ label: v, key: "platform" as const, value: v })),
    ...filters.saga.map((v) => ({ label: v, key: "saga" as const, value: v })),
    ...filters.genre.map((v) => ({ label: v, key: "genre" as const, value: v })),
    ...filters.region.map((v) => ({ label: v, key: "region" as const, value: v })),
    ...filters.condition.map((v) => ({
      label: CONDITIONS.find((c) => c.value === v)?.label ?? v,
      key: "condition" as const,
      value: v,
    })),
    ...filters.completeness.map((v) => ({
      label: COMPLETENESS_OPTIONS.find((c) => c.value === v)?.label ?? v,
      key: "completeness" as const,
      value: v,
    })),
  ];

  function removeChip(key: keyof FiltersState, value: string) {
    const current = filters[key] as string[];
    onChange({ ...filters, [key]: current.filter((v) => v !== value) });
  }

  return (
    <div className="space-y-2">
      {/* Search */}
      <input
        type="search"
        className="input"
        placeholder="Search by title..."
        value={filters.search}
        onChange={(e) => update("search", e.target.value)}
      />

      {/* Multi-select dropdowns */}
      <div className="flex flex-wrap gap-2">
        <MultiSelectFilter
          label="Platform"
          options={PLATFORMS.map((p) => ({ value: p, label: p }))}
          selected={filters.platform}
          onChange={(v) => update("platform", v)}
        />

        {sagas.length > 0 && (
          <MultiSelectFilter
            label="Saga"
            options={sagas.map((s) => ({ value: s, label: s }))}
            selected={filters.saga}
            onChange={(v) => update("saga", v)}
          />
        )}

        {genres.length > 0 && (
          <MultiSelectFilter
            label="Genre"
            options={genres.map((g) => ({ value: g, label: g }))}
            selected={filters.genre}
            onChange={(v) => update("genre", v)}
          />
        )}

        <MultiSelectFilter
          label="Region"
          options={REGIONS.map((r) => ({ value: r, label: r }))}
          selected={filters.region}
          onChange={(v) => update("region", v)}
        />

        <MultiSelectFilter
          label="Condition"
          options={CONDITIONS.map((c) => ({ value: c.value, label: c.label }))}
          selected={filters.condition}
          onChange={(v) => update("condition", v)}
        />

        <MultiSelectFilter
          label="Completeness"
          options={COMPLETENESS_OPTIONS.map((c) => ({ value: c.value, label: c.label }))}
          selected={filters.completeness}
          onChange={(v) => update("completeness", v)}
        />

        {hasActiveFilters && (
          <button
            onClick={() => onChange({ ...EMPTY_FILTERS, search: filters.search })}
            className="text-xs text-vault-600 hover:underline self-center"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeChips.map((chip) => (
            <span
              key={`${chip.key}-${chip.value}`}
              className="flex items-center gap-1 rounded-full bg-vault-100 px-2 py-0.5 text-xs text-vault-700"
            >
              {chip.label}
              <button
                type="button"
                onClick={() => removeChip(chip.key, chip.value)}
                className="ml-0.5 text-vault-500 hover:text-vault-800 font-bold leading-none"
                aria-label={`Remove ${chip.label}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
