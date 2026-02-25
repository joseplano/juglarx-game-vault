"use client";

import { useState } from "react";
import { PLATFORMS } from "@/lib/constants";
import type { Game } from "@/types";
import toast from "react-hot-toast";

interface ManualGameFormProps {
  onCreated: (game: Game) => void;
  onCancel: () => void;
  initialTitle?: string;
}

export default function ManualGameForm({
  onCreated,
  onCancel,
  initialTitle = "",
}: ManualGameFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [platform, setPlatform] = useState<string>(PLATFORMS[0]);
  const [genre, setGenre] = useState("");
  const [saga, setSaga] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !platform) return;

    setSaving(true);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          platform,
          genre: genre
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean),
          saga: saga.trim() || null,
          release_date: releaseDate || null,
          summary: summary.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Game created");
      onCreated(data.game);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create game");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-medium">Create Game Manually</h3>

      <div>
        <label className="label">Title *</label>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="label">Platform *</label>
        <select
          className="input"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Genre (comma-separated)</label>
        <input
          className="input"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          placeholder="Action, RPG, Platformer"
        />
      </div>

      <div>
        <label className="label">Saga / Franchise</label>
        <input
          className="input"
          value={saga}
          onChange={(e) => setSaga(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Release Date</label>
        <input
          type="date"
          className="input"
          value={releaseDate}
          onChange={(e) => setReleaseDate(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Summary</label>
        <textarea
          className="input"
          rows={2}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? "Creating..." : "Create Game"}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
