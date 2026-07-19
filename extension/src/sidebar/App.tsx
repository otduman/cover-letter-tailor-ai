import { useEffect, useRef, useState } from "react";
import { getSettings, setSettings } from "../lib/storage";
import type { Language } from "../lib/config";
import { generateCoverLetter, type GenerateResult } from "../lib/generate";
import { createDoc } from "../lib/google/docs";
import { readJobFromActiveTab } from "../lib/linkedin";

// Single fixed tone — no selector (personal tool).
const TONE = "Formal / Corporate" as const;
const LANGUAGES: Language[] = ["English", "German"];

export default function App() {
  const [ready, setReady] = useState(false);
  const [apiOk, setApiOk] = useState(false);
  const [docOk, setDocOk] = useState(false);

  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [language, setLanguage] = useState<Language>("English");

  const [reading, setReading] = useState(false);
  const [readMsg, setReadMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [docUrl, setDocUrl] = useState("");
  const [savingDoc, setSavingDoc] = useState(false);
  const [copied, setCopied] = useState(false);

  // Keep a stable reference so event listeners always call the latest reader.
  const readJobRef = useRef<(interactive: boolean) => Promise<void>>();

  async function readJob(interactive: boolean) {
    setReading(true);
    setReadMsg("");
    try {
      const job = await readJobFromActiveTab();
      if (job && (job.title || job.description)) {
        setJobTitle(job.title);
        setCompany(job.company);
        setJobDescription(job.description);
        setReadMsg("Read job from this page ✓");
      } else if (interactive) {
        setReadMsg("Couldn't read the job — open a LinkedIn job, reload the page once, then try again (or fill manually).");
      }
    } finally {
      setReading(false);
    }
  }
  readJobRef.current = readJob;

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setApiOk(!!s.geminiApiKey);
      setDocOk(!!s.masterDocText);
      setLanguage(s.language);
      await readJob(false);
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh: re-read when the active tab changes, or when the content
  // script reports the LinkedIn job changed (clicking another job in the list).
  useEffect(() => {
    const refresh = () => readJobRef.current?.(false);
    const onMessage = (msg: { type?: string }) => {
      if (msg?.type === "JOB_CHANGED") refresh();
    };
    browser.tabs.onActivated.addListener(refresh);
    browser.runtime.onMessage.addListener(onMessage);
    return () => {
      browser.tabs.onActivated.removeListener(refresh);
      browser.runtime.onMessage.removeListener(onMessage);
    };
  }, []);

  const canGenerate =
    apiOk && docOk && jobTitle.trim() && company.trim() && jobDescription.trim() && !loading;

  async function onGenerate() {
    setError("");
    setResult(null);
    setDocUrl("");
    setLoading(true);
    try {
      setResult(
        await generateCoverLetter({ jobTitle, company, jobDescription, tone: TONE, language })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function onCreateDoc() {
    if (!result) return;
    setSavingDoc(true);
    setError("");
    try {
      const url = await createDoc(`Cover Letter - ${company || "Untitled"}`, result.letter);
      setDocUrl(url);
      await browser.tabs.create({ url });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingDoc(false);
    }
  }

  if (!ready) return <div className="p-5 text-sm text-muted">Loading…</div>;

  return (
    <div className="p-4 bg-paper min-h-screen">
      <header className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-sage flex items-center justify-center text-white text-sm">
          ✦
        </div>
        <div>
          <div className="font-semibold text-ink leading-tight">Project Tailor</div>
          <div className="text-xs text-muted">From your real experience</div>
        </div>
      </header>

      {(!apiOk || !docOk) && (
        <div className="rounded-lg bg-[#FFF3CD] text-[#7A5A00] text-[13px] px-4 py-3 mb-4">
          {!apiOk && <div>• Add your Gemini API key in Settings.</div>}
          {!docOk && <div>• Load your master career document in Settings.</div>}
          <button className="btn-secondary mt-2" onClick={() => browser.runtime.openOptionsPage()}>
            Open Settings
          </button>
        </div>
      )}

      <button className="btn-secondary w-full mb-1" disabled={reading} onClick={() => readJob(true)}>
        {reading ? "Reading…" : "Read this job page"}
      </button>
      {readMsg && <p className="text-xs text-muted mb-3">{readMsg}</p>}

      <label className="lbl">Job title</label>
      <input className="input mb-3" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
        placeholder="e.g. Junior Java Engineer" />

      <label className="lbl">Company</label>
      <input className="input mb-3" value={company} onChange={(e) => setCompany(e.target.value)}
        placeholder="e.g. KAYAK" />

      <label className="lbl">Job description</label>
      <textarea className="input h-32 mb-3" value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        placeholder="Auto-read from the LinkedIn job, or paste it here." />

      <label className="lbl">Letter language</label>
      <div className="flex gap-1.5 mb-4">
        {LANGUAGES.map((l) => (
          <button key={l}
            onClick={() => { setLanguage(l); setSettings({ language: l }); }}
            className={`text-xs rounded-full px-3 py-1.5 border transition ${
              language === l ? "bg-sage text-white border-sage" : "bg-white text-ink border-line"
            }`}>
            {l}
          </button>
        ))}
      </div>

      <button className="btn-primary w-full" disabled={!canGenerate} onClick={onGenerate}>
        {loading ? "Generating…" : "Generate Cover Letter"}
      </button>

      {error && (
        <div className="rounded-lg bg-[#F8D7DA] text-[#842029] text-[13px] px-4 py-2.5 mt-3">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4">
          {result.gaps.length > 0 && (
            <div className="rounded-lg bg-[#FFF3CD] border border-[rgba(122,90,0,0.3)] px-4 py-3 mb-3">
              <div className="text-[13px] font-semibold text-[#7A5A00] mb-1.5">
                ⚠ Missing skills — not in your master document
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.gaps.map((g) => (
                  <span key={g} className="font-mono text-[11px] bg-[#7A5A00] text-[#FFF3CD] rounded px-2 py-0.5">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.buzzwordHits.length > 0 && (
            <div className="rounded-lg bg-[#FFF3CD] text-[#7A5A00] text-[12px] px-4 py-2 mb-3">
              ⚠ AI-sounding words detected: <strong>{result.buzzwordHits.join(", ")}</strong>
            </div>
          )}

          <div className="rounded-xl border border-line bg-panel p-4 mb-1">
            <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-ink m-0">
              {result.letter}
            </pre>
          </div>

          <p className="text-[12px] mb-3 text-right"
            style={{ color: result.pageFill >= 0.88 && result.pageFill <= 1.0 ? "#2E6B3A" : "#7A5A00" }}>
            Page fill: {Math.round(result.pageFill * 100)}%
            {result.pageFill >= 0.88 && result.pageFill <= 1.0 ? " ✓" : " (outside 88–100%)"}
          </p>

          <div className="flex gap-2">
            <button className="btn-secondary flex-1" onClick={onCopy}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
            <button className="btn-primary flex-1" disabled={savingDoc} onClick={onCreateDoc}>
              {savingDoc ? "Creating…" : "Create Google Doc"}
            </button>
          </div>

          {docUrl && (
            <a href={docUrl} target="_blank" rel="noreferrer"
              className="block text-center text-[12px] text-sage mt-2 underline">
              Opened in Google Docs ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}
