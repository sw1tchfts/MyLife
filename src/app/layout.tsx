import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SignOutButton } from "@/components/SignOutButton";
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
      <body className="min-h-full bg-gray-50 font-sans">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {user && (
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm text-gray-500">{user.email}</span>
              <div className="flex items-center gap-4">
                <Link
                  href="/admin"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Admin
                </Link>
                <Link
                  href="/settings"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Settings
                </Link>
                <SignOutButton />
              </div>
            </div>
          )}
          {children}
        </div>
      </body>
    </html>
  );
}
