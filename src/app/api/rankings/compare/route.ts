import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { newRatings } from "@/lib/elo";
import type { ComparisonResult } from "@/generated/prisma/client";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * GET — fetch the next pair to compare for a category.
 * Picks the pair with the fewest comparisons between them,
 * prioritising items with fewer total comparisons.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categoryId = new URL(request.url).searchParams.get("categoryId");
    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId is required" },
        { status: 400 },
      );
    }

    const items = await prisma.rankingItem.findMany({
      where: { categoryId },
      orderBy: [{ wins: "asc" }, { losses: "asc" }, { ties: "asc" }],
    });

    if (items.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 items to compare" },
        { status: 400 },
      );
    }

    // Find the pair with fewest head-to-head comparisons
    const comparisons = await prisma.comparison.findMany({
      where: { categoryId },
      select: { leftItemId: true, rightItemId: true },
    });

    // Count comparisons per pair
    const pairCounts = new Map<string, number>();
    for (const c of comparisons) {
      const key = [c.leftItemId, c.rightItemId].sort().join("|");
      pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
    }

    // Find pair with minimum comparisons
    let bestPair: [string, string] | null = null;
    let minCount = Infinity;

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const key = [items[i].id, items[j].id].sort().join("|");
        const count = pairCounts.get(key) || 0;
        // Also factor in total comparisons for each item
        const totalComps =
          items[i].wins +
          items[i].losses +
          items[i].ties +
          items[j].wins +
          items[j].losses +
          items[j].ties;
        const score = count * 1000 + totalComps;
        if (score < minCount) {
          minCount = score;
          bestPair = [items[i].id, items[j].id];
        }
      }
    }

    if (!bestPair) {
      return NextResponse.json(
        { error: "No pairs available" },
        { status: 400 },
      );
    }

    // Randomize left/right
    if (Math.random() > 0.5) bestPair.reverse();

    const [left, right] = await Promise.all([
      prisma.rankingItem.findUnique({ where: { id: bestPair[0] } }),
      prisma.rankingItem.findUnique({ where: { id: bestPair[1] } }),
    ]);

    return NextResponse.json({ left, right });
  } catch (error) {
    console.error("Failed to get comparison pair:", error);
    return NextResponse.json({ error: "Failed to get pair" }, { status: 500 });
  }
}

/**
 * POST — submit a comparison result.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { leftItemId, rightItemId, categoryId, result } = body;

    if (!leftItemId || !rightItemId || !categoryId || !result) {
      return NextResponse.json(
        {
          error: "leftItemId, rightItemId, categoryId, and result are required",
        },
        { status: 400 },
      );
    }

    const validResults: ComparisonResult[] = ["LEFT", "RIGHT", "TIE", "SKIP"];
    if (!validResults.includes(result)) {
      return NextResponse.json(
        { error: "result must be LEFT, RIGHT, TIE, or SKIP" },
        { status: 400 },
      );
    }

    // Save comparison
    const comparison = await prisma.comparison.create({
      data: { leftItemId, rightItemId, categoryId, result },
    });

    // Update Elo ratings (skip doesn't affect ratings)
    if (result !== "SKIP") {
      const [leftItem, rightItem] = await Promise.all([
        prisma.rankingItem.findUnique({ where: { id: leftItemId } }),
        prisma.rankingItem.findUnique({ where: { id: rightItemId } }),
      ]);

      if (leftItem && rightItem) {
        const { newA, newB } = newRatings(leftItem.elo, rightItem.elo, result);

        const leftUpdate: Record<string, unknown> = { elo: newA };
        const rightUpdate: Record<string, unknown> = { elo: newB };

        if (result === "LEFT") {
          leftUpdate.wins = { increment: 1 };
          rightUpdate.losses = { increment: 1 };
        } else if (result === "RIGHT") {
          leftUpdate.losses = { increment: 1 };
          rightUpdate.wins = { increment: 1 };
        } else {
          leftUpdate.ties = { increment: 1 };
          rightUpdate.ties = { increment: 1 };
        }

        await Promise.all([
          prisma.rankingItem.update({
            where: { id: leftItemId },
            data: leftUpdate,
          }),
          prisma.rankingItem.update({
            where: { id: rightItemId },
            data: rightUpdate,
          }),
        ]);
      }
    }

    return NextResponse.json(comparison, { status: 201 });
  } catch (error) {
    console.error("Failed to submit comparison:", error);
    return NextResponse.json(
      { error: "Failed to submit comparison" },
      { status: 500 },
    );
  }
}
