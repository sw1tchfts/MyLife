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

    const where: Record<string, unknown> = {};

    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);
      where.date = dateFilter;
    }

    const photos = await prisma.progressPhoto.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return NextResponse.json(photos);
  } catch (error) {
    console.error("Failed to fetch progress photos:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress photos" },
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

    if (!body.date || !body.photoUrl) {
      return NextResponse.json(
        { error: "Date and photoUrl are required" },
        { status: 400 },
      );
    }

    const photo = await prisma.progressPhoto.create({
      data: {
        date: new Date(body.date),
        photoUrl: body.photoUrl,
        notes: body.notes ?? "",
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("Failed to create progress photo:", error);
    return NextResponse.json(
      { error: "Failed to create progress photo" },
      { status: 500 },
    );
  }
}
