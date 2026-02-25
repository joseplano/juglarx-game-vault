"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface PhotoCaptureProps {
  onCapture: (file: File) => void;
  label?: string;
}

export default function PhotoCapture({
  onCapture,
  label = "Capture or select a photo",
}: PhotoCaptureProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [liveCamera, setLiveCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startLiveCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLiveCamera(true);
    } catch {
      setCameraError("Could not access camera. Check permissions.");
    }
  }

  function stopLiveCamera() {
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
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setPreview(URL.createObjectURL(blob));
        stopLiveCamera();
        onCapture(file);
      },
      "image/jpeg",
      0.9
    );
  }, [onCapture]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onCapture(file);
  }

  function clearPreview() {
    setPreview(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">{label}</p>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {/* Hidden canvas for snapshots */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Live camera viewfinder */}
      {liveCamera && (
        <div className="relative overflow-hidden rounded-lg bg-black">
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
              onClick={stopLiveCamera}
              className="rounded-full bg-black/50 px-4 py-2 text-sm text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Preview of captured/selected image */}
      {preview && !liveCamera && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Captured"
            className="max-h-64 w-full rounded-lg object-contain"
          />
          <button
            onClick={clearPreview}
            className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-1 text-xs text-white"
          >
            Clear
          </button>
        </div>
      )}

      {/* Buttons: Camera / Gallery */}
      {!preview && !liveCamera && (
        <div className="space-y-2">
          {cameraError && (
            <p className="text-xs text-red-500">{cameraError}</p>
          )}

          <div className="grid grid-cols-2 gap-2">
            {/* Native camera (works great on mobile) */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="btn-primary flex flex-col items-center gap-1 py-3"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                />
              </svg>
              <span className="text-xs">Open Camera</span>
            </button>

            {/* Gallery picker */}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="btn-secondary flex flex-col items-center gap-1 py-3"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                />
              </svg>
              <span className="text-xs">From Gallery</span>
            </button>
          </div>

          {/* Live camera viewfinder (for desktop or advanced use) */}
          <button
            type="button"
            onClick={startLiveCamera}
            className="w-full rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:border-vault-400 hover:text-vault-600"
          >
            Or use live camera viewfinder
          </button>
        </div>
      )}
    </div>
  );
}
