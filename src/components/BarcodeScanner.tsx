"use client";

import { useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({
  onDetected,
  onClose,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const scannerRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startScanner() {
      try {
        // Try native BarcodeDetector first (Chrome Android)
        if ("BarcodeDetector" in window) {
          await startNativeScanner(cancelled);
        } else {
          // Fallback to html5-qrcode
          await startHtml5Scanner(cancelled);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Scanner error:", err);
          setError(
            "Camera access failed. Make sure you allow camera permissions."
          );
        }
      }
    }

    async function startNativeScanner(isCancelled: boolean) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (isCancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
      });

      const interval = setInterval(async () => {
        if (!videoRef.current || isCancelled) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            clearInterval(interval);
            stream.getTracks().forEach((t) => t.stop());
            setScanning(false);
            onDetected(barcodes[0].rawValue);
          }
        } catch {
          // Detection frame error — ignore and retry
        }
      }, 300);

      scannerRef.current = {
        stop: () => {
          clearInterval(interval);
          stream.getTracks().forEach((t) => t.stop());
        },
      };
    }

    async function startHtml5Scanner(isCancelled: boolean) {
      const { Html5Qrcode } = await import("html5-qrcode");

      if (isCancelled) return;

      const scannerId = "barcode-scanner-region";
      const html5QrCode = new Html5Qrcode(scannerId);

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 300, height: 150 },
        },
        (decodedText) => {
          html5QrCode.stop().catch(console.error);
          setScanning(false);
          onDetected(decodedText);
        },
        () => {
          // scan failure — ignore, keep scanning
        }
      );

      scannerRef.current = {
        stop: () => {
          html5QrCode.stop().catch(console.error);
        },
      };
    }

    startScanner();

    return () => {
      cancelled = true;
      scannerRef.current?.stop();
    };
  }, [onDetected]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Scan Barcode</h3>
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
          Cancel
        </button>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : scanning ? (
        <div className="relative overflow-hidden rounded-lg bg-black">
          {/* Native scanner uses video element */}
          <video
            ref={videoRef}
            className="w-full"
            playsInline
            muted
            style={{ display: "BarcodeDetector" in (typeof window !== "undefined" ? window : {}) ? "block" : "none" }}
          />
          {/* html5-qrcode fallback uses this div */}
          <div id="barcode-scanner-region" className="w-full" />
          <p className="py-2 text-center text-xs text-gray-400">
            Point camera at a barcode...
          </p>
        </div>
      ) : (
        <p className="text-sm text-green-600">Barcode detected!</p>
      )}
    </div>
  );
}
