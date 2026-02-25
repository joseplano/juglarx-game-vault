"use client";

import { useState, useMemo } from "react";
import type { Item, Game } from "@/types";
import ItemCard from "@/components/ItemCard";
import Filters from "@/components/Filters";

type ItemWithGame = Item & { game: Game };

interface CollectionListProps {
  initialItems: ItemWithGame[];
}

export default function CollectionList({ initialItems }: CollectionListProps) {
  const [filters, setFilters] = useState({
    platform: "",
    condition: "",
    completeness: "",
    region: "",
    search: "",
  });

  const filtered = useMemo(() => {
    return initialItems.filter((item) => {
      if (
        filters.search &&
        !item.game?.title
          ?.toLowerCase()
          .includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (filters.platform && item.game?.platform !== filters.platform) {
        return false;
      }
      if (filters.condition && item.condition !== filters.condition) {
        return false;
      }
      if (filters.completeness && item.completeness !== filters.completeness) {
        return false;
      }
      if (filters.region && item.region !== filters.region) {
        return false;
      }
      return true;
    });
  }, [initialItems, filters]);

  return (
    <div className="space-y-4">
      <Filters filters={filters} onChange={setFilters} />

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">
            {initialItems.length === 0
              ? "Your collection is empty. Add your first item!"
              : "No items match the current filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item as ItemWithGame} />
          ))}
        </div>
      )}
    </div>
  );
}
