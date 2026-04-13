"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/* ── Types ─────────────────────────────────────────── */

type ChargeFrequency =
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY";
type ChargeCategory =
  | "SUBSCRIPTION"
  | "UTILITY"
  | "INSURANCE"
  | "RENT"
  | "DEBT"
  | "OTHER";
type OccurrenceStatus = "UPCOMING" | "DUE" | "PAID" | "LATE" | "SKIPPED";

interface ChargeOccurrence {
  id: string;
  recurringChargeId: string;
  dueDate: string;
  amount: number;
  status: OccurrenceStatus;
  paidDate: string | null;
  notes: string;
}

interface RecurringCharge {
  id: string;
  name: string;
  amount: number;
  isVariableAmount: boolean;
  frequency: ChargeFrequency;
  billingDay: number;
  category: ChargeCategory;
  autoPay: boolean;
  url: string;
  notes: string;
  startDate: string;
  endDate: string | null;
  active: boolean;
  occurrences: ChargeOccurrence[];
}

type Tab = "overview" | "charges" | "history";

/* ── Constants ─────────────────────────────────────── */

const FREQUENCIES: { value: ChargeFrequency; label: string }[] = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Biweekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
];

const CATEGORIES: { value: ChargeCategory; label: string }[] = [
  { value: "SUBSCRIPTION", label: "Subscription" },
  { value: "UTILITY", label: "Utility" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "RENT", label: "Rent" },
  { value: "DEBT", label: "Debt" },
  { value: "OTHER", label: "Other" },
];

const CATEGORY_COLORS: Record<ChargeCategory, string> = {
  SUBSCRIPTION:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  UTILITY:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  INSURANCE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  RENT: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  DEBT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  OTHER: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

const STATUS_COLORS: Record<OccurrenceStatus, string> = {
  UPCOMING: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  DUE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  LATE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  SKIPPED: "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
};

/* ── Helpers ───────────────────────────────────────── */

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getDueStatus(
  dueDate: string,
): "overdue" | "due-today" | "due-soon" | "upcoming" {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "due-today";
  if (diffDays <= 3) return "due-soon";
  return "upcoming";
}

/* ── Page wrapper ──────────────────────────────────── */

export default function FinancesPage() {
  return (
    <Suspense
      fallback={<p className="text-center text-gray-400">Loading...</p>}
    >
      <FinancesContent />
    </Suspense>
  );
}

/* ── Main content ──────────────────────────────────── */

function FinancesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = (searchParams.get("tab") as Tab) || "overview";

  const setTab = (t: Tab) => router.push(`/finances?tab=${t}`);

  const [charges, setCharges] = useState<RecurringCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  const fetchCharges = useCallback(async () => {
    try {
      const url = showInactive ? "/api/charges?active=false" : "/api/charges";
      const res = await fetch(url);
      if (res.ok) setCharges(await res.json());
    } catch (err) {
      console.error("Failed to fetch charges:", err);
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    fetchCharges();
  }, [fetchCharges]);

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "charges", label: "Manage Charges" },
    { key: "history", label: "Payment History" },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
        Finances
      </h1>

      <div className="mb-6 flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-t-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-400">Loading...</p>
      ) : (
        <>
          {tab === "overview" && (
            <OverviewTab charges={charges} onUpdate={fetchCharges} />
          )}
          {tab === "charges" && (
            <ChargesTab
              charges={charges}
              onUpdate={fetchCharges}
              showInactive={showInactive}
              setShowInactive={setShowInactive}
            />
          )}
          {tab === "history" && <HistoryTab charges={charges} />}
        </>
      )}
    </div>
  );
}

/* ── Overview Tab ──────────────────────────────────── */

