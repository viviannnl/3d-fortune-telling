import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// CJK fonts are split by unicode-range; skip preload so only used glyph slices download.
const notoSerifSC = Noto_Serif_SC({
  weight: ["400", "600"],
  variable: "--font-noto-serif-sc",
  preload: false,
});

const notoSansSC = Noto_Sans_SC({
  weight: ["400", "500"],
  variable: "--font-noto-sans-sc",
  preload: false,
});

export const metadata: Metadata = {
  title: "Moonlit Sanctuary · 月影圣所",
  description: "An immersive 3D sanctuary for tarot and Chinese Bazi exploration.",
};

export const viewport: Viewport = {
  themeColor: "#17152f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} ${notoSerifSC.variable} ${notoSansSC.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
