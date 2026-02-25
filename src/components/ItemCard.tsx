import Link from "next/link";
import type { Item, Game } from "@/types";
import { CONDITION_COLORS } from "@/lib/constants";

interface ItemCardProps {
  item: Item & { game: Game };
}

export default function ItemCard({ item }: ItemCardProps) {
  const game = item.game;
  const conditionColor =
    CONDITION_COLORS[item.condition] || "bg-gray-100 text-gray-800";

  return (
    <Link
      href={`/items/${item.id}`}
      className="flex gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md"
    >
      {game.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={game.cover_url}
          alt={game.title}
          className="h-20 w-14 flex-shrink-0 rounded object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-20 w-14 flex-shrink-0 items-center justify-center rounded bg-gray-200 text-[10px] text-gray-400">
          No img
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium leading-tight">{game.title}</p>
        <p className="text-xs text-gray-500">{game.platform}</p>

        <div className="mt-1.5 flex flex-wrap gap-1">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${conditionColor}`}
          >
            {item.condition.replace("_", " ")}
          </span>
          <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
            {item.completeness === "CIB"
              ? "CIB"
              : item.completeness.replace(/_/g, " ")}
          </span>
          {item.region && (
            <span className="inline-block rounded-full bg-purple-50 px-2 py-0.5 text-[10px] text-purple-600">
              {item.region}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
