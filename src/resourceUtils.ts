import type { ResourceType } from "./data";

const URL_PATTERN = /https?:\/\/[^\s<>{}[\]"']+/gi;

export function normalizeResourceUrl(value: string) {
  const candidate = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`;
  const url = new URL(candidate);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Use um endereço iniciado por http:// ou https://.");
  return url.href;
}

export function inferResourceType(value: string): ResourceType {
  const url = new URL(value); const host = url.hostname.toLowerCase(); const path = url.pathname.toLowerCase();
  if (host.includes("youtube.com") || host.includes("youtu.be") || host.includes("vimeo.com")) return "video";
  if (path.endsWith(".pdf")) return "pdf";
  if (host.includes("drive.google.com") || host.includes("docs.google.com") || host.includes("onedrive") || host.includes("dropbox.com")) return path.includes("folder") || url.searchParams.has("id") && path.includes("folders") ? "folder" : "document";
  if (/\.(docx?|odt|pptx?|odp|xlsx?|ods)$/i.test(path)) return "document";
  return "link";
}

export function extractUrls(value: string) {
  return [...new Set(value.match(URL_PATTERN) ?? [])].map((item) => item.replace(/[),.;!?]+$/, "")).slice(0, 20);
}

export function resourceHost(value: string) {
  try { return new URL(value).hostname.replace(/^www\./, ""); } catch { return value; }
}
