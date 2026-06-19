import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { QueryProvider } from "@/components/shared/query-provider";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { Toaster } from "sonner";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Open Monitor YT — Dashboard",
  description: "YouTube competitive intelligence dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans`}
      >
        <ThemeProvider>
          <QueryProvider>
            <Sidebar />
            <div className="min-h-screen pl-0 lg:pl-64">
              <Header />
              <main className="mx-auto max-w-7xl p-6">{children}</main>
            </div>
            <Toaster richColors position="bottom-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
