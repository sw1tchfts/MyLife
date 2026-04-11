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

    const data: Record<string, unknown> = {};
    if (typeof body.title === "string") data.title = body.title.trim();
    if (typeof body.description === "string")
      data.description = body.description;
    if (typeof body.imageUrl === "string") data.imageUrl = body.imageUrl;
    if (typeof body.tags === "string") data.tags = body.tags;
    if (typeof body.categoryId === "string") {
      data.categoryId = body.categoryId;
      // Reset Elo when moving to a new list
      data.elo = 1500;
      data.wins = 0;
      data.losses = 0;
      data.ties = 0;
    }

    const item = await prisma.rankingItem.update({
      where: { id },
      data,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to update ranking item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 },
    );
  }
}

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

    await prisma.rankingItem.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete ranking item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 },
    );
  }
}
