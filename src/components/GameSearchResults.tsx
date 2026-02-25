"use client";

import type { GameSearchResult } from "@/types";
import { formatDate } from "@/lib/utils";

interface GameSearchResultsProps {
  results: GameSearchResult[];
  loading?: boolean;
  onSelect: (result: GameSearchResult) => void;
  onManualCreate: () => void;
}

export default function GameSearchResults({
  results,
  loading,
  onSelect,
  onManualCreate,
}: GameSearchResultsProps) {
  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-vault-600 border-t-transparent" />
        <p className="text-sm text-gray-500">
          Analyzing with ChatGPT...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium">
        {results.length > 0
          ? "ChatGPT identified these games:"
          : "No matches found"}
      </h3>

      {results.map((result, idx) => (
        <button
          key={`${result.title}-${result.platform}-${idx}`}
          onClick={() => onSelect(result)}
          className="flex w-full items-start gap-3 rounded-lg border border-gray-200 p-3 text-left transition hover:border-vault-400 hover:bg-vault-50"
        >
          <div className="flex h-20 w-14 flex-shrink-0 items-center justify-center rounded bg-gradient-to-br from-vault-100 to-vault-200 text-center text-[10px] font-bold leading-tight text-vault-700">
            {result.platform}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-medium leading-tight">{result.title}</p>
            <p className="mt-0.5 text-xs text-gray-500">{result.platform}</p>
            {result.release_date && (
              <p className="text-xs text-gray-400">
                {formatDate(result.release_date)}
              </p>
            )}
            {result.genres.length > 0 && (
              <p className="mt-1 text-xs text-gray-400">
                {result.genres.join(", ")}
              </p>
            )}
            {result.region && (
              <span className="mt-1 inline-block rounded-full bg-purple-50 px-2 py-0.5 text-[10px] text-purple-600">
                {result.region}
              </span>
            )}
          </div>
        </button>
      ))}

      <button onClick={onManualCreate} className="btn-secondary w-full">
        Not here? Create game manually
      </button>
    </div>
  );
}
