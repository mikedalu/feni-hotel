import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/components/Providers";

const outfit = localFont({
  src: "../../public/fonts/Outfit-VariableFont_wght.ttf",
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Feni Hotel - Local POS",
  description: "Local Facility POS and Reception",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="antialiased font-sans min-h-full">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
