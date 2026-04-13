import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { generateOccurrences } from "../route";
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

// GET /api/charges/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const charge = await prisma.recurringCharge.findUnique({
      where: { id },
      include: { occurrences: { orderBy: { dueDate: "asc" } } },
    });

    if (!charge) {
      return NextResponse.json({ error: "Charge not found" }, { status: 404 });
    }

    return NextResponse.json(charge);
  } catch (error) {
    console.error("Failed to fetch charge:", error);
    return NextResponse.json(
      { error: "Failed to fetch charge" },
      { status: 500 },
    );
  }
}

// PUT /api/charges/:id — update template, regenerate unpaid occurrences if needed
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (
      body.name !== undefined &&
      (!body.name || typeof body.name !== "string" || !body.name.trim())
    ) {
      return NextResponse.json(
        { error: "Name must be a non-empty string" },
        { status: 400 },
      );
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

    const existing = await prisma.recurringCharge.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Charge not found" }, { status: 404 });
    }

    // Detect if schedule-affecting fields changed
    const scheduleChanged =
      (body.amount !== undefined && body.amount !== existing.amount) ||
      (body.frequency !== undefined && body.frequency !== existing.frequency) ||
      (body.billingDay !== undefined &&
        body.billingDay !== existing.billingDay);

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.amount !== undefined) data.amount = body.amount;
    if (body.isVariableAmount !== undefined)
      data.isVariableAmount = body.isVariableAmount;
    if (body.frequency !== undefined) data.frequency = body.frequency;
    if (body.billingDay !== undefined) data.billingDay = body.billingDay;
    if (body.category !== undefined) data.category = body.category;
    if (body.autoPay !== undefined) data.autoPay = body.autoPay;
    if (body.url !== undefined) data.url = body.url;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.active !== undefined) data.active = body.active;
    if (body.endDate !== undefined)
      data.endDate = body.endDate ? new Date(body.endDate) : null;

    const updated = await prisma.recurringCharge.update({
      where: { id },
      data,
    });

    // If schedule-affecting fields changed, delete unpaid future occurrences and regenerate
    if (scheduleChanged) {
      await prisma.chargeOccurrence.deleteMany({
        where: {
          recurringChargeId: id,
          status: { in: ["UPCOMING", "DUE"] },
        },
      });

      if (updated.active) {
        const newOccurrences = generateOccurrences(updated, 60);
        if (newOccurrences.length > 0) {
          await prisma.chargeOccurrence.createMany({ data: newOccurrences });
        }
      }
    }

    // If deactivated, remove future unpaid occurrences
    if (body.active === false) {
      await prisma.chargeOccurrence.deleteMany({
        where: {
          recurringChargeId: id,
          status: { in: ["UPCOMING", "DUE"] },
        },
      });
    }

    const result = await prisma.recurringCharge.findUnique({
      where: { id },
      include: { occurrences: { orderBy: { dueDate: "asc" } } },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to update charge:", error);
    return NextResponse.json(
      { error: "Failed to update charge" },
      { status: 500 },
    );
  }
}

// DELETE /api/charges/:id — permanently delete charge and all occurrences
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.recurringCharge.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete charge:", error);
    return NextResponse.json(
      { error: "Failed to delete charge" },
      { status: 500 },
    );
  }
}
