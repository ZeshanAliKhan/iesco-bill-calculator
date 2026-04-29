# IESCO Bill Calculator

IESCO Bill Calculator is a static React and Vite site for estimating a residential IESCO bill using the latest public IESCO tariff guide and the public IESCO FPA page.

## What the calculator does

- uses the current published A-1 residential slabs from IESCO
- separates protected and unprotected residential logic
- shows GST and FC surcharge explicitly
- keeps FPA optional because it changes by bill month
- allows manual entry for electricity duty, quarterly adjustment, TV fee, and other charges
- ships supporting SEO pages for tariff notes, protected billing rules, duplicate bill workflow, payment methods, bill components, and bill-saving tips

## Data sources

- `https://iesco.com.pk/tariff-guide`
- `https://iesco.com.pk/fpa-rates`
- `https://iesco.com.pk/bill-calculator`

## Important note

The public IESCO calculator endpoint appears to lag the latest tariff guide on some higher slabs. This project prefers the latest published tariff guide for residential slab rates and keeps the more volatile adjustments visible instead of hiding them.

## Scripts

- `npm install`
- `npm run update:data`
- `npm run test`
- `npm run build`
