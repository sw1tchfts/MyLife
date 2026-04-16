import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import ToastProvider from "@/components/ToastProvider";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "MyLife - Task Tracker",
  description: "A simple task tracking application",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Use getSession (reads cookie, no network call) instead of getUser
  // (which validates with Supabase servers). The proxy already validates auth.
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full bg-surface font-sans text-body">
        <ToastProvider>
          {user ? (
            <div className="flex h-full">
              <Suspense>
                <Sidebar userEmail={user.email ?? ""} />
              </Suspense>
              <main className="flex-1 overflow-y-auto p-4 pt-16 lg:p-8 lg:pt-8">
                {children}
              </main>
            </div>
          ) : (
            <div className="min-h-full">{children}</div>
          )}
        </ToastProvider>
      </body>
    </html>
  );
}
