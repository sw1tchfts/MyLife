import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full font-sans">
        {user ? (
          <div className="flex h-full">
            <Suspense>
              <Sidebar userEmail={user.email ?? ""} />
            </Suspense>
            <main className="flex-1 overflow-y-auto bg-gray-50 p-6 lg:p-8">
              {children}
            </main>
          </div>
        ) : (
          <div className="min-h-full bg-gray-50">{children}</div>
        )}
      </body>
    </html>
  );
}
