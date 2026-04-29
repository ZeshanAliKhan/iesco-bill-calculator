const pageIndex = [
  { title: "Home", href: "index.html", keywords: ["calculator", "estimate", "homepage"] },
  {
    title: "Protected vs Unprotected",
    href: "protected-vs-unprotected.html",
    keywords: ["protected", "unprotected", "200 units", "subsidy"],
  },
  {
    title: "Tariff Guide",
    href: "iesco-tariff-guide.html",
    keywords: ["tariff", "unit rate", "slabs", "prices"],
  },
  {
    title: "FPA Guide",
    href: "fuel-price-adjustment-guide.html",
    keywords: ["fpa", "fuel price adjustment", "monthly adjustment"],
  },
  {
    title: "Bill Check Guide",
    href: "iesco-bill-check-guide.html",
    keywords: ["bill check", "read bill", "units", "billing month"],
  },
  {
    title: "Duplicate Bill Guide",
    href: "iesco-duplicate-bill-guide.html",
    keywords: ["duplicate bill", "bill copy", "download bill"],
  },
  {
    title: "Reference Number Guide",
    href: "iesco-reference-number-guide.html",
    keywords: ["reference number", "customer id", "lookup"],
  },
  {
    title: "Bill Components Guide",
    href: "iesco-bill-components-guide.html",
    keywords: ["charges", "gst", "fc surcharge", "duty", "tv fee", "arrears"],
  },
  {
    title: "Payment Methods Guide",
    href: "iesco-bill-payment-methods.html",
    keywords: ["payment", "pay bill", "bank", "app", "due date"],
  },
  {
    title: "Bill Saving Tips",
    href: "iesco-bill-saving-tips.html",
    keywords: ["save bill", "reduce bill", "budget", "usage tips"],
  },
  {
    title: "IESCO Areas",
    href: "iesco-areas-guide.html",
    keywords: ["areas", "service area", "Islamabad", "Rawalpindi", "Attock", "Jhelum", "Chakwal"],
  },
];

function normaliseCurrentPage() {
  const fileName = window.location.pathname.split("/").pop();
  return fileName && fileName.length > 0 ? fileName : "index.html";
}

function scorePage(query, page) {
  const haystack = [page.title, ...page.keywords].join(" ").toLowerCase();
  if (page.title.toLowerCase() === query) {
    return 100;
  }
  if (haystack.includes(query)) {
    return 50;
  }

  const queryWords = query.split(/\s+/).filter(Boolean);
  let score = 0;
  for (const word of queryWords) {
    if (haystack.includes(word)) {
      score += 10;
    }
  }
  return score;
}

function buildSearchForm() {
  const form = document.createElement("form");
  form.className = "site-search";
  form.setAttribute("role", "search");
  form.innerHTML = `
    <label class="sr-only" for="site-page-search">Search IESCO site pages</label>
    <input id="site-page-search" list="site-page-options" placeholder="Search guides and bill topics" />
    <datalist id="site-page-options">
      ${pageIndex.map((page) => `<option value="${page.title}"></option>`).join("")}
    </datalist>
    <button type="submit">Go</button>
  `;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = form.querySelector("input");
    const rawValue = input ? input.value.trim().toLowerCase() : "";
    if (!rawValue) {
      return;
    }

    const sortedPages = [...pageIndex]
      .map((page) => ({ page, score: scorePage(rawValue, page) }))
      .sort((left, right) => right.score - left.score);

    if (sortedPages[0] && sortedPages[0].score > 0) {
      window.location.assign(sortedPages[0].page.href);
    }
  });

  return form;
}

document.addEventListener("DOMContentLoaded", () => {
  const currentPage = normaliseCurrentPage();
  const nav = document.querySelector(".nav-links");
  if (nav) {
    nav.innerHTML = pageIndex
      .map((page) => {
        const currentClass = page.href === currentPage ? "is-current" : "";
        return `<a class="${currentClass}" href="${page.href}">${page.title}</a>`;
      })
      .join("");
  }

  const headerInner = document.querySelector(".header-inner");
  if (headerInner && !headerInner.querySelector(".site-search")) {
    headerInner.appendChild(buildSearchForm());
  }
});
