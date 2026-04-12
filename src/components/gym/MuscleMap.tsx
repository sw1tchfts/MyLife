"use client";

import { useState, useCallback } from "react";

export const MUSCLE_GROUPS = [
  { id: "chest", label: "Chest", color: "#ef4444" },
  { id: "back", label: "Back", color: "#f97316" },
  { id: "shoulders", label: "Shoulders", color: "#eab308" },
  { id: "quads", label: "Quads", color: "#22c55e" },
  { id: "hamstrings", label: "Hamstrings", color: "#14b8a6" },
  { id: "glutes", label: "Glutes", color: "#06b6d4" },
  { id: "biceps", label: "Biceps", color: "#3b82f6" },
  { id: "triceps", label: "Triceps", color: "#8b5cf6" },
  { id: "core", label: "Core", color: "#d946ef" },
  { id: "calves", label: "Calves", color: "#f43f5e" },
  { id: "forearms", label: "Forearms", color: "#78716c" },
  { id: "full-body", label: "Full Body", color: "#6366f1" },
] as const;

interface MuscleMapProps {
  highlighted?: string[];
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onMuscleClick?: (muscle: string) => void;
}

const SIZE_MAP = { sm: 150, md: 250, lg: 350 } as const;

function MuscleRegion({
  d,
  muscle,
  label,
  highlighted,
  interactive,
  onMuscleClick,
  hoveredMuscle,
  onHover,
  onLeave,
}: {
  d: string;
  muscle: string;
  label: string;
  highlighted: boolean;
  interactive: boolean;
  onMuscleClick?: (muscle: string) => void;
  hoveredMuscle: string | null;
  onHover: (muscle: string) => void;
  onLeave: () => void;
}) {
  const isHovered = hoveredMuscle === muscle;

  let fill: string;
  if (highlighted) {
    fill = isHovered && interactive ? "#60a5fa" : "#3b82f6";
  } else if (isHovered && interactive) {
    fill = "#93c5fd";
  } else {
    fill = "var(--muscle-default)";
  }

  return (
    <path
      d={d}
      data-muscle={muscle}
      fill={fill}
      fillOpacity={highlighted ? 0.8 : isHovered && interactive ? 0.5 : 1}
      stroke="var(--muscle-stroke)"
      strokeWidth="0.5"
      style={{
        cursor: interactive ? "pointer" : "default",
        transition: "fill 0.15s ease, fill-opacity 0.15s ease",
      }}
      onClick={() => interactive && onMuscleClick?.(muscle)}
      onMouseEnter={() => onHover(muscle)}
      onMouseLeave={onLeave}
    >
      <title>{label}</title>
    </path>
  );
}

