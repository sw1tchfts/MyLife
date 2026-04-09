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
        emailNotifications: false,
        browserNotifications: false,
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
        ...(body.emailNotifications !== undefined && {
          emailNotifications: body.emailNotifications,
        }),
        ...(body.browserNotifications !== undefined && {
          browserNotifications: body.browserNotifications,
        }),
      },
      create: {
        userId: user.id,
        theme: body.theme || "light",
        emailNotifications: body.emailNotifications || false,
        browserNotifications: body.browserNotifications || false,
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
