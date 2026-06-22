import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "DoMusMat — B2B Catalogue",
  description: "Industrial lighting BIM catalogue",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className={`${inter.variable} font-sans text-ink bg-white antialiased`}><Providers>{children}</Providers></body>
    </html>
  );
}
