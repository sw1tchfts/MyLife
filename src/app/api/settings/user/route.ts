import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });
    return NextResponse.json(
      settings || {
        userId: user.id,
        theme: "light",
        trackerEnabled: true,
        trackerConfig: {
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
            activityLevel: "moderate",
          },
          goal: { type: "maintenance", weeklyRateLbs: 0 },
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch user settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch user settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {
        ...(body.theme !== undefined && { theme: body.theme }),
        ...(body.trackerEnabled !== undefined && {
          trackerEnabled: body.trackerEnabled,
        }),
        ...(body.trackerConfig !== undefined && {
          trackerConfig: body.trackerConfig,
        }),
      },
      create: {
        userId: user.id,
        theme: body.theme || "light",
        trackerEnabled: body.trackerEnabled ?? true,
        trackerConfig: body.trackerConfig || undefined,
      },
    });
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to update user settings:", error);
    return NextResponse.json(
      { error: "Failed to update user settings" },
      { status: 500 },
    );
  }
}
