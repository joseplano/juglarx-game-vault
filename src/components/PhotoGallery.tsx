"use client";

import { useState } from "react";
import type { Photo } from "@/types";
import toast from "react-hot-toast";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface PhotoGalleryProps {
  photos: Photo[];
  onDelete?: (photoId: string) => void;
  onSetCover?: (photoId: string) => void;
  currentCoverPhotoId?: string | null;
}

export default function PhotoGallery({
  photos,
  onDelete,
  onSetCover,
  currentCoverPhotoId,
}: PhotoGalleryProps) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [settingCover, setSettingCover] = useState<string | null>(null);

  async function handleDelete(photoId: string) {
    if (!confirm("Delete this photo?")) return;
    setDeleting(photoId);
    try {
      const res = await fetch(`/api/photos?id=${photoId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Photo deleted");
      onDelete?.(photoId);
    } catch {
      toast.error("Failed to delete photo");
    } finally {
      setDeleting(null);
    }
  }

  async function handleSetCover(photoId: string) {
    setSettingCover(photoId);
    try {
      onSetCover?.(photoId);
    } finally {
      setSettingCover(null);
    }
  }

  if (photos.length === 0) {
    return <p className="py-4 text-center text-sm text-gray-400">No photos yet.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => {
          const isCover = currentCoverPhotoId === photo.id;
          return (
            <div key={photo.id} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.public_url || ""}
                alt={photo.kind}
                className={`h-24 w-full cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-90 ${
                  isCover ? "ring-2 ring-vault-500" : ""
                }`}
                onClick={() => setLightbox(photo.public_url)}
                loading="lazy"
              />
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] text-white">
                {photo.kind}
              </span>
              {isCover && (
                <span className="absolute top-1 left-1 rounded bg-vault-600 px-1 py-0.5 text-[9px] text-white">
                  Cover
                </span>
              )}
              <div className="absolute right-1 top-1 hidden flex-col gap-1 group-hover:flex">
                {onSetCover && !isCover && (
                  <button
                    onClick={() => handleSetCover(photo.id)}
                    disabled={settingCover === photo.id}
                    className="rounded-full bg-vault-600 px-1.5 py-0.5 text-[10px] text-white"
                  >
                    {settingCover === photo.id ? "..." : "Cover"}
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => handleDelete(photo.id)}
                    disabled={deleting === photo.id}
                    className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white"
                  >
                    {deleting === photo.id ? "..." : "✕"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Lightbox con zoom/pan ── */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          {/* Toolbar */}
          <div className="flex items-center justify-between bg-black/80 px-4 py-2">
            <span className="text-xs text-gray-400">Pinch · Double-tap · Scroll to zoom</span>
            <button
              onClick={() => setLightbox(null)}
              className="rounded-full bg-white/20 px-3 py-1 text-sm text-white hover:bg-white/30"
            >
              ✕ Close
            </button>
          </div>

          {/* Zoom canvas */}
          <div className="flex flex-1 items-center justify-center overflow-hidden">
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={8}
              doubleClick={{ mode: "zoomIn" }}
              centerOnInit
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <div className="flex h-full w-full flex-col">
                  <TransformComponent
                    wrapperStyle={{ flex: 1, width: "100%", cursor: "grab" }}
                    contentStyle={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={lightbox}
                      alt="Full size"
                      style={{ maxHeight: "80vh", maxWidth: "100vw", objectFit: "contain" }}
                    />
                  </TransformComponent>

                  {/* Bottom controls */}
                  <div className="flex items-center justify-center gap-4 bg-black/70 py-3">
                    <button
                      onClick={() => zoomOut()}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg text-white hover:bg-white/30"
                    >
                      −
                    </button>
                    <button
                      onClick={() => resetTransform()}
                      className="rounded-full bg-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/30"
                    >
                      ↺ Reset
                    </button>
                    <button
                      onClick={() => zoomIn()}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg text-white hover:bg-white/30"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </TransformWrapper>
          </div>
        </div>
      )}
    </>
  );
}
