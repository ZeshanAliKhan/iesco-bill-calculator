# Research Notes

## Official sources used

- IESCO tariff guide: `https://iesco.com.pk/tariff-guide`
- IESCO bill calculator page: `https://iesco.com.pk/bill-calculator`
- IESCO FPA page: `https://iesco.com.pk/fpa-rates`

## Key findings

1. The public tariff guide currently shows `S.R.O. 279 (I)/2026`.
2. The residential A-1 section currently exposes:
   - protected regular rows for `001 - 100` and `101 - 200`
   - unprotected rows from `1 - 100` through `Above 700`
   - TOU peak and off-peak values
   - prepaid residential rate
   - published minimum charges of `Rs. 75` for single phase and `Rs. 150` for three phase
3. The public IESCO bill calculator clearly states that FPA, electricity duty, NJ surcharge, and quarterly taxes can change the real bill.
4. A manual benchmark on 2026-04-29 showed:
   - protected `200` units total payable: `2864.9`
   - unprotected `250` units total payable: `9872`
   - GST aligns to `18%`
   - FC surcharge aligns to `Rs. 0.43` per unit
5. The official calculator backend appears to use older slab rates above 300 units, while the tariff guide exposes newer published values. The site therefore trusts the latest tariff guide for slab rates and keeps the adjustments explicit.
