/**
 * Elo rating system for pairwise comparisons.
 * K-factor of 32 (standard for new players / volatile ratings).
 */

const K = 32;

export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function newRatings(
  ratingA: number,
  ratingB: number,
  result: "LEFT" | "RIGHT" | "TIE",
): { newA: number; newB: number } {
  const eA = expectedScore(ratingA, ratingB);
  const eB = 1 - eA;

  let sA: number;
  let sB: number;

  if (result === "LEFT") {
    sA = 1;
    sB = 0;
  } else if (result === "RIGHT") {
    sA = 0;
    sB = 1;
  } else {
    sA = 0.5;
    sB = 0.5;
  }

  return {
    newA: ratingA + K * (sA - eA),
    newB: ratingB + K * (sB - eB),
  };
}

/**
 * Calculate ranking stability as a percentage (0–100).
 * Based on number of comparisons per item — more comparisons = more stable.
 * An item with 10+ comparisons is considered fully stable.
 */
export function stabilityScore(totalComparisons: number): number {
  const maxComparisons = 10;
  return Math.min(100, Math.round((totalComparisons / maxComparisons) * 100));
}
