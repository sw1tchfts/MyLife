import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/gym/muscles — list all muscles, optionally filter by group
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const group = searchParams.get("group");

    const where: Record<string, unknown> = {};
    if (group) where.group = group;

    const muscles = await prisma.muscle.findMany({
      where,
      include: { children: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(muscles);
  } catch (error) {
    console.error("Failed to fetch muscles:", error);
    return NextResponse.json(
      { error: "Failed to fetch muscles" },
      { status: 500 },
    );
  }
}
