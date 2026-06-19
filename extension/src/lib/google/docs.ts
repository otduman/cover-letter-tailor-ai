// Google Docs read/write, used by the extension.
//   - readDoc: pull the master career document as plain text
//   - createDoc: create a new Google Doc for a generated cover letter
import { getAccessToken } from "./oauth";

const DOCS_API = "https://docs.googleapis.com/v1/documents";

/** Extract the document id from a full Google Docs URL. */
export function parseDocId(url: string): string | null {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/** Read a Google Doc and flatten its body to plain text. */
export async function readDoc(docId: string): Promise<string> {
  const token = await getAccessToken();
  const res = await fetch(`${DOCS_API}/${docId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Could not read the Google Doc (${res.status}). Check the URL and sharing.`);
  }
  const doc = await res.json();
  return flattenDoc(doc);
}

/** Create a new Google Doc with the given title and body text. Returns its URL. */
export async function createDoc(title: string, body: string): Promise<string> {
  const token = await getAccessToken();

  // 1) create an empty document with the title
  const createRes = await fetch(DOCS_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });
  if (!createRes.ok) {
    throw new Error(`Could not create the Google Doc (${createRes.status}).`);
  }
  const { documentId } = await createRes.json();

  // 2) insert the text, then style it. Document index = bodyOffset + 1.
  const requests: object[] = [
    { insertText: { location: { index: 1 }, text: body } },
    // Calibri for the whole document
    {
      updateTextStyle: {
        range: { startIndex: 1, endIndex: body.length + 1 },
        textStyle: { weightedFontFamily: { fontFamily: "Calibri" } },
        fields: "weightedFontFamily",
      },
    },
  ];

  // Right-align the "City, DD.MM.YYYY" date line
  const dateMatch = body.match(/^.+,\s*\d{2}\.\d{2}\.\d{4}\s*$/m);
  if (dateMatch && dateMatch.index !== undefined) {
    const start = dateMatch.index;
    requests.push({
      updateParagraphStyle: {
        range: { startIndex: start + 1, endIndex: start + dateMatch[0].length + 1 },
        paragraphStyle: { alignment: "END" },
        fields: "alignment",
      },
    });
  }

  // Bold the sender's name (first line)
  const firstLineEnd = body.indexOf("\n");
  if (firstLineEnd > 0) {
    requests.push({
      updateTextStyle: {
        range: { startIndex: 1, endIndex: firstLineEnd + 1 },
        textStyle: { bold: true },
        fields: "bold",
      },
    });
  }

  // Bold the subject/role line — the non-empty line right before the salutation.
  const salutation = body.match(/^(Dear |Sehr geehrte)/m);
  if (salutation && salutation.index !== undefined) {
    const before = body.slice(0, salutation.index).replace(/\s+$/, "");
    const subjStart = before.lastIndexOf("\n") + 1;
    const subjLine = before.slice(subjStart);
    if (subjLine && !/\d{2}\.\d{2}\.\d{4}/.test(subjLine)) {
      requests.push({
        updateTextStyle: {
          range: { startIndex: subjStart + 1, endIndex: before.length + 1 },
          textStyle: { bold: true },
          fields: "bold",
        },
      });
    }
  }

  const updateRes = await fetch(`${DOCS_API}/${documentId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });
  if (!updateRes.ok) {
    throw new Error(`Could not write the cover letter into the Doc (${updateRes.status}).`);
  }

  return `https://docs.google.com/document/d/${documentId}/edit`;
}

interface DocElement {
  paragraph?: {
    elements?: { textRun?: { content?: string } }[];
  };
}

function flattenDoc(doc: { body?: { content?: DocElement[] } }): string {
  const content = doc.body?.content ?? [];
  let out = "";
  for (const el of content) {
    const runs = el.paragraph?.elements ?? [];
    for (const run of runs) {
      out += run.textRun?.content ?? "";
    }
  }
  return out.trim();
}
