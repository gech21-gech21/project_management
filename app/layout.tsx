// Root layout for the project management application
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import React from "react";
import "./globals.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import NextAuthProvider from "./providers/SessionProvider";
import { ThemeProvider } from "./providers/theme-provider";
import { ToastProvider } from "./providers/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Build stability comment: force layout refresh
export const metadata: Metadata = {
  title: "Project Nexus",
  description: "Next-generation project management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-blue-500/30 transition-colors duration-300`}>
        <NextAuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ToastProvider>
              <div className="flex min-h-screen bg-white dark:bg-[#050505]">
                {/* Sidebar */}
                <div className="hidden lg:block">
                  <Sidebar />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
                  <Header />
                  <main className="flex-1">
                    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                      {children}
                    </div>
                  </main>
                  <Footer />
                </div>
              </div>
            </ToastProvider>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