export default function MuscleMap({
  highlighted = [],
  size = "md",
  interactive = false,
  onMuscleClick,
}: MuscleMapProps) {
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);

  const handleHover = useCallback((muscle: string) => setHoveredMuscle(muscle), []);
  const handleLeave = useCallback(() => setHoveredMuscle(null), []);

  const height = SIZE_MAP[size];
  const aspect = 1.85; // width to height for two figures side by side
  const width = Math.round(height * aspect);

  const isHighlighted = (muscle: string) => highlighted.includes(muscle);

  const regionProps = (muscle: string, label: string) => ({
    muscle,
    label,
    highlighted: isHighlighted(muscle),
    interactive,
    onMuscleClick,
    hoveredMuscle,
    onHover: handleHover,
    onLeave: handleLeave,
  });

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="flex items-start gap-2">
        {/* ===== FRONT VIEW ===== */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 font-medium">
            Front
          </span>
          <svg
            viewBox="0 0 120 200"
            width={width / 2 - 4}
            height={height}
            xmlns="http://www.w3.org/2000/svg"
            style={
              {
                "--muscle-default": "#e5e7eb",
                "--muscle-stroke": "#d1d5db",
              } as React.CSSProperties
            }
            className="dark:[--muscle-default:#374151] dark:[--muscle-stroke:#4b5563]"
          >
            {/* Head */}
            <ellipse cx="60" cy="18" rx="12" ry="14" fill="var(--muscle-default)" stroke="var(--muscle-stroke)" strokeWidth="0.5" />
            {/* Neck */}
            <rect x="55" y="31" width="10" height="8" rx="2" fill="var(--muscle-default)" stroke="var(--muscle-stroke)" strokeWidth="0.5" />

            {/* ---- Shoulders (front deltoids) ---- */}
            {/* Left shoulder */}
            <MuscleRegion
              d="M 42 40 Q 36 38 32 44 Q 30 50 33 54 L 42 52 L 42 40 Z"
              {...regionProps("shoulders", "Shoulders (Front Deltoids)")}
            />
            {/* Right shoulder */}
            <MuscleRegion
              d="M 78 40 Q 84 38 88 44 Q 90 50 87 54 L 78 52 L 78 40 Z"
              {...regionProps("shoulders", "Shoulders (Front Deltoids)")}
            />

            {/* ---- Chest (pectorals) ---- */}
            {/* Left pec */}
            <MuscleRegion
              d="M 42 40 L 42 52 L 43 60 Q 48 66 58 64 L 58 42 Q 52 38 42 40 Z"
              {...regionProps("chest", "Chest (Pectorals)")}
            />
            {/* Right pec */}
            <MuscleRegion
              d="M 78 40 L 78 52 L 77 60 Q 72 66 62 64 L 62 42 Q 68 38 78 40 Z"
              {...regionProps("chest", "Chest (Pectorals)")}
            />

            {/* ---- Biceps ---- */}
            {/* Left bicep */}
            <MuscleRegion
              d="M 33 54 L 30 56 Q 26 64 27 76 L 30 78 L 35 78 Q 38 68 38 58 L 42 52 L 33 54 Z"
              {...regionProps("biceps", "Biceps")}
            />
            {/* Right bicep */}
            <MuscleRegion
              d="M 87 54 L 90 56 Q 94 64 93 76 L 90 78 L 85 78 Q 82 68 82 58 L 78 52 L 87 54 Z"
              {...regionProps("biceps", "Biceps")}
            />

            {/* ---- Forearms ---- */}
            {/* Left forearm */}
            <MuscleRegion
              d="M 27 78 L 30 78 L 35 78 Q 36 90 34 100 L 30 104 L 25 104 Q 24 92 27 78 Z"
              {...regionProps("forearms", "Forearms")}
            />
            {/* Right forearm */}
            <MuscleRegion
              d="M 93 78 L 90 78 L 85 78 Q 84 90 86 100 L 90 104 L 95 104 Q 96 92 93 78 Z"
              {...regionProps("forearms", "Forearms")}
            />

            {/* Hands (non-interactive) */}
            <ellipse cx="29" cy="109" rx="5" ry="6" fill="var(--muscle-default)" stroke="var(--muscle-stroke)" strokeWidth="0.5" />
            <ellipse cx="91" cy="109" rx="5" ry="6" fill="var(--muscle-default)" stroke="var(--muscle-stroke)" strokeWidth="0.5" />

            {/* ---- Core (abs/obliques) ---- */}
            <MuscleRegion
              d="M 47 64 Q 44 66 43 70 L 43 100 Q 46 106 52 108 L 58 108 L 58 64 Q 52 66 47 64 Z"
              {...regionProps("core", "Core (Abs/Obliques)")}
            />
            <MuscleRegion
              d="M 73 64 Q 76 66 77 70 L 77 100 Q 74 106 68 108 L 62 108 L 62 64 Q 68 66 73 64 Z"
              {...regionProps("core", "Core (Abs/Obliques)")}
            />

            {/* ---- Quads ---- */}
            {/* Left quad */}
            <MuscleRegion
              d="M 43 108 L 52 108 L 56 108 Q 58 124 57 140 L 55 152 L 52 152 L 46 152 Q 42 140 40 128 Q 40 116 43 108 Z"
              {...regionProps("quads", "Quadriceps")}
            />
            {/* Right quad */}
            <MuscleRegion
              d="M 77 108 L 68 108 L 64 108 Q 62 124 63 140 L 65 152 L 68 152 L 74 152 Q 78 140 80 128 Q 80 116 77 108 Z"
              {...regionProps("quads", "Quadriceps")}
            />

            {/* Knees (non-interactive) */}
            <ellipse cx="50" cy="156" rx="6" ry="5" fill="var(--muscle-default)" stroke="var(--muscle-stroke)" strokeWidth="0.5" />
            <ellipse cx="70" cy="156" rx="6" ry="5" fill="var(--muscle-default)" stroke="var(--muscle-stroke)" strokeWidth="0.5" />

            {/* ---- Calves (front) ---- */}
            {/* Left calf */}
            <MuscleRegion
              d="M 45 160 L 55 160 Q 56 170 55 180 L 53 190 L 47 190 Q 44 180 44 170 Q 44 164 45 160 Z"
              {...regionProps("calves", "Calves")}
            />
            {/* Right calf */}
            <MuscleRegion
              d="M 65 160 L 75 160 Q 76 170 75 180 L 73 190 L 67 190 Q 64 180 64 170 Q 64 164 65 160 Z"
              {...regionProps("calves", "Calves")}
            />

            {/* Feet (non-interactive) */}
            <path d="M 45 190 L 55 190 L 56 196 L 43 196 Z" fill="var(--muscle-default)" stroke="var(--muscle-stroke)" strokeWidth="0.5" />
            <path d="M 65 190 L 75 190 L 77 196 L 63 196 Z" fill="var(--muscle-default)" stroke="var(--muscle-stroke)" strokeWidth="0.5" />
          </svg>
        </div>

        {/* ===== BACK VIEW ===== */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 font-medium">
            Back
          </span>
          <svg
            viewBox="0 0 120 200"
            width={width / 2 - 4}
            height={height}
            xmlns="http://www.w3.org/2000/svg"
            style={
              {
                "--muscle-default": "#e5e7eb",
                "--muscle-stroke": "#d1d5db",
              } as React.CSSProperties
            }
            className="dark:[--muscle-default:#374151] dark:[--muscle-stroke:#4b5563]"
          >
            {/* Head */}
            <ellipse cx="60" cy="18" rx="12" ry="14" fill="var(--muscle-default)" stroke="var(--muscle-stroke)" strokeWidth="0.5" />
            {/* Neck */}
            <rect x="55" y="31" width="10" height="8" rx="2" fill="var(--muscle-default)" stroke="var(--muscle-stroke)" strokeWidth="0.5" />

            {/* ---- Shoulders (rear deltoids) ---- */}
            {/* Left shoulder */}
            <MuscleRegion
              d="M 42 40 Q 36 38 32 44 Q 30 50 33 54 L 42 52 L 42 40 Z"
              {...regionProps("shoulders", "Shoulders (Rear Deltoids)")}
            />
            {/* Right shoulder */}
            <MuscleRegion
              d="M 78 40 Q 84 38 88 44 Q 90 50 87 54 L 78 52 L 78 40 Z"
              {...regionProps("shoulders", "Shoulders (Rear Deltoids)")}
            />

            {/* ---- Back (traps / lats / rhomboids) ---- */}
            {/* Upper back - traps */}
            <MuscleRegion
              d="M 42 40 L 58 42 L 62 42 L 78 40 L 78 52 Q 72 56 62 56 L 58 56 Q 48 56 42 52 Z"
              {...regionProps("back", "Back (Traps)")}
            />
            {/* Left lat */}
            <MuscleRegion
              d="M 42 52 Q 48 56 58 56 L 58 64 Q 52 68 46 68 L 43 72 L 43 100 Q 44 104 48 106 L 48 108 L 43 108 Q 40 100 40 88 Q 38 72 38 58 L 42 52 Z"
              {...regionProps("back", "Back (Lats)")}
            />
            {/* Right lat */}
            <MuscleRegion
              d="M 78 52 Q 72 56 62 56 L 62 64 Q 68 68 74 68 L 77 72 L 77 100 Q 76 104 72 106 L 72 108 L 77 108 Q 80 100 80 88 Q 82 72 82 58 L 78 52 Z"
              {...regionProps("back", "Back (Lats)")}
            />
            {/* Mid/lower back - spinal erectors */}
            <MuscleRegion
              d="M 58 56 L 62 56 L 62 64 Q 68 68 74 68 L 77 72 L 77 100 Q 74 106 68 108 L 62 108 L 58 108 L 52 108 Q 46 106 43 100 L 43 72 L 46 68 Q 52 68 58 64 Z"
              {...regionProps("back", "Back (Spinal Erectors)")}
            />

            {/* ---- Triceps ---- */}
            {/* Left tricep */}
            <MuscleRegion
              d="M 33 54 L 30 56 Q 26 64 27 76 L 30 78 L 35 78 Q 38 68 38 58 L 42 52 L 33 54 Z"
              {...regionProps("triceps", "Triceps")}
            />
            {/* Right tricep */}
            <MuscleRegion
              d="M 87 54 L 90 56 Q 94 64 93 76 L 90 78 L 85 78 Q 82 68 82 58 L 78 52 L 87 54 Z"
              {...regionProps("triceps", "Triceps")}
            />

            {/* ---- Forearms (back) ---- */}
            {/* Left forearm */}
            <MuscleRegion
              d="M 27 78 L 30 78 L 35 78 Q 36 90 34 100 L 30 104 L 25 104 Q 24 92 27 78 Z"
              {...regionProps("forearms", "Forearms")}
            />
            {/* Right forearm */}
            <MuscleRegion
              d="M 93 78 L 90 78 L 85 78 Q 84 90 86 100 L 90 104 L 95 104 Q 96 92 93 78 Z"
              {...regionProps("forearms", "Forearms")}
            />

            {/* Hands */}
            <ellipse cx="29" cy="109" rx="5" ry="6" fill="var(--muscle-default)" stroke="var(--muscle-stroke)" strokeWidth="0.5" />
            <ellipse cx="91" cy="109" rx="5" ry="6" fill="var(--muscle-default)" stroke="var(--muscle-stroke)" strokeWidth="0.5" />

            {/* ---- Glutes ---- */}
            {/* Left glute */}
            <MuscleRegion
              d="M 43 108 L 58 108 L 58 124 Q 54 128 48 128 Q 42 126 40 120 Q 40 114 43 108 Z"
              {...regionProps("glutes", "Glutes")}
            />
            {/* Right glute */}
            <MuscleRegion
              d="M 77 108 L 62 108 L 62 124 Q 66 128 72 128 Q 78 126 80 120 Q 80 114 77 108 Z"
              {...regionProps("glutes", "Glutes")}
            />

            {/* ---- Hamstrings ---- */}
            {/* Left hamstring */}
            <MuscleRegion
              d="M 40 128 Q 42 126 48 128 Q 54 128 58 124 L 58 152 L 55 152 L 46 152 Q 42 140 40 128 Z"
              {...regionProps("hamstrings", "Hamstrings")}
            />
            {/* Right hamstring */}
            <MuscleRegion
              d="M 80 128 Q 78 126 72 128 Q 66 128 62 124 L 62 152 L 65 152 L 74 152 Q 78 140 80 128 Z"
              {...regionProps("hamstrings", "Hamstrings")}
            />

            {/* Knees */}
            <ellipse cx="50" cy="156" rx="6" ry="5" fill="var(--muscle-default)" stroke="var(--muscle-stroke)" strokeWidth="0.5" />
            <ellipse cx="70" cy="156" rx="6" ry="5" fill="var(--muscle-default)" stroke="var(--muscle-stroke)" strokeWidth="0.5" />

            {/* ---- Calves (back) ---- */}
            {/* Left calf */}
            <MuscleRegion
              d="M 44 160 L 56 160 Q 58 168 57 176 Q 55 184 53 190 L 47 190 Q 44 182 43 174 Q 42 168 44 160 Z"
              {...regionProps("calves", "Calves")}
            />
            {/* Right calf */}
            <MuscleRegion
              d="M 64 160 L 76 160 Q 78 168 77 176 Q 75 184 73 190 L 67 190 Q 64 182 63 174 Q 62 168 64 160 Z"
              {...regionProps("calves", "Calves")}
            />

            {/* Feet */}
            <path d="M 45 190 L 55 190 L 56 196 L 43 196 Z" fill="var(--muscle-default)" stroke="var(--muscle-stroke)" strokeWidth="0.5" />
            <path d="M 65 190 L 75 190 L 77 196 L 63 196 Z" fill="var(--muscle-default)" stroke="var(--muscle-stroke)" strokeWidth="0.5" />
          </svg>
        </div>
      </div>

      {/* Hovered muscle label */}
      <div className="h-5 flex items-center justify-center">
        {hoveredMuscle && (
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {MUSCLE_GROUPS.find((m) => m.id === hoveredMuscle)?.label ?? hoveredMuscle}
          </span>
        )}
      </div>
    </div>
  );
}
