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


/**
 * CFT (cubic feet) কে "ফুট-ইঞ্চি-পয়েন্ট" style এ ভাঙে —
 * এটা প্রকৃত ইউনিট কনভার্সন না (CFT আয়তন, বাকিগুলো দৈর্ঘ্য),
 * শুধু করাতকলের প্রথাগত display format অনুকরণ করে।
 */
export interface CftBreakdown {
  feet: number;
  inches: number;
  points: number;
}

export const breakdownCft = (cft: number): CftBreakdown => {
  const sign = cft < 0 ? -1 : 1;
  const abs = Math.abs(cft);

  const feet = Math.floor(abs);
  const inchDecimal = (abs - feet) * 12;
  let inches = Math.floor(inchDecimal);
  let points = Math.round((inchDecimal - inches) * 100);

  let finalFeet = feet;
  if (points >= 100) {
    points = 0;
    inches += 1;
  }
  if (inches >= 12) {
    inches = 0;
    finalFeet += 1;
  }

  return { feet: sign * finalFeet, inches, points };
};