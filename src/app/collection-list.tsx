"use client";

import { useState, useMemo, useEffect } from "react";
import type { Item, Game } from "@/types";
import ItemCard from "@/components/ItemCard";
import Filters, { type FiltersState, EMPTY_FILTERS } from "@/components/Filters";
import Pagination from "@/components/Pagination";

const PAGE_SIZE = 12;
const FILTERS_STORAGE_KEY = "collection-filters";
const PAGE_STORAGE_KEY = "collection-page";

type ItemWithGame = Item & { game: Game };

interface CollectionListProps {
  initialItems: ItemWithGame[];
}

function loadStoredFilters(): FiltersState {
  if (typeof window === "undefined") return EMPTY_FILTERS;
  try {
    const raw = sessionStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return EMPTY_FILTERS;
    const parsed = JSON.parse(raw) as Partial<FiltersState>;
    return { ...EMPTY_FILTERS, ...parsed };
  } catch {
    return EMPTY_FILTERS;
  }
}

function loadStoredPage(): number {
  if (typeof window === "undefined") return 1;
  const raw = sessionStorage.getItem(PAGE_STORAGE_KEY);
  const n = raw ? parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default function CollectionList({ initialItems }: CollectionListProps) {
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate persisted state after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    setFilters(loadStoredFilters());
    setPage(loadStoredPage());
    setHydrated(true);
  }, []);

  // Persist filters and page across navigation within the session
  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }, [filters, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(PAGE_STORAGE_KEY, String(page));
  }, [page, hydrated]);

  // Derive unique sagas and genres from the collection
  const sagas = useMemo(() => {
    const set = new Set<string>();
    for (const item of initialItems) {
      if (item.game?.saga) set.add(item.game.saga);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [initialItems]);

  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const item of initialItems) {
      for (const g of item.game?.genre ?? []) {
        if (g) set.add(g);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [initialItems]);

  const filtered = useMemo(() => {
    return initialItems.filter((item) => {
      if (
        filters.search &&
        !item.game?.title?.toLowerCase().includes(filters.search.toLowerCase())
      ) return false;
      if (filters.platform.length > 0 && !filters.platform.includes(item.game?.platform ?? "")) return false;
      if (filters.condition.length > 0 && !filters.condition.includes(item.condition)) return false;
      if (filters.completeness.length > 0 && !filters.completeness.includes(item.completeness)) return false;
      if (filters.region.length > 0 && !filters.region.includes(item.region ?? "")) return false;
      if (filters.saga.length > 0 && !filters.saga.includes(item.game?.saga ?? "")) return false;
      if (filters.genre.length > 0 && !filters.genre.some((g) => item.game?.genre?.includes(g))) return false;
      return true;
    });
  }, [initialItems, filters]);

  function handleFiltersChange(next: FiltersState) {
    setFilters(next);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <div className="space-y-4">
      <Filters
        filters={filters}
        onChange={handleFiltersChange}
        sagas={sagas}
        genres={genres}
      />

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">
            {initialItems.length === 0
              ? "Your collection is empty. Add your first item!"
              : "No items match the current filters."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400">
            {filtered.length === initialItems.length
              ? `${filtered.length} item${filtered.length !== 1 ? "s" : ""}`
              : `${filtered.length} of ${initialItems.length} items`}
            {totalPages > 1 && ` · Page ${safePage} of ${totalPages}`}
          </p>

          <div className="space-y-2">
            {paginated.map((item) => (
              <ItemCard key={item.id} item={item as ItemWithGame} />
            ))}
          </div>

          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