function OverviewTab({
  charges,
  onUpdate,
}: {
  charges: RecurringCharge[];
  onUpdate: () => void;
}) {
  const activeCharges = charges.filter((c) => c.active);

  // Gather all unpaid occurrences sorted by due date
  const unpaidOccurrences = activeCharges
    .flatMap((c) =>
      c.occurrences
        .filter((o) => o.status !== "PAID" && o.status !== "SKIPPED")
        .map((o) => ({
          ...o,
          chargeName: c.name,
          category: c.category,
          autoPay: c.autoPay,
        })),
    )
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

  // Monthly totals
  const monthlyEstimate = activeCharges.reduce((sum, c) => {
    switch (c.frequency) {
      case "WEEKLY":
        return sum + c.amount * 4.33;
      case "BIWEEKLY":
        return sum + c.amount * 2.17;
      case "MONTHLY":
        return sum + c.amount;
      case "QUARTERLY":
        return sum + c.amount / 3;
      case "YEARLY":
        return sum + c.amount / 12;
      default:
        return sum;
    }
  }, 0);

  const paidThisMonth = activeCharges.reduce((sum, c) => {
    const now = new Date();
    return (
      sum +
      c.occurrences
        .filter(
          (o) =>
            o.status === "PAID" &&
            o.paidDate &&
            new Date(o.paidDate).getMonth() === now.getMonth() &&
            new Date(o.paidDate).getFullYear() === now.getFullYear(),
        )
        .reduce((s, o) => s + o.amount, 0)
    );
  }, 0);

  const overdueCount = unpaidOccurrences.filter(
    (o) => getDueStatus(o.dueDate) === "overdue",
  ).length;

  const markPaid = async (occurrenceId: string, chargeId: string) => {
    await fetch(`/api/charges/${chargeId}/occurrences`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ occurrenceId, status: "PAID" }),
    });
    onUpdate();
  };

  const skipOccurrence = async (occurrenceId: string, chargeId: string) => {
    await fetch(`/api/charges/${chargeId}/occurrences`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ occurrenceId, status: "SKIPPED" }),
    });
    onUpdate();
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
            Monthly Estimate
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(monthlyEstimate)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {activeCharges.length} active charge
            {activeCharges.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
            Paid This Month
          </p>
          <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(paidThisMonth)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
            Overdue
          </p>
          <p
            className={`mt-1 text-2xl font-bold ${overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"}`}
          >
            {overdueCount}
          </p>
        </div>
      </div>

      {/* Upcoming charges list */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 uppercase dark:text-gray-300">
          Upcoming & Due
        </h2>
        {unpaidOccurrences.length === 0 ? (
          <p className="text-sm text-gray-400">No upcoming charges.</p>
        ) : (
          <div className="space-y-2">
            {unpaidOccurrences.map((occ) => {
              const dueStatus = getDueStatus(occ.dueDate);
              return (
                <div
                  key={occ.id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    dueStatus === "overdue"
                      ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                      : dueStatus === "due-today"
                        ? "border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
                        : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {occ.chargeName}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span
                          className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[occ.category]}`}
                        >
                          {occ.category}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDateShort(occ.dueDate)}
                        </span>
                        {occ.autoPay && (
                          <span className="text-[10px] text-gray-400">
                            (auto-pay)
                          </span>
                        )}
                        {dueStatus === "overdue" && (
                          <span className="text-[10px] font-medium text-red-600 dark:text-red-400">
                            OVERDUE
                          </span>
                        )}
                        {dueStatus === "due-today" && (
                          <span className="text-[10px] font-medium text-yellow-600 dark:text-yellow-400">
                            DUE TODAY
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(occ.amount)}
                    </span>
                    <button
                      onClick={() => markPaid(occ.id, occ.recurringChargeId)}
                      className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                    >
                      Paid
                    </button>
                    <button
                      onClick={() =>
                        skipOccurrence(occ.id, occ.recurringChargeId)
                      }
                      className="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* By category breakdown */}
      {activeCharges.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700 uppercase dark:text-gray-300">
            Monthly by Category
          </h2>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => {
              const catCharges = activeCharges.filter(
                (c) => c.category === cat.value,
              );
              if (catCharges.length === 0) return null;
              const catMonthly = catCharges.reduce((sum, c) => {
                switch (c.frequency) {
                  case "WEEKLY":
                    return sum + c.amount * 4.33;
                  case "BIWEEKLY":
                    return sum + c.amount * 2.17;
                  case "MONTHLY":
                    return sum + c.amount;
                  case "QUARTERLY":
                    return sum + c.amount / 3;
                  case "YEARLY":
                    return sum + c.amount / 12;
                  default:
                    return sum;
                }
              }, 0);
              return (
                <div
                  key={cat.value}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[cat.value]}`}
                    >
                      {cat.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {catCharges.length} charge
                      {catCharges.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(catMonthly)}/mo
                  </span>
                </div>
              );
            }).filter(Boolean)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Charges Tab (Manage) ──────────────────────────── */

function ChargesTab({
  charges,
  onUpdate,
  showInactive,
  setShowInactive,
}: {
  charges: RecurringCharge[];
  onUpdate: () => void;
  showInactive: boolean;
  setShowInactive: (v: boolean) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingCharge, setEditingCharge] = useState<RecurringCharge | null>(
    null,
  );

  const handleDelete = async (id: string) => {
    if (
      !confirm("Delete this charge and all its history? This cannot be undone.")
    )
      return;
    await fetch(`/api/charges/${id}`, { method: "DELETE" });
    onUpdate();
  };

  const handleToggleActive = async (charge: RecurringCharge) => {
    await fetch(`/api/charges/${charge.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !charge.active }),
    });
    onUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Show inactive
        </label>
        <button
          onClick={() => {
            setEditingCharge(null);
            setShowForm(true);
          }}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Charge
        </button>
      </div>

      {showForm && (
        <ChargeForm
          charge={editingCharge}
          onSave={() => {
            setShowForm(false);
            setEditingCharge(null);
            onUpdate();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingCharge(null);
          }}
        />
      )}

      {charges.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">
          No charges yet. Add your first recurring charge to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {charges.map((charge) => (
            <div
              key={charge.id}
              className={`rounded-lg border p-4 ${
                charge.active
                  ? "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                  : "border-gray-200 bg-gray-50 opacity-60 dark:border-gray-700 dark:bg-gray-800/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {charge.name}
                    </h3>
                    <span
                      className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[charge.category]}`}
                    >
                      {charge.category}
                    </span>
                    {charge.autoPay && (
                      <span className="inline-flex rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        AUTO-PAY
                      </span>
                    )}
                    {charge.isVariableAmount && (
                      <span className="inline-flex rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        VARIABLE
                      </span>
                    )}
                    {!charge.active && (
                      <span className="inline-flex rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatCurrency(charge.amount)} /{" "}
                    {FREQUENCIES.find(
                      (f) => f.value === charge.frequency,
                    )?.label.toLowerCase()}{" "}
                    &middot; Day {charge.billingDay} &middot; Started{" "}
                    {formatDate(charge.startDate)}
                  </p>
                  {charge.notes && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {charge.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingCharge(charge);
                      setShowForm(true);
                    }}
                    className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(charge)}
                    className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    {charge.active ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={() => handleDelete(charge.id)}
                    className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Charge Form (Create / Edit) ───────────────────── */

function ChargeForm({
  charge,
  onSave,
  onCancel,
}: {
  charge: RecurringCharge | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(charge?.name ?? "");
  const [amount, setAmount] = useState(charge?.amount?.toString() ?? "");
  const [frequency, setFrequency] = useState<ChargeFrequency>(
    charge?.frequency ?? "MONTHLY",
  );
  const [billingDay, setBillingDay] = useState(
    charge?.billingDay?.toString() ?? "1",
  );
  const [category, setCategory] = useState<ChargeCategory>(
    charge?.category ?? "OTHER",
  );
  const [autoPay, setAutoPay] = useState(charge?.autoPay ?? false);
  const [isVariableAmount, setIsVariableAmount] = useState(
    charge?.isVariableAmount ?? false,
  );
  const [url, setUrl] = useState(charge?.url ?? "");
  const [notes, setNotes] = useState(charge?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      name: name.trim(),
      amount: parseFloat(amount) || 0,
      frequency,
      billingDay: parseInt(billingDay) || 1,
      category,
      autoPay,
      isVariableAmount,
      url: url.trim(),
      notes: notes.trim(),
    };

    try {
      const res = charge
        ? await fetch(`/api/charges/${charge.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/charges", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }
      onSave();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/10"
    >
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
        {charge ? "Edit Charge" : "New Recurring Charge"}
      </h3>

      {error && (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Netflix, Electric Bill..."
            required
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Amount ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Frequency
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as ChargeFrequency)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Billing Day
          </label>
          <input
            type="number"
            min="1"
            max="31"
            value={billingDay}
            onChange={(e) => setBillingDay(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ChargeCategory)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Payment URL (optional)
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="mt-3 flex gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={autoPay}
            onChange={(e) => setAutoPay(e.target.checked)}
            className="rounded"
          />
          Auto-pay
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={isVariableAmount}
            onChange={(e) => setIsVariableAmount(e.target.checked)}
            className="rounded"
          />
          Variable amount
        </label>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
          Notes (optional)
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes..."
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : charge ? "Update" : "Create"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md bg-gray-200 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ── History Tab ───────────────────────────────────── */

function HistoryTab({ charges }: { charges: RecurringCharge[] }) {
  const paidOccurrences = charges
    .flatMap((c) =>
      c.occurrences
        .filter((o) => o.status === "PAID" || o.status === "SKIPPED")
        .map((o) => ({
          ...o,
          chargeName: c.name,
          category: c.category,
        })),
    )
    .sort((a, b) => {
      const dateA = a.paidDate || a.dueDate;
      const dateB = b.paidDate || b.dueDate;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

  if (paidOccurrences.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        No payment history yet. Mark charges as paid to see them here.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="py-2 pr-4 text-left font-medium text-gray-500 dark:text-gray-400">
              Charge
            </th>
            <th className="py-2 pr-4 text-left font-medium text-gray-500 dark:text-gray-400">
              Category
            </th>
            <th className="py-2 pr-4 text-left font-medium text-gray-500 dark:text-gray-400">
              Due Date
            </th>
            <th className="py-2 pr-4 text-left font-medium text-gray-500 dark:text-gray-400">
              Paid Date
            </th>
            <th className="py-2 pr-4 text-right font-medium text-gray-500 dark:text-gray-400">
              Amount
            </th>
            <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {paidOccurrences.map((occ) => (
            <tr
              key={occ.id}
              className="border-b border-gray-100 dark:border-gray-800"
            >
              <td className="py-2 pr-4 text-gray-900 dark:text-gray-100">
                {occ.chargeName}
              </td>
              <td className="py-2 pr-4">
                <span
                  className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[occ.category]}`}
                >
                  {occ.category}
                </span>
              </td>
              <td className="py-2 pr-4 text-gray-500 dark:text-gray-400">
                {formatDate(occ.dueDate)}
              </td>
              <td className="py-2 pr-4 text-gray-500 dark:text-gray-400">
                {occ.paidDate ? formatDate(occ.paidDate) : "—"}
              </td>
              <td className="py-2 pr-4 text-right font-medium text-gray-900 dark:text-gray-100">
                {occ.status === "SKIPPED" ? "—" : formatCurrency(occ.amount)}
              </td>
              <td className="py-2">
                <span
                  className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[occ.status]}`}
                >
                  {occ.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
