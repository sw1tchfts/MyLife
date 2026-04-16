import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

interface USDANutrient {
  nutrientId: number;
  value: number;
}

interface USDAFood {
  fdcId: number;
  description: string;
  brandName?: string;
  brandOwner?: string;
  foodNutrients: USDANutrient[];
}

function getNutrientValue(nutrients: USDANutrient[], id: number): number {
  const nutrient = nutrients.find((n) => n.nutrientId === id);
  return nutrient?.value ?? 0;
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

    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&pageSize=10&api_key=DEMO_KEY`,
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to search USDA database" },
        { status: 502 },
      );
    }

    const data = await response.json();
    const foods = (data.foods ?? []).map((food: USDAFood) => ({
      fdcId: food.fdcId,
      name: food.description,
      brand: food.brandName || food.brandOwner || "",
      servingSize: 100,
      servingUnit: "g",
      calories: getNutrientValue(food.foodNutrients, 1008),
      protein: getNutrientValue(food.foodNutrients, 1003),
      carbs: getNutrientValue(food.foodNutrients, 1005),
      fat: getNutrientValue(food.foodNutrients, 1004),
      fiber: getNutrientValue(food.foodNutrients, 1079),
      sugar: getNutrientValue(food.foodNutrients, 2000),
      sodium: getNutrientValue(food.foodNutrients, 1093),
      vitaminA: getNutrientValue(food.foodNutrients, 1104),
      vitaminC: getNutrientValue(food.foodNutrients, 1162),
      vitaminD: getNutrientValue(food.foodNutrients, 1114),
      calcium: getNutrientValue(food.foodNutrients, 1087),
      iron: getNutrientValue(food.foodNutrients, 1089),
      potassium: getNutrientValue(food.foodNutrients, 1092),
    }));

    return NextResponse.json(foods);
  } catch (error) {
    console.error("Failed to search foods:", error);
    return NextResponse.json(
      { error: "Failed to search foods" },
      { status: 500 },
    );
  }
}
