import officialData from "../data/iescoOfficialData.json";
import type { BillBreakdown, MeterPhase, OfficialData, ResidentialBillInput, SlabCharge } from "../types";

const data = officialData as OfficialData;

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

type RangeRow = {
  min: number;
  max: number | null;
  rate: number;
  label: string;
};

function parseRange(label: string, rate: number): RangeRow {
  const rangeMatch = label.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    return {
      min: Number(rangeMatch[1]),
      max: Number(rangeMatch[2]),
      rate,
      label,
    };
  }

  if (/Above\s+(\d+)/i.test(label)) {
    const aboveMatch = label.match(/Above\s+(\d+)/i);
    return {
      min: Number(aboveMatch?.[1] ?? 0) + 1,
      max: null,
      rate,
      label,
    };
  }

  throw new Error(`Unsupported published slab label: ${label}`);
}

const protectedRanges = data.tariff.residential.protectedRegular.map((row) =>
  parseRange(row.label, row.variableRate),
);
const unprotectedRanges = data.tariff.residential.unprotected.map((row) =>
  parseRange(row.label, row.variableRate),
);

export function getLatestOfficialData() {
  return data;
}

export function getLatestFpaRow() {
  return data.fpaRates[0];
}

export function getPhaseMinimumCharge(phase: MeterPhase) {
  return phase === "three"
    ? data.tariff.residential.minimumChargeThreePhase
    : data.tariff.residential.minimumChargeSinglePhase;
}

function getProtectedEnergy(units: number): { energyCharge: number; slabCharges: SlabCharge[] } {
  let remaining = units;
  const slabCharges: SlabCharge[] = [];

  for (const range of protectedRanges) {
    if (remaining <= 0) {
      break;
    }

    const span = (range.max ?? range.min) - range.min + 1;
    const slabUnits = Math.min(remaining, span);
    if (slabUnits > 0) {
      const amount = round2(slabUnits * range.rate);
      slabCharges.push({
        label: range.label,
        units: slabUnits,
        rate: range.rate,
        amount,
      });
      remaining -= slabUnits;
    }
  }

  const energyCharge = round2(slabCharges.reduce((sum, item) => sum + item.amount, 0));
  return { energyCharge, slabCharges };
}

function getUnprotectedEnergy(units: number): { energyCharge: number; slabCharges: SlabCharge[] } {
  const matchedRange = unprotectedRanges.find((range) => units >= range.min && (range.max === null || units <= range.max));
  if (!matchedRange) {
    throw new Error(`Unable to match ${units} units to an unprotected residential slab.`);
  }

  const amount = round2(units * matchedRange.rate);
  return {
    energyCharge: amount,
    slabCharges: [
      {
        label: matchedRange.label,
        units,
        rate: matchedRange.rate,
        amount,
      },
    ],
  };
}

export function calculateResidentialBill(input: ResidentialBillInput): BillBreakdown {
  const units = Math.max(0, Math.floor(input.units));
  const protectedEligible = input.protectedEligible && units > 0 && units <= 200;
  const categoryLabel = protectedEligible ? "Protected residential" : "Unprotected residential";

  const energyModel = protectedEligible ? getProtectedEnergy(units) : getUnprotectedEnergy(units);

  const gst = input.includeGst ? round2(energyModel.energyCharge * data.derivedCharges.gstRate) : 0;
  const fcSurcharge = input.includeFcSurcharge ? round2(units * data.derivedCharges.fcSurchargeRate) : 0;
  const fpaCharge = input.includeFpa ? round2(units * input.fpaRate) : 0;
  const minimumCharge = input.includeMinimumCharge ? getPhaseMinimumCharge(input.meterPhase) : 0;

  const electricityDuty = round2(input.electricityDuty || 0);
  const quarterlyAdjustment = round2(input.quarterlyAdjustment || 0);
  const tvFee = round2(input.tvFee || 0);
  const otherCharges = round2(input.otherCharges || 0);

  const total = round2(
    energyModel.energyCharge +
      gst +
      fcSurcharge +
      fpaCharge +
      minimumCharge +
      electricityDuty +
      quarterlyAdjustment +
      tvFee +
      otherCharges,
  );

  const officialNotes = [
    `Latest published tariff guide used: S.R.O. ${data.tariff.sro}.`,
    "Protected status is only applied when you confirm the last 6 months stayed at 200 units or less.",
    "Lifeline slabs are not auto-applied because eligibility depends on account status beyond the units you enter.",
    "The public IESCO calculator note says FPA, electricity duty, NJ surcharge, and quarterly taxes can change the final bill.",
  ];

  return {
    categoryLabel,
    units,
    energyCharge: energyModel.energyCharge,
    slabCharges: energyModel.slabCharges,
    gst,
    fcSurcharge,
    fpaCharge,
    minimumCharge,
    electricityDuty,
    quarterlyAdjustment,
    tvFee,
    otherCharges,
    total,
    officialNotes,
  };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(value);
}
