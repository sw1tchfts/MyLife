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

export async function GET() {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const medications = await prisma.medicationItem.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(medications);
  } catch (error) {
    console.error("Failed to fetch medications:", error);
    return NextResponse.json(
      { error: "Failed to fetch medications" },
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

    const medication = await prisma.medicationItem.create({
      data: {
        name: body.name,
        genericName: body.genericName ?? "",
        dosageForm: body.dosageForm ?? "",
        strength: body.strength ?? "",
        description: body.description ?? "",
        externalId: body.externalId ?? "",
        source: body.source ?? "",
      },
    });

    return NextResponse.json(medication, { status: 201 });
  } catch (error) {
    console.error("Failed to create medication:", error);
    return NextResponse.json(
      { error: "Failed to create medication" },
      { status: 500 },
    );
  }
}
