"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { PhotoKind } from "@/types";
import toast from "react-hot-toast";

interface PhotoUploaderProps {
  itemId: string;
  kind: PhotoKind;
  label: string;
  multiple?: boolean;
}

export default function PhotoUploader({
  itemId,
  kind,
  label,
  multiple = false,
}: PhotoUploaderProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [liveCamera, setLiveCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const uploaded = !multiple && uploadedCount > 0;

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Attach stream to video element when it becomes available
  useEffect(() => {
    if (liveCamera && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [liveCamera]);

  async function startCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      setLiveCamera(true);
    } catch {
      setCameraError("Could not access camera. Check permissions.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLiveCamera(false);
  }

  const takeSnapshot = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `${kind}-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        stopCamera();
        uploadFile(file);
      },
      "image/jpeg",
      0.9
    );
  }, [kind]);

  async function uploadFile(file: File) {
    const objectUrl = URL.createObjectURL(file);
    if (!multiple) {
      setPreviewUrls([objectUrl]);
    }
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

      setUploadedCount((c) => c + 1);
      if (multiple) {
        setPreviewUrls((prev) => [...prev, objectUrl]);
      }
      toast.success(`${label} photo uploaded`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload photo"
      );
      if (!multiple) {
        setPreviewUrls([]);
      }
    } finally {
      setUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile(file);
  }

  const showButtons = !uploaded && !uploading && !liveCamera;

  return (
    <div className="rounded-lg border border-gray-200 p-3">
      {/* Hidden elements */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Header row */}
      <div className="flex items-center gap-3">
        {previewUrls.length === 1 && !multiple ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrls[0]}
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
          ) : liveCamera ? (
            <p className="text-xs text-vault-600">Camera active</p>
          ) : multiple && uploadedCount > 0 ? (
            <p className="text-xs text-green-600">{uploadedCount} photo{uploadedCount > 1 ? "s" : ""} uploaded</p>
          ) : null}
        </div>
      </div>

      {/* Thumbnails grid for multiple uploads */}
      {multiple && previewUrls.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {previewUrls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`${label} ${i + 1}`}
              className="h-16 w-16 flex-shrink-0 rounded object-cover"
            />
          ))}
        </div>
      )}

      {/* Live camera viewfinder */}
      {liveCamera && (
        <div className="relative mt-3 overflow-hidden rounded-lg bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full"
          />
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
            <button
              onClick={takeSnapshot}
              className="rounded-full bg-white px-5 py-2 text-sm font-medium text-gray-900 shadow-lg"
            >
              Capture
            </button>
            <button
              onClick={stopCamera}
              className="rounded-full bg-black/50 px-4 py-2 text-sm text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {showButtons && (
        <div className="mt-2 space-y-1">
          {cameraError && (
            <p className="text-xs text-red-500">{cameraError}</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={startCamera}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-vault-300 bg-vault-50 px-3 py-2 text-xs font-medium text-vault-700 hover:bg-vault-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              Camera
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
              From Disc
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
