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

    const medication = await prisma.medicationItem.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.genericName !== undefined && {
          genericName: body.genericName,
        }),
        ...(body.dosageForm !== undefined && { dosageForm: body.dosageForm }),
        ...(body.strength !== undefined && { strength: body.strength }),
        ...(body.concentration !== undefined && {
          concentration: body.concentration,
        }),
        ...(body.dosage !== undefined && { dosage: body.dosage }),
        ...(body.halfLife !== undefined && { halfLife: body.halfLife }),
        ...(body.halfLifeHours !== undefined && {
          halfLifeHours: body.halfLifeHours,
        }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
      },
    });

    return NextResponse.json(medication);
  } catch (error) {
    console.error("Failed to update medication:", error);
    return NextResponse.json(
      { error: "Failed to update medication" },
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

    await prisma.medicationItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete medication:", error);
    return NextResponse.json(
      { error: "Failed to delete medication" },
      { status: 500 },
    );
  }
}
