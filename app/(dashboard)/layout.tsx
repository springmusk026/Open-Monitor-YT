import { ThemeProvider } from "@/components/shared/theme-provider";
import { QueryProvider } from "@/components/shared/query-provider";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { Toaster } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
  );
}
