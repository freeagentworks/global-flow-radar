import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "@/lib/providers";
import "./globals.css";

// タイポグラフィ設定（07_ui-wireframe.md 1.2節）
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

// SEO / OGP メタデータ設定
export const metadata: Metadata = {
  title: {
    template: "%s | Global Flow Radar",
    default: "Global Flow Radar - グローバル資金フロー可視化",
  },
  description:
    "世界の投資資金がどこから流出し、どこに流入しているかを検知・可視化するプラットフォーム",
  keywords: ["投資", "資金フロー", "ETF", "グローバル", "セクターローテーション"],
  openGraph: {
    title: "Global Flow Radar - グローバル資金フロー可視化",
    description:
      "世界の投資資金がどこから流出し、どこに流入しているかを検知・可視化するプラットフォーム",
    type: "website",
    locale: "ja_JP",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Global Flow Radar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/twitter-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
