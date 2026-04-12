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

    const existing = await prisma.progressPhoto.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Progress photo not found" },
        { status: 404 },
      );
    }

    await prisma.progressPhoto.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete progress photo:", error);
    return NextResponse.json(
      { error: "Failed to delete progress photo" },
      { status: 500 },
    );
  }
}
