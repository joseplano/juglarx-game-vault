"use client";

import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface PhotoCaptureProps {
  onCapture: (file: File) => void;
  label?: string;
}

interface CamControls {
  hasZoom: boolean;
  hasTorch: boolean;
  minZoom: number;
  maxZoom: number;
  stepZoom: number;
}

// MediaTrack extended constraints (zoom / torch are not in TS lib.dom yet)
type ExtConstraintSet = MediaTrackConstraintSet & { zoom?: number; torch?: boolean };
type ExtCapabilities = MediaTrackCapabilities & {
  zoom?: { min: number; max: number; step: number };
  torch?: boolean;
};

export default function PhotoCapture({
  onCapture,
  label = "Capture or select a photo",
}: PhotoCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [liveCamera, setLiveCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Controls state
  const [controls, setControls] = useState<CamControls>({
    hasZoom: false, hasTorch: false, minZoom: 1, maxZoom: 1, stepZoom: 0.1,
  });
  const [zoom, setZoom] = useState(1);
  const [torchOn, setTorchOn] = useState(false);
  const [brightness, setBrightness] = useState(1); // CSS filter 0.5–2

  // Called when react-webcam has loaded and stream is ready
  function handleUserMedia() {
    const stream = webcamRef.current?.stream;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    const caps = track.getCapabilities() as ExtCapabilities;
    setControls({
      hasZoom: !!caps.zoom,
      hasTorch: !!caps.torch,
      minZoom: caps.zoom?.min ?? 1,
      maxZoom: caps.zoom?.max ?? 1,
      stepZoom: caps.zoom?.step ?? 0.1,
    });
  }

  async function applyZoom(value: number) {
    setZoom(value);
    const track = webcamRef.current?.stream?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ zoom: value } as ExtConstraintSet] });
    } catch { /* not supported on this device */ }
  }

  async function toggleTorch() {
    const track = webcamRef.current?.stream?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as ExtConstraintSet] });
      setTorchOn(next);
    } catch { /* not supported */ }
  }

  const takeSnapshot = useCallback(() => {
    const video = webcamRef.current?.video;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Apply brightness to the captured frame
    ctx.filter = `brightness(${brightness})`;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        setPreview(dataUrl);
        setLiveCamera(false);
        onCapture(file);
      },
      "image/jpeg",
      0.9
    );
  }, [brightness, onCapture]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onCapture(file);
  }

  function clearPreview() {
    setPreview(null);
    setZoom(1);
    setTorchOn(false);
    setBrightness(1);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  function startCamera() {
    setCameraError(null);
    setLiveCamera(true);
  }

  function stopCamera() {
    webcamRef.current?.stream?.getTracks().forEach((t) => t.stop());
    setLiveCamera(false);
    setTorchOn(false);
    setZoom(1);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">{label}</p>

      {/* Hidden file input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* ── Live camera ── */}
      {liveCamera && (
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-lg bg-black">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } }}
              onUserMedia={handleUserMedia}
              onUserMediaError={() => {
                setCameraError("Could not access camera. Check permissions.");
                setLiveCamera(false);
              }}
              style={{ filter: `brightness(${brightness})`, width: "100%", display: "block" }}
              playsInline
            />

            {/* Capture / Cancel overlay */}
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

            {/* Torch button (top-right) */}
            {controls.hasTorch && (
              <button
                onClick={toggleTorch}
                className={`absolute right-2 top-2 rounded-full px-2 py-1 text-lg shadow ${
                  torchOn ? "bg-yellow-300" : "bg-black/40 text-white"
                }`}
                title="Toggle flash"
              >
                🔦
              </button>
            )}
          </div>

          {/* Camera controls panel */}
          <div className="rounded-lg bg-gray-100 px-3 py-2 space-y-2">
            {/* Brightness */}
            <div className="flex items-center gap-3">
              <span className="w-20 text-xs text-gray-500">Brightness</span>
              <span className="text-sm">🌑</span>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.05}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="flex-1 accent-vault-600"
              />
              <span className="text-sm">☀️</span>
              <button
                onClick={() => setBrightness(1)}
                className="text-[10px] text-gray-400 hover:text-gray-600"
              >
                Reset
              </button>
            </div>

            {/* Zoom (hardware) */}
            {controls.hasZoom && controls.maxZoom > controls.minZoom && (
              <div className="flex items-center gap-3">
                <span className="w-20 text-xs text-gray-500">Zoom</span>
                <span className="text-sm">🔍</span>
                <input
                  type="range"
                  min={controls.minZoom}
                  max={controls.maxZoom}
                  step={controls.stepZoom}
                  value={zoom}
                  onChange={(e) => applyZoom(Number(e.target.value))}
                  className="flex-1 accent-vault-600"
                />
                <span className="text-xs text-gray-500 w-8 text-right">{zoom.toFixed(1)}×</span>
                <button
                  onClick={() => applyZoom(controls.minZoom)}
                  className="text-[10px] text-gray-400 hover:text-gray-600"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Preview con zoom/pan ── */}
      {preview && !liveCamera && (
        <div className="overflow-hidden rounded-lg bg-black">
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={6}
            doubleClick={{ mode: "zoomIn" }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* Zoom controls */}
                <div className="flex justify-between items-center bg-black/70 px-3 py-1">
                  <span className="text-xs text-gray-400">Pinch or use buttons to zoom</span>
                  <div className="flex gap-2">
                    <button onClick={() => zoomOut()} className="rounded bg-white/20 px-2 py-0.5 text-sm text-white hover:bg-white/30">−</button>
                    <button onClick={() => resetTransform()} className="rounded bg-white/20 px-2 py-0.5 text-xs text-white hover:bg-white/30">↺</button>
                    <button onClick={() => zoomIn()} className="rounded bg-white/20 px-2 py-0.5 text-sm text-white hover:bg-white/30">+</button>
                  </div>
                </div>
                <TransformComponent wrapperStyle={{ width: "100%" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Captured"
                    style={{ width: "100%", maxHeight: "60vh", objectFit: "contain", display: "block" }}
                  />
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
          <div className="flex justify-center bg-black/70 py-2">
            <button
              onClick={clearPreview}
              className="rounded-full bg-white/20 px-4 py-1 text-xs text-white hover:bg-white/30"
            >
              Clear & retake
            </button>
          </div>
        </div>
      )}

      {/* ── Initial buttons ── */}
      {!preview && !liveCamera && (
        <div className="space-y-2">
          {cameraError && <p className="text-xs text-red-500">{cameraError}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={startCamera}
              className="btn-primary flex flex-col items-center gap-1 py-3"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              <span className="text-xs">Open Camera</span>
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="btn-secondary flex flex-col items-center gap-1 py-3"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
              <span className="text-xs">From Gallery</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
