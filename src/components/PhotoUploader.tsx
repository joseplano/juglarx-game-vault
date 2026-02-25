"use client";

import { useRef, useState } from "react";
import type { PhotoKind } from "@/types";
import toast from "react-hot-toast";

interface PhotoUploaderProps {
  itemId: string;
  kind: PhotoKind;
  label: string;
}

export default function PhotoUploader({
  itemId,
  kind,
  label,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("item_id", itemId);
      formData.append("kind", kind);

      const res = await fetch("/api/photos", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUploaded(true);
      toast.success(`${label} photo uploaded`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload photo"
      );
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={label}
          className="h-12 w-12 rounded object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
          {kind[0]}
        </div>
      )}

      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        {uploaded ? (
          <p className="text-xs text-green-600">Uploaded</p>
        ) : uploading ? (
          <p className="text-xs text-vault-600">Uploading...</p>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="text-xs text-vault-600 hover:underline"
          >
            Add photo
          </button>
        )}
      </div>
    </div>
  );
}
