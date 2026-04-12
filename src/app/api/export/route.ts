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

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    const values = headers.map((h) => {
      const v = row[h];
      if (v === null || v === undefined) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    });
    lines.push(values.join(","));
  }
  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // tasks | journal | metrics
    const format = searchParams.get("format") || "json"; // json | csv

    if (!type || !["tasks", "journal", "metrics"].includes(type)) {
      return NextResponse.json(
        { error: "type must be one of: tasks, journal, metrics" },
        { status: 400 },
      );
    }

    let data: Record<string, unknown>[];

    switch (type) {
      case "tasks": {
        const tasks = await prisma.task.findMany({
          orderBy: { createdAt: "desc" },
        });
        data = tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate ? t.dueDate.toISOString() : "",
          recurrence: t.recurrence,
          taskType: t.taskType,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        }));
        break;
      }
      case "journal": {
        const entries = await prisma.journalEntry.findMany({
          orderBy: { date: "desc" },
        });
        data = entries.map((e) => ({
          id: e.id,
          title: e.title,
          content: e.content,
          mood: e.mood ?? "",
          tags: e.tags,
          date: e.date.toISOString(),
          createdAt: e.createdAt.toISOString(),
        }));
        break;
      }
      case "metrics": {
        const metrics = await prisma.bodyMetric.findMany({
          orderBy: { date: "desc" },
        });
        data = metrics.map((m) => ({
          id: m.id,
          date: m.date.toISOString(),
          type: m.type,
          value: m.value,
          unit: m.unit,
        }));
        break;
      }
      default:
        data = [];
    }

    if (format === "csv") {
      const csv = toCsv(data);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${type}-export.csv"`,
        },
      });
    }

    return NextResponse.json(data, {
      headers: {
        "Content-Disposition": `attachment; filename="${type}-export.json"`,
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
