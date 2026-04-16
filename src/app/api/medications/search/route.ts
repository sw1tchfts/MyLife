import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

interface OpenFDAResult {
  openfda?: {
    spl_id?: string[];
    brand_name?: string[];
    generic_name?: string[];
    dosage_form?: string[];
    product_type?: string[];
  };
  purpose?: string[];
  indications_and_usage?: string[];
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q || q.trim().length === 0) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 },
      );
    }

    try {
      const response = await fetch(
        `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(q)}"+openfda.generic_name:"${encodeURIComponent(q)}"&limit=10`,
      );

      if (!response.ok) {
        return NextResponse.json([]);
      }

      const data = await response.json();
      const results = (data.results ?? []).map((result: OpenFDAResult) => {
        const description =
          result.purpose?.[0] || result.indications_and_usage?.[0] || "";
        return {
          id: result.openfda?.spl_id?.[0] ?? "",
          name: result.openfda?.brand_name?.[0] ?? "",
          genericName: result.openfda?.generic_name?.[0] ?? "",
          dosageForm: result.openfda?.dosage_form?.[0] ?? "",
          strength: result.openfda?.product_type?.[0] ?? "",
          description:
            description.length > 200
              ? description.substring(0, 200)
              : description,
        };
      });

      return NextResponse.json(results);
    } catch {
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Failed to search medications:", error);
    return NextResponse.json(
      { error: "Failed to search medications" },
      { status: 500 },
    );
  }
}
