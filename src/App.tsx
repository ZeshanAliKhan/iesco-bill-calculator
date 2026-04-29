import { useMemo, useState, type FormEvent } from "react";
import type { ResidentialBillInput } from "./types";
import { calculateResidentialBill, formatCurrency, getLatestFpaRow, getLatestOfficialData } from "./utils/bill";

const BONUS_LINK =
  "https://www.profitablecpmratenetwork.com/j9f627innq?key=be46e17df9e34aa3b5b8e77e88a34740";

const OFFICIAL_LINKS = {
  tariff: "https://iesco.com.pk/tariff-guide",
  fpa: "https://iesco.com.pk/fpa-rates",
  calculator: "https://iesco.com.pk/bill-calculator",
  referenceSearch: "https://iesco.com.pk/search-reference-number",
  duplicateBill: "https://bill.pitc.com.pk/iescobill",
};

const ownNetworkLinks = [
  {
    title: "Pakistan Digital Payments Notes",
    href: "https://sites.google.com/view/pakistan-digital-payments/home",
    description: "A separate owned page for broader digital-payment context around online bill handling in Pakistan.",
  },
  {
    title: "Live Site Directory",
    href: "https://zeshanalikhan.github.io/creator-app-hub-site/pages/site-directory.html",
    description: "A larger hub of owned utility pages if you want related planning and productivity tools.",
  },
];

const sitePages = [
  {
    title: "Protected vs Unprotected",
    href: "protected-vs-unprotected.html",
    description: "When protected billing applies, when it does not, and why crossing the 200-unit rule changes the estimate.",
    keywords: ["protected", "unprotected", "200 units", "subsidy", "residential"],
  },
  {
    title: "Tariff Guide",
    href: "iesco-tariff-guide.html",
    description: "Published residential slab rates, TOU rows, and how the latest guide is loaded into the calculator.",
    keywords: ["tariff", "rates", "slabs", "unit price", "residential tariff"],
  },
  {
    title: "FPA Guide",
    href: "fuel-price-adjustment-guide.html",
    description: "A plain-language explanation of fuel price adjustment and why it should stay visible in the estimate.",
    keywords: ["fpa", "fuel price adjustment", "monthly adjustment", "rate"],
  },
  {
    title: "Bill Check Guide",
    href: "iesco-bill-check-guide.html",
    description: "How to read units, billing month, adjustments, and the important lines before you pay.",
    keywords: ["bill check", "read bill", "units", "billing month", "sanity check"],
  },
  {
    title: "Duplicate Bill Guide",
    href: "iesco-duplicate-bill-guide.html",
    description: "How to open the official duplicate bill path when you already have a reference number or customer ID.",
    keywords: ["duplicate bill", "bill copy", "download bill", "pitc"],
  },
  {
    title: "Reference Number Guide",
    href: "iesco-reference-number-guide.html",
    description: "How to recover or verify an IESCO reference number before you try bill lookup or payment.",
    keywords: ["reference number", "customer id", "lookup", "search"],
  },
  {
    title: "Bill Components Guide",
    href: "iesco-bill-components-guide.html",
    description: "A breakdown of energy charge, GST, FC surcharge, FPA, TV fee, duty, and other bill lines.",
    keywords: ["bill components", "charges", "gst", "fc surcharge", "tv fee", "duty"],
  },
  {
    title: "Payment Methods Guide",
    href: "iesco-bill-payment-methods.html",
    description: "Common payment routes, payment timing checks, and what to verify after paying an IESCO bill.",
    keywords: ["payment methods", "pay bill", "bank", "mobile app", "due date"],
  },
  {
    title: "Bill Saving Tips",
    href: "iesco-bill-saving-tips.html",
    description: "Practical ways to manage units, avoid avoidable threshold jumps, and budget better around the bill.",
    keywords: ["save bill", "reduce bill", "budget", "usage tips", "200 units"],
  },
  {
    title: "IESCO Areas",
    href: "iesco-areas-guide.html",
    description: "A quick guide to the IESCO service footprint and where this residential estimate is relevant.",
    keywords: ["areas", "service area", "Islamabad", "Rawalpindi", "Attock", "Jhelum", "Chakwal"],
  },
];

const examples = [
  { label: "150 units", units: 150, protectedEligible: true },
  { label: "250 units", units: 250, protectedEligible: false },
  { label: "350 units", units: 350, protectedEligible: false },
  { label: "600 units", units: 600, protectedEligible: false },
];

