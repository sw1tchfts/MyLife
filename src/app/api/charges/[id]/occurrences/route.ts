import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { OccurrenceStatus } from "@/generated/prisma/client";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

const VALID_STATUSES: OccurrenceStatus[] = [
  "UPCOMING",
  "DUE",
  "PAID",
  "LATE",
  "SKIPPED",
];

// GET /api/charges/:id/occurrences — list occurrences for a charge
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as OccurrenceStatus | null;

    const occurrences = await prisma.chargeOccurrence.findMany({
      where: {
        recurringChargeId: id,
        ...(status && VALID_STATUSES.includes(status) ? { status } : {}),
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(occurrences);
  } catch (error) {
    console.error("Failed to fetch occurrences:", error);
    return NextResponse.json(
      { error: "Failed to fetch occurrences" },
      { status: 500 },
    );
  }
}

// PUT /api/charges/:id/occurrences — update an occurrence (mark paid, skip, edit amount)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await params; // validate charge id exists in URL
    const body = await request.json();

    if (!body.occurrenceId || typeof body.occurrenceId !== "string") {
      return NextResponse.json(
        { error: "occurrenceId is required" },
        { status: 400 },
      );
    }

    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 },
      );
    }

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.amount !== undefined) data.amount = body.amount;
    if (body.notes !== undefined) data.notes = body.notes;

    // Auto-set paidDate when marking as PAID
    if (body.status === "PAID") {
      data.paidDate = body.paidDate ? new Date(body.paidDate) : new Date();
    }
    // Clear paidDate if un-paying
    if (body.status && body.status !== "PAID") {
      data.paidDate = null;
    }

    const occurrence = await prisma.chargeOccurrence.update({
      where: { id: body.occurrenceId },
      data,
    });

    return NextResponse.json(occurrence);
  } catch (error) {
    console.error("Failed to update occurrence:", error);
    return NextResponse.json(
      { error: "Failed to update occurrence" },
      { status: 500 },
    );
  }
}
