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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!body.categoryId) {
      return NextResponse.json(
        { error: "categoryId is required" },
        { status: 400 },
      );
    }

    const tagNames: string[] = Array.isArray(body.tags)
      ? body.tags.map((t: string) => t.trim()).filter(Boolean)
      : typeof body.tags === "string" && body.tags.trim()
        ? body.tags
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [];

    const item = await prisma.rankingItem.create({
      data: {
        title,
        description: body.description || "",
        imageUrl: body.imageUrl || "",
        categoryId: body.categoryId,
        rankingItemTags: {
          create: tagNames.map((name: string) => ({
            tag: {
              connectOrCreate: { where: { name }, create: { name } },
            },
          })),
        },
      },
      include: { rankingItemTags: { include: { tag: true } } },
    });

    const { rankingItemTags, ...rest } = item;
    return NextResponse.json(
      { ...rest, tags: rankingItemTags.map((rt) => rt.tag.name) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create ranking item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 },
    );
  }
}
