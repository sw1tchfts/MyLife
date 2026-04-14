"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/ThemeProvider";

interface TrackerConfig {
  metrics: {
    weight: boolean;
    bodyFat: boolean;
    waist: boolean;
    chest: boolean;
    manualCalories: boolean;
  };
  units: {
    weight: "lbs" | "kg";
    measurements: "in" | "cm";
  };
  profile: {
    height: number | null;
    heightUnit: "in" | "cm";
    age: number | null;
    sex: "male" | "female" | null;
  };
  goal: {
    goalWeight: number | null;
    goalBodyFat: number | null;
  };
}

const DEFAULT_TRACKER_CONFIG: TrackerConfig = {
  metrics: {
    weight: true,
    bodyFat: true,
    waist: false,
    chest: false,
    manualCalories: false,
  },
  units: { weight: "lbs", measurements: "in" },
  profile: {
    height: null,
    heightUnit: "in",
    age: null,
    sex: null,
  },
  goal: { goalWeight: null, goalBodyFat: null },
};

interface UserSettingsData {
  theme: string;
  emailNotifications: boolean;
  browserNotifications: boolean;
  trackerEnabled: boolean;
  trackerConfig: TrackerConfig;
}

export default function SettingsPage() {
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettingsData>({
    theme: "light",
    emailNotifications: false,
    browserNotifications: false,
    trackerEnabled: true,
    trackerConfig: DEFAULT_TRACKER_CONFIG,
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
          trackerEnabled: data.trackerEnabled ?? true,
          trackerConfig: data.trackerConfig
            ? { ...DEFAULT_TRACKER_CONFIG, ...data.trackerConfig }
            : DEFAULT_TRACKER_CONFIG,
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

      {/* Daily Tracker */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Daily Tracker
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure the daily &quot;Log Your Data&quot; task that appears in your
          task list.
        </p>

        {/* Master toggle */}
        <label className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.trackerEnabled}
            onChange={(e) =>
              setSettings((s) => ({ ...s, trackerEnabled: e.target.checked }))
            }
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable daily tracking task
          </span>
        </label>

        {settings.trackerEnabled && (
          <div className="mt-4 space-y-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            {/* Metrics to track */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Metrics to Track
              </h3>
              <div className="mt-2 space-y-2">
                {(
                  [
                    ["weight", "Weight"],
                    ["bodyFat", "Body fat %"],
                    ["waist", "Waist circumference"],
                    ["chest", "Chest circumference"],
                    ["manualCalories", "Manual calorie entry (instead of meal tasks)"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.trackerConfig.metrics[key]}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          trackerConfig: {
                            ...s.trackerConfig,
                            metrics: {
                              ...s.trackerConfig.metrics,
                              [key]: e.target.checked,
                            },
                          },
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Units */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Units
              </h3>
              <div className="mt-2 flex gap-6">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400">
                    Weight
                  </label>
                  <div className="mt-1 flex gap-2">
                    {(["lbs", "kg"] as const).map((u) => (
                      <button
                        key={u}
                        onClick={() =>
                          setSettings((s) => ({
                            ...s,
                            trackerConfig: {
                              ...s.trackerConfig,
                              units: { ...s.trackerConfig.units, weight: u },
                            },
                          }))
                        }
                        className={`rounded-md border px-3 py-1 text-xs font-medium ${
                          settings.trackerConfig.units.weight === u
                            ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400">
                    Measurements
                  </label>
                  <div className="mt-1 flex gap-2">
                    {(["in", "cm"] as const).map((u) => (
                      <button
                        key={u}
                        onClick={() =>
                          setSettings((s) => ({
                            ...s,
                            trackerConfig: {
                              ...s.trackerConfig,
                              units: {
                                ...s.trackerConfig.units,
                                measurements: u,
                              },
                            },
                          }))
                        }
                        className={`rounded-md border px-3 py-1 text-xs font-medium ${
                          settings.trackerConfig.units.measurements === u
                            ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile (for TDEE seed) */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Profile
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Used to estimate your initial daily burn before enough tracking
                data is available.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {/* Height — feet/inches when imperial, cm when metric */}
                {settings.trackerConfig.profile.heightUnit === "in" ? (
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-gray-500 dark:text-gray-400">
                      Height
                    </label>
                    <div className="mt-1 flex gap-1.5">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          max="8"
                          value={
                            settings.trackerConfig.profile.height !== null
                              ? Math.floor(
                                  settings.trackerConfig.profile.height / 12,
                                )
                              : ""
                          }
                          onChange={(e) => {
                            const feet = e.target.value
                              ? Number(e.target.value)
                              : 0;
                            const currentInches =
                              settings.trackerConfig.profile.height !== null
                                ? settings.trackerConfig.profile.height % 12
                                : 0;
                            setSettings((s) => ({
                              ...s,
                              trackerConfig: {
                                ...s.trackerConfig,
                                profile: {
                                  ...s.trackerConfig.profile,
                                  height:
                                    feet * 12 + Math.round(currentInches),
                                },
                              },
                            }));
                          }}
                          placeholder="5"
                          className="w-full rounded-md border border-gray-300 px-2 py-1.5 pr-7 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                        />
                        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-gray-400">
                          ft
                        </span>
                      </div>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          max="11"
                          value={
                            settings.trackerConfig.profile.height !== null
                              ? Math.round(
                                  settings.trackerConfig.profile.height % 12,
                                )
                              : ""
                          }
                          onChange={(e) => {
                            const inches = e.target.value
                              ? Number(e.target.value)
                              : 0;
                            const currentFeet =
                              settings.trackerConfig.profile.height !== null
                                ? Math.floor(
                                    settings.trackerConfig.profile.height / 12,
                                  )
                                : 0;
                            setSettings((s) => ({
                              ...s,
                              trackerConfig: {
                                ...s.trackerConfig,
                                profile: {
                                  ...s.trackerConfig.profile,
                                  height: currentFeet * 12 + inches,
                                },
                              },
                            }));
                          }}
                          placeholder="10"
                          className="w-full rounded-md border border-gray-300 px-2 py-1.5 pr-7 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                        />
                        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-gray-400">
                          in
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={settings.trackerConfig.profile.height ?? ""}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          trackerConfig: {
                            ...s.trackerConfig,
                            profile: {
                              ...s.trackerConfig.profile,
                              height: e.target.value
                                ? Number(e.target.value)
                                : null,
                            },
                          },
                        }))
                      }
                      placeholder="178"
                      className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400">
                    Age
                  </label>
                  <input
                    type="number"
                    value={settings.trackerConfig.profile.age ?? ""}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        trackerConfig: {
                          ...s.trackerConfig,
                          profile: {
                            ...s.trackerConfig.profile,
                            age: e.target.value
                              ? Number(e.target.value)
                              : null,
                          },
                        },
                      }))
                    }
                    placeholder="30"
                    className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400">
                    Sex
                  </label>
                  <select
                    value={settings.trackerConfig.profile.sex ?? ""}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        trackerConfig: {
                          ...s.trackerConfig,
                          profile: {
                            ...s.trackerConfig.profile,
                            sex: (e.target.value || null) as
                              | "male"
                              | "female"
                              | null,
                          },
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Goal */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Goal
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your target weight and body fat %. The system will calculate
                your daily calorie target based on your TDEE and how far you are
                from these goals.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400">
                    Goal Weight ({settings.trackerConfig.units.weight})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={settings.trackerConfig.goal.goalWeight ?? ""}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        trackerConfig: {
                          ...s.trackerConfig,
                          goal: {
                            ...s.trackerConfig.goal,
                            goalWeight: e.target.value
                              ? Number(e.target.value)
                              : null,
                          },
                        },
                      }))
                    }
                    placeholder="170"
                    className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400">
                    Goal Body Fat (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={settings.trackerConfig.goal.goalBodyFat ?? ""}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        trackerConfig: {
                          ...s.trackerConfig,
                          goal: {
                            ...s.trackerConfig.goal,
                            goalBodyFat: e.target.value
                              ? Number(e.target.value)
                              : null,
                          },
                        },
                      }))
                    }
                    placeholder="15"
                    className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
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