const sampleScenarioConfigs = [
  { label: "100 units protected", units: 100, protectedEligible: true },
  { label: "200 units protected", units: 200, protectedEligible: true },
  { label: "250 units unprotected", units: 250, protectedEligible: false },
  { label: "400 units unprotected", units: 400, protectedEligible: false },
  { label: "700 units unprotected", units: 700, protectedEligible: false },
];

const areaHighlights = [
  "Islamabad and the wider twin-cities demand pattern",
  "Rawalpindi urban and cantonment-side residential usage",
  "Attock-side residential consumers in IESCO's western footprint",
  "Chakwal and surrounding domestic connections",
  "Jhelum-side residential billing checks",
];

const jumpLinks = [
  { title: "Calculator", href: "#tool-heading" },
  { title: "Sample Bills", href: "#sample-bills" },
  { title: "Tariff Snapshot", href: "#tariff-snapshot" },
  { title: "Site Guides", href: "#guide-directory" },
  { title: "FAQ", href: "#faq-section" },
];

const initialForm: ResidentialBillInput = {
  units: 0,
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
};

const officialData = getLatestOfficialData();
const latestFpa = getLatestFpaRow();

export default function App() {
  const [siteQuery, setSiteQuery] = useState("");
  const [form, setForm] = useState<ResidentialBillInput>({
    ...initialForm,
    fpaRate: latestFpa.rate,
  });
  const [hasCalculated, setHasCalculated] = useState(false);
  const [error, setError] = useState("");

  const result = useMemo(() => {
    if (!hasCalculated || form.units <= 0) {
      return null;
    }
    return calculateResidentialBill(form);
  }, [form, hasCalculated]);

  const currentRate = useMemo(() => {
    if (form.protectedEligible && form.units > 0 && form.units <= 200) {
      return "Protected regular tariff";
    }
    return "Unprotected whole-bill tariff";
  }, [form.protectedEligible, form.units]);

  const sampleScenarios = useMemo(
    () =>
      sampleScenarioConfigs.map((item) => ({
        ...item,
        result: calculateResidentialBill({
          units: item.units,
          protectedEligible: item.protectedEligible,
          includeGst: true,
          includeFcSurcharge: true,
          includeFpa: false,
          fpaRate: latestFpa.rate,
          electricityDuty: 0,
          quarterlyAdjustment: 0,
          tvFee: 35,
          otherCharges: 0,
          meterPhase: "single",
          includeMinimumCharge: false,
        }),
      })),
    [],
  );

  const generatedDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(officialData.generatedAt)),
    [],
  );

  const handlePageSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = siteQuery.trim().toLowerCase();
    if (!query) {
      return;
    }

    const bestMatch = sitePages.find((page) => {
      const haystack = [page.title, page.description, ...page.keywords].join(" ").toLowerCase();
      return haystack.includes(query);
    });

    if (bestMatch) {
      window.location.assign(bestMatch.href);
    }
  };

  const handleCalculate = () => {
    if (!Number.isFinite(form.units) || form.units <= 0) {
      setError("Enter a valid number of consumed units.");
      setHasCalculated(false);
      return;
    }

    if (form.units > 2000) {
      setError("For anything above 2000 units, verify the bill manually against the published tariff and your bill copy.");
      setHasCalculated(false);
      return;
    }

    setError("");
    setHasCalculated(true);
  };

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="container topbar">
          <div className="brand">
            <span className="brand-mark">Rs</span>
            <div>
              <p className="eyebrow">Official-source estimate</p>
              <h1>IESCO Bill Calculator</h1>
            </div>
          </div>

          <a href={BONUS_LINK} target="_blank" rel="noopener noreferrer" className="bonus-link">
            Bonus Link
          </a>
        </div>

        <div className="container nav-row">
          <nav className="header-nav" aria-label="Site pages">
            <a href="index.html">Home</a>
            {sitePages.map((page) => (
              <a key={page.href} href={page.href}>
                {page.title}
              </a>
            ))}
          </nav>

          <form className="site-search" role="search" onSubmit={handlePageSearch}>
            <label className="sr-only" htmlFor="site-page-search">
              Search IESCO site pages
            </label>
            <input
              id="site-page-search"
              list="site-page-options"
              placeholder="Search guides and bill topics"
              value={siteQuery}
              onChange={(event) => setSiteQuery(event.target.value)}
            />
            <datalist id="site-page-options">
              {sitePages.map((page) => (
                <option key={page.href} value={page.title} />
              ))}
            </datalist>
            <button type="submit">Go</button>
          </form>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="section-tag">Domestic A-1 estimate</p>
              <h2>Check an IESCO bill with the latest published residential tariff guide, not a stale slab table.</h2>
              <p className="hero-text">
                This page is built around the current public IESCO tariff guide and the official IESCO FPA page. It
                gives you a cleaner breakdown for energy charges, GST, FC surcharge, optional FPA, and manual bill
                adjustments so you can sanity-check a bill before it arrives.
              </p>

              <div className="hero-points">
                <div className="hero-point">
                  <strong>{officialData.tariff.sro}</strong>
                  <span>Latest published tariff guide currently loaded.</span>
                </div>
                <div className="hero-point">
                  <strong>{latestFpa.billingMonth}</strong>
                  <span>Latest visible FPA row on IESCO&apos;s public FPA page.</span>
                </div>
                <div className="hero-point">
                  <strong>18% GST</strong>
                  <span>Derived from the official calculator behavior and shown separately.</span>
                </div>
                <div className="hero-point">
                  <strong>{generatedDateLabel}</strong>
                  <span>Last local data refresh from the current public IESCO source pages.</span>
                </div>
              </div>

              <div className="jump-link-row">
                {jumpLinks.map((link) => (
                  <a key={link.href} className="jump-link" href={link.href}>
                    {link.title}
                  </a>
                ))}
              </div>
            </div>

            <div className="hero-media-card hero-data-card">
              <img
                src="./iesco-homepage-hero.jpg"
                alt="IESCO bill estimate guide visual with highlighted calculator and tariff text"
                className="hero-visual"
              />
              <div className="media-caption">
                <strong>Current local source snapshot</strong>
                <span>The estimator stores the latest parsed public source data locally so the site remains usable when the official pages are slow.</span>
              </div>
              <ul className="hero-data-list">
                <li>
                  <span>Tariff guide</span>
                  <strong>{officialData.tariff.sro}</strong>
                </li>
                <li>
                  <span>Latest FPA row</span>
                  <strong>
                    {latestFpa.billingMonth} bill / {latestFpa.rate} Rs
                  </strong>
                </li>
                <li>
                  <span>Minimum charge</span>
                  <strong>
                    {officialData.tariff.residential.minimumChargeSinglePhase} /{" "}
                    {officialData.tariff.residential.minimumChargeThreePhase} Rs
                  </strong>
                </li>
                <li>
                  <span>Benchmark note</span>
                  <strong>{formatCurrency(officialData.officialCalculatorBenchmark.unprotected250UnitsTotal)} at 250 units</strong>
                </li>
              </ul>
              <a className="secondary-button" href={OFFICIAL_LINKS.tariff} target="_blank" rel="noopener noreferrer">
                Open Official Tariff Page
              </a>
            </div>
          </div>
        </section>

        <section className="tool-section">
          <div className="container tool-grid">
            <div className="tool-card" aria-labelledby="tool-heading">
              <div className="tool-heading-row">
                <div>
                  <p className="section-tag">Calculator</p>
                  <h2 id="tool-heading">Estimate your residential IESCO bill</h2>
                </div>
                <span className="status-pill">{currentRate}</span>
              </div>

              <div className="form-grid">
                <label className="field">
                  <span>Units consumed</span>
                  <input
                    type="number"
                    min="1"
                    max="2000"
                    value={form.units || ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        units: Number(event.target.value),
                      }))
                    }
                    placeholder="For example: 250"
                  />
                </label>

                <label className="field">
                  <span>Meter phase</span>
                  <select
                    value={form.meterPhase}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        meterPhase: event.target.value as ResidentialBillInput["meterPhase"],
                      }))
                    }
                  >
                    <option value="single">Single phase</option>
                    <option value="three">Three phase</option>
                  </select>
                </label>

                <label className="checkbox-field checkbox-wide">
                  <input
                    type="checkbox"
                    checked={form.protectedEligible}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        protectedEligible: event.target.checked,
                      }))
                    }
                  />
                  <span>I stayed at 200 units or less for the last 6 months and want the protected-consumer estimate.</span>
                </label>

                <div className="toggle-grid toggle-wide">
                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={form.includeGst}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          includeGst: event.target.checked,
                        }))
                      }
                    />
                    <span>Include GST</span>
                  </label>

                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={form.includeFcSurcharge}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          includeFcSurcharge: event.target.checked,
                        }))
                      }
                    />
                    <span>Include FC surcharge</span>
                  </label>

                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={form.includeMinimumCharge}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          includeMinimumCharge: event.target.checked,
                        }))
                      }
                    />
                    <span>Add the published phase-based minimum charge</span>
                  </label>

                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={form.includeFpa}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          includeFpa: event.target.checked,
                        }))
                      }
                    />
                    <span>Apply the latest visible official FPA row</span>
                  </label>
                </div>

                <label className="field">
                  <span>FPA rate (Rs/kWh)</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={form.fpaRate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fpaRate: Number(event.target.value),
                      }))
                    }
                  />
                  <small>
                    Current row on the IESCO FPA page: {latestFpa.billingMonth} bill, {latestFpa.rate} Rs/kWh.
                  </small>
                </label>

                <label className="field">
                  <span>Electricity duty (optional)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={form.electricityDuty}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        electricityDuty: Number(event.target.value),
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Quarterly adjustment (optional)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={form.quarterlyAdjustment}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        quarterlyAdjustment: Number(event.target.value),
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>TV fee (optional)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={form.tvFee}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        tvFee: Number(event.target.value),
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Other charges or arrears</span>
                  <input
                    type="number"
                    step="0.01"
                    value={form.otherCharges}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        otherCharges: Number(event.target.value),
                      }))
                    }
                  />
                </label>
              </div>

              <div className="tool-actions">
                <button className="primary-button" type="button" onClick={handleCalculate}>
                  Calculate IESCO Bill
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setForm({
                      ...initialForm,
                      fpaRate: latestFpa.rate,
                    });
                    setHasCalculated(false);
                    setError("");
                  }}
                >
                  Reset
                </button>
              </div>

              <div className="example-row">
                {examples.map((example) => (
                  <button
                    key={example.label}
                    type="button"
                    className="example-chip"
                    onClick={() => {
                      setForm((current) => ({
                        ...current,
                        units: example.units,
                        protectedEligible: example.protectedEligible,
                      }));
                      setError("");
                      setHasCalculated(false);
                    }}
                  >
                    {example.label}
                  </button>
                ))}
              </div>

              <p className="tool-note">
                This estimator is for residential A-1 consumers. Use the official duplicate-bill or reference-search
                routes below when the problem is account lookup, not bill math.
              </p>

              {error ? <p className="error-text">{error}</p> : null}
            </div>

            <aside className="result-card" aria-live="polite">
              {!result ? (
                <div className="empty-state">
                  <p className="section-tag">Breakdown</p>
                  <h3>No estimate yet</h3>
                  <p>
                    Enter your units, decide whether you qualify for protected billing, and calculate the result to see
                    the energy charge, taxes, and optional adjustments in one place.
                  </p>
                </div>
              ) : (
                <>
                  <div className="result-top">
                    <div>
                      <p className="section-tag">Estimated total</p>
                      <h3>{formatCurrency(result.total)}</h3>
                    </div>
                    <span className="status-pill">{result.categoryLabel}</span>
                  </div>

                  <dl className="summary-list">
                    <div>
                      <dt>Energy charge</dt>
                      <dd>{formatCurrency(result.energyCharge)}</dd>
                    </div>
                    <div>
                      <dt>GST</dt>
                      <dd>{formatCurrency(result.gst)}</dd>
                    </div>
                    <div>
                      <dt>FC surcharge</dt>
                      <dd>{formatCurrency(result.fcSurcharge)}</dd>
                    </div>
                    <div>
                      <dt>FPA</dt>
                      <dd>{formatCurrency(result.fpaCharge)}</dd>
                    </div>
                    <div>
                      <dt>Minimum charge</dt>
                      <dd>{formatCurrency(result.minimumCharge)}</dd>
                    </div>
                    <div>
                      <dt>Other adjustments</dt>
                      <dd>
                        {formatCurrency(
                          result.electricityDuty + result.quarterlyAdjustment + result.tvFee + result.otherCharges,
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div className="slab-box">
                    <h4>Applied slab details</h4>
                    <ul className="slab-list">
                      {result.slabCharges.map((item) => (
                        <li key={`${item.label}-${item.units}`}>
                          <span>
                            {item.label}: {item.units} x {item.rate}
                          </span>
                          <strong>{formatCurrency(item.amount)}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="notes-box">
                    <h4>Important notes</h4>
                    <ul>
                      {result.officialNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </aside>
          </div>
        </section>

        <section className="source-section">
          <div className="container">
            <div className="section-heading">
              <p className="section-tag">Official-source shortcuts</p>
              <h2>Useful official pages around the bill itself</h2>
              <p>
                Pakistan SERP results often mix estimates, duplicate-bill tools, and reference-number guides into one
                page. This site keeps those tasks separate and points you to the original public portals when you need them.
              </p>
            </div>

            <div className="source-grid">
              <a className="source-card" href={OFFICIAL_LINKS.duplicateBill} target="_blank" rel="noopener noreferrer">
                <strong>Open duplicate bill portal</strong>
                <span>Use the public PITC bill portal if you already have your 14-digit reference number or 10-digit customer ID.</span>
              </a>
              <a className="source-card" href={OFFICIAL_LINKS.referenceSearch} target="_blank" rel="noopener noreferrer">
                <strong>Open reference number search</strong>
                <span>Use the public IESCO reference-number search page when you need to recover a new or old reference number.</span>
              </a>
              <a className="source-card" href={OFFICIAL_LINKS.tariff} target="_blank" rel="noopener noreferrer">
                <strong>Open tariff guide</strong>
                <span>Check the latest published slab table and tariff notes on the official IESCO site.</span>
              </a>
            </div>
          </div>
        </section>

        <section className="content-section">
          <div className="container content-grid">
            <article className="content-column">
              <p className="section-tag">How it works</p>
              <h2>What this IESCO bill calculator includes</h2>
              <p>
                The tool applies the current published domestic A-1 residential slabs from the public IESCO tariff
                guide. It separates protected and unprotected billing logic, keeps GST and FC surcharge visible, and
                lets you switch on the latest visible FPA row or add manual bill items that often show up on real
                electricity bills.
              </p>
              <p>
                The official IESCO bill calculator is still useful as a basic check, but its backend appears to lag the
                latest tariff guide for some higher slabs. This page prefers the published guide for slab rates and keeps
                the other charges explicit so you can see what is being added.
              </p>
            </article>

            <article className="content-column">
              <p className="section-tag">Use it well</p>
              <h2>When to use the protected estimate</h2>
              <p>
                Only choose the protected estimate when your domestic connection actually stayed at 200 units or less
                for the previous six billing months. If that history is missing, or if the connection has already moved
                out of protected status, the unprotected rate is the safer estimate.
              </p>
              <p>
                If your actual bill contains electricity duty, quarterly tariff adjustment, TV fee, or arrears, enter
                those values manually. That gives you a more realistic estimate than hiding them behind a single black-box total.
              </p>
            </article>
          </div>
        </section>

        <section className="sample-section" id="sample-bills">
          <div className="container">
            <div className="section-heading">
              <p className="section-tag">Sample estimates</p>
              <h2>Quick bill examples by units</h2>
              <p>
                Pakistan search results for this topic often rank because users want to know what 100, 200, 300, or
                500 units roughly look like. These examples use the same calculator logic shown above.
              </p>
            </div>

            <div className="sample-grid">
              {sampleScenarios.map((scenario) => (
                <article key={scenario.label} className="sample-card">
                  <span className="sample-badge">{scenario.label}</span>
                  <strong>{formatCurrency(scenario.result.total)}</strong>
                  <p>
                    Energy {formatCurrency(scenario.result.energyCharge)} + GST {formatCurrency(scenario.result.gst)} + FC surcharge{" "}
                    {formatCurrency(scenario.result.fcSurcharge)} + TV fee {formatCurrency(scenario.result.tvFee)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="table-section" id="tariff-snapshot">
          <div className="container">
            <div className="section-heading">
              <p className="section-tag">Rate reference</p>
              <h2>Current published residential slab snapshot</h2>
              <p>
                These are the rows currently loaded from the public IESCO tariff guide. The site stores them locally
                after refresh so the calculator still works even if the official site is slow.
              </p>
            </div>

            <div className="table-grid">
              <div className="table-card">
                <h3>Protected regular residential</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Units</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officialData.tariff.residential.protectedRegular.map((row) => (
                      <tr key={row.code}>
                        <td>{row.label}</td>
                        <td>{row.variableRate} Rs/kWh</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="table-card">
                <h3>Unprotected residential</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Units</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officialData.tariff.residential.unprotected.map((row) => (
                      <tr key={row.code}>
                        <td>{row.label}</td>
                        <td>{row.variableRate} Rs/kWh</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="areas-section">
          <div className="container content-grid">
            <article className="content-column">
              <p className="section-tag">Coverage context</p>
              <h2>Where this estimate is relevant</h2>
              <p>
                The calculator is meant for residential users inside IESCO&apos;s service footprint. The official IESCO
                site describes that footprint broadly from Attock to Jhelum and from the Indus side to the Neelum side
                in Kashmir, with the twin-cities region at the center of the demand pattern.
              </p>
              <ul className="bullet-list">
                {areaHighlights.map((area) => (
                  <li key={area}>{area}</li>
                ))}
              </ul>
            </article>

            <article className="content-column">
              <p className="section-tag">Meter-reading workflow</p>
              <h2>How to get the right unit number first</h2>
              <ol className="bullet-list ordered-list">
                <li>Read the present meter reading on your bill or meter.</li>
                <li>Subtract the previous reading to confirm the month&apos;s units.</li>
                <li>Decide whether protected status still applies for the last six months.</li>
                <li>Apply FPA or other line items only when the bill month actually calls for them.</li>
              </ol>
            </article>
          </div>
        </section>

        <section className="faq-section" id="faq-section">
          <div className="container">
            <div className="section-heading">
              <p className="section-tag">FAQ</p>
              <h2>IESCO bill calculator questions that matter</h2>
            </div>

            <div className="faq-list">
              <details>
                <summary>Does this calculator use real IESCO data?</summary>
                <p>
                  Yes. The slab table is pulled from the public IESCO tariff guide page, the FPA list comes from the
                  public IESCO FPA page, and GST plus FC surcharge are aligned with the official calculator behavior.
                </p>
              </details>
              <details>
                <summary>Why is the protected checkbox manual?</summary>
                <p>
                  Protected status depends on your last six months of consumption history. The units for the current
                  month alone are not enough to prove that status, so the tool makes you state it explicitly.
                </p>
              </details>
              <details>
                <summary>Why is FPA optional instead of always on?</summary>
                <p>
                  FPA changes by billing month. The IESCO FPA page is public, but the latest visible row can lag the
                  current month. Leaving it optional is more honest than pretending one fixed value always applies.
                </p>
              </details>
              <details>
                <summary>Why might my real bill still differ?</summary>
                <p>
                  Real bills can include electricity duty, quarterly tariff adjustments, arrears, TV fee, or other
                  line items tied to your connection history. Those are left visible and editable here instead of being
                  hidden behind one unexplained number.
                </p>
              </details>
              <details>
                <summary>Can this page fetch my actual duplicate bill?</summary>
                <p>
                  No. This site is an estimator and explainer. For the real duplicate bill, use the public PITC bill
                  portal linked on this page.
                </p>
              </details>
              <details>
                <summary>Can I use it for commercial or industrial bills?</summary>
                <p>
                  Not yet. This version is intentionally limited to residential A-1 usage because that is where most
                  search demand lands and where the official public calculator also focuses.
                </p>
              </details>
            </div>
          </div>
        </section>

        <section className="links-section">
          <div className="container">
            <div className="section-heading">
              <p className="section-tag">Related owned pages</p>
              <h2 id="guide-directory">Context links without crowding the tool</h2>
            </div>

            <div className="link-card-grid">
              {sitePages.map((page) => (
                <a key={page.href} className="link-card" href={page.href}>
                  <strong>{page.title}</strong>
                  <span>{page.description}</span>
                </a>
              ))}

              {ownNetworkLinks.map((link) => (
                <a key={link.href} className="link-card" href={link.href} target="_blank" rel="noopener noreferrer">
                  <strong>{link.title}</strong>
                  <span>{link.description}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <strong>IESCO Bill Calculator</strong>
            <p>
              A residential estimate tool built from the latest public tariff guide, the official FPA list, and manual
              line-item handling for the parts that change month to month.
            </p>
          </div>

          <div>
            <strong>Official sources</strong>
            <ul className="footer-links">
              <li>
                <a href={OFFICIAL_LINKS.tariff} target="_blank" rel="noopener noreferrer">
                  IESCO tariff guide
                </a>
              </li>
              <li>
                <a href={OFFICIAL_LINKS.fpa} target="_blank" rel="noopener noreferrer">
                  IESCO FPA page
                </a>
              </li>
              <li>
                <a href={OFFICIAL_LINKS.referenceSearch} target="_blank" rel="noopener noreferrer">
                  IESCO reference search
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
