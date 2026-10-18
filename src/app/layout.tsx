import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import { INTRO_SEEN_KEY } from "@/lib/introKey";

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
      // The inline script below may set data-intro before React hydrates.
      suppressHydrationWarning
      className={`${cormorant.variable} ${inter.variable} ${notoSerifSC.variable} ${notoSansSC.variable}`}
    >
      <head>
        <script
          // Hides the entrance gate before first paint when it was already passed this session.
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("${INTRO_SEEN_KEY}")==="seen")document.documentElement.dataset.intro="seen"}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
