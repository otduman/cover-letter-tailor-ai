// Talks to the LinkedIn content script to read the job on the active tab.
export interface JobPosting {
  title: string;
  company: string;
  description: string;
}

export async function readJobFromActiveTab(): Promise<JobPosting | null> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return null;
  try {
    const job = (await browser.tabs.sendMessage(tab.id, { type: "GET_JOB" })) as
      | JobPosting
      | null;
    return job ?? null;
  } catch {
    // Content script not present (not a LinkedIn job tab, or page needs reload).
    return null;
  }
}
