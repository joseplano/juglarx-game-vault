import type { ItemCompleteness } from "@/types";
import { COMPLETENESS_OPTIONS } from "./constants";

/**
 * Get default has_* flags for a given completeness value.
 */
export function getCompletenessDefaults(completeness: ItemCompleteness) {
  const option = COMPLETENESS_OPTIONS.find((o) => o.value === completeness);
  return (
    option?.defaults ?? {
      cart: false,
      box: false,
      manual: false,
      extras: false,
    }
  );
}

/**
 * Format a date string (ISO) to locale short date.
 */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Convert IGDB cover URL to full-size HTTPS URL.
 * IGDB returns //images.igdb.com/... with t_thumb; we swap to t_cover_big.
 */
export function igdbCoverUrl(
  url: string | null | undefined,
  size: "cover_big" | "cover_small" | "thumb" = "cover_big"
): string | null {
  if (!url) return null;
  return url
    .replace("//", "https://")
    .replace("t_thumb", `t_${size}`)
    .replace("t_cover_small", `t_${size}`);
}

/**
 * Resize image blob client-side (for thumbnails / upload optimization).
 */
export async function resizeImage(
  file: File,
  maxWidth = 1200,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Build the storage path for a photo.
 */
export function photoStoragePath(
  ownerId: string,
  itemId: string,
  kind: string
): string {
  const ts = Date.now();
  return `${ownerId}/${itemId}/${kind.toLowerCase()}/${ts}.jpg`;
}
