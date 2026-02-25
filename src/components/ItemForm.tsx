"use client";

import { useState } from "react";
import type { Game, ItemFormData, PhotoKind } from "@/types";
import {
  REGIONS,
  CONDITIONS,
  COMPLETENESS_OPTIONS,
  PHOTO_KINDS,
} from "@/lib/constants";
import { getCompletenessDefaults } from "@/lib/utils";
import PhotoUploader from "./PhotoUploader";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface ItemFormProps {
  game: Game;
  barcode?: string;
}

export default function ItemForm({ game, barcode = "" }: ItemFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [itemId, setItemId] = useState<string | null>(null);

  const [form, setForm] = useState<ItemFormData>({
    region: "NTSC-J",
    condition: "GOOD",
    completeness: "CIB",
    has_cartridge: true,
    has_box: true,
    has_manual: true,
    has_extras: true,
    notes: "",
    barcode,
  });

  function handleCompletenessChange(val: string) {
    const defaults = getCompletenessDefaults(
      val as ItemFormData["completeness"]
    );
    setForm((f) => ({
      ...f,
      completeness: val as ItemFormData["completeness"],
      has_cartridge: defaults.cart,
      has_box: defaults.box,
      has_manual: defaults.manual,
      has_extras: defaults.extras,
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: game.id,
          ...form,
          barcode: form.barcode || null,
          notes: form.notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setItemId(data.item.id);
      toast.success("Item saved! Now add photos if you want.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save item"
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDone() {
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Game info header */}
      <div className="flex items-start gap-3 rounded-lg bg-vault-50 p-3">
        {game.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.cover_url}
            alt={game.title}
            className="h-24 w-16 rounded object-cover"
          />
        ) : (
          <div className="flex h-24 w-16 items-center justify-center rounded bg-gray-200 text-xs text-gray-400">
            No img
          </div>
        )}
        <div>
          <h2 className="font-bold">{game.title}</h2>
          <p className="text-sm text-gray-600">{game.platform}</p>
          {game.genre.length > 0 && (
            <p className="text-xs text-gray-400">{game.genre.join(", ")}</p>
          )}
        </div>
      </div>

      {!itemId ? (
        /* Item details form */
        <div className="space-y-4">
          <h3 className="font-medium">Item Details</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Region</label>
              <select
                className="input"
                value={form.region}
                onChange={(e) =>
                  setForm((f) => ({ ...f, region: e.target.value }))
                }
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Condition</label>
              <select
                className="input"
                value={form.condition}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    condition: e.target.value as ItemFormData["condition"],
                  }))
                }
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Completeness</label>
            <select
              className="input"
              value={form.completeness}
              onChange={(e) => handleCompletenessChange(e.target.value)}
            >
              {COMPLETENESS_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { key: "has_cartridge" as const, label: "Cartridge/Disc" },
              { key: "has_box" as const, label: "Box" },
              { key: "has_manual" as const, label: "Manual" },
              { key: "has_extras" as const, label: "Extras" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.checked }))
                  }
                  className="rounded border-gray-300"
                />
                {label}
              </label>
            ))}
          </div>

          {barcode && (
            <div>
              <label className="label">Barcode</label>
              <input className="input" value={form.barcode} readOnly />
            </div>
          )}

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows={2}
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Any notes about this copy..."
            />
          </div>

          <button
            onClick={handleSave}
            className="btn-primary w-full"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Item"}
          </button>
        </div>
      ) : (
        /* Photos section (shown after item is saved) */
        <div className="space-y-4">
          <h3 className="font-medium">Add Photos (optional)</h3>
          <div className="space-y-3">
            {PHOTO_KINDS.map((kind) => (
              <PhotoUploader
                key={kind.value}
                itemId={itemId}
                kind={kind.value as PhotoKind}
                label={kind.label}
                multiple={kind.value === "OTHER"}
              />
            ))}
          </div>

          <button onClick={handleDone} className="btn-primary w-full">
            Done — Back to Collection
          </button>
        </div>
      )}
    </div>
  );
}
