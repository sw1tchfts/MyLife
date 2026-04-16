import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

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
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "Both 'from' and 'to' query params are required" },
        { status: 400 },
      );
    }

    const logs = await prisma.nutritionLog.findMany({
      where: {
        date: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to fetch nutrition logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch nutrition logs" },
      { status: 500 },
    );
  }
}
