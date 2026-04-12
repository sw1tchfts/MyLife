import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const VALID_TYPES = ["FLOWCHART", "PROCESS", "SWIMLANE", "ER_DIAGRAM"] as const;

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const diagram = await prisma.diagram.findUnique({ where: { id } });

    if (!diagram) {
      return NextResponse.json({ error: "Diagram not found" }, { status: 404 });
    }

    return NextResponse.json(diagram);
  } catch (error) {
    console.error("Failed to fetch diagram:", error);
    return NextResponse.json(
      { error: "Failed to fetch diagram" },
      { status: 500 },
    );
  }
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
    if (body.type && VALID_TYPES.includes(body.type)) data.type = body.type;
    if (body.nodes !== undefined) data.nodes = body.nodes;
    if (body.edges !== undefined) data.edges = body.edges;
    if (body.viewport !== undefined) data.viewport = body.viewport;

    const diagram = await prisma.diagram.update({
      where: { id },
      data,
    });

    return NextResponse.json(diagram);
  } catch (error) {
    console.error("Failed to update diagram:", error);
    return NextResponse.json(
      { error: "Failed to update diagram" },
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

    await prisma.diagram.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete diagram:", error);
    return NextResponse.json(
      { error: "Failed to delete diagram" },
      { status: 500 },
    );
  }
}
