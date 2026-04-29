export type MeterPhase = "single" | "three";

export type TariffMode = "latest-guide";

export type ResidentialBillInput = {
  units: number;
  protectedEligible: boolean;
  includeGst: boolean;
  includeFcSurcharge: boolean;
  includeFpa: boolean;
  fpaRate: number;
  electricityDuty: number;
  quarterlyAdjustment: number;
  tvFee: number;
  otherCharges: number;
  meterPhase: MeterPhase;
  includeMinimumCharge: boolean;
};

export type SlabCharge = {
  label: string;
  units: number;
  rate: number;
  amount: number;
};

export type BillBreakdown = {
  categoryLabel: string;
  units: number;
  energyCharge: number;
  slabCharges: SlabCharge[];
  gst: number;
  fcSurcharge: number;
  fpaCharge: number;
  minimumCharge: number;
  electricityDuty: number;
  quarterlyAdjustment: number;
  tvFee: number;
  otherCharges: number;
  total: number;
  officialNotes: string[];
};

export type FpaRow = {
  billingMonth: string;
  fpaMonth: string;
  rate: number;
};

export type PublishedRateRow = {
  code: string;
  label: string;
  fixedChargePerConsumer: number | null;
  fixedChargePerKw: number | null;
  variableRate: number;
};

export type OfficialData = {
  generatedAt: string;
  sources: {
    tariffGuideUrl: string;
    billCalculatorUrl: string;
    fpaRatesUrl: string;
  };
  tariff: {
    sro: string;
    residential: {
      protectedRegular: PublishedRateRow[];
      unprotected: PublishedRateRow[];
      tou: {
        fixedChargePerKw: number;
        peakRate: number;
        offPeakRate: number;
      };
      prepaidRate: number;
      minimumChargeSinglePhase: number;
      minimumChargeThreePhase: number;
    };
  };
  derivedCharges: {
    gstRate: number;
    fcSurchargeRate: number;
    benchmarkSourceUnits: number;
  };
  fpaRates: FpaRow[];
  officialCalculatorBenchmark: {
    sampledAt: string;
    protected200UnitsTotal: number;
    unprotected250UnitsTotal: number;
    note: string;
  };
};
