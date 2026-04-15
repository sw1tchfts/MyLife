/**
 * Elo rating system for pairwise comparisons.
 * K-factor of 32 (standard for new players / volatile ratings).
 */

const K = 32;

function expectedScore(ratingA: number, ratingB: number): number {
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
