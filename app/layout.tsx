import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "MakeYou",
  title: {
    default: "MakeYou — a calmer place to watch",
    template: "%s · MakeYou",
  },
  description:
    "A clean, lightweight space to discover and watch videos with MakeYou.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "MakeYou",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#11131a" },
    { media: "(prefers-color-scheme: light)", color: "#f5f6fa" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
