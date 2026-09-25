/** LLM çıktısından markdown ve kaynak satırlarını temizler (widget + yedek). */
export function sanitizeAssistantText(raw: string): string {
  let t = raw;
  t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
  t = t.replace(/\*([^*]+)\*/g, "$1");
  t = t.replace(/^#{1,6}\s+/gm, "");
  t = t.replace(/\nKaynak\s*:[^\n]*/gi, "");
  t = t.replace(/^Kaynak\s*:[^\n]*\n?/gim, "");
  t = t.replace(/\bBAĞLAM(?:da|daki)?\b[^.\n]*/gi, "toligames.com mağazamızda");
  t = t.replace(/\bbağlam(?:da|daki)?\b/gi, "mağazamızda");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}
