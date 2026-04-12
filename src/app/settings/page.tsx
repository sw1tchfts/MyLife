"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/ThemeProvider";

interface UserSettingsData {
  theme: string;
  emailNotifications: boolean;
  browserNotifications: boolean;
}

export default function SettingsPage() {
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettingsData>({
    theme: "light",
    emailNotifications: false,
    browserNotifications: false,
  });
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetch("/api/settings/user")
      .then((r) => r.json())
      .then((data) => {
        setSettings({
          theme: data.theme || "light",
          emailNotifications: data.emailNotifications || false,
          browserNotifications: data.browserNotifications || false,
        });
      });
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email);
    });
  }, [supabase.auth]);

  const handleThemeChange = (t: string) => {
    setSettings((s) => ({ ...s, theme: t }));
    setTheme(t as "light" | "dark" | "system");
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    await fetch("/api/settings/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setMessage("Settings saved.");
    setSaving(false);
  };

  const updatePassword = async () => {
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setMessage("");
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      setError(error.message);
    } else {
      setMessage("Password updated.");
      setNewPassword("");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-500">
          Back to Tasks
        </Link>
      </div>

      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {/* Theme */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Appearance
        </h2>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Theme
          </label>
          <div className="mt-2 flex gap-3">
            {["light", "dark", "system"].map((t) => (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                className={`rounded-md border px-4 py-2 text-sm font-medium capitalize ${
                  settings.theme === t
                    ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Account
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {email}
            </p>
          </div>
          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Change Password
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                minLength={6}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              <button
                onClick={updatePassword}
                className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Notifications
        </h2>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  emailNotifications: e.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Email notifications for upcoming due dates
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.browserNotifications}
              onChange={async (e) => {
                if (e.target.checked && "Notification" in window) {
                  const perm = await Notification.requestPermission();
                  if (perm !== "granted") {
                    setError(
                      "Browser notifications were blocked. Enable them in your browser settings.",
                    );
                    return;
                  }
                }
                setSettings((s) => ({
                  ...s,
                  browserNotifications: e.target.checked,
                }));
              }}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Browser notifications for overdue and due-today tasks
            </span>
          </label>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
