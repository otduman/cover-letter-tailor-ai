// Measures how much of one A4 page the letter fills, by rendering it
// off-screen with the same geometry the exported Google Doc uses:
// A4 (21 × 29.7 cm), 2.54 cm margins, Calibri 11 pt, 1.15 line spacing.
// Must run in a window context (the sidebar) — it needs the DOM to measure.

const PAGE_TEXT_WIDTH_CM = 15.92; // 21 − 2 × 2.54
const PAGE_TEXT_HEIGHT_CM = 24.62; // 29.7 − 2 × 2.54
const PX_PER_CM = 96 / 2.54; // CSS reference pixel

/** Returns the fraction of one A4 page the text occupies (1.0 = exactly full). */
export function measurePageFill(text: string): number {
  const probe = document.createElement("div");
  probe.style.cssText = [
    "position:absolute",
    "left:-99999px",
    "top:0",
    "visibility:hidden",
    `width:${PAGE_TEXT_WIDTH_CM}cm`,
    "font-family:Calibri,Carlito,sans-serif",
    "font-size:11pt",
    "line-height:1.15",
    "white-space:pre-wrap",
    "word-break:normal",
    "margin:0",
    "padding:0",
    "border:0",
  ].join(";");
  probe.textContent = text;
  document.body.appendChild(probe);
  const heightPx = probe.scrollHeight;
  probe.remove();
  return heightPx / (PAGE_TEXT_HEIGHT_CM * PX_PER_CM);
}
