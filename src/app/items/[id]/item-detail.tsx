"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Item, Game, Photo, PhotoKind } from "@/types";
import {
  CONDITIONS,
  COMPLETENESS_OPTIONS,
  REGIONS,
  CONDITION_COLORS,
  PHOTO_KINDS,
} from "@/lib/constants";
import { formatDate, getCompletenessDefaults } from "@/lib/utils";
import PhotoGallery from "@/components/PhotoGallery";
import PhotoUploader from "@/components/PhotoUploader";
import SagaInput from "@/components/SagaInput";
import toast from "react-hot-toast";

function rotateImageBlob(
  imageUrl: string,
  degrees: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));

      const rad = (degrees * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      canvas.width = Math.round(img.width * cos + img.height * sin);
      canvas.height = Math.round(img.width * sin + img.height * cos);

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        },
        "image/jpeg",
        0.92
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageUrl;
  });
}

interface ItemDetailProps {
  item: Item & { game: Game };
  photos: Photo[];
  initialCoverPhotoId?: string | null;
}

export default function ItemDetail({
  item: initialItem,
  photos: initialPhotos,
  initialCoverPhotoId = null,
}: ItemDetailProps) {
  const router = useRouter();
  const [item, setItem] = useState(initialItem);
  const [photos, setPhotos] = useState(initialPhotos);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(initialCoverPhotoId);
  const [rotating, setRotating] = useState(false);
  const [editingGame, setEditingGame] = useState(false);
  const [savingGame, setSavingGame] = useState(false);
  const [gameSaga, setGameSaga] = useState(item.game.saga ?? "");
  const [queryingRegional, setQueryingRegional] = useState(false);

  const game = item.game;
  const conditionColor =
    CONDITION_COLORS[item.condition] || "bg-gray-100 text-gray-800";

  // Edit state
  const [editForm, setEditForm] = useState({
    region: item.region || "",
    condition: item.condition,
    completeness: item.completeness,
    has_cartridge: item.has_cartridge,
    has_box: item.has_box,
    has_manual: item.has_manual,
    has_extras: item.has_extras,
    notes: item.notes || "",
  });

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setItem({ ...item, ...data.item });
      setEditing(false);
      toast.success("Item updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleQueryRegionalNames() {
    setQueryingRegional(true);
    try {
      const res = await fetch("/api/games/regional-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: game.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setItem((prev) => ({
        ...prev,
        game: {
          ...prev.game,
          name_america: data.game.name_america,
          name_europe: data.game.name_europe,
          regional_names_fetched: data.game.regional_names_fetched,
          regional_query_count: data.game.regional_query_count,
        },
      }));
      toast.success("Regional names updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to query regional names");
    } finally {
      setQueryingRegional(false);
    }
  }

  async function handleSaveGame() {
    setSavingGame(true);
    try {
      const res = await fetch(`/api/games/${game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saga: gameSaga.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setItem((prev) => ({
        ...prev,
        game: { ...prev.game, saga: data.game.saga },
      }));
      setEditingGame(false);
      toast.success("Game info updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update game");
    } finally {
      setSavingGame(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this item and all its photos? This cannot be undone."))
      return;

    try {
      const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Item deleted");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to delete item");
    }
  }

  function handleCompletenessChange(val: string) {
    const defaults = getCompletenessDefaults(val as typeof editForm.completeness);
    setEditForm((f) => ({
      ...f,
      completeness: val as typeof editForm.completeness,
      has_cartridge: defaults.cart,
      has_box: defaults.box,
      has_manual: defaults.manual,
      has_extras: defaults.extras,
    }));
  }

  function handlePhotoDeleted(photoId: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }

  async function handleSetCover(photoId: string) {
    try {
      const res = await fetch("/api/games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: game.id,
          photo_id: photoId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setItem((prev) => ({
        ...prev,
        game: { ...prev.game, cover_url: data.cover_url },
      }));
      setCoverPhotoId(photoId);
      toast.success("Cover updated!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to set cover"
      );
    }
  }

  const handleRotateCover = useCallback(async (degrees: number) => {
    if (!game.cover_url || rotating) return;
    setRotating(true);
    try {
      const blob = await rotateImageBlob(game.cover_url, degrees);
      const file = new File([blob], `cover-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("game_id", game.id);

      const res = await fetch("/api/games/cover", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setItem((prev) => ({
        ...prev,
        game: { ...prev.game, cover_url: data.cover_url },
      }));
      toast.success("Cover rotated!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to rotate cover"
      );
    } finally {
      setRotating(false);
    }
  }, [game.cover_url, game.id, rotating]);

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={() => router.push("/")}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to collection
      </button>

      {/* Game header */}
      <div className="flex gap-4">
        <div className="flex flex-shrink-0 flex-col items-center gap-1">
          {game.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={game.cover_url}
              alt={game.title}
              className="h-32 w-24 rounded-lg object-cover shadow"
            />
          ) : (
            <div className="flex h-32 w-24 items-center justify-center rounded-lg bg-gray-200 text-sm text-gray-400">
              No img
            </div>
          )}
          {game.cover_url && (
            <div className="flex gap-1">
              <button
                onClick={() => handleRotateCover(-90)}
                disabled={rotating}
                className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-600 hover:bg-gray-300 disabled:opacity-50"
                title="Rotate 90° CCW"
              >
                CCW
              </button>
              <button
                onClick={() => handleRotateCover(180)}
                disabled={rotating}
                className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-600 hover:bg-gray-300 disabled:opacity-50"
                title="Rotate 180°"
              >
                180°
              </button>
              <button
                onClick={() => handleRotateCover(90)}
                disabled={rotating}
                className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-600 hover:bg-gray-300 disabled:opacity-50"
                title="Rotate 90° CW"
              >
                CW
              </button>
            </div>
          )}
          {rotating && (
            <p className="text-[10px] text-vault-600">Rotating...</p>
          )}
        </div>

        <div className="space-y-1">
          <h1 className="text-lg font-bold leading-tight">{game.title}</h1>
          <p className="text-sm text-gray-600">{game.platform}</p>
          {game.release_date && (
            <p className="text-xs text-gray-400">
              {formatDate(game.release_date)}
            </p>
          )}
          {game.genre.length > 0 && (
            <p className="text-xs text-gray-400">{game.genre.join(", ")}</p>
          )}
          {!editingGame ? (
            <div className="flex items-center gap-2">
              {game.saga ? (
                <p className="text-xs text-purple-500">Saga: {game.saga}</p>
              ) : (
                <p className="text-xs text-gray-400">No saga</p>
              )}
              <button
                onClick={() => {
                  setGameSaga(game.saga ?? "");
                  setEditingGame(true);
                }}
                className="text-[10px] text-vault-600 hover:underline"
              >
                Edit
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SagaInput
                  value={gameSaga}
                  onChange={setGameSaga}
                  placeholder="Saga / Franchise"
                />
              </div>
              <button
                onClick={handleSaveGame}
                disabled={savingGame}
                className="btn-primary text-xs px-2 py-1"
              >
                {savingGame ? "..." : "Save"}
              </button>
              <button
                onClick={() => setEditingGame(false)}
                className="btn-secondary text-xs px-2 py-1"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {game.summary && (
        <p className="text-xs leading-relaxed text-gray-500">
          {game.summary}
        </p>
      )}

      {/* Regional names */}
      <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs space-y-1">
        {game.regional_names_fetched ? (
          <>
            <p className="font-medium text-gray-600">Nombres en otras regiones</p>
            <p className="text-gray-500">
              <span className="font-medium text-gray-600">América: </span>
              {game.name_america === "none"
                ? "No existe en América"
                : game.name_america
                ? game.name_america
                : "Mismo nombre en América"}
            </p>
            <p className="text-gray-500">
              <span className="font-medium text-gray-600">Europa: </span>
              {game.name_europe === "none"
                ? "No existe en Europa"
                : game.name_europe
                ? game.name_europe
                : "Mismo nombre en Europa"}
            </p>
            {(game.regional_query_count ?? 0) > 0 && (
              <p className="text-gray-400">
                Consultado {game.regional_query_count} vez{game.regional_query_count !== 1 ? "es" : ""}
              </p>
            )}
            <button
              onClick={handleQueryRegionalNames}
              disabled={queryingRegional}
              className="mt-1 text-vault-600 hover:underline disabled:opacity-50"
            >
              {queryingRegional ? "Consultando..." : "Actualizar información regional"}
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-400">Sin información de nombres en otras regiones</p>
            <button
              onClick={handleQueryRegionalNames}
              disabled={queryingRegional}
              className="flex items-center gap-1 font-medium text-vault-600 hover:underline disabled:opacity-50"
            >
              {queryingRegional ? (
                "Consultando..."
              ) : (
                <>
                  Consultar información regional
                  {(game.regional_query_count ?? 0) > 0 && (
                    <span className="ml-1 rounded-full bg-vault-100 px-1.5 text-vault-700">
                      {game.regional_query_count}
                    </span>
                  )}
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Item details */}
      {!editing ? (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Item Details</h2>
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-vault-600 hover:underline"
            >
              Edit
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400">Condition</span>
              <span
                className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${conditionColor}`}
              >
                {item.condition.replace("_", " ")}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Completeness</span>
              <p className="text-xs">
                {COMPLETENESS_OPTIONS.find(
                  (c) => c.value === item.completeness
                )?.label ?? item.completeness}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Region</span>
              <p className="text-xs">{item.region || "N/A"}</p>
            </div>
            {item.barcode && (
              <div>
                <span className="text-gray-400">Barcode</span>
                <p className="text-xs font-mono">{item.barcode}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 text-xs">
            {item.has_cartridge && (
              <span className="rounded bg-green-50 px-2 py-0.5 text-green-700">
                Cartridge
              </span>
            )}
            {item.has_box && (
              <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-700">
                Box
              </span>
            )}
            {item.has_manual && (
              <span className="rounded bg-yellow-50 px-2 py-0.5 text-yellow-700">
                Manual
              </span>
            )}
            {item.has_extras && (
              <span className="rounded bg-purple-50 px-2 py-0.5 text-purple-700">
                Extras
              </span>
            )}
          </div>

          {item.notes && (
            <p className="text-xs text-gray-500">Notes: {item.notes}</p>
          )}
        </div>
      ) : (
        /* Edit form */
        <div className="card space-y-3">
          <h2 className="font-medium">Edit Item</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Region</label>
              <select
                className="input"
                value={editForm.region}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, region: e.target.value }))
                }
              >
                <option value="">N/A</option>
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
                value={editForm.condition}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    condition: e.target.value as typeof editForm.condition,
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
              value={editForm.completeness}
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
            {(
              [
                ["has_cartridge", "Cartridge/Disc"],
                ["has_box", "Box"],
                ["has_manual", "Manual"],
                ["has_extras", "Extras"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editForm[key]}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, [key]: e.target.checked }))
                  }
                  className="rounded border-gray-300"
                />
                {label}
              </label>
            ))}
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows={2}
              value={editForm.notes}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="btn-primary flex-1"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Photos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Photos</h2>
          <button
            onClick={() => setShowAddPhoto(!showAddPhoto)}
            className="text-xs text-vault-600 hover:underline"
          >
            {showAddPhoto ? "Hide" : "+ Add photo"}
          </button>
        </div>

        <PhotoGallery
          photos={photos}
          onDelete={handlePhotoDeleted}
          onSetCover={handleSetCover}
          currentCoverPhotoId={coverPhotoId}
        />

        {showAddPhoto && (
          <div className="space-y-2">
            {PHOTO_KINDS.map((kind) => (
              <PhotoUploader
                key={kind.value}
                itemId={item.id}
                kind={kind.value as PhotoKind}
                label={kind.label}
                multiple
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete */}
      <div className="border-t pt-4">
        <button onClick={handleDelete} className="btn-danger w-full text-xs">
          Delete Item
        </button>
      </div>
    </div>
  );
}
