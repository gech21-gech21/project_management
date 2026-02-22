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
        <div className=" fixed top-0 left-0 w-full z-10 bg-amber-200 p-4 shadow-md">
          {/* Fixed Header */}
          <Header />
        </div>
        <div>
          {/* Main Content Area - Scrolls independently */}
          <main className="flex-1 overflow-y-auto pt-16">
            {" "}
            {/* pt-16 for header height */}
            <NextAuthProvider>
              <div className="container mx-auto px-4 py-8">{children}</div>
            </NextAuthProvider>
          </main>

          {/* Footer at bottom */}
          <Footer />
        </div>
      </body>
    </html>
  );
}
