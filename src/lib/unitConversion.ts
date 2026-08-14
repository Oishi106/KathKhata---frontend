/**
 * Frontend mirror of the backend's centralized unit conversion.
 * Keep in sync with kathkhata-ai-backend/src/modules/wood-measurement/utils/unitConversion.ts
 *
 * 1 foot = 12 inches | 1 inch = 100 points | 1 foot = 1200 points
 * 1 inch = 2.54 cm   | 1 foot = 30.48 cm   | 1 point = 0.01 inch
 */

export interface LengthBreakdown {
  feet: number;
  inches: number;
  points: number;
  totalInches: number;
  totalPoints: number;
  totalCm: number;
  totalFeetDecimal: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export type LengthUnit = "feet" | "inch" | "cm" | "point";

export const toInches = (value: number, unit: LengthUnit): number => {
  switch (unit) {
    case "feet":
      return value * 12;
    case "inch":
      return value;
    case "cm":
      return value / 2.54;
    case "point":
      return value / 100;
    default:
      return value;
  }
};

export const breakdownFromInches = (totalInches: number): LengthBreakdown => {
  const feet = Math.floor(totalInches / 12);
  const remainingInchesDecimal = totalInches - feet * 12;
  const inches = Math.floor(remainingInchesDecimal);
  const points = Math.round((remainingInchesDecimal - inches) * 100);

  return {
    feet,
    inches,
    points,
    totalInches: round2(totalInches),
    totalPoints: round2(totalInches * 100),
    totalCm: round2(totalInches * 2.54),
    totalFeetDecimal: round2(totalInches / 12)
  };
};