"use client";

import { useState } from "react";
import type { Photo } from "@/types";
import toast from "react-hot-toast";

interface PhotoGalleryProps {
  photos: Photo[];
  onDelete?: (photoId: string) => void;
}

export default function PhotoGallery({ photos, onDelete }: PhotoGalleryProps) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(photoId: string) {
    if (!confirm("Delete this photo?")) return;

    setDeleting(photoId);
    try {
      const res = await fetch(`/api/photos?id=${photoId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Photo deleted");
      onDelete?.(photoId);
    } catch {
      toast.error("Failed to delete photo");
    } finally {
      setDeleting(null);
    }
  }

  if (photos.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-400">
        No photos yet.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <div key={photo.id} className="group relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.public_url || ""}
              alt={photo.kind}
              className="h-24 w-full cursor-pointer rounded-lg object-cover"
              onClick={() => setLightbox(photo.public_url)}
              loading="lazy"
            />
            <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] text-white">
              {photo.kind}
            </span>
            {onDelete && (
              <button
                onClick={() => handleDelete(photo.id)}
                disabled={deleting === photo.id}
                className="absolute right-1 top-1 hidden rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white group-hover:block"
              >
                {deleting === photo.id ? "..." : "X"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Full size"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}
