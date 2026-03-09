import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import React from "react";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import NextAuthProvider from "./providers/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "project management",
  description: "Generate project management tasks easily",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextAuthProvider>
          <div className="">
            {/* Fixed Header */}
            <Header />
          </div>
          <div>
            {/* Main Content Area - Scrolls independently */}
            <main className="flex-1 overflow-y-auto pt-16">
              <div className="container mx-auto px-4 py-8">{children}</div>
            </main>
            {/* Footer at bottom */}
            <Footer />
          </div>
        </NextAuthProvider>
      </body>
    </html>
  );
}
