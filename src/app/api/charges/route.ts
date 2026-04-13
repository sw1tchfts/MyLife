import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { ChargeFrequency, ChargeCategory } from "@/generated/prisma";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

const VALID_FREQUENCIES: ChargeFrequency[] = [
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
];
const VALID_CATEGORIES: ChargeCategory[] = [
  "SUBSCRIPTION",
  "UTILITY",
  "INSURANCE",
  "RENT",
  "DEBT",
  "OTHER",
];

// GET /api/charges — list all recurring charges with upcoming occurrences
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") !== "false";

    const charges = await prisma.recurringCharge.findMany({
      where: activeOnly ? { active: true } : undefined,
      include: {
        occurrences: {
          orderBy: { dueDate: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(charges);
  } catch (error) {
    console.error("Failed to fetch charges:", error);
    return NextResponse.json(
      { error: "Failed to fetch charges" },
      { status: 500 },
    );
  }
}

// POST /api/charges — create a recurring charge and generate occurrences
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (
      body.amount !== undefined &&
      (typeof body.amount !== "number" || body.amount < 0)
    ) {
      return NextResponse.json(
        { error: "Amount must be a non-negative number" },
        { status: 400 },
      );
    }
    if (body.frequency && !VALID_FREQUENCIES.includes(body.frequency)) {
      return NextResponse.json(
        { error: `Frequency must be one of: ${VALID_FREQUENCIES.join(", ")}` },
        { status: 400 },
      );
    }
    if (body.category && !VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json(
        { error: `Category must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 },
      );
    }
    if (body.billingDay !== undefined) {
      const day = body.billingDay;
      if (!Number.isInteger(day) || day < 1 || day > 31) {
        return NextResponse.json(
          { error: "Billing day must be an integer between 1 and 31" },
          { status: 400 },
        );
      }
    }

    const charge = await prisma.recurringCharge.create({
      data: {
        name: body.name.trim(),
        amount: body.amount ?? 0,
        isVariableAmount: body.isVariableAmount ?? false,
        frequency: body.frequency ?? "MONTHLY",
        billingDay: body.billingDay ?? 1,
        category: body.category ?? "OTHER",
        autoPay: body.autoPay ?? false,
        url: body.url ?? "",
        notes: body.notes ?? "",
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    });

    // Generate occurrences for the next 60 days
    const occurrences = generateOccurrences(charge, 60);
    if (occurrences.length > 0) {
      await prisma.chargeOccurrence.createMany({ data: occurrences });
    }

    const result = await prisma.recurringCharge.findUnique({
      where: { id: charge.id },
      include: { occurrences: { orderBy: { dueDate: "asc" } } },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create charge:", error);
    return NextResponse.json(
      { error: "Failed to create charge" },
      { status: 500 },
    );
  }
}

/* ── Occurrence generation helper ─────────────────── */

interface ChargeTemplate {
  id: string;
  amount: number;
  frequency: ChargeFrequency;
  billingDay: number;
  startDate: Date;
  endDate: Date | null;
}

export function generateOccurrences(
  charge: ChargeTemplate,
  daysAhead: number,
): { recurringChargeId: string; dueDate: Date; amount: number }[] {
  const now = new Date();
  const end = new Date();
  end.setDate(end.getDate() + daysAhead);

  const results: {
    recurringChargeId: string;
    dueDate: Date;
    amount: number;
  }[] = [];

  // Start from the charge's start date or now, whichever is later
  let cursor = new Date(charge.startDate);
  if (cursor < now) {
    // Fast-forward cursor to the first upcoming occurrence
    cursor = findNextOccurrence(charge, now);
  }

  while (cursor <= end) {
    if (charge.endDate && cursor > charge.endDate) break;

    results.push({
      recurringChargeId: charge.id,
      dueDate: new Date(cursor),
      amount: charge.amount,
    });

    cursor = advanceDate(cursor, charge.frequency, charge.billingDay);
  }

  return results;
}

function findNextOccurrence(charge: ChargeTemplate, after: Date): Date {
  let cursor = new Date(charge.startDate);
  while (cursor <= after) {
    cursor = advanceDate(cursor, charge.frequency, charge.billingDay);
  }
  return cursor;
}

function advanceDate(
  date: Date,
  frequency: ChargeFrequency,
  billingDay: number,
): Date {
  const next = new Date(date);
  switch (frequency) {
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "BIWEEKLY":
      next.setDate(next.getDate() + 14);
      break;
    case "MONTHLY": {
      next.setMonth(next.getMonth() + 1);
      // Clamp to the billing day (handles months with fewer days)
      const maxDay = new Date(
        next.getFullYear(),
        next.getMonth() + 1,
        0,
      ).getDate();
      next.setDate(Math.min(billingDay, maxDay));
      break;
    }
    case "QUARTERLY": {
      next.setMonth(next.getMonth() + 3);
      const maxDayQ = new Date(
        next.getFullYear(),
        next.getMonth() + 1,
        0,
      ).getDate();
      next.setDate(Math.min(billingDay, maxDayQ));
      break;
    }
    case "YEARLY": {
      next.setFullYear(next.getFullYear() + 1);
      const maxDayY = new Date(
        next.getFullYear(),
        next.getMonth() + 1,
        0,
      ).getDate();
      next.setDate(Math.min(billingDay, maxDayY));
      break;
    }
  }
  return next;
}
