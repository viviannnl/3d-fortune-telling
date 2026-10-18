import type { Metadata } from "next";
import { AboutContent } from "@/components/about/AboutContent";

export const metadata: Metadata = {
  title: "About & methods · Moonlit Sanctuary",
};

export default function AboutPage() {
  return <AboutContent />;
}
