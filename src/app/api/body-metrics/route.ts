import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { MetricType } from "@/generated/prisma/client";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as MetricType | null;

    const where = type ? { type } : {};

    const metrics = await prisma.bodyMetric.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Failed to fetch body metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch body metrics" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const metric = await prisma.bodyMetric.create({
      data: {
        date: new Date(body.date),
        type: body.type,
        value: body.value,
        unit: body.unit ?? "",
      },
    });

    return NextResponse.json(metric, { status: 201 });
  } catch (error) {
    console.error("Failed to create body metric:", error);
    return NextResponse.json(
      { error: "Failed to create body metric" },
      { status: 500 },
    );
  }
}
