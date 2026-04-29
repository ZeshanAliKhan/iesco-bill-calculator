import { describe, expect, it } from "vitest";
import { calculateResidentialBill, getLatestFpaRow, getLatestOfficialData, getPhaseMinimumCharge } from "./bill";

describe("IESCO residential bill engine", () => {
  it("uses protected slabs incrementally when the user confirms protected eligibility", () => {
    const bill = calculateResidentialBill({
      units: 150,
      protectedEligible: true,
      includeGst: false,
      includeFcSurcharge: false,
      includeFpa: false,
      fpaRate: 0,
      electricityDuty: 0,
      quarterlyAdjustment: 0,
      tvFee: 0,
      otherCharges: 0,
      meterPhase: "single",
      includeMinimumCharge: false,
    });

    expect(bill.categoryLabel).toBe("Protected residential");
    expect(bill.energyCharge).toBe(1704.5);
    expect(bill.slabCharges).toEqual([
      { label: "001 - 100 Units", units: 100, rate: 10.54, amount: 1054 },
      { label: "101 - 200 Units", units: 50, rate: 13.01, amount: 650.5 },
    ]);
  });

  it("uses the whole-bill unprotected slab rate when the user is not protected", () => {
    const bill = calculateResidentialBill({
      units: 350,
      protectedEligible: false,
      includeGst: false,
      includeFcSurcharge: false,
      includeFpa: false,
      fpaRate: 0,
      electricityDuty: 0,
      quarterlyAdjustment: 0,
      tvFee: 0,
      otherCharges: 0,
      meterPhase: "single",
      includeMinimumCharge: false,
    });

    expect(bill.categoryLabel).toBe("Unprotected residential");
    expect(bill.energyCharge).toBe(12761);
    expect(bill.slabCharges[0].rate).toBe(36.46);
  });

  it("adds GST and FC surcharge using the official calculator constants", () => {
    const bill = calculateResidentialBill({
      units: 250,
      protectedEligible: false,
      includeGst: true,
      includeFcSurcharge: true,
      includeFpa: false,
      fpaRate: 0,
      electricityDuty: 0,
      quarterlyAdjustment: 0,
      tvFee: 0,
      otherCharges: 0,
      meterPhase: "single",
      includeMinimumCharge: false,
    });

    expect(bill.energyCharge).toBe(8275);
    expect(bill.gst).toBe(1489.5);
    expect(bill.fcSurcharge).toBe(107.5);
    expect(bill.total).toBe(9872);
  });

  it("can add the latest official FPA row when the user turns it on", () => {
    const latestFpa = getLatestFpaRow();
    const bill = calculateResidentialBill({
      units: 300,
      protectedEligible: false,
      includeGst: false,
      includeFcSurcharge: false,
      includeFpa: true,
      fpaRate: latestFpa.rate,
      electricityDuty: 0,
      quarterlyAdjustment: 0,
      tvFee: 0,
      otherCharges: 0,
      meterPhase: "single",
      includeMinimumCharge: false,
    });

    expect(latestFpa.billingMonth).toBe("09-2025");
    expect(bill.fpaCharge).toBe(-535.68);
    expect(bill.total).toBe(9394.32);
  });

  it("can add the published minimum customer charge by phase", () => {
    expect(getPhaseMinimumCharge("single")).toBe(75);
    expect(getPhaseMinimumCharge("three")).toBe(150);
  });

  it("ignores the protected flag once usage is above 200 units", () => {
    const bill = calculateResidentialBill({
      units: 250,
      protectedEligible: true,
      includeGst: false,
      includeFcSurcharge: false,
      includeFpa: false,
      fpaRate: 0,
      electricityDuty: 0,
      quarterlyAdjustment: 0,
      tvFee: 0,
      otherCharges: 0,
      meterPhase: "single",
      includeMinimumCharge: false,
    });

    expect(bill.categoryLabel).toBe("Unprotected residential");
    expect(bill.slabCharges[0].rate).toBe(33.1);
  });

  it("uses the published above-700 slab for heavier residential usage", () => {
    const bill = calculateResidentialBill({
      units: 800,
      protectedEligible: false,
      includeGst: false,
      includeFcSurcharge: false,
      includeFpa: false,
      fpaRate: 0,
      electricityDuty: 0,
      quarterlyAdjustment: 0,
      tvFee: 0,
      otherCharges: 0,
      meterPhase: "single",
      includeMinimumCharge: false,
    });

    expect(bill.slabCharges[0].label).toBe("Above 700 Units");
    expect(bill.energyCharge).toBe(37760);
  });

  it("ships the current published residential rate table", () => {
    const data = getLatestOfficialData();
    expect(data.tariff.sro).toContain("279");
    expect(data.tariff.residential.unprotected[data.tariff.residential.unprotected.length - 1]?.variableRate).toBe(47.2);
    expect(data.derivedCharges.fcSurchargeRate).toBe(0.43);
  });
});
