import { useEffect, useState, type ReactNode } from "react";
import { getSettings, setSettings, type Settings } from "../lib/storage";
import { connectGoogle, disconnectGoogle, getRedirectURL } from "../lib/google/oauth";
import { parseDocId, readDoc } from "../lib/google/docs";

export default function App() {
  const [form, setForm] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    getSettings().then(setForm);
  }, []);

  if (!form) return null;

  const redirectUrl = getRedirectURL();
  const connected = !!form.googleRefreshToken;

  const update = (patch: Partial<Settings>) => {
    setForm({ ...form, ...patch });
    setSaved(false);
  };

  const save = async () => {
    await setSettings(form);
    setSaved(true);
  };

  const connect = async () => {
    setMessage(null);
    setBusy("connect");
    try {
      await setSettings(form); // persist client id/secret before the flow
      await connectGoogle();
      setForm(await getSettings());
      setMessage({ kind: "ok", text: "Connected to Google ✓" });
    } catch (e) {
      setMessage({ kind: "err", text: String(e instanceof Error ? e.message : e) });
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async () => {
    await disconnectGoogle();
    setForm(await getSettings());
    setMessage(null);
  };

  const loadMasterDoc = async () => {
    setMessage(null);
    const docId = parseDocId(form.masterDocUrl);
    if (!docId) {
      setMessage({ kind: "err", text: "That doesn't look like a Google Docs URL." });
      return;
    }
    setBusy("load");
    try {
      await setSettings(form);
      const text = await readDoc(docId);
      await setSettings({ masterDocText: text });
      setForm(await getSettings());
      setMessage({ kind: "ok", text: `Loaded master document — ${text.length} characters.` });
    } catch (e) {
      setMessage({ kind: "err", text: String(e instanceof Error ? e.message : e) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-semibold text-ink mb-1">Project Tailor — Settings</h1>
      <p className="text-sm text-muted mb-8">
        Everything stays on this device. Keys are used only to call Google and Gemini directly.
      </p>

      {message && (
        <div
          className={`rounded-lg px-4 py-2.5 text-sm mb-6 ${
            message.kind === "ok"
              ? "bg-[#D4EDDA] text-[#2E6B3A]"
              : "bg-[#F8D7DA] text-[#842029]"
          }`}
        >
          {message.text}
        </div>
      )}

      <Section title="1 · Gemini">
        <Field label="Gemini API key" hint="Get one at aistudio.google.com/apikey">
          <input
            type="password"
            className="input"
            value={form.geminiApiKey}
            onChange={(e) => update({ geminiApiKey: e.target.value })}
            placeholder="AIza..."
          />
        </Field>
        <Field
          label="Letter model"
          hint="Model that writes the letter. gemini-2.5-pro writes best (slower, ~10–40s); gemini-2.5-flash is fastest. Leave blank for the default (gemini-2.5-pro)."
        >
          <input
            type="text"
            className="input"
            value={form.generationModel}
            onChange={(e) => update({ generationModel: e.target.value })}
            placeholder="gemini-2.5-pro"
          />
        </Field>
      </Section>

      <Section title="2 · Connect Google">
        <Field
          label="Firefox redirect URL"
          hint="Copy this into your Google OAuth client's 'Authorized redirect URIs'."
        >
          <div className="flex gap-2">
            <input className="input font-mono text-xs" value={redirectUrl} readOnly />
            <button
              className="btn-secondary shrink-0"
              onClick={() => navigator.clipboard.writeText(redirectUrl)}
            >
              Copy
            </button>
          </div>
        </Field>

        <Field label="Google Client ID">
          <input
            type="text"
            className="input"
            value={form.googleClientId}
            onChange={(e) => update({ googleClientId: e.target.value })}
            placeholder="....apps.googleusercontent.com"
          />
        </Field>

        <Field label="Google Client Secret">
          <input
            type="password"
            className="input"
            value={form.googleClientSecret}
            onChange={(e) => update({ googleClientSecret: e.target.value })}
            placeholder="GOCSPX-..."
          />
        </Field>

        <div className="flex items-center gap-3">
          {connected ? (
            <>
              <span className="text-sm text-sage">Connected ✓</span>
              <button className="btn-secondary" onClick={disconnect}>
                Disconnect
              </button>
            </>
          ) : (
            <button className="btn-primary" disabled={busy === "connect"} onClick={connect}>
              {busy === "connect" ? "Connecting…" : "Connect Google"}
            </button>
          )}
        </div>
      </Section>

      <Section title="3 · Master career document">
        <Field
          label="Google Doc URL"
          hint="The Google Doc that holds your real career history (source of truth)."
        >
          <div className="flex gap-2">
            <input
              type="url"
              className="input"
              value={form.masterDocUrl}
              onChange={(e) => update({ masterDocUrl: e.target.value })}
              placeholder="https://docs.google.com/document/d/..."
            />
            <button
              className="btn-secondary shrink-0"
              disabled={busy === "load" || !connected}
              onClick={loadMasterDoc}
            >
              {busy === "load" ? "Loading…" : "Load"}
            </button>
          </div>
        </Field>
        {form.masterDocText && (
          <p className="text-xs text-sage -mt-2">
            Cached: {form.masterDocText.length} characters loaded.
          </p>
        )}
      </Section>

      <Section title="4 · Cover letter template (optional)">
        <Field hint="Leave blank to use the built-in German-format template.">
          <textarea
            className="input font-mono h-40"
            value={form.coverLetterTemplate}
            onChange={(e) => update({ coverLetterTemplate: e.target.value })}
            placeholder="{COMPANY_NAME}&#10;{YOUR_CITY}, {DATE}&#10;&#10;Dear {HIRING_MANAGER}, ..."
          />
        </Field>
      </Section>

      <div className="flex items-center gap-3 mt-2">
        <button className="btn-primary" onClick={save}>
          Save
        </button>
        {saved && <span className="text-sm text-sage">Saved ✓</span>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8 rounded-xl border border-line bg-paper p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-ink mb-4 uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-5 last:mb-0">
      {label && <label className="block text-sm font-medium text-ink mb-1">{label}</label>}
      {hint && <p className="text-xs text-muted mb-2">{hint}</p>}
      {children}
    </div>
  );
}
