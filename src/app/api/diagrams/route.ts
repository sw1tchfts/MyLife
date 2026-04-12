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

export async function GET() {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const diagrams = await prisma.diagram.findMany({
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(diagrams);
  } catch (error) {
    console.error("Failed to fetch diagrams:", error);
    return NextResponse.json(
      { error: "Failed to fetch diagrams" },
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
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const type = VALID_TYPES.includes(body.type) ? body.type : "FLOWCHART";

    const diagram = await prisma.diagram.create({
      data: {
        title,
        type,
        nodes: body.nodes ?? [],
        edges: body.edges ?? [],
        viewport: body.viewport ?? { x: 0, y: 0, zoom: 1 },
      },
    });

    return NextResponse.json(diagram, { status: 201 });
  } catch (error) {
    console.error("Failed to create diagram:", error);
    return NextResponse.json(
      { error: "Failed to create diagram" },
      { status: 500 },
    );
  }
}
