"use client";

import { useState } from "react";
import type { Game, GameSearchResult } from "@/types";
import Navbar from "@/components/Navbar";
import BarcodeScanner from "@/components/BarcodeScanner";
import PhotoCapture from "@/components/PhotoCapture";
import GameSearchResults from "@/components/GameSearchResults";
import ManualGameForm from "@/components/ManualGameForm";
import ItemForm from "@/components/ItemForm";
import toast from "react-hot-toast";

type Step =
  | "method"
  | "scanning"
  | "photo"
  | "search"
  | "results"
  | "manual"
  | "item-form";

export default function NewItemPage() {
  const [step, setStep] = useState<Step>("method");
  const [searchResults, setSearchResults] = useState<GameSearchResult[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [barcode, setBarcode] = useState("");

  // --- Barcode flow ---
  async function handleBarcodeDetected(code: string) {
    setBarcode(code);
    setLoading(true);
    setStep("results");

    try {
      const res = await fetch("/api/identify/barcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSearchResults(data.results ?? []);
      if (!data.results?.length) {
        toast("ChatGPT could not identify the barcode. Try photo or manual search.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to identify barcode");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }

  // --- Photo flow ---
  async function handlePhotoCapture(file: File) {
    setLoading(true);
    setStep("results");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/identify/image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSearchResults(data.results ?? []);
      if (!data.results?.length) {
        toast("ChatGPT could not identify the game. Try manual search.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to identify image");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }

  // --- Manual search flow ---
  async function handleManualSearch() {
    if (searchQuery.trim().length < 2) return;
    setLoading(true);
    setStep("results");

    try {
      const res = await fetch(
        `/api/search/games?q=${encodeURIComponent(searchQuery.trim())}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSearchResults(data.results ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }

  // --- Select game from ChatGPT results → save to DB ---
  async function handleSelectResult(result: GameSearchResult) {
    setLoading(true);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.title,
          platform: result.platform,
          genre: result.genres,
          saga: result.franchise || null,
          release_date: result.release_date || null,
          summary: result.summary || null,
          source: "CHATGPT",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSelectedGame(data.game);
      setStep("item-form");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save game"
      );
    } finally {
      setLoading(false);
    }
  }

  // --- Manual game created ---
  function handleManualGameCreated(game: Game) {
    setSelectedGame(game);
    setStep("item-form");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-lg px-4 py-4">
        <h1 className="mb-4 text-xl font-bold">Add Item</h1>

        {/* Step: Choose method */}
        {step === "method" && (
          <div className="space-y-3">
            <button
              onClick={() => setStep("photo")}
              className="card flex w-full items-center gap-3 text-left transition hover:border-vault-400"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-xl">
                {"\u{1F4F7}"}
              </div>
              <div>
                <p className="font-medium">Photo Identify</p>
                <p className="text-xs text-gray-500">
                  Take a photo of the box — ChatGPT identifies the game
                </p>
              </div>
            </button>

            <button
              onClick={() => setStep("scanning")}
              className="card flex w-full items-center gap-3 text-left transition hover:border-vault-400"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-vault-100 text-xl">
                {"\u{1F4CB}"}
              </div>
              <div>
                <p className="font-medium">Scan Barcode</p>
                <p className="text-xs text-gray-500">
                  Scan EAN/UPC — ChatGPT identifies from barcode
                </p>
              </div>
            </button>

            <button
              onClick={() => setStep("search")}
              className="card flex w-full items-center gap-3 text-left transition hover:border-vault-400"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-xl">
                {"\u{1F50D}"}
              </div>
              <div>
                <p className="font-medium">Manual Search</p>
                <p className="text-xs text-gray-500">
                  Type a game title — ChatGPT returns info
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Step: Barcode scanner */}
        {step === "scanning" && (
          <BarcodeScanner
            onDetected={handleBarcodeDetected}
            onClose={() => setStep("method")}
          />
        )}

        {/* Step: Photo capture */}
        {step === "photo" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Photo Identify</h3>
              <button
                onClick={() => setStep("method")}
                className="text-sm text-gray-500"
              >
                Back
              </button>
            </div>
            <PhotoCapture
              onCapture={handlePhotoCapture}
              label="Take a photo of the game box, cartridge, or manual"
            />
          </div>
        )}

        {/* Step: Manual search input */}
        {step === "search" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Search Game</h3>
              <button
                onClick={() => setStep("method")}
                className="text-sm text-gray-500"
              >
                Back
              </button>
            </div>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Game title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                autoFocus
              />
              <button
                onClick={handleManualSearch}
                className="btn-primary"
                disabled={loading || searchQuery.trim().length < 2}
              >
                {loading ? "..." : "Search"}
              </button>
            </div>
          </div>
        )}

        {/* Step: Show results */}
        {step === "results" && (
          <div className="space-y-3">
            <button
              onClick={() => setStep("method")}
              className="text-sm text-gray-500"
            >
              &larr; Back to methods
            </button>

            {barcode && (
              <p className="text-xs text-gray-400">Barcode: {barcode}</p>
            )}

            <GameSearchResults
              results={searchResults}
              loading={loading}
              onSelect={handleSelectResult}
              onManualCreate={() => setStep("manual")}
            />

            {/* Allow refining search */}
            {!loading && (
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Refine search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                />
                <button onClick={handleManualSearch} className="btn-secondary">
                  Search
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step: Manual game creation */}
        {step === "manual" && (
          <ManualGameForm
            onCreated={handleManualGameCreated}
            onCancel={() => setStep("results")}
            initialTitle={searchQuery}
          />
        )}

        {/* Step: Item details form */}
        {step === "item-form" && selectedGame && (
          <ItemForm game={selectedGame} barcode={barcode} />
        )}
      </main>
    </div>
  );
}
