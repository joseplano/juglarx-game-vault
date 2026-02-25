import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "JuglarX Game Vault",
  description: "Personal retro game collection tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Game Vault",
  },
};

export const viewport: Viewport = {
  themeColor: "#4263eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3000,
            style: { background: "#1f2937", color: "#fff", fontSize: "14px" },
          }}
        />
      </body>
    </html>
  );
}
