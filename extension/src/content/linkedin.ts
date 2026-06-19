// LinkedIn job-page content script. Runs in the page and answers GET_JOB.
// Handles BOTH LinkedIn layouts: the classic one (#job-details, unified top
// card) and the new "SDUI" one (obfuscated classes, data-testid / aria-label).
import type { JobPosting } from "../lib/linkedin";

function txt(el: Element | null): string {
  return (el as HTMLElement | null)?.innerText?.trim() ?? "";
}
function q(selector: string): string {
  return txt(document.querySelector(selector));
}

// Layout-agnostic last resort: every LinkedIn layout puts the description under
// an "About the job" heading. Find it and read its surrounding container.
function descByAboutHeading(): string {
  const heads = Array.from(document.querySelectorAll("h1, h2, h3")) as HTMLElement[];
  const heading = heads.find((el) => /about the job/i.test(el.innerText || ""));
  if (!heading) return "";
  let node: HTMLElement | null = heading.parentElement;
  let best = "";
  for (let i = 0; i < 5 && node; i++) {
    const t = node.innerText?.trim() ?? "";
    if (t.length > best.length && t.length < 20000) best = t;
    node = node.parentElement;
  }
  return best.replace(/^about the job\s*/i, "").trim();
}

function extractJob(): JobPosting | null {
  // Description — known selectors first, then the semantic heading fallback.
  let description =
    q("#job-details") ||
    q(".jobs-description__content") ||
    q(".jobs-box__html-content") ||
    q('[data-testid="expandable-text-box"]') ||
    q('[class*="jobs-description"]') ||
    descByAboutHeading();
  description = description.replace(/\s*…\s*more\s*$/i, "").trim();

  // Title — classic selectors first, then the job-id link, then any h1.
  const jobId =
    new URLSearchParams(location.search).get("currentJobId") ||
    location.pathname.match(/\/jobs\/view\/(\d+)/)?.[1] ||
    "";
  let title =
    q(".job-details-jobs-unified-top-card__job-title") ||
    q(".jobs-unified-top-card__job-title") ||
    (jobId ? q(`a[href*="/jobs/view/${jobId}"]`) : "") ||
    q("h1");

  // Company — classic class, then accessible label, then a /company/ link.
  let company =
    q(".job-details-jobs-unified-top-card__company-name") ||
    q(".jobs-unified-top-card__company-name");
  if (!company) {
    const label = document
      .querySelector('[aria-label^="Company, "]')
      ?.getAttribute("aria-label");
    if (label) company = label.replace(/^Company,\s*/, "").replace(/\.$/, "").trim();
  }
  if (!company) company = q('a[href*="/company/"]');

  if (!title && !description) return null;
  return { title, company, description };
}

browser.runtime.onMessage.addListener((message) => {
  if (message?.type === "GET_JOB") {
    return Promise.resolve(extractJob());
  }
  return undefined;
});
